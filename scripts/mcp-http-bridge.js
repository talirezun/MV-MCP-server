#!/usr/bin/env node

/**
 * MCP HTTP Bridge - Converts STDIO MCP protocol to HTTP requests
 * This allows Claude Desktop to connect to HTTP-based MCP servers
 */

const https = require('https');
const http = require('http');

const SERVER_URL = 'https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev/mcp';

// Read from stdin and write to stdout for MCP protocol
process.stdin.setEncoding('utf8');

let buffer = '';

process.stdin.on('data', async (chunk) => {
  buffer += chunk;
  
  // Process complete JSON-RPC messages (separated by newlines)
  const lines = buffer.split('\n');
  buffer = lines.pop() || ''; // Keep incomplete line in buffer
  
  for (const line of lines) {
    if (line.trim()) {
      try {
        const request = JSON.parse(line);
        const response = await forwardToHTTP(request);
        process.stdout.write(JSON.stringify(response) + '\n');
      } catch (error) {
        const errorResponse = {
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32700,
            message: 'Parse error: ' + error.message
          }
        };
        process.stdout.write(JSON.stringify(errorResponse) + '\n');
      }
    }
  }
});

process.stdin.on('end', () => {
  process.exit(0);
});

async function forwardToHTTP(request) {
  return new Promise((resolve, reject) => {
    const url = new URL(SERVER_URL);
    const postData = JSON.stringify(request);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          resolve({
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32603,
              message: 'Invalid JSON response from server'
            }
          });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32603,
          message: 'HTTP request failed: ' + error.message
        }
      });
    });
    
    req.write(postData);
    req.end();
  });
}

// Handle process termination
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
