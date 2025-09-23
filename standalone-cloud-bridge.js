#!/usr/bin/env node

/**
 * MountVacation MCP Standalone Cloud Bridge
 * Connects directly to Cloudflare Workers - no local setup required!
 *
 * Usage: Save this file anywhere and reference it in Claude Desktop config
 */

const https = require('https');

const SERVER_URL = 'https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev/mcp';

// Enable logging for debugging
const DEBUG = process.env.MCP_DEBUG === '1';
function log(...args) {
  if (DEBUG) {
    console.error('[MCP Bridge]', ...args);
  }
}

process.stdin.setEncoding('utf8');
let buffer = '';

// Handle initialization
process.stdin.on('data', async (chunk) => {
  buffer += chunk;
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';

  for (const line of lines) {
    if (line.trim()) {
      try {
        const request = JSON.parse(line);
        log('Received request:', request.method, request.id);

        // Handle initialize method specially
        if (request.method === 'initialize') {
          const initResponse = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {}
              },
              serverInfo: {
                name: 'mountvacation-cloud',
                version: '1.0.0'
              }
            }
          };
          process.stdout.write(JSON.stringify(initResponse) + '\n');
          log('Sent initialize response');
          continue;
        }

        // Handle notifications
        if (request.method === 'notifications/initialized') {
          log('Received initialized notification');
          continue;
        }

        // Forward other requests to cloud server
        const response = await forwardToCloudServer(request);
        process.stdout.write(JSON.stringify(response) + '\n');
        log('Forwarded response for:', request.method);

      } catch (error) {
        log('Parse error:', error.message);
        const errorResponse = {
          jsonrpc: '2.0',
          id: null,
          error: { code: -32700, message: 'Parse error: ' + error.message }
        };
        process.stdout.write(JSON.stringify(errorResponse) + '\n');
      }
    }
  }
});

process.stdin.on('end', () => {
  log('STDIN ended, exiting');
  process.exit(0);
});

async function forwardToCloudServer(request) {
  return new Promise((resolve) => {
    const url = new URL(SERVER_URL);
    const postData = JSON.stringify(request);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'MountVacation-MCP-Bridge/1.0'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          resolve({
            jsonrpc: '2.0',
            id: request.id,
            error: { code: -32603, message: 'Invalid JSON response from cloud server' }
          });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({
        jsonrpc: '2.0',
        id: request.id,
        error: { code: -32603, message: 'Failed to connect to cloud server: ' + error.message }
      });
    });
    
    req.setTimeout(30000, () => {
      req.destroy();
      resolve({
        jsonrpc: '2.0',
        id: request.id,
        error: { code: -32603, message: 'Request timeout' }
      });
    });
    
    req.write(postData);
    req.end();
  });
}

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
