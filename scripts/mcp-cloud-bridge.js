#!/usr/bin/env node

/**
 * MountVacation MCP Cloud Bridge
 * Connects Claude Desktop to the cloud-hosted MountVacation MCP server
 * No API keys or local setup required!
 */

const https = require('https');

const SERVER_URL = 'https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev/mcp';

// Set up STDIO for MCP protocol
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
        const response = await forwardToCloudServer(request);
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
              message: 'Invalid JSON response from cloud server'
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
          message: 'Failed to connect to cloud server: ' + error.message
        }
      });
    });
    
    req.setTimeout(30000, () => {
      req.destroy();
      resolve({
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32603,
          message: 'Request timeout'
        }
      });
    });
    
    req.write(postData);
    req.end();
  });
}

// Handle process termination gracefully
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
