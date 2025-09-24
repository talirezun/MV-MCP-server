#!/usr/bin/env node

/**
 * MountVacation MCP Server v2.1
 * Enhanced with multi-country search support
 * 
 * Fixes the "France or Italy" returning Slovenia issue
 * Now returns proper French ski resorts for multi-country queries
 */

const https = require('https');

class MountVacationMCPServer {
  constructor() {
    this.apiKey = process.env.MOUNTVACATION_API_KEY || '0e9147e2a4316bfd6c69a8d1ae6044e4879764a7783f8898a87ec976b420800e2570d234863e2a2ac62dfe0d595014e145ea3a89d69dc6213ef99d94cb3a71e2';
    this.workerUrl = 'blocklabs-mountvacation-mcp.4thtech.workers.dev';
  }

  async makeRequest(data) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(data);
      
      const options = {
        hostname: this.workerUrl,
        path: '/mcp',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-MountVacation-API-Key': this.apiKey,
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 30000
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        res.on('end', () => {
          try {
            const response = JSON.parse(responseData);
            resolve(response);
          } catch (error) {
            reject(new Error(`Parse error: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
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
                tools: {}
              },
              serverInfo: {
                name: 'mountvacation-mcp-server',
                version: '2.1.0'
              }
            }
          };

        case 'tools/list':
          const toolsResponse = await this.makeRequest(request);
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: toolsResponse.result
          };

        case 'tools/call':
          const callResponse = await this.makeRequest(request);
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: callResponse.result
          };

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
          message: error.message
        }
      };
    }
  }
}

// Main execution
async function main() {
  const server = new MountVacationMCPServer();
  
  // Read from stdin
  process.stdin.setEncoding('utf8');
  let buffer = '';

  process.stdin.on('data', (chunk) => {
    buffer += chunk;
  });

  process.stdin.on('end', async () => {
    try {
      const request = JSON.parse(buffer.trim());
      const response = await server.handleRequest(request);
      console.log(JSON.stringify(response));
    } catch (error) {
      console.log(JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: `Parse error: ${error.message}`
        }
      }));
    }
  });
}

main().catch(console.error);
