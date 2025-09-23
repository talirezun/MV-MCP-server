#!/usr/bin/env node

/**
 * MountVacation MCP Standalone Bridge
 * 
 * A single-file bridge that connects MCP clients to the MountVacation Cloudflare Workers deployment.
 * No repository cloning required - just download this file and use it in your MCP client configuration.
 * 
 * Usage:
 * 1. Download this file: curl -o mountvacation-mcp.js https://raw.githubusercontent.com/talirezun/MV-MCP-server/main/scripts/standalone-mcp-bridge.js
 * 2. Make it executable: chmod +x mountvacation-mcp.js
 * 3. Use in your MCP client configuration
 * 
 * Environment Variables:
 * - MOUNTVACATION_API_KEY: Your MountVacation API key (optional, fallback key used if not provided)
 */

const https = require('https');

const SERVER_URL = 'https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev';
const API_KEY = process.env.MOUNTVACATION_API_KEY;

class MCPBridge {
  constructor() {
    this.requestId = 0;
  }

  async makeRequest(path, data, headers = {}) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(data);
      
      const options = {
        hostname: 'blocklabs-mountvacation-mcp-production.4thtech.workers.dev',
        port: 443,
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          ...headers
        }
      };

      if (API_KEY) {
        options.headers['X-MountVacation-API-Key'] = API_KEY;
      }

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          try {
            const response = JSON.parse(body);
            resolve(response);
          } catch (error) {
            reject(new Error(`Invalid JSON response: ${body}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  }

  async handleRequest(request) {
    try {
      switch (request.method) {
        case 'initialize':
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
                name: 'MountVacation MCP Bridge',
                version: '2.0.0'
              }
            }
          };

        case 'notifications/initialized':
          return null; // No response needed for notifications

        case 'tools/list':
          const toolsResponse = await this.makeRequest('/mcp', request);
          return toolsResponse;

        case 'tools/call':
          const callResponse = await this.makeRequest('/mcp', request);
          return callResponse;

        default:
          return {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32601,
              message: `Method not found: ${request.method}`
            }
          };
      }
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32603,
          message: `Internal error: ${error.message}`
        }
      };
    }
  }

  async start() {
    process.stdin.setEncoding('utf8');
    
    let buffer = '';
    
    process.stdin.on('data', async (chunk) => {
      buffer += chunk;
      
      // Process complete JSON-RPC messages
      let lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            const request = JSON.parse(line);
            const response = await this.handleRequest(request);
            
            if (response) {
              process.stdout.write(JSON.stringify(response) + '\n');
            }
          } catch (error) {
            const errorResponse = {
              jsonrpc: '2.0',
              id: null,
              error: {
                code: -32700,
                message: `Parse error: ${error.message}`
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

    // Handle process termination
    process.on('SIGINT', () => {
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      process.exit(0);
    });
  }
}

// Start the bridge
const bridge = new MCPBridge();
bridge.start().catch((error) => {
  console.error('Bridge error:', error);
  process.exit(1);
});
