#!/usr/bin/env node

const https = require('https');

// MCP Server for MountVacation - Standalone version for testing
class MountVacationMCPServer {
  constructor() {
    this.apiKey = process.env.MOUNTVACATION_API_KEY || '0e9147e2a4316bfd6c69a8d1ae6044e4879764a7783f8898a87ec976b420800e2570d234863e2a2ac62dfe0d595014e145ea3a89d69dc6213ef99d94cb3a71e2';
    this.workerUrl = 'blocklabs-mountvacation-mcp.4thtech.workers.dev';
  }

  async handleRequest(request) {
    switch (request.method) {
      case 'initialize':
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {
                listChanged: false
              }
            },
            serverInfo: {
              name: 'mountvacation',
              version: '1.0.0'
            }
          }
        };

      case 'tools/list':
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            tools: [{
              name: 'search_accommodations',
              description: 'Search for ski accommodations and vacation rentals worldwide. Supports searches in France, Italy, Austria, Switzerland, Slovenia, and other ski destinations.',
              inputSchema: {
                type: 'object',
                properties: {
                  location: {
                    type: 'string',
                    description: 'Location to search for accommodations. Can be specific (e.g., "Chamonix", "Val d\'Isère") or general (e.g., "French Alps", "Italian Dolomites", "ski in France", "Austria skiing")'
                  },
                  arrival_date: {
                    type: 'string',
                    description: 'Check-in date in YYYY-MM-DD format'
                  },
                  departure_date: {
                    type: 'string',
                    description: 'Check-out date in YYYY-MM-DD format'
                  },
                  persons_ages: {
                    type: 'string',
                    description: 'Ages of all guests separated by commas (e.g., "25,30" for 2 adults, "25,30,8,12" for 2 adults and 2 children)'
                  },
                  currency: {
                    type: 'string',
                    description: 'Currency code (EUR, USD, GBP, CHF)',
                    default: 'EUR'
                  },
                  max_results: {
                    type: 'integer',
                    description: 'Maximum number of results to return (1-50)',
                    default: 10
                  }
                },
                required: ['location', 'arrival_date', 'departure_date', 'persons_ages']
              }
            }]
          }
        };

      case 'tools/call':
        if (request.params.name === 'search_accommodations') {
          return await this.searchAccommodations(request);
        }
        throw new Error(`Unknown tool: ${request.params.name}`);

      default:
        throw new Error(`Unknown method: ${request.method}`);
    }
  }

  async searchAccommodations(request) {
    const args = request.params.arguments;
    
    // Forward the request to the Cloudflare Workers endpoint
    const postData = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'search_accommodations',
        arguments: args
      }
    });

    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.workerUrl,
        path: '/mcp',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-MountVacation-API-Key': this.apiKey,
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
              jsonrpc: '2.0',
              id: request.id,
              result: response.result
            });
          } catch (e) {
            reject(new Error(`Failed to parse response: ${e.message}`));
          }
        });
      });

      req.on('error', (e) => {
        reject(new Error(`Request failed: ${e.message}`));
      });

      req.write(postData);
      req.end();
    });
  }
}

// Main execution
async function main() {
  const server = new MountVacationMCPServer();
  
  // Send initialization notification
  console.log(JSON.stringify({
    jsonrpc: '2.0',
    method: 'notifications/initialized'
  }));

  // Handle stdin input
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on('line', async (line) => {
    try {
      const request = JSON.parse(line);
      const response = await server.handleRequest(request);
      console.log(JSON.stringify(response));
    } catch (error) {
      console.log(JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        error: {
          code: -32603,
          message: error.message
        }
      }));
    }
  });
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = MountVacationMCPServer;
