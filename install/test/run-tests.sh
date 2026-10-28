#!/bin/bash
# Sandboxed tests for install/install.js and install/install.sh.
# Never touches the real home: every run uses a temp HOME and a PATH shim dir.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
SCR="${MV_TEST_DIR:-/private/tmp/claude-501/-Users-talirezun-Projects-mv-travel-mcp/b5c89480-92a3-4ed4-9eaf-ee09bd6e6340/scratchpad}/mvtest.$$"
mkdir -p "$SCR"
NODE_BIN="$(command -v node)"
KEY="goodKEY-1234567890abcdef"   # fake worker accepts keys starting with "good"
BADKEY="badKEY-1234567890abcdef"
PASS=0; FAIL=0
XENV=()

free_port() { python3 -c 'import socket;s=socket.socket();s.bind(("127.0.0.1",0));print(s.getsockname()[1])'; }

# ---- fake servers
cat > "$SCR/fake_worker.py" <<'PY'
import json, sys
from http.server import BaseHTTPRequestHandler, HTTPServer
LOG = sys.argv[2]
class H(BaseHTTPRequestHandler):
    def do_POST(self):
        body = self.rfile.read(int(self.headers.get('Content-Length', 0)))
        key = self.headers.get('X-MountVacation-API-Key', '')
        with open(LOG, 'a') as f:
            f.write(json.dumps({'path': self.path, 'ua': self.headers.get('User-Agent'), 'body': json.loads(body or b'{}')}) + '\n')
        text = 'Found 1 accommodation' if key.startswith('good') else 'MountVacation API key was rejected (401)'
        out = json.dumps({'jsonrpc': '2.0', 'id': 1, 'result': {'content': [{'type': 'text', 'text': text}]}}).encode()
        self.send_response(200); self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(out))); self.end_headers(); self.wfile.write(out)
    def log_message(self, *a): pass
HTTPServer(('127.0.0.1', int(sys.argv[1])), H).serve_forever()
PY
cat > "$SCR/redirector.py" <<'PY'
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer
TARGET, LOG = sys.argv[2], sys.argv[3]
class H(BaseHTTPRequestHandler):
    def _r(self):
        n = int(self.headers.get('Content-Length', 0)); self.rfile.read(n)
        self.send_response(302); self.send_header('Location', TARGET + self.path)
        self.send_header('Content-Length', '0'); self.end_headers()
    do_GET = do_POST = _r
    def log_message(self, *a): pass
HTTPServer(('127.0.0.1', int(sys.argv[1])), H).serve_forever()
PY
cat > "$SCR/sink.py" <<'PY'
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer
LOG = sys.argv[2]
class H(BaseHTTPRequestHandler):
    def _r(self):
        n = int(self.headers.get('Content-Length', 0)); self.rfile.read(n)
        open(LOG, 'a').write(self.command + ' ' + self.path + ' key=' + self.headers.get('X-MountVacation-API-Key', '') + '\n')
        self.send_response(200); self.send_header('Content-Length', '2'); self.end_headers(); self.wfile.write(b'ok')
    do_GET = do_POST = _r
    def log_message(self, *a): pass
HTTPServer(('127.0.0.1', int(sys.argv[1])), H).serve_forever()
PY
WPORT=$(free_port); FPORT=$(free_port); RPORT=$(free_port); SPORT=$(free_port); TPORT=$(free_port)
# tampered copy of the scripts (one byte appended), served separately
mkdir -p "$SCR/tampersrv/server-versions"
cp "$REPO"/server-versions/mountvacation-mcp-server*.js "$SCR/tampersrv/server-versions/"
echo "// tampered" >> "$SCR/tampersrv/server-versions/mountvacation-mcp-server.js"
python3 "$SCR/fake_worker.py" "$WPORT" "$SCR/worker.log" & WPID=$!
(cd "$REPO" && python3 -m http.server "$FPORT" --bind 127.0.0.1 >/dev/null 2>&1) & FPID=$!
python3 "$SCR/sink.py" "$SPORT" "$SCR/sink.log" & SPID=$!
python3 "$SCR/redirector.py" "$RPORT" "http://127.0.0.1:$SPORT" x & RPID=$!
(cd "$SCR/tampersrv" && python3 -m http.server "$TPORT" --bind 127.0.0.1 >/dev/null 2>&1) & TPID=$!
trap 'kill $WPID $FPID $SPID $RPID $TPID 2>/dev/null; [ -n "${KEEP:-}" ] || rm -rf "${SCR:?}"' EXIT
sleep 1
BASE_URL="http://127.0.0.1:$FPORT"; WORKER_URL="http://127.0.0.1:$WPORT"

