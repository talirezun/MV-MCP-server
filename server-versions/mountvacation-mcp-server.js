#!/usr/bin/env node

/**
 * MountVacation MCP Server v3.3
 * FIXED: DNS Resolution Issue & Claude Desktop MCP Protocol Compliance
 *
 * DNS Resolution Fix (v3.3):
 * - Uses Cloudflare IP directly (188.114.96.3) to bypass local DNS issues
 * - Maintains Host header for HTTPS/TLS verification
 * - Works reliably regardless of system DNS configuration
 * - No Cloudflare Workers redeployment needed
 *
 * MCP Protocol Compliance (v3.2):
 * - Removing server-side notifications/initialized (protocol violation)
 * - Following proper MCP initialization sequence per specification
 * - Server now purely reactive, only responds to client requests
 * - Universal MCP client compatibility achieved
 */

const https = require('https');
const dns = require('dns');
const { promisify } = require('util');

const dnsResolve4 = promisify(dns.resolve4);

class MountVacationMCPServer {
  constructor() {
    this.apiKey = process.env.MOUNTVACATION_API_KEY;
    if (!this.apiKey) {
      throw new Error('MOUNTVACATION_API_KEY environment variable is required. Please set your API key.');
    }
    this.workerUrl = 'mountvacation-mcp-final.4thtech.workers.dev';
    this.workerIp = '188.114.96.3'; // Cloudflare IP for the worker
    this.tools = this.getToolDefinitions();
    // Use Google's DNS server to avoid local DNS caching issues
    dns.setServers(['8.8.8.8', '8.8.4.4']);
  }

