#!/usr/bin/env node

/**
 * Minimal MCP Server for Testing Claude Desktop Compatibility
 * This is a stripped-down version to isolate validation issues
 */

const readline = require('readline');

class TestMCPServer {
  constructor() {
    this.tools = [
      {
        name: 'test_tool',
        description: 'A simple test tool',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'A test message'
            }
          },
          required: ['message']
        }
      }
    ];
  }

  async handleRequest(request) {
    const requestId = request.id !== undefined ? request.id : null;
    
    try {
      switch (request.method) {
        case 'initialize':
          return {
            jsonrpc: '2.0',
            id: requestId,
            result: {
              protocolVersion: '2025-06-18',
              capabilities: {
                tools: {}
              },
              serverInfo: {
                name: 'test-mcp-server',
                version: '1.0.0'
              }
            }
          };

        case 'tools/list':
          return {
            jsonrpc: '2.0',
            id: requestId,
            result: {
              tools: this.tools
            }
          };

        case 'tools/call':
          return {
            jsonrpc: '2.0',
            id: requestId,
            result: {
              content: [
                {
                  type: 'text',
                  text: `Test response: ${request.params?.arguments?.message || 'No message'}`
                }
              ]
            }
          };

        default:
          return {
            jsonrpc: '2.0',
            id: requestId,
            error: {
              code: -32601,
              message: `Method not found: ${request.method}`
            }
          };
      }
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: requestId,
        error: {
          code: -32603,
          message: error.message || 'Internal error'
        }
      };
    }
  }
}

async function main() {
  const server = new TestMCPServer();

  // Send initialization notification
  console.log(JSON.stringify({
    jsonrpc: '2.0',
    method: 'notifications/initialized'
  }));

  const rl = readline.createInterface({
    input: process.stdin,
    terminal: false
  });

  rl.on('line', async (line) => {
    if (!line.trim()) return;
    
    let requestId = null;
    try {
      const request = JSON.parse(line.trim());
      requestId = request.id || null;
      
      const response = await server.handleRequest(request);
      console.log(JSON.stringify(response));
    } catch (error) {
      const errorResponse = {
        jsonrpc: '2.0',
        id: requestId,
        error: {
          code: -32700,
          message: error.message || 'Parse error'
        }
      };
      console.log(JSON.stringify(errorResponse));
    }
  });

  process.on('SIGINT', () => {
    rl.close();
    process.exit(0);
  });
}

if (require.main === module) {
  main().catch(console.error);
}
