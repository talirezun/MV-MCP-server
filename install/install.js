#!/usr/bin/env node
/*
 * !! RELEASE CHECKLIST !!
 * The constants CLIENT_TAG and SHA256 below pin the server scripts to a
 * released git tag and to their exact contents. Bump BOTH (tag + hashes)
 * with every client release, otherwise the installer keeps shipping the old
 * version (or aborts on a hash mismatch). Hashes:
 *   git show <tag>:server-versions/<file> | shasum -a 256
 *
 * MV Travel MCP installer
 * One file, Node >= 18, built-in modules only.
 * Downloads the MV Travel MCP server script and registers it with the
 * MCP clients found on this machine.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const https = require('https');
const readline = require('readline');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

// ---------------------------------------------------------------- constants
const NAME = 'mv-travel';
const OLD_NAME = 'mountvacation';
const ENV_KEY = 'MOUNTVACATION_API_KEY';
const CLIENT_TAG = 'client-v3.5.0';
const SHA256 = {
  'mountvacation-mcp-server.js': '307d993270648109d2b2621c68b2c410ea5c1a3770003f6af29cc3b548be3784',
  'mountvacation-mcp-server-cline.js': '0ac6d6bfcfccb653c20ce6990f1bead2a6f9b77760b38c42cc61ae5f9e75e4d1',
};
// Override (testing): scripts are then fetched from <base>/server-versions/, hashes still verified.
const BASE = (process.env.MV_TRAVEL_INSTALL_BASE ||
  `https://raw.githubusercontent.com/talirezun/MV-MCP-server/${CLIENT_TAG}`).replace(/\/+$/, '');
const KEY_RE = /^[A-Za-z0-9._~-]{8,256}$/;
const WORKER = (process.env.MV_TRAVEL_WORKER_URL || 'https://mv-travel-mcp.talirezun.com').replace(/\/+$/, '');
const MAIN_FILE = 'mountvacation-mcp-server.js';
const CLINE_FILE = 'mountvacation-mcp-server-cline.js';
const UA = 'mv-travel-installer/1.0';

const WIN = process.platform === 'win32';
const MAC = process.platform === 'darwin';
const HOME = os.homedir();
const APPDATA = process.env.APPDATA || path.join(HOME, 'AppData', 'Roaming');
const INSTALL_DIR = path.join(HOME, '.mv-travel-mcp');
// Absolute node path for configs (GUI apps lack the shell PATH). Prefer a stable PATH
// entry (e.g. /opt/homebrew/bin/node, not realpath'd) over a version-specific one.
const VERSIONED = /(^|[\\/])(v?\d+(\.\d+)+|\.nvm|fnm|\.fnm|asdf|\.asdf|volta|\.volta|nodenv|\.nodenv|Cellar)([\\/]|$)/;
function pickNode() {
  const found = which('node');
  if (found && !VERSIONED.test(found)) {
    const r = spawnSync(found, ['--version'], { encoding: 'utf8' });
    if (r.status === 0 && parseInt(r.stdout.replace(/^v/, ''), 10) >= 18) return found;
  }
  return process.execPath;
}
const NODE = pickNode();
const NODE_UNSTABLE = /\.nvm|fnm|asdf|volta|Cellar/.test(NODE);

// --------------------------------------------------------------- arguments
const opts = { key: null, clients: null, yes: false, uninstall: false, dry: false, help: false };
function parseArgs(argv) {
  for (let i = 0; i < argv.length; i++) {
    let a = argv[i], v = null;
    if (a.startsWith('--') && a.includes('=')) { v = a.slice(a.indexOf('=') + 1); a = a.slice(0, a.indexOf('=')); }
    const val = () => (v !== null ? v : argv[++i]);
    if (a === '--key') opts.key = val();
    else if (a === '--clients') opts.clients = val();
    else if (a === '--yes' || a === '-y') opts.yes = true;
    else if (a === '--uninstall') opts.uninstall = true;
    else if (a === '--dry-run') opts.dry = true;
    else if (a === '--help' || a === '-h') opts.help = true;
    else throw new Error(`Unknown option: ${a} (try --help)`);
  }
  if (opts.key === null && process.env.MV_TRAVEL_API_KEY) opts.key = process.env.MV_TRAVEL_API_KEY;
  if ((opts.key !== null && !opts.key) || (opts.clients !== null && !opts.clients)) {
    throw new Error('Missing value for --key / --clients');
  }
}

const HELP = `MV Travel MCP installer

Usage: node install.js [options]

  --key <k>          MV Travel API key (otherwise asked, input hidden)
                     Alternative: env MV_TRAVEL_API_KEY (keeps it out of the process list)
  --clients <list>   Comma list of client ids, or "all" (detected clients only)
  --yes              Non-interactive: accept defaults, install to all detected
  --uninstall        Remove the "${NAME}" entry from all known configs
  --dry-run          Show planned changes, write nothing
  --help             This text

Client ids: claude-code, codex, vscode, gemini, claude-desktop, cursor, windsurf,
            cline, roo, lmstudio, kiro, antigravity, opencode, zed, goose, augment

Env: MV_TRAVEL_INSTALL_BASE  override download base URL
     MV_TRAVEL_WORKER_URL    override API-key check endpoint
`;

// ------------------------------------------------------------------ output
let SECRET = null;
const mask = (k) => (k.length > 8 ? k.slice(0, 4) : k.slice(0, 1)) + '…';
const redact = (s) => (SECRET ? String(s).split(SECRET).join(mask(SECRET)) : String(s));
const color = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (c, s) => (color ? `\x1b[${c}m${s}\x1b[0m` : s);
const log = (s = '') => console.log(redact(s));
const warn = (s) => console.log(redact(paint(33, '  ! ' + s)));
const ok = (s) => console.log(redact(paint(32, '  ✓ ') + s));
const info = (s) => console.log(redact('    ' + s));
const step = (n, t) => console.log('\n' + paint('1;36', `Step ${n}`) + paint('1', `  ${t}`));
const tilde = (p) => (p.startsWith(HOME) ? '~' + p.slice(HOME.length) : p);

// ------------------------------------------------------------------ prompts
// Prompts need a real terminal; otherwise defaults are used (and --key is required).
const interactive = () => !opts.yes && process.stdin.isTTY && process.stdout.isTTY;

function askLine(q) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.on('close', () => resolve(''));
    rl.question(q, (a) => { rl.removeAllListeners('close'); rl.close(); resolve(a); });
  });
}

async function confirm(q, def = true) {
  if (!interactive()) return def;
  const a = (await askLine(`${q} ${def ? '[Y/n]' : '[y/N]'} `)).trim().toLowerCase();
  return a ? a[0] === 'y' : def;
}

// Reads a line from the TTY in raw mode and echoes nothing.
function askHidden(q) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    process.stdout.write(q);
    stdin.setRawMode(true); stdin.resume(); stdin.setEncoding('utf8');
    let buf = '';
    const done = () => { stdin.removeListener('data', onData); stdin.setRawMode(false); stdin.pause(); process.stdout.write('\n'); };
    const onData = (chunk) => {
      for (const c of chunk) {
        if (c === '\r' || c === '\n' || c === '\u0004') { done(); return resolve(buf.trim()); }
        if (c === '\u0003') { done(); process.exit(130); }
        if (c === '\u007f' || c === '\b') buf = buf.slice(0, -1);
        else if (c >= ' ') buf += c;
      }
    };
    stdin.on('data', onData);
  });
}

// --------------------------------------------------------------------- http
// Turns low-level network errors into short messages (plus a proxy hint).
function netError(e, what) {
  const code = e.code || '';
  let msg = e.message;
  if (/timed out/i.test(msg) || code === 'ETIMEDOUT') msg = 'the request timed out';
  else if (code === 'ECONNRESET') msg = 'the connection was reset';
  else if (code === 'ENOTFOUND') msg = 'the host name could not be resolved';
  else if (code === 'ECONNREFUSED') msg = 'the connection was refused';
  const err = new Error(`${what}: ${msg}`);
  const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.https_proxy || process.env.http_proxy;
  if (proxy || ['ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT'].includes(code) || /timed out/.test(msg)) {
    err.hint = 'If you are behind a proxy or firewall: Node ignores HTTPS_PROXY by default (use a transparent proxy or ' +
      'Node 24+ with NODE_USE_ENV_PROXY=1), and a corporate TLS proxy needs NODE_EXTRA_CA_CERTS=/path/to/ca.pem.';
  }
  return err;
}

// follow: only https -> https redirects are followed; anything else is refused.
function request(urlStr, { method = 'GET', headers = {}, body = null, timeout = 30000, follow = false, what = 'request' } = {}, hops = 5) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const lib = u.protocol === 'http:' ? http : https;
    const req = lib.request(u, { method, headers, timeout }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        if (!follow || hops <= 0) return resolve({ status: res.statusCode, text: '', redirected: true });
        const target = new URL(res.headers.location, u);
        if (u.protocol !== 'https:' || target.protocol !== 'https:') {
          return reject(new Error(`${what}: refusing redirect to ${target.protocol}//${target.host}`));
        }
        return resolve(request(target.href, { method, headers, body, timeout, follow, what }, hops - 1));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('error', (e) => reject(netError(e, what)));
      res.on('end', () => {
        if (!res.complete) return reject(netError(new Error('connection closed before the response finished'), what));
        const buf = Buffer.concat(chunks);
        resolve({ status: res.statusCode, text: buf.toString('utf8'), buf });
      });
    });
    req.on('timeout', () => req.destroy(new Error('timed out')));
    req.on('error', (e) => reject(netError(e, what)));
    if (body) req.write(body);
    req.end();
  });
}

// ------------------------------------------------------------ step 1: the key
const isoDay = (d) => d.toISOString().slice(0, 10);

// Returns 'valid' | 'invalid' | 'unreachable'. Never follows redirects.
async function checkKey(key) {
  const arrival = isoDay(new Date(Date.now() + 60 * 864e5));
  const body = JSON.stringify({
    jsonrpc: '2.0', id: 1, method: 'tools/call',
    params: { name: 'search_accommodations', arguments: {
      location: 'Bled, Slovenia', arrival_date: arrival, nights: 2, persons_ages: '30,30', max_results: 1 } },
  });
  try {
    const r = await request(`${WORKER}/mcp`, { method: 'POST', body, timeout: 30000, what: 'key check', headers: {
      'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', 'User-Agent': UA,
      'X-MountVacation-API-Key': key, 'Content-Length': Buffer.byteLength(body) } });
    if (r.redirected) { warn('The key-check service answered with a redirect; not following it (your key stays private).'); return 'unreachable'; }
    if (r.text.includes('API key was rejected')) return 'invalid';
    if (r.status >= 200 && r.status < 300) return 'valid';
    return 'unreachable';
  } catch (e) {
    warn(e.message);
    if (e.hint) info(e.hint);
    return 'unreachable';
  }
}

async function stepKey() {
  step(1, 'Your MV Travel API key');
  let key = opts.key ? opts.key.trim() : null;
  if (!key && !(process.stdin.isTTY && process.stdout.isTTY)) {
    throw new Error('No terminal available for the key prompt. Re-run with --key <your key> (or set MV_TRAVEL_API_KEY).');
  }
  for (let attempt = 1; attempt <= 3; attempt++) {
    if (!key) key = await askHidden('  Paste your API key (input hidden): ');
    if (!key) { warn('Empty key.'); continue; }
    if (!KEY_RE.test(key)) {
      if (opts.key) throw new Error('The API key has an unexpected format (expected 8-256 letters, digits, . _ ~ -).');
      warn('That does not look like an API key (8-256 letters, digits, . _ ~ -). Try again.');
      key = null; continue;
    }
    SECRET = key;
    info(`Checking key ${mask(key)} ...`);
    const res = await checkKey(key);
    if (res === 'valid') { ok('API key accepted.'); return key; }
    if (res === 'invalid') {
      warn('That API key was rejected by MV Travel.');
      if (opts.key) throw new Error('The API key passed with --key is invalid.');
      key = null; SECRET = null;
      continue;
    }
    warn('Could not verify the key (network problem).');
    if (opts.yes || await confirm('  Continue without verifying the key?', true)) return key;
    throw new Error('Aborted: key could not be verified.');
  }
  throw new Error('Too many invalid keys.');
}

// -------------------------------------------------------- step 2: the scripts
function nodeCheck(file) {
  const r = spawnSync(NODE, ['--check', file], { encoding: 'utf8' });
  return r.status === 0;
}

async function download(file) {
  const url = `${BASE}/server-versions/${file}`;
  const dest = path.join(INSTALL_DIR, file);
  if (opts.dry) { info(`would download ${url} -> ${tilde(dest)}`); return dest; }
  // https -> https redirects only; no custom headers.
  const r = await request(url, { follow: true, what: `download of ${file}` });
  if (r.status !== 200) throw new Error(`Download failed (${r.status}) for ${url}`);
  if (!r.text.includes(ENV_KEY)) throw new Error(`${file} does not look like the MV Travel server (no ${ENV_KEY}).`);
  const sum = crypto.createHash('sha256').update(r.buf).digest('hex');
  if (sum !== SHA256[file]) {
    throw new Error(`${file} failed the integrity check (SHA-256 mismatch). Nothing was installed.\n` +
      `    expected ${SHA256[file]}\n    got      ${sum}`);
  }
  fs.mkdirSync(INSTALL_DIR, { recursive: true });
  const tmp = dest.replace(/\.js$/, '.tmp.js'); // keep .js so node --check treats it as a script
  fs.writeFileSync(tmp, r.text);
  if (!nodeCheck(tmp)) { fs.unlinkSync(tmp); throw new Error(`${file} failed the Node syntax check.`); }
  fs.renameSync(tmp, dest);
  if (!WIN) fs.chmodSync(dest, 0o755);
  ok(`${file} -> ${tilde(dest)} (checksum verified)`);
  return dest;
}

// ------------------------------------------------------------ file utilities
const exists = (p) => { try { fs.accessSync(p); return true; } catch (e) { return false; } };
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

function which(name) {
  const exts = WIN ? (process.env.PATHEXT || '.EXE;.CMD;.BAT;.COM').split(';') : [''];
  for (const dir of (process.env.PATH || '').split(path.delimiter).filter(Boolean)) {
    for (const ext of exts) {
      const p = path.join(dir, name + ext);
      try {
        if (!fs.statSync(p).isFile()) continue;
        if (!WIN) fs.accessSync(p, fs.constants.X_OK);
        return p;
      } catch (e) { /* keep looking */ }
    }
  }
  return null;
}