  getToolDefinitions() {
    return [
      {
        name: 'search_accommodations',
        description: 'Search for accommodations using the MountVacation API. Supports location-based search (city, resort, region names), specific accommodation IDs, resort IDs, city IDs, and geolocation-based search. Returns comprehensive accommodation details including pricing, amenities, pictures, distances, and booking information.',
        inputSchema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            location: {
              type: 'string',
              description: 'Location name: city, resort, region, or country (e.g., "Madonna di Campiglio", "French Alps", "Slovenia"). Leave empty if using other search methods.'
            },
            accommodation_id: {
              type: 'integer',
              description: 'Specific accommodation ID for direct search. Use instead of location.'
            },
            accommodation_ids: {
              type: 'array',
              items: { type: 'integer' },
              description: 'Array of accommodation IDs for searching multiple specific accommodations. Use instead of location.'
            },
            resort_id: {
              type: 'integer',
              description: 'Resort ID to search all accommodations in a specific resort. Use instead of location.'
            },
            city_id: {
              type: 'integer',
              description: 'City ID to search all accommodations in a specific city. Use instead of location.'
            },
            latitude: {
              type: 'number',
              description: 'Latitude for geolocation-based search. Requires longitude and radius.'
            },
            longitude: {
              type: 'number',
              description: 'Longitude for geolocation-based search. Requires latitude and radius.'
            },
            radius: {
              type: 'integer',
              description: 'Search radius in meters for geolocation search (e.g., 10000 for 10km). Requires latitude and longitude.'
            },
            arrival_date: {
              type: 'string',
              description: 'Check-in date in YYYY-MM-DD format (e.g., "2024-03-10"). Must not be in the past.'
            },
            departure_date: {
              type: 'string',
              description: 'Check-out date in YYYY-MM-DD format (e.g., "2024-03-17"). Alternative: use nights instead.'
            },
            nights: {
              type: 'integer',
              description: 'Number of nights to stay. Alternative to departure_date.'
            },
            persons_ages: {
              type: 'string',
              description: 'Ages of all persons separated by commas (e.g., "30,28,8,5" for 2 adults and 2 children). Recommended for accurate pricing with children discounts.'
            },
            persons: {
              type: 'integer',
              description: 'Number of persons (all treated as adults). Alternative to persons_ages.'
            },
            currency: {
              type: 'string',
              description: 'Currency code for pricing. Supported: AUD, BGN, BRL, CAD, CHF, CNY, CZK, DKK, EUR, GBP, HKD, HRK, HUF, IDR, ILS, INR, JPY, KRW, LTL, MXN, MYR, NOK, NZD, PHP, PLN, RON, RUB, SEK, SGD, THB, TRY, USD, ZAR'
            },
            language: {
              type: 'string',
              description: 'Language for translated content. Supported: en, de, it, fr, sl, hr, pl, cz'
            },
            include_additional_fees: {
              type: 'boolean',
              description: 'Include additional fees in search results for more accurate total pricing'
            },
            max_results: {
              type: 'integer',
              description: 'Maximum number of accommodations to return per page (1-100)'
            },
            page: {
              type: 'integer',
              description: 'Page number for pagination (starts from 1)'
            }
          },
          required: ['arrival_date']
        }
      },
      {
        name: 'get_accommodation_details',
        description: 'Get detailed properties and amenities for a specific accommodation including facilities, wellness options, distances, and comprehensive image galleries.',
        inputSchema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            accommodation_id: {
              type: 'integer',
              description: 'The accommodation ID from search results'
            },
            language: {
              type: 'string',
              description: 'Language for descriptions (default: "en")'
            },
            include_facilities: {
              type: 'boolean',
              description: 'Include detailed facility properties (default: true)'
            }
          },
          required: ['accommodation_id']
        }
      },
      {
        name: 'get_facility_details',
        description: 'Get detailed properties for a specific room or facility within an accommodation, including amenities, views, kitchen facilities, and bathroom details.',
        inputSchema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            accommodation_id: {
              type: 'integer',
              description: 'The accommodation ID'
            },
            facility_id: {
              type: 'integer',
              description: 'The facility/room ID'
            },
            language: {
              type: 'string',
              description: 'Language for descriptions (default: "en")'
            }
          },
          required: ['accommodation_id', 'facility_id']
        }
      },
      {
        name: 'search_by_resort_id',
        description: 'Search all accommodations in a specific resort using resort ID. Returns all available accommodations in that resort with full details.',
        inputSchema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            resort_id: {
              type: 'integer',
              description: 'The resort ID to search accommodations in'
            },
            arrival_date: {
              type: 'string',
              description: 'Check-in date in YYYY-MM-DD format'
            },
            departure_date: {
              type: 'string',
              description: 'Check-out date in YYYY-MM-DD format. Alternative: use nights'
            },
            nights: {
              type: 'integer',
              description: 'Number of nights. Alternative to departure_date'
            },
            persons: {
              type: 'integer',
              description: 'Number of persons (all adults). Alternative to persons_ages'
            },
            persons_ages: {
              type: 'string',
              description: 'Ages separated by commas (e.g., "30,28,8")'
            },
            currency: {
              type: 'string',
              description: 'Currency code (default: EUR)'
            },
            language: {
              type: 'string',
              description: 'Language code (default: en)'
            },
            include_additional_fees: {
              type: 'boolean',
              description: 'Include additional fees for accurate pricing'
            }
          },
          required: ['resort_id', 'arrival_date']
        }
      },
      {
        name: 'search_by_city_id',
        description: 'Search all accommodations in a specific city using city ID. Returns all available accommodations in that city with full details.',
        inputSchema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            city_id: {
              type: 'integer',
              description: 'The city ID to search accommodations in'
            },
            arrival_date: {
              type: 'string',
              description: 'Check-in date in YYYY-MM-DD format'
            },
            departure_date: {
              type: 'string',
              description: 'Check-out date in YYYY-MM-DD format. Alternative: use nights'
            },
            nights: {
              type: 'integer',
              description: 'Number of nights. Alternative to departure_date'
            },
            persons: {
              type: 'integer',
              description: 'Number of persons (all adults). Alternative to persons_ages'
            },
            persons_ages: {
              type: 'string',
              description: 'Ages separated by commas (e.g., "30,28,8")'
            },
            currency: {
              type: 'string',
              description: 'Currency code (default: EUR)'
            },
            language: {
              type: 'string',
              description: 'Language code (default: en)'
            },
            include_additional_fees: {
              type: 'boolean',
              description: 'Include additional fees for accurate pricing'
            }
          },
          required: ['city_id', 'arrival_date']
        }
      },
      {
        name: 'search_by_geolocation',
        description: 'Search accommodations within a specific radius from geographic coordinates. Useful for finding accommodations near specific locations.',
        inputSchema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            latitude: {
              type: 'number',
              description: 'Latitude coordinate'
            },
            longitude: {
              type: 'number',
              description: 'Longitude coordinate'
            },
            radius: {
              type: 'integer',
              description: 'Search radius in meters (e.g., 10000 for 10km)'
            },
            arrival_date: {
              type: 'string',
              description: 'Check-in date in YYYY-MM-DD format'
            },
            departure_date: {
              type: 'string',
              description: 'Check-out date in YYYY-MM-DD format. Alternative: use nights'
            },
            nights: {
              type: 'integer',
              description: 'Number of nights. Alternative to departure_date'
            },
            persons: {
              type: 'integer',
              description: 'Number of persons (all adults). Alternative to persons_ages'
            },
            persons_ages: {
              type: 'string',
              description: 'Ages separated by commas (e.g., "30,28,8")'
            },
            currency: {
              type: 'string',
              description: 'Currency code (default: EUR)'
            },
            language: {
              type: 'string',
              description: 'Language code (default: en)'
            },
            include_additional_fees: {
              type: 'boolean',
              description: 'Include additional fees for accurate pricing'
            }
          },
          required: ['latitude', 'longitude', 'radius', 'arrival_date']
        }
      },
      {
        name: 'get_booking_links',
        description: 'Get direct booking links for specific accommodations. This tool extracts and formats booking URLs prominently for easy access.',
        inputSchema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            accommodation_id: {
              type: 'integer',
              description: 'The accommodation ID to get booking links for'
            },
            arrival_date: {
              type: 'string',
              description: 'Check-in date in YYYY-MM-DD format'
            },
            departure_date: {
              type: 'string',
              description: 'Check-out date in YYYY-MM-DD format. Alternative: use nights'
            },
            nights: {
              type: 'integer',
              description: 'Number of nights. Alternative to departure_date'
            },
            persons: {
              type: 'integer',
              description: 'Number of persons (all adults). Alternative to persons_ages'
            },
            persons_ages: {
              type: 'string',
              description: 'Ages separated by commas (e.g., "30,28,8")'
            },
            currency: {
              type: 'string',
              description: 'Currency code (default: EUR)'
            },
            language: {
              type: 'string',
              description: 'Language code (default: en)'
            }
          },
          required: ['accommodation_id', 'arrival_date']
        }
      },
      {
        name: 'research_accommodations',
        description: 'Advanced research tool that searches multiple regions and compares options',
        inputSchema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            regions: {
              type: 'string',
              description: 'Comma-separated list of regions to search (e.g., "French Alps,Italian Dolomites")'
            },
            arrival_date: {
              type: 'string',
              description: 'Preferred arrival date (YYYY-MM-DD)'
            },
            departure_date: {
              type: 'string',
              description: 'Preferred departure date (YYYY-MM-DD)'
            },
            persons_ages: {
              type: 'string',
              description: 'Comma-separated list of person ages (e.g., "18,18" for 2 adults)'
            },
            max_budget: {
              type: 'number',
              description: 'Maximum total budget for the stay'
            },
            amenities: {
              type: 'string',
              description: 'Comma-separated list of required amenities (e.g., "pool,wellness,parking")'
            }
          },
          required: ['regions', 'arrival_date', 'departure_date', 'persons_ages']
        }
      },
      {
        name: 'search_accommodations_complete',
        description: 'Search for accommodations with complete pagination support. Collects all available results by following pagination links from the MountVacation API. Use this when you need comprehensive results equivalent to browsing all pages on the website.',
        inputSchema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            location: {
              type: 'string',
              description: 'Location name: city, resort, region, or country (e.g., "Madonna di Campiglio", "Chamonix", "French Alps")'
            },
            accommodation_id: {
              type: 'integer',
              description: 'Specific accommodation ID for direct search. Use instead of location.'
            },
            resort_id: {
              type: 'integer',
              description: 'Resort ID to search all accommodations in a specific resort. Use instead of location.'
            },
            city_id: {
              type: 'integer',
              description: 'City ID to search all accommodations in a specific city. Use instead of location.'
            },
            arrival_date: {
              type: 'string',
              description: 'Check-in date in YYYY-MM-DD format'
            },
            departure_date: {
              type: 'string',
              description: 'Check-out date in YYYY-MM-DD format. Alternative: use nights'
            },
            nights: {
              type: 'integer',
              description: 'Number of nights. Alternative to departure_date'
            },
            persons_ages: {
              type: 'string',
              description: 'Ages separated by commas (e.g., "30,28,8")'
            },
            currency: {
              type: 'string',
              description: 'Currency code for pricing (default: EUR)'
            },
            max_total_results: {
              type: 'integer',
              description: 'Maximum total results to collect across all pages (default: 50)'
            },
            max_pages: {
              type: 'integer',
              description: 'Maximum number of pages to fetch (default: 10)'
            }
          },
          required: ['arrival_date']
        }
      },
      {
        name: 'load_more_accommodations',
        description: 'Load the next batch of accommodations using a pagination URL from a previous search. Use this when a search result indicates more pages are available.',
        inputSchema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            next_page_url: {
              type: 'string',
              description: 'The next page URL from a previous search result\'s pagination object'
            },
            max_additional_results: {
              type: 'integer',
              description: 'Maximum number of additional results to return from this page (default: 20)'
            }
          },
          required: ['next_page_url']
        }
      }
    ];
  }

  async makeRequest(data) {
    return new Promise(async (resolve, reject) => {
      try {
        const postData = JSON.stringify(data);

        // Use IP address directly to avoid DNS resolution issues
        const options = {
          hostname: this.workerIp,
          path: '/mcp',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-MountVacation-API-Key': this.apiKey,
            'Host': this.workerUrl,
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
      } catch (error) {
        reject(error);
      }
    });
  }

  async handleRequest(request) {
    // Ensure request has required fields
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
                version: '3.2.1'
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

// Main execution
async function main() {
  const server = new MountVacationMCPServer();

  // Handle stdin input line by line (proper MCP protocol)
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    terminal: false
  });

  rl.on('line', async (line) => {
    if (!line.trim()) return; // Skip empty lines

    let requestId = null;
    try {
      const request = JSON.parse(line.trim());
      requestId = request.id || null;

      // Validate basic JSON-RPC structure
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

  // Handle process termination gracefully
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
