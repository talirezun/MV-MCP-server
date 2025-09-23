#!/usr/bin/env node

/**
 * MountVacation MCP Standalone Bridge
 *
 * Ultra-simple single-file bridge that connects MCP clients to MountVacation API.
 * No dependencies, no git clone, no SDK installation required!
 *
 * SIMPLE SETUP:
 * 1. Download: curl -L -o mountvacation-mcp.js "https://raw.githubusercontent.com/talirezun/MV-MCP-server/main/scripts/standalone-mcp-bridge.js"
 * 2. Make executable: chmod +x mountvacation-mcp.js
 * 3. Add to Claude Desktop config with your API key
 * 4. Restart Claude Desktop - Done!
 *
 * Environment Variables:
 * - MOUNTVACATION_API_KEY: Your MountVacation API key (required)
 *
 * @version 3.0.0
 * @author MountVacation MCP Team
 */

const https = require('https');

// Use the production server for reliability
const SERVER_URL = 'https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev/mcp';
const API_KEY = process.env.MOUNTVACATION_API_KEY;

// Enable debug logging if needed
const DEBUG = process.env.DEBUG === 'true';

function debugLog(...args) {
  if (DEBUG) {
    console.error('[MCP-Bridge]', ...args);
  }
}

class MCPBridge {
  constructor() {
    this.requestId = 0;
    debugLog('MCP Bridge initialized');

    if (!API_KEY) {
      console.error('ERROR: MOUNTVACATION_API_KEY environment variable is required');
      process.exit(1);
    }
  }

  async makeRequest(data) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(data);
      debugLog('Making request to server:', data.method);

      const url = new URL(SERVER_URL);
      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'X-MountVacation-API-Key': API_KEY,
          'User-Agent': 'MountVacation-MCP-Bridge/3.0'
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          debugLog('Server response status:', res.statusCode);
          try {
            const response = JSON.parse(body);
            debugLog('Server response:', response);
            resolve(response);
          } catch (error) {
            debugLog('JSON parse error:', error.message);
            reject(new Error(`Invalid JSON response: ${body.substring(0, 200)}...`));
          }
        });
      });

      req.on('error', (error) => {
        debugLog('Request error:', error.message);
        reject(error);
      });

      req.setTimeout(30000, () => {
        debugLog('Request timeout');
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.write(postData);
      req.end();
    });
  }

  async handleRequest(request) {
    try {
      debugLog('Handling request:', request.method, 'ID:', request.id);

      switch (request.method) {
        case 'initialize':
          debugLog('Initializing MCP connection');
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
                version: '3.0.0'
              }
            }
          };

        case 'notifications/initialized':
          debugLog('Received initialized notification');
          return null; // No response needed for notifications

        case 'tools/list':
          debugLog('Listing tools');
          const toolsResponse = await this.makeRequest(request);
          return toolsResponse;

        case 'tools/call':
          debugLog('Calling tool:', request.params?.name);
          const callResponse = await this.makeRequest(request);
          return callResponse;

        default:
          debugLog('Unknown method:', request.method);
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
      debugLog('Error handling request:', error.message);
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
    debugLog('Starting MCP Bridge...');
    process.stdin.setEncoding('utf8');

    let buffer = '';

    process.stdin.on('data', async (chunk) => {
      buffer += chunk;

      // Process complete JSON-RPC messages (separated by newlines)
      let lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.trim()) {
          try {
            const request = JSON.parse(line);
            const response = await this.handleRequest(request);

            if (response !== null) {
              const responseStr = JSON.stringify(response);
              debugLog('Sending response:', responseStr.substring(0, 200) + '...');
              process.stdout.write(responseStr + '\n');
            }
          } catch (error) {
            debugLog('Parse error:', error.message);
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
      debugLog('STDIN ended, exiting');
      process.exit(0);
    });

    // Handle process termination gracefully
    process.on('SIGINT', () => {
      debugLog('Received SIGINT, exiting');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      debugLog('Received SIGTERM, exiting');
      process.exit(0);
    });

    // Log startup success
    console.error('✅ MountVacation MCP Bridge v3.0 started successfully');
    console.error('🔗 Connected to:', SERVER_URL);
    console.error('🔑 API Key:', API_KEY ? 'Configured' : 'Missing');
  }
}

// Start the bridge
if (require.main === module) {
  const bridge = new MCPBridge();
  bridge.start().catch((error) => {
    console.error('❌ Bridge startup error:', error.message);
    console.error('💡 Make sure MOUNTVACATION_API_KEY is set in your environment');
    process.exit(1);
  });
}