# ---- helpers
ok()   { PASS=$((PASS+1)); echo "PASS  $1"; }
bad()  { FAIL=$((FAIL+1)); echo "FAIL  $1  ${2:-}"; }
check(){ if eval "$2"; then ok "$1"; else bad "$1" "[$2]"; fi; }
nj()   { "$NODE_BIN" -e 'const j=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));const r=eval(process.argv[2]);console.log(typeof r==="string"?r:JSON.stringify(r))' "$1" "$2"; }

# Builds a sandbox HOME with fake client dirs, existing configs and fake CLIs.
mkenv() {  # $1 = name, $2 = "empty" for nothing detected
  E="$SCR/$1"; rm -rf "${E:?}"; H="$E/home"; SHIM="$E/shim"; REC="$E/rec"
  mkdir -p "$H" "$SHIM" "$REC" "$E/apps"
  [ "${2:-}" = empty ] && return
  if [ "$(uname)" = Darwin ]; then SUP="$H/Library/Application Support"; else SUP="$H/.config"; fi
  CURSOR="$H/.cursor/mcp.json"; DESK="$SUP/Claude/claude_desktop_config.json"
  ZED="$H/.config/zed/settings.json"; KIRO="$H/.kiro/settings/mcp.json"
  CLINE="$SUP/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json"
  mkdir -p "$H/.cursor" "$SUP/Claude" "$H/.config/zed" "$H/.kiro/settings" "$H/.codeium/windsurf" \
           "$H/.config/opencode" "$SUP/Code/User/globalStorage/saoudrizwan.claude-dev"
  echo '{"mcpServers":{"other":{"command":"x","args":["y"]},"mountvacation":{"command":"old"}}}' > "$CURSOR"
  printf '{\n    "preferences": {"a": 1},\n    "mcpServers": {"keepme": {"command": "k"}, "mountvacation": {"command": "old"}}\n}\n' > "$DESK"
  printf '// my settings\n{\n  "theme": "One Dark", // comment\n  "context_servers": {}\n}\n' > "$ZED"
  echo '{ this is not json' > "$KIRO"
  for c in claude codex code gemini; do
    cat > "$SHIM/$c" <<SH
#!/bin/sh
{ echo CALL; for a in "\$@"; do printf '%s\n' "\$a"; done; } >> "$REC/$c.log"
exit 0
SH
    chmod +x "$SHIM/$c"
  done
}
# Runs the installer inside the sandbox. Output -> $E/out.txt, exit code -> RC.
run() {
  ( cd "$E" && env -i HOME="$H" USERPROFILE="$H" APPDATA="$H/AppData/Roaming" LOCALAPPDATA="$H/AppData/Local" \
      PATH="$SHIM:/usr/bin:/bin" MV_TRAVEL_INSTALL_BASE="${BASE_OVERRIDE:-$BASE_URL}" MV_TRAVEL_WORKER_URL="${WORKER_OVERRIDE:-$WORKER_URL}" \
      MV_TRAVEL_APPS_DIR="$E/apps" ${XENV[@]+"${XENV[@]}"} "$NODE_BIN" "$REPO/install/install.js" "$@" </dev/null ) > "$E/out.txt" 2>&1
  RC=$?
}
snap() { (cd "$H" && find . -type f -exec cksum {} + | sort; find . | sort) | cksum; }
expect_log() {  # name, cli, expected
  if [ "$(cat "$REC/$2.log" 2>/dev/null)" = "$3" ]; then ok "$1"; else bad "$1" "got: $(tr '\n' '|' < "$REC/$2.log" 2>/dev/null)"; fi
}

