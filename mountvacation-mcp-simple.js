#!/usr/bin/env node

/**
 * MountVacation MCP Server v3.1 - Simplified Schemas
 * Simplified version to resolve Claude Desktop validation issues
 */

const https = require('https');

class MountVacationMCPServer {
  constructor() {
    this.apiKey = process.env.MOUNTVACATION_API_KEY || '0e9147e2a4316bfd6c69a8d1ae6044e4879764a7783f8898a87ec976b420800e2570d234863e2a2ac62dfe0d595014e145ea3a89d69dc6213ef99d94cb3a71e2';
    this.workerUrl = 'blocklabs-mountvacation-mcp.4thtech.workers.dev';
    this.tools = this.getToolDefinitions();
  }

  getToolDefinitions() {
    return [
      {
        name: 'search_accommodations',
        description: 'Search for accommodations using the MountVacation API. Supports location-based search, specific accommodation IDs, resort IDs, city IDs, and geolocation-based search.',
        inputSchema: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'Location name: city, resort, region, or country (e.g., "Madonna di Campiglio", "French Alps", "Slovenia")'
            },
            accommodation_id: {
              type: 'integer',
              description: 'Specific accommodation ID for direct search'
            },
            arrival_date: {
              type: 'string',
              description: 'Check-in date in YYYY-MM-DD format (e.g., "2024-03-10")'
            },
            departure_date: {
              type: 'string',
              description: 'Check-out date in YYYY-MM-DD format (e.g., "2024-03-17")'
            },
            nights: {
              type: 'integer',
              description: 'Number of nights to stay'
            },
            persons: {
              type: 'integer',
              description: 'Number of persons'
            },
            currency: {
              type: 'string',
              description: 'Currency code (EUR, USD, GBP, etc.)'
            },
            language: {
              type: 'string',
              description: 'Language code (en, de, it, fr, etc.)'
            }
          },
          required: ['arrival_date']
        }
      },
      {
        name: 'get_accommodation_details',
        description: 'Get detailed properties and amenities for a specific accommodation.',
        inputSchema: {
          type: 'object',
          properties: {
            accommodation_id: {
              type: 'integer',
              description: 'The accommodation ID from search results'
            },
            language: {
              type: 'string',
              description: 'Language for descriptions'
            }
          },
          required: ['accommodation_id']
        }
      }
    ];
  }

  async makeRequest(request) {
    const toolName = request.params?.name;
    const args = request.params?.arguments || {};

    if (!toolName) {
      throw new Error('Tool name is required');
    }

    const postData = JSON.stringify({
      tool: toolName,
      arguments: args,
      api_key: this.apiKey
    });

    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.workerUrl,
        port: 443,
        path: '/',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
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
            resolve({
              result: {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify(response, null, 2)
                  }
                ]
              }
            });
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });

      req.write(postData);
      req.end();
    });
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
                name: 'mountvacation-mcp-server',
                version: '3.1.0'
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
          if (!request.params || !request.params.name) {
            return {
              jsonrpc: '2.0',
              id: requestId,
              error: {
                code: -32602,
                message: 'Invalid params: missing tool name'
              }
            };
          }
          
          const callResponse = await this.makeRequest(request);
          return {
            jsonrpc: '2.0',
            id: requestId,
            result: callResponse.result || callResponse
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
  const server = new MountVacationMCPServer();

  console.log(JSON.stringify({
    jsonrpc: '2.0',
    method: 'notifications/initialized'
  }));

  const readline = require('readline');
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
      
      if (!request.jsonrpc || request.jsonrpc !== '2.0') {
        throw new Error('Invalid JSON-RPC version');
      }
      
      if (!request.method) {
        throw new Error('Missing method');
      }
      
      const response = await server.handleRequest(request);
      console.log(JSON.stringify(response));
    } catch (error) {
      const errorResponse = {
        jsonrpc: '2.0',
        id: requestId,
        error: {
          code: error.name === 'SyntaxError' ? -32700 : -32603,
          message: error.message || 'Internal error'
        }
      };
      console.log(JSON.stringify(errorResponse));
    }
  });

  process.on('SIGINT', () => {
    rl.close();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    rl.close();
    process.exit(0);
  });
}

if (require.main === module) {
  main().catch(console.error);
}