// Runs a CLI without a shell (arg array). .cmd shims on Windows go through cmd.exe.
function runBin(bin, args) {
  const file = which(bin);
  if (!file) return { status: 127, stdout: '', stderr: `${bin} not found` };
  if (WIN && /\.(cmd|bat)$/i.test(file)) {
    const q = (s) => '"' + String(s).replace(/(\\*)"/g, '$1$1\\"').replace(/(\\+)$/, '$1$1') + '"';
    return spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', '"' + [file, ...args].map(q).join(' ') + '"'],
      { encoding: 'utf8', windowsVerbatimArguments: true, windowsHide: true, timeout: 60000 });
  }
  return spawnSync(file, args, { encoding: 'utf8', windowsHide: true, timeout: 60000 });
}

const shown = (bin, args) => redact([bin, ...args].map((a) => (/[\s"'{]/.test(a) ? JSON.stringify(a) : a)).join(' '));

// Reads a config file. Returns { data, indent, raw } or { error }.
function readConfig(file) {
  if (!exists(file)) return { data: {}, indent: 2, missing: true };
  const raw = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
  if (!raw.trim()) return { data: {}, indent: 2 };
  try {
    const m = raw.match(/^\n?([ \t]+)"/m);
    return { data: JSON.parse(raw), indent: m ? (m[1][0] === '\t' ? '\t' : m[1].length) : 2 };
  } catch (e) { return { error: e.message }; }
}

const stamp = () => new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);

// Writes a config safely: follows symlinks, backs up, atomic rename, 0600.
// Keeps only the newest backup per file. Throws {skip:true} errors for unwritable files.
function writeConfig(file, data, indent) {
  let target = file;
  try { target = fs.realpathSync(file); } catch (e) { /* file does not exist yet */ }
  if (exists(target)) {
    try { fs.accessSync(target, fs.constants.W_OK); } catch (e) {
      const err = new Error('file is not writable; left untouched'); err.skip = true; throw err;
    }
  } else {
    fs.mkdirSync(path.dirname(target), { recursive: true });
  }
  let backup = null;
  if (exists(target)) {
    backup = `${target}.mv-travel-backup-${stamp()}`;
    for (let i = 1; exists(backup); i++) backup = `${target}.mv-travel-backup-${stamp()}-${i}`;
    fs.copyFileSync(target, backup);
    if (!WIN) fs.chmodSync(backup, 0o600);
  }
  const tmp = `${target}.mv-travel-tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, indent) + '\n', { mode: 0o600, flag: 'wx' });
  try { fs.renameSync(tmp, target); } catch (e) { // atomic replace
    try { fs.unlinkSync(tmp); } catch (e2) { /* ignore */ }
    throw e;
  }
  if (backup) { // drop older backups of this file
    const prefix = path.basename(target) + '.mv-travel-backup-';
    for (const f of fs.readdirSync(path.dirname(target))) {
      if (f.startsWith(prefix) && path.join(path.dirname(target), f) !== backup) {
        try { fs.unlinkSync(path.join(path.dirname(target), f)); } catch (e) { /* ignore */ }
      }
    }
  }
  return backup;
}

// ------------------------------------------------------- client definitions
// Entry shapes for JSON-based clients.
const stdioEntry = (c, extra = {}) => ({ ...extra, command: NODE, args: [c.script], env: { [ENV_KEY]: c.key } });
const vscodeUser = () => (MAC ? path.join(HOME, 'Library', 'Application Support', 'Code', 'User')
  : WIN ? path.join(APPDATA, 'Code', 'User') : path.join(HOME, '.config', 'Code', 'User'));
const parentExists = (f) => exists(path.dirname(f));

// Declarative JSON-file client.
function jsonClient(o) {
  return { kind: o.format === 'jsonc' ? 'jsonc' : 'json', restartHint: 'restart the app', ...o };
}

// CLI-based client: commands are arg arrays; the key is only inside them.
function cliClient(o) { return { kind: 'cli', restartHint: 'restart the app', ...o }; }

const appsDir = process.env.MV_TRAVEL_APPS_DIR || '/Applications';
const CLIENTS = [
  cliClient({
    id: 'claude-code', name: 'Claude Code', bin: 'claude',
    detect: () => !!which('claude'), restartHint: 'start a new Claude Code session',
    installCmds: (c) => [
      ...(c.removeOld ? [{ args: ['mcp', 'remove', '--scope', 'user', OLD_NAME], optional: true, old: true }] : []),
      { args: ['mcp', 'remove', '--scope', 'user', NAME], optional: true },
      { args: ['mcp', 'add', '--transport', 'stdio', '--scope', 'user', NAME, '-e', `${ENV_KEY}=${c.key}`, '--', NODE, c.script] },
    ],
    removeCmds: () => [{ args: ['mcp', 'remove', '--scope', 'user', NAME], optional: true }],
  }),
  cliClient({
    id: 'codex', name: 'Codex CLI', bin: 'codex', detect: () => !!which('codex'),
    installCmds: (c) => [
      { args: ['mcp', 'remove', NAME], optional: true },
      { args: ['mcp', 'add', NAME, '--env', `${ENV_KEY}=${c.key}`, '--', NODE, c.script] },
    ],
    removeCmds: () => [{ args: ['mcp', 'remove', NAME], optional: true }],
  }),
  // Windows: quoting JSON through cmd.exe is unsafe, so edit the user mcp.json directly.
  ...(WIN ? [jsonClient({
    id: 'vscode', name: 'VS Code (Copilot)', root: 'servers',
    candidates: () => [path.join(APPDATA, 'Code', 'User', 'mcp.json')],
    detect: () => !!which('code') || exists(path.join(APPDATA, 'Code', 'User')),
    entry: (c) => stdioEntry(c, { type: 'stdio' }),
  })] : [cliClient({
    id: 'vscode', name: 'VS Code (Copilot)', bin: 'code', detect: () => !!which('code'),
    installCmds: (c) => [{ args: ['--add-mcp', JSON.stringify({ name: NAME, type: 'stdio', command: NODE, args: [c.script], env: { [ENV_KEY]: c.key } })] }],
    removeCmds: null, // no CLI removal; handled as a manual note
    removeNote: 'VS Code has no CLI removal: run "MCP: List Servers" in the command palette and remove mv-travel.',
  })]),
  cliClient({
    id: 'gemini', name: 'Gemini CLI', bin: 'gemini', detect: () => !!which('gemini'),
    installCmds: (c) => [
      { args: ['mcp', 'remove', '-s', 'user', NAME], optional: true },
      { args: ['mcp', 'add', '-s', 'user', NAME, NODE, c.script, '-e', `${ENV_KEY}=${c.key}`] },
    ],
    removeCmds: () => [{ args: ['mcp', 'remove', '-s', 'user', NAME], optional: true }],
  }),
  jsonClient({
    id: 'claude-desktop', name: 'Claude Desktop', root: 'mcpServers', restartHint: 'quit Claude Desktop before installing, or fully quit and reopen it after',
    candidates() {
      const list = [MAC ? path.join(HOME, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json')
        : WIN ? path.join(APPDATA, 'Claude', 'claude_desktop_config.json')
          : path.join(HOME, '.config', 'Claude', 'claude_desktop_config.json')];
      if (WIN) { // Microsoft Store (MSIX) install keeps its config under Packages
        const pk = path.join(process.env.LOCALAPPDATA || path.join(HOME, 'AppData', 'Local'), 'Packages');
        try {
          for (const d of fs.readdirSync(pk)) {
            if (d.startsWith('Claude_')) list.push(path.join(pk, d, 'LocalCache', 'Roaming', 'Claude', 'claude_desktop_config.json'));
          }
        } catch (e) { /* no Packages dir */ }
      }
      return list;
    },
    multi: true,
    detect() { return this.candidates().some(parentExists) || (MAC && exists(path.join(appsDir, 'Claude.app'))); },
    entry: (c) => stdioEntry(c),
  }),
  jsonClient({
    id: 'cursor', name: 'Cursor', root: 'mcpServers',
    candidates: () => [path.join(HOME, '.cursor', 'mcp.json')],
    detect: () => exists(path.join(HOME, '.cursor')),
    entry: (c) => stdioEntry(c, { type: 'stdio' }),
  }),
  jsonClient({
    id: 'windsurf', name: 'Windsurf / Devin Desktop', root: 'mcpServers', multi: true,
    candidates: () => [path.join(HOME, '.codeium', 'windsurf', 'mcp_config.json'),
      WIN ? path.join(APPDATA, 'devin', 'mcp_config.json') : path.join(HOME, '.config', 'devin', 'mcp_config.json')],
    entry: (c) => stdioEntry(c),
  }),
  jsonClient({
    id: 'cline', name: 'Cline (VS Code)', root: 'mcpServers', script: 'cline',
    candidates: () => [path.join(vscodeUser(), 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json')],
    detect: () => exists(path.join(vscodeUser(), 'globalStorage', 'saoudrizwan.claude-dev')),
    entry: (c, old) => stdioEntry(c, { disabled: false, autoApprove: old && Array.isArray(old.autoApprove) ? old.autoApprove : [] }),
  }),
  jsonClient({
    id: 'roo', name: 'Roo Code (VS Code)', root: 'mcpServers',
    candidates: () => {
      const dir = path.join(vscodeUser(), 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings');
      const a = path.join(dir, 'mcp_settings.json'), b = path.join(dir, 'cline_mcp_settings.json');
      return [exists(a) || !exists(b) ? a : b];
    },
    detect: () => exists(path.join(vscodeUser(), 'globalStorage', 'rooveterinaryinc.roo-cline')),
    allCandidates: () => ['mcp_settings.json', 'cline_mcp_settings.json'].map((f) =>
      path.join(vscodeUser(), 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', f)),
    entry: (c) => stdioEntry(c, { type: 'stdio' }),
  }),
  jsonClient({
    id: 'lmstudio', name: 'LM Studio', root: 'mcpServers',
    candidates: () => [path.join(HOME, '.lmstudio', 'mcp.json')],
    detect: () => exists(path.join(HOME, '.lmstudio')),
    entry: (c) => stdioEntry(c),
  }),
  jsonClient({
    id: 'kiro', name: 'Kiro', root: 'mcpServers',
    candidates: () => [path.join(HOME, '.kiro', 'settings', 'mcp.json')],
    detect: () => exists(path.join(HOME, '.kiro')),
    entry: (c) => stdioEntry(c),
  }),
  jsonClient({
    id: 'antigravity', name: 'Antigravity', root: 'mcpServers', multi: true,
    candidates: () => [path.join(HOME, '.gemini', 'antigravity', 'mcp_config.json'), path.join(HOME, '.gemini', 'config', 'mcp_config.json')],
    entry: (c) => stdioEntry(c),
  }),
  jsonClient({
    id: 'opencode', name: 'opencode', root: 'mcp', format: 'jsonc', fresh: { $schema: 'https://opencode.ai/config.json' },
    // If opencode.jsonc exists it is the config; never create opencode.json beside it.
    candidates: () => {
      const dir = path.join(HOME, '.config', 'opencode');
      return [exists(path.join(dir, 'opencode.jsonc')) ? path.join(dir, 'opencode.jsonc') : path.join(dir, 'opencode.json')];
    },
    allCandidates: () => ['opencode.json', 'opencode.jsonc'].map((f) => path.join(HOME, '.config', 'opencode', f)),
    detect: () => exists(path.join(HOME, '.config', 'opencode')),
    entry: (c) => ({ type: 'local', command: [NODE, c.script], enabled: true, environment: { [ENV_KEY]: c.key } }),
  }),
  jsonClient({
    id: 'zed', name: 'Zed', root: 'context_servers', format: 'jsonc',
    candidates: () => [WIN ? path.join(APPDATA, 'Zed', 'settings.json') : path.join(HOME, '.config', 'zed', 'settings.json')],
    detect() { return parentExists(this.candidates()[0]); },
    entry: (c) => stdioEntry(c),
  }),
  { id: 'goose', name: 'Goose', kind: 'manual', restartHint: 'restart Goose', detect: () => !!which('goose'),
    manual: () => ['Run `goose configure` -> Add Extension -> Command-line Extension, then enter:',
      `  Command: ${NODE} ${CLINE_OR_MAIN()}`, `  Environment variable: ${ENV_KEY}=<your key>`] },
  { id: 'augment', name: 'Augment', kind: 'manual', restartHint: 'restart the editor',
    detect: () => exists(path.join(HOME, '.augment')) || !!which('auggie'),
    manual: () => ['In Augment: Settings -> MCP -> Import from JSON, and paste the snippet below.'], snippet: true },
];
// Targets default: the first candidate; multi-candidate clients use every candidate whose parent dir exists.
for (const c of CLIENTS) {
  if (c.kind === 'cli' || c.kind === 'manual') continue;
  if (!c.detect) c.detect = function () { return this.candidates().some(parentExists); };
  c.targets = function () { const t = this.candidates().filter(parentExists); return this.multi && t.length ? t : this.multi ? [this.candidates()[0]] : this.candidates(); };
}
function CLINE_OR_MAIN() { return path.join(INSTALL_DIR, MAIN_FILE); }

// ----------------------------------------------------------- snippets/manual
const snippetFor = (def, c) => JSON.stringify({ [def.root || 'mcpServers']: { [NAME]: def.entry ? def.entry({ ...c, key: '<YOUR_MOUNTVACATION_API_KEY>' }) : stdioEntry({ ...c, key: '<YOUR_MOUNTVACATION_API_KEY>' }) } }, null, 2);
const genericSnippet = (c) => JSON.stringify({ mcpServers: { [NAME]: stdioEntry({ ...c, key: '<YOUR_MOUNTVACATION_API_KEY>' }) } }, null, 2);

// -------------------------------------------------------------- configuring
// Each returns { status, notes[], snippets[] } where status is
// installed | updated | manual | skipped | failed.
function configureJson(def, ctx) {
  const res = { status: 'skipped', notes: [], snippets: [] };
  const states = [];
  const c = { key: ctx.key, script: def.script === 'cline' ? ctx.clineScript : ctx.mainScript };
  for (const file of def.targets()) {
    const cfg = readConfig(file);
    if (cfg.error || !isObj(cfg.data)) {
      states.push('manual');
      res.notes.push(`${tilde(file)} has comments or is not strict JSON; left untouched. Add this yourself (use your real key):`);
      res.snippets.push({ file, text: snippetFor(def, c) });
      continue;
    }
    let data = cfg.data;
    if (cfg.missing && def.fresh) data = { ...def.fresh };
    if (data[def.root] === undefined) data[def.root] = {};
    if (!isObj(data[def.root])) { states.push('skipped'); res.notes.push(`${tilde(file)}: "${def.root}" is not an object; left untouched.`); continue; }
    const had = Object.prototype.hasOwnProperty.call(data[def.root], NAME);
    data[def.root][NAME] = def.entry(c, data[def.root][NAME]);
    const dropOld = ctx.removeOld && Object.prototype.hasOwnProperty.call(data[def.root], OLD_NAME);
    if (dropOld) { delete data[def.root][OLD_NAME]; res.notes.push(`Removed the old "${OLD_NAME}" entry from ${tilde(file)}.`); }
    if (opts.dry) {
      info(`would ${had ? 'update' : 'add'} "${NAME}" in ${tilde(file)}${dropOld ? ` and remove old "${OLD_NAME}"` : ''}`);
    } else {
      try {
        const backup = writeConfig(file, data, cfg.indent);
        info(`${had ? 'updated' : 'added'} ${tilde(file)}${backup ? ` (backup: ${path.basename(backup)})` : ''}${dropOld ? `; removed old "${OLD_NAME}"` : ''}`);
      } catch (e) { states.push(e.skip ? 'skipped' : 'failed'); res.notes.push(`${tilde(file)}: ${e.message}`); continue; }
    }
    states.push(had ? 'updated' : 'installed');
  }
  res.status = ['failed', 'updated', 'installed', 'manual', 'skipped'].find((s) => states.includes(s)) || 'skipped';
  if (res.status === 'manual' && states.includes('installed')) res.status = 'installed';
  return res;
}

function runCmds(def, cmds) {
  const res = { status: 'installed', notes: [], snippets: [] };
  let removedOk = false;
  for (const cmd of cmds) {
    if (opts.dry) { info(`would run: ${shown(def.bin, cmd.args)}`); continue; }
    const r = runBin(def.bin, cmd.args);
    if (r.status !== 0 && !cmd.optional) {
      res.status = 'failed';
      const why = r.error && r.error.code === 'ETIMEDOUT' ? 'timed out'
        : r.status === null ? `failed to run (${(r.error && r.error.message) || 'killed'})`
          : `exited ${r.status}: ${(r.stderr || r.stdout || '').trim().split('\n')[0] || 'no output'}`;
      res.notes.push(`\`${shown(def.bin, cmd.args)}\` ${why}`);
      if (removedOk) {
        res.notes.push(`The previous "${NAME}" entry was removed, so ${def.name} currently has NO ${NAME} entry. Run this by hand:`);
        res.notes.push(`  ${shown(def.bin, cmd.args)}   (use your real API key instead of the masked one)`);
      }
      break;
    }
    if (cmd.optional && r.status === 0 && cmd.args.includes(NAME)) removedOk = true;
    info(`ran: ${shown(def.bin, cmd.args)}`);
    if (cmd.old && r.status === 0) res.notes.push(`Removed the old "${OLD_NAME}" entry.`);
  }
  return res;
}

function configure(def, ctx) {
  const c = { key: ctx.key, script: ctx.mainScript, removeOld: ctx.removeOld };
  if (def.kind === 'cli') return runCmds(def, def.installCmds(c));
  if (def.kind === 'manual') {
    const notes = def.manual();
    const snippets = def.snippet ? [{ text: genericSnippet(c) }] : [];
    return { status: 'manual', notes, snippets };
  }
  return configureJson(def, ctx);
}

function unconfigure(def, ctx) {
  const res = { status: 'skipped', notes: [], snippets: [] };
  if (def.kind === 'manual') return { ...res, status: 'manual', notes: ['Remove "mv-travel" from this app yourself.'] };
  if (def.kind === 'cli') {
    if (!def.removeCmds) return { ...res, status: 'manual', notes: [def.removeNote] };
    const r = runCmds(def, def.removeCmds());
    return { ...r, status: r.status === 'installed' ? 'removed' : r.status };
  }
  const states = [];
  const files = def.allCandidates ? def.allCandidates() : def.candidates();
  for (const file of files) {
    if (!exists(file)) continue;
    const cfg = readConfig(file);
    if (cfg.error || !isObj(cfg.data)) {
      states.push('manual');
      res.notes.push(`${tilde(file)} could not be parsed as strict JSON; remove "${NAME}" from "${def.root}" by hand.`);
      continue;
    }
    const root = cfg.data[def.root];
    if (!isObj(root) || !(NAME in root)) continue;
    delete root[NAME];
    if (opts.dry) { info(`would remove "${NAME}" from ${tilde(file)}`); states.push('removed'); continue; }
    try {
      const backup = writeConfig(file, cfg.data, cfg.indent);
      info(`removed from ${tilde(file)}${backup ? ` (backup: ${path.basename(backup)})` : ''}`);
      states.push('removed');
    } catch (e) { states.push(e.skip ? 'skipped' : 'failed'); res.notes.push(`${tilde(file)}: ${e.message}`); }
  }
  res.status = ['failed', 'removed', 'manual', 'skipped'].find((s) => states.includes(s)) || 'skipped';
  if (!states.length) res.notes.push('no mv-travel entry found');
  return res;
}

// Any old "mountvacation" entry in the files we would edit?
function hasOldEntry(def) {
  if (def.kind === 'cli') return def.id === 'claude-code';
  if (def.kind === 'manual') return false;
  return def.targets().some((f) => { const r = readConfig(f); return r.data && isObj(r.data[def.root]) && OLD_NAME in r.data[def.root]; });
}

// -------------------------------------------------------------- the flow
async function chooseClients(detected) {
  let selected = new Set(detected.map((d) => d.id));
  if (opts.clients) {
    const known = CLIENTS.map((c) => c.id);
    const want = opts.clients.split(',').map((s) => s.trim()).filter(Boolean);
    const bad = want.filter((w) => w !== 'all' && !known.includes(w));
    if (bad.length) throw new Error(`Unknown client id(s): ${bad.join(', ')}`);
    if (!want.includes('all')) {
      for (const w of want) if (!selected.has(w)) warn(`${w} was not detected on this machine; skipping it.`);
      selected = new Set(want.filter((w) => selected.has(w)));
    }
    return detected.filter((d) => selected.has(d.id));
  }
  if (!interactive()) return detected;
  for (;;) {
    detected.forEach((d, i) => log(`   ${String(i + 1).padStart(2)}) [${selected.has(d.id) ? 'x' : ' '}] ${d.name}`));
    const a = (await askLine('  Type numbers to toggle (e.g. "2 4"), or press Enter to continue: ')).trim();
    if (!a) break;
    for (const t of a.split(/[\s,]+/)) {
      const d = detected[Number(t) - 1];
      if (d) selected.has(d.id) ? selected.delete(d.id) : selected.add(d.id);
    }
  }
  return detected.filter((d) => selected.has(d.id));
}

function printSummary(rows, verb) {
  log('\n' + paint('1;36', verb));
  const colors = { installed: 32, updated: 32, removed: 32, manual: 33, skipped: 90, failed: 31 };
  for (const r of rows) {
    log(`  ${paint(colors[r.res.status] || 0, r.res.status.padEnd(9))} ${r.def.name}`);
    for (const n of r.res.notes) log(`            ${n}`);
    for (const s of r.res.snippets) {
      if (s.file) log(`            ${tilde(s.file)}:`);
      log(s.text.split('\n').map((l) => '              ' + l).join('\n'));
    }
  }
}

async function main() {
  parseArgs(process.argv.slice(2));
  if (opts.help) { console.log(HELP); return 0; }
  if (parseInt(process.versions.node, 10) < 18) throw new Error('Node 18 or newer is required (https://nodejs.org).');

  log(paint('1', '\nMV Travel MCP installer') + (opts.dry ? paint(33, '  (dry run: nothing will be written)') : ''));
  if (opts.key) {
    SECRET = opts.key.trim();
    if (!KEY_RE.test(SECRET)) throw new Error('The API key has an unexpected format (expected 8-256 letters, digits, . _ ~ -).');
  }
  if (!opts.uninstall && NODE_UNSTABLE) warn('Node was found in a version-managed folder. If you change Node versions later, re-run this installer.');

  if (opts.uninstall) return uninstall();

  const key = await stepKey();
  SECRET = key;

  // Detect first (cheap), so we know which scripts to download.
  const detected = CLIENTS.filter((c) => { try { return c.detect(); } catch (e) { return false; } });

  step(2, 'Downloading the MV Travel server');
  const mainScript = await download(MAIN_FILE);
  const clineScript = detected.some((d) => d.script === 'cline') ? await download(CLINE_FILE) : path.join(INSTALL_DIR, CLINE_FILE);

  step(3, 'Looking for AI apps on this machine');
  if (!detected.length) {
    warn('No supported AI apps were detected.');
    log('\n  If your app supports stdio MCP servers, add this to its config (replace the key placeholder):\n');
    log(genericSnippet({ script: mainScript }).split('\n').map((l) => '    ' + l).join('\n'));
    log(`\n  The server script is saved at ${tilde(mainScript)}.`);
    return 0;
  }
  detected.forEach((d) => info(`found ${d.name}`));

  step(4, 'Choose where to install');
  const chosen = await chooseClients(detected);
  if (!chosen.length) { warn('Nothing selected.'); return 0; }

  const ctx = { key, mainScript, clineScript, removeOld: false };
  if (chosen.some(hasOldEntry)) {
    ctx.removeOld = await confirm(`  Remove the old "${OLD_NAME}" entry where present?`, true);
  }

  step(5, 'Writing configuration');
  const rows = [];
  for (const def of chosen) {
    log(paint('1', `  ${def.name}`));
    let res;
    try { res = configure(def, ctx); } catch (e) { res = { status: 'failed', notes: [e.message], snippets: [] }; }
    rows.push({ def, res });
  }

  printSummary(rows, opts.dry ? 'Planned (dry run)' : 'Summary');
  const hints = [...new Set(rows.filter((r) => ['installed', 'updated'].includes(r.res.status)).map((r) => `${r.def.name}: ${r.def.restartHint}`))];
  if (hints.length) { log('\n  Next: restart your apps so they pick up the server.'); hints.forEach((h) => log(`   - ${h}`)); }
  if (!opts.dry) log(`\n  Config backups are named *.mv-travel-backup-<time> next to each edited file (they contain your key; delete when happy).`);
  return rows.some((r) => r.res.status === 'failed') ? 1 : 0;
}

async function uninstall() {
  step(1, 'Removing MV Travel from your AI apps');
  const rows = [];
  for (const def of CLIENTS) {
    if (def.kind === 'manual') continue;
    // CLI clients only if present; file clients if any config exists.
    if (def.kind === 'cli' && !def.detect()) continue;
    log(paint('1', `  ${def.name}`));
    let res;
    try { res = unconfigure(def, {}); } catch (e) { res = { status: 'failed', notes: [e.message], snippets: [] }; }
    if (def.kind !== 'cli' && res.status === 'skipped' && res.notes.length === 1 && /no mv-travel/.test(res.notes[0])) continue;
    rows.push({ def, res });
  }
  printSummary(rows, opts.dry ? 'Planned (dry run)' : 'Summary');
  if (exists(INSTALL_DIR)) {
    if (opts.dry) info(`would ask to delete ${tilde(INSTALL_DIR)}`);
    else if (await confirm(`\n  Delete ${tilde(INSTALL_DIR)} (the downloaded server scripts)?`, true)) {
      fs.rmSync(INSTALL_DIR, { recursive: true, force: true });
      ok(`deleted ${tilde(INSTALL_DIR)}`);
    }
  }
  return rows.some((r) => r.res.status === 'failed') ? 1 : 0;
}

main().then((code) => { process.exitCode = code; }, (e) => {
  console.error(redact(paint(31, `\nError: ${e.message}`)));
  if (e.hint) console.error(redact(e.hint));
  process.exitCode = 1;
});