# ======================================================= 1. fresh install
mkenv fresh
SCRIPT="$H/.mv-travel-mcp/mountvacation-mcp-server.js"; CSCRIPT="$H/.mv-travel-mcp/mountvacation-mcp-server-cline.js"
BEFORE_ZED="$(cat "$ZED")"; BEFORE_KIRO="$(cat "$KIRO")"
run --key "$KEY" --yes
check "fresh install: exit 0" '[ $RC -eq 0 ]'
check "scripts downloaded (main + cline)" '[ -s "$SCRIPT" ] && [ -s "$CSCRIPT" ]'
check "worker got tools/call with UA, query" 'grep -q "mv-travel-installer/1.0" "$SCR/worker.log" && grep -q "search_accommodations" "$SCR/worker.log" && grep -q "Bled, Slovenia" "$SCR/worker.log"'
EXP_CUR=$("$NODE_BIN" -e 'console.log(JSON.stringify({type:"stdio",command:process.argv[1],args:[process.argv[2]],env:{MOUNTVACATION_API_KEY:process.argv[3]}}))' "$NODE_BIN" "$SCRIPT" "$KEY")
check "cursor entry correct (type, command, args, env)" '[ "$(nj "$CURSOR" "JSON.stringify(j.mcpServers[\"mv-travel\"])")" = "$EXP_CUR" ]'
check "other servers preserved (cursor)" '[ "$(nj "$CURSOR" "j.mcpServers.other.command")" = x ]'
check "old mountvacation removed (cursor)" '[ "$(nj "$CURSOR" "\"mountvacation\" in j.mcpServers")" = false ]'
check "claude desktop merged, siblings kept" '[ "$(nj "$DESK" "j.preferences.a+j.mcpServers.keepme.command+(\"mountvacation\" in j.mcpServers)+j.mcpServers[\"mv-travel\"].args[0]")" = "1kfalse$SCRIPT" ]'
check "claude desktop indent preserved (4 spaces)" 'grep -q "^    \"preferences\"" "$DESK"'
check "cline uses cline script + disabled/autoApprove" '[ "$(nj "$CLINE" "j.mcpServers[\"mv-travel\"].args[0]+j.mcpServers[\"mv-travel\"].disabled+j.mcpServers[\"mv-travel\"].autoApprove.length")" = "${CSCRIPT}false0" ]'
check "windsurf entry (no type)" '[ "$(nj "$H/.codeium/windsurf/mcp_config.json" "(\"type\" in j.mcpServers[\"mv-travel\"])+j.mcpServers[\"mv-travel\"].command")" = "false$NODE_BIN" ]'
check "opencode created with schema + local entry" '[ "$(nj "$H/.config/opencode/opencode.json" "j.\$schema+j.mcp[\"mv-travel\"].type+j.mcp[\"mv-travel\"].enabled+j.mcp[\"mv-travel\"].command[1]+j.mcp[\"mv-travel\"].environment.MOUNTVACATION_API_KEY")" = "https://opencode.ai/config.jsonlocaltrue$SCRIPT$KEY" ]'
check "JSONC (zed) left untouched" '[ "$(cat "$ZED")" = "$BEFORE_ZED" ]'
check "JSONC reported manual with snippet" 'grep -qE "manual +Zed" "$E/out.txt" && grep -q "context_servers" "$E/out.txt"'
check "invalid JSON (kiro) untouched, reported manual with snippet" '[ "$(cat "$KIRO")" = "$BEFORE_KIRO" ] && grep -qE "manual +Kiro" "$E/out.txt" && grep -q "mcpServers" "$E/out.txt"'
check "old mountvacation removal is mentioned in summary" 'grep -q "Removed the old \"mountvacation\"" "$E/out.txt"'
check "backup created for cursor" 'ls "$H"/.cursor/mcp.json.mv-travel-backup-* >/dev/null 2>&1'
check "config mode 600" '[ "$(stat -f %Lp "$CURSOR" 2>/dev/null || stat -c %a "$CURSOR")" = 600 ]'
check "no temp files left behind" '! find "$H" -name "*.mv-travel-tmp-*" -o -name "*.tmp.js" | grep -q .'
expect_log "claude args" claude "CALL
mcp
remove
--scope
user
mountvacation
CALL
mcp
remove
--scope
user
mv-travel
CALL
mcp
add
--transport
stdio
--scope
user
mv-travel
-e
MOUNTVACATION_API_KEY=$KEY
--
$NODE_BIN
$SCRIPT"
expect_log "codex args" codex "CALL
mcp
remove
mv-travel
CALL
mcp
add
mv-travel
--env
MOUNTVACATION_API_KEY=$KEY
--
$NODE_BIN
$SCRIPT"
expect_log "gemini args" gemini "CALL
mcp
remove
-s
user
mv-travel
CALL
mcp
add
-s
user
mv-travel
$NODE_BIN
$SCRIPT
-e
MOUNTVACATION_API_KEY=$KEY"
expect_log "vscode args" code "CALL
--add-mcp
{\"name\":\"mv-travel\",\"type\":\"stdio\",\"command\":\"$NODE_BIN\",\"args\":[\"$SCRIPT\"],\"env\":{\"MOUNTVACATION_API_KEY\":\"$KEY\"}}"
check "API key never printed (stdout/stderr), masked form shown" '! grep -qF "$KEY" "$E/out.txt" && grep -qF "good…" "$E/out.txt"'

# ======================================================= 2. idempotent re-run
CUR1="$(cat "$CURSOR")"
run --key "$KEY" --yes
check "re-run: exit 0" '[ $RC -eq 0 ]'
check "re-run: reports updated" 'grep -qE "updated +Cursor" "$E/out.txt"'
check "re-run: cursor content identical, single entry" '[ "$(cat "$CURSOR")" = "$CUR1" ] && [ "$(nj "$CURSOR" "Object.keys(j.mcpServers).join()")" = "other,mv-travel" ]'
check "re-run: key not printed" '! grep -qF "$KEY" "$E/out.txt"'

check "re-run: only one backup kept per config" '[ "$(ls "$H"/.cursor/mcp.json.mv-travel-backup-* | wc -l | tr -d " ")" = 1 ]'

# ======================================================= 3. uninstall
rm -f "${REC:?}"/*.log
run --uninstall --yes
check "uninstall: exit 0" '[ $RC -eq 0 ]'
check "uninstall: entry gone, others kept (cursor)" '[ "$(nj "$CURSOR" "Object.keys(j.mcpServers).join()")" = other ]'
check "uninstall: claude desktop/cline/opencode cleaned" '[ "$(nj "$DESK" "(\"mv-travel\" in j.mcpServers)+j.mcpServers.keepme.command")" = falsek ] && [ "$(nj "$CLINE" "Object.keys(j.mcpServers).length")" = 0 ] && [ "$(nj "$H/.config/opencode/opencode.json" "Object.keys(j.mcp).length")" = 0 ]'
check "uninstall: install dir deleted" '[ ! -e "$H/.mv-travel-mcp" ]'
expect_log "uninstall: claude remove call" claude "CALL
mcp
remove
--scope
user
mv-travel"
check "uninstall: codex+gemini remove called" 'grep -q "^mv-travel$" "$REC/codex.log" && grep -q "^-s$" "$REC/gemini.log"'

# ======================================================= 4. dry-run
mkenv dry
S0="$(snap)"
run --key "$KEY" --yes --dry-run
check "dry-run: exit 0" '[ $RC -eq 0 ]'
check "dry-run: filesystem unchanged" '[ "$(snap)" = "$S0" ]'
check "dry-run: no CLI invoked" '[ -z "$(ls "$REC")" ]'
check "dry-run: prints plan" 'grep -q "would" "$E/out.txt"'
check "dry-run: key not printed" '! grep -qF "$KEY" "$E/out.txt"'
run --key "$KEY" --yes --dry-run --uninstall
check "dry-run uninstall: no changes" '[ "$(snap)" = "$S0" ]'

# ======================================================= 5. bad key
mkenv badkey
run --key "$BADKEY" --yes
check "bad key: exit 1" '[ $RC -eq 1 ]'
check "bad key: says rejected/invalid" 'grep -qi "rejected\|invalid" "$E/out.txt"'
check "bad key: nothing written" '[ ! -e "$H/.mv-travel-mcp" ] && [ -z "$(ls "$REC")" ]'
check "bad key: not printed" '! grep -qF "$BADKEY" "$E/out.txt"'

# ======================================================= 6. misc
mkenv nokey
run --yes
check "no key and no terminal: exit 1 with hint" '[ $RC -eq 1 ] && grep -q -- "--key" "$E/out.txt"'

mkenv none empty
run --key "$KEY" --yes
check "nothing detected: exit 0 + generic snippet" '[ $RC -eq 0 ] && grep -q "mcpServers" "$E/out.txt" && grep -q "YOUR_MOUNTVACATION_API_KEY" "$E/out.txt"'

mkenv sel
run --key "$KEY" --clients cursor,codex
check "--clients limits targets" '[ $RC -eq 0 ] && [ -f "$CURSOR" ] && [ ! -e "$H/.codeium/windsurf/mcp_config.json" ] && [ -f "$REC/codex.log" ] && [ ! -e "$REC/claude.log" ]'
run --key "$KEY" --clients bogus
check "--clients unknown id: exit 1" '[ $RC -eq 1 ]'

# ======================================================= 6b. audit fixes
# key via env var; bad format rejected
mkenv envkey
XENV=(MV_TRAVEL_API_KEY="$KEY"); run --yes --clients cursor; XENV=()
check "MV_TRAVEL_API_KEY env works (no --key)" '[ $RC -eq 0 ] && [ "$(nj "$CURSOR" "j.mcpServers[\"mv-travel\"].env.MOUNTVACATION_API_KEY")" = "$KEY" ] && ! grep -qF "$KEY" "$E/out.txt"'
run --key "bad key!" --yes
check "malformed key rejected" '[ $RC -eq 1 ] && grep -qi "unexpected format" "$E/out.txt"'

# stable node path preferred over process.execPath
mkenv nodepath
ln -s "$NODE_BIN" "$SHIM/node"
run --key "$KEY" --yes --clients cursor
check "stable PATH node used as given (not realpath)" '[ "$(nj "$CURSOR" "j.mcpServers[\"mv-travel\"].command")" = "$SHIM/node" ]'

# redirect on key check: not followed, key never reaches the target
mkenv redir
: > "$SCR/sink.log"
WORKER_OVERRIDE="http://127.0.0.1:$RPORT"; run --key "$KEY" --yes --clients cursor; WORKER_OVERRIDE=
check "key check redirect: not followed, key not leaked" '[ ! -s "$SCR/sink.log" ] && grep -qi "redirect" "$E/out.txt" && ! grep -qF "$KEY" "$E/out.txt"'
# download redirect to non-https refused
mkenv dlredir
BASE_OVERRIDE="http://127.0.0.1:$RPORT"; run --key "$KEY" --yes --clients cursor; BASE_OVERRIDE=
check "download redirect (non-https) refused" '[ $RC -eq 1 ] && grep -q "refusing redirect" "$E/out.txt" && [ ! -s "$SCR/sink.log" ]'

# tampered download rejected
mkenv tamper
BASE_OVERRIDE="http://127.0.0.1:$TPORT"; run --key "$KEY" --yes --clients cursor; BASE_OVERRIDE=
check "tampered download rejected, nothing installed" '[ $RC -eq 1 ] && grep -q "integrity check" "$E/out.txt" && [ ! -e "$H/.mv-travel-mcp/mountvacation-mcp-server.js" ] && [ "$(nj "$CURSOR" "Object.keys(j.mcpServers).join()")" = "other,mountvacation" ]'

# symlinked config: write goes to the real target, link survives
mkenv symlink
mv "$CURSOR" "$E/real-cursor.json"; ln -s "$E/real-cursor.json" "$CURSOR"
run --key "$KEY" --yes --clients cursor
check "symlinked config: link kept, real file updated" '[ $RC -eq 0 ] && [ -L "$CURSOR" ] && [ "$(nj "$E/real-cursor.json" "j.mcpServers.other.command+(\"mv-travel\" in j.mcpServers)")" = xtrue ]'

# read-only config skipped with a note
mkenv ro
chmod 444 "$CURSOR"; RO_BEFORE="$(cat "$CURSOR")"
run --key "$KEY" --yes --clients cursor,codex
check "read-only config: skipped with note, untouched, others proceed" '[ $RC -eq 0 ] && [ "$(cat "$CURSOR")" = "$RO_BEFORE" ] && grep -qE "skipped +Cursor" "$E/out.txt" && grep -q "not writable" "$E/out.txt" && [ -f "$REC/codex.log" ]'

# CLI remove ok but add fails -> clear message, masked key, exit 1
mkenv addfail
cat > "$SHIM/claude" <<SH
#!/bin/sh
case "\$1 \$2" in "mcp add") exit 1;; esac
exit 0
SH
run --key "$KEY" --yes --clients claude-code
check "remove ok / add failed: reports missing entry, manual command masked" '[ $RC -eq 1 ] && grep -q "currently has NO mv-travel entry" "$E/out.txt" && grep -qF "good…" "$E/out.txt" && ! grep -qF "$KEY" "$E/out.txt"'

# opencode.jsonc is the target; opencode.json not created beside it
mkenv ocjsonc
echo '{"mcp":{"x":{"type":"remote","url":"u"}}}' > "$H/.config/opencode/opencode.jsonc"
run --key "$KEY" --yes --clients opencode
check "opencode.jsonc used, no opencode.json created" '[ ! -e "$H/.config/opencode/opencode.json" ] && [ "$(nj "$H/.config/opencode/opencode.jsonc" "j.mcp.x.type+(\"mv-travel\" in j.mcp)")" = remotetrue ]'

# ======================================================= 7. shell wrapper
mkenv wrap
( cd "$E" && env -i HOME="$H" USERPROFILE="$H" APPDATA="$H/AppData/Roaming" PATH="$SHIM:/usr/bin:/bin:$(dirname "$NODE_BIN")" \
    MV_TRAVEL_INSTALL_BASE="$BASE_URL" MV_TRAVEL_WORKER_URL="$WORKER_URL" MV_TRAVEL_APPS_DIR="$E/apps" \
    bash -s -- --key "$KEY" --yes < "$REPO/install/install.sh" ) > "$E/out.txt" 2>&1; RC=$?
check "install.sh via 'bash -s -- args': exit 0, installed" '[ $RC -eq 0 ] && [ -s "$H/.mv-travel-mcp/mountvacation-mcp-server.js" ] && [ -n "$(nj "$H/.cursor/mcp.json" "j.mcpServers[\"mv-travel\"].command" 2>/dev/null)" ]'
( cd "$E" && env -i HOME="$H" PATH="/usr/bin:/bin" bash "$REPO/install/install.sh" ) > "$E/out2.txt" 2>&1; RC=$?
if ! /usr/bin/env -i PATH=/usr/bin:/bin sh -c 'command -v node' >/dev/null 2>&1; then
  check "install.sh without node: friendly message, exit 1" '[ $RC -eq 1 ] && grep -q "nodejs.org" "$E/out2.txt"'
else
  ok "install.sh without node: skipped (node is in /usr/bin here)"
fi

( cd "$E" && env -i HOME="$H" PATH="$SHIM:/usr/bin:/bin:$(dirname "$NODE_BIN")" MV_TRAVEL_TEST_UID=0 bash "$REPO/install/install.sh" --help ) > "$E/out3.txt" 2>&1; RC=$?
check "install.sh refuses root" '[ $RC -eq 1 ] && grep -qi "not as root" "$E/out3.txt"'
( cd "$E" && env -i HOME="$H" PATH="$SHIM:/usr/bin:/bin:$(dirname "$NODE_BIN")" MV_TRAVEL_TEST_UID=0 MV_TRAVEL_ALLOW_ROOT=1 MV_TRAVEL_INSTALL_BASE="$BASE_URL" bash "$REPO/install/install.sh" --help ) > "$E/out3.txt" 2>&1; RC=$?
check "MV_TRAVEL_ALLOW_ROOT=1 overrides root refusal" '[ $RC -eq 0 ] && grep -q "Usage" "$E/out3.txt"'
sh -n "$REPO/install/install.sh" && ok "sh -n install.sh" || bad "sh -n install.sh"
"$NODE_BIN" --check "$REPO/install/install.js" && ok "node --check install.js" || bad "node --check install.js"

echo; echo "Passed: $PASS  Failed: $FAIL"
[ "$FAIL" -eq 0 ]
