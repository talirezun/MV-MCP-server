#!/usr/bin/env node

/**
 * MountVacation MCP Cloud Bridge with API Key Authentication
 * 
 * This bridge connects MCP clients to the cloud-hosted MountVacation MCP server.
 * Users need to provide their MountVacation API key for authentication.
 * 
 * Configuration:
 * - Set MOUNTVACATION_API_KEY environment variable, OR
 * - Modify the API_KEY constant below
 */

const https = require('https');

// ============================================================================
// CONFIGURATION - Users should set their API key here or via environment variable
// ============================================================================

const API_KEY = process.env.MOUNTVACATION_API_KEY || 'YOUR_API_KEY_HERE';
const SERVER_URL = 'https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev/mcp';

// ============================================================================
// MCP Bridge Implementation
// ============================================================================

// Validate API key
if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
  console.error('❌ ERROR: MountVacation API key not configured!');
  console.error('');
  console.error('Please set your API key in one of these ways:');
  console.error('1. Environment variable: export MOUNTVACATION_API_KEY="your_key_here"');
  console.error('2. Edit this file and replace YOUR_API_KEY_HERE with your actual API key');
  console.error('');
  console.error('Get your API key from: https://mountvacation.com/api');
  process.exit(1);
}

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
        const response = await handleMCPRequest(request);
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

async function handleMCPRequest(request) {
  // Handle MCP protocol methods locally
  if (request.method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
          logging: {}
        },
        serverInfo: {
          name: 'MountVacation MCP Cloud Bridge',
          version: '2.1.0'
        }
      }
    };
  }

  if (request.method === 'notifications/initialized') {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {}
    };
  }

  // Forward all other requests to cloud server with API key
  return forwardToCloudServer(request);
}

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
        'X-MountVacation-API-Key': API_KEY,
        'User-Agent': 'MountVacation-MCP-Bridge/2.1.0'
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

// Log startup message
console.error('🌐 MountVacation MCP Bridge started successfully');
console.error(`🔑 Using API key: ${API_KEY.substring(0, 8)}...`);
console.error(`🚀 Connected to: ${SERVER_URL}`);
