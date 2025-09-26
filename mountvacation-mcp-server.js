#!/usr/bin/env node

/**
 * MountVacation MCP Server v2.2
 * Fixed Claude Desktop compatibility with proper tool schema validation
 *
 * Fixes the ZodError validation issues in Claude Desktop
 * Now includes local tool definitions for proper schema validation
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
              description: 'Check-in date in YYYY-MM-DD format (e.g., "2024-03-10"). Must not be in the past.',
              pattern: '^\\d{4}-\\d{2}-\\d{2}$'
            },
            departure_date: {
              type: 'string',
              description: 'Check-out date in YYYY-MM-DD format (e.g., "2024-03-17"). Alternative: use nights instead.',
              pattern: '^\\d{4}-\\d{2}-\\d{2}$'
            },
            nights: {
              type: 'integer',
              description: 'Number of nights to stay. Alternative to departure_date.',
              minimum: 1
            },
            persons_ages: {
              type: 'string',
              description: 'Ages of all persons separated by commas (e.g., "30,28,8,5" for 2 adults and 2 children). Recommended for accurate pricing with children discounts.',
              pattern: '^\\d+(,\\d+)*$'
            },
            persons: {
              type: 'integer',
              description: 'Number of persons (all treated as adults). Alternative to persons_ages.',
              minimum: 1
            },
            currency: {
              type: 'string',
              description: 'Currency code for pricing. Supported: AUD, BGN, BRL, CAD, CHF, CNY, CZK, DKK, EUR, GBP, HKD, HRK, HUF, IDR, ILS, INR, JPY, KRW, LTL, MXN, MYR, NOK, NZD, PHP, PLN, RON, RUB, SEK, SGD, THB, TRY, USD, ZAR',
              default: 'EUR'
            },
            language: {
              type: 'string',
              description: 'Language for translated content. Supported: en, de, it, fr, sl, hr, pl, cz',
              enum: ['en', 'de', 'it', 'fr', 'sl', 'hr', 'pl', 'cz'],
              default: 'en'
            },
            include_additional_fees: {
              type: 'boolean',
              description: 'Include additional fees in search results for more accurate total pricing',
              default: false
            },
            max_results: {
              type: 'integer',
              description: 'Maximum number of accommodations to return per page (1-100)',
              minimum: 1,
              maximum: 100,
              default: 10
            },
            page: {
              type: 'integer',
              description: 'Page number for pagination (starts from 1)',
              minimum: 1,
              default: 1
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
              description: 'Language for descriptions (default: "en")',
              enum: ['en', 'de', 'it', 'fr', 'sl', 'hr', 'pl', 'cz'],
              default: 'en'
            },
            include_facilities: {
              type: 'boolean',
              description: 'Include detailed facility properties (default: true)',
              default: true
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
              description: 'Language for descriptions (default: "en")',
              enum: ['en', 'de', 'it', 'fr', 'sl', 'hr', 'pl', 'cz'],
              default: 'en'
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
              description: 'Check-in date in YYYY-MM-DD format',
              pattern: '^\\d{4}-\\d{2}-\\d{2}$'
            },
            departure_date: {
              type: 'string',
              description: 'Check-out date in YYYY-MM-DD format. Alternative: use nights',
              pattern: '^\\d{4}-\\d{2}-\\d{2}$'
            },
            nights: {
              type: 'integer',
              description: 'Number of nights. Alternative to departure_date',
              minimum: 1
            },
            persons: {
              type: 'integer',
              description: 'Number of persons (all adults). Alternative to persons_ages',
              minimum: 1
            },
            persons_ages: {
              type: 'string',
              description: 'Ages separated by commas (e.g., "30,28,8")',
              pattern: '^\\d+(,\\d+)*$'
            },
            currency: {
              type: 'string',
              description: 'Currency code (default: EUR)',
              default: 'EUR'
            },
            language: {
              type: 'string',
              description: 'Language code (default: en)',
              enum: ['en', 'de', 'it', 'fr', 'sl', 'hr', 'pl', 'cz'],
              default: 'en'
            },
            include_additional_fees: {
              type: 'boolean',
              description: 'Include additional fees for accurate pricing',
              default: false
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
              description: 'Check-in date in YYYY-MM-DD format',
              pattern: '^\\d{4}-\\d{2}-\\d{2}$'
            },
            departure_date: {
              type: 'string',
              description: 'Check-out date in YYYY-MM-DD format. Alternative: use nights',
              pattern: '^\\d{4}-\\d{2}-\\d{2}$'
            },
            nights: {
              type: 'integer',
              description: 'Number of nights. Alternative to departure_date',
              minimum: 1
            },
            persons: {
              type: 'integer',
              description: 'Number of persons (all adults). Alternative to persons_ages',
              minimum: 1
            },
            persons_ages: {
              type: 'string',
              description: 'Ages separated by commas (e.g., "30,28,8")',
              pattern: '^\\d+(,\\d+)*$'
            },
            currency: {
              type: 'string',
              description: 'Currency code (default: EUR)',
              default: 'EUR'
            },
            language: {
              type: 'string',
              description: 'Language code (default: en)',
              enum: ['en', 'de', 'it', 'fr', 'sl', 'hr', 'pl', 'cz'],
              default: 'en'
            },
            include_additional_fees: {
              type: 'boolean',
              description: 'Include additional fees for accurate pricing',
              default: false
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
              description: 'Search radius in meters (e.g., 10000 for 10km)',
              minimum: 100
            },
            arrival_date: {
              type: 'string',
              description: 'Check-in date in YYYY-MM-DD format',
              pattern: '^\\d{4}-\\d{2}-\\d{2}$'
            },
            departure_date: {
              type: 'string',
              description: 'Check-out date in YYYY-MM-DD format. Alternative: use nights',
              pattern: '^\\d{4}-\\d{2}-\\d{2}$'
            },
            nights: {
              type: 'integer',
              description: 'Number of nights. Alternative to departure_date',
              minimum: 1
            },
            persons: {
              type: 'integer',
              description: 'Number of persons (all adults). Alternative to persons_ages',
              minimum: 1
            },
            persons_ages: {
              type: 'string',
              description: 'Ages separated by commas (e.g., "30,28,8")',
              pattern: '^\\d+(,\\d+)*$'
            },
            currency: {
              type: 'string',
              description: 'Currency code (default: EUR)',
              default: 'EUR'
            },
            language: {
              type: 'string',
              description: 'Language code (default: en)',
              enum: ['en', 'de', 'it', 'fr', 'sl', 'hr', 'pl', 'cz'],
              default: 'en'
            },
            include_additional_fees: {
              type: 'boolean',
              description: 'Include additional fees for accurate pricing',
              default: false
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
              description: 'Check-in date in YYYY-MM-DD format',
              pattern: '^\\d{4}-\\d{2}-\\d{2}$'
            },
            departure_date: {
              type: 'string',
              description: 'Check-out date in YYYY-MM-DD format. Alternative: use nights',
              pattern: '^\\d{4}-\\d{2}-\\d{2}$'
            },
            nights: {
              type: 'integer',
              description: 'Number of nights. Alternative to departure_date',
              minimum: 1
            },
            persons: {
              type: 'integer',
              description: 'Number of persons (all adults). Alternative to persons_ages',
              minimum: 1
            },
            persons_ages: {
              type: 'string',
              description: 'Ages separated by commas (e.g., "30,28,8")',
              pattern: '^\\d+(,\\d+)*$'
            },
            currency: {
              type: 'string',
              description: 'Currency code (default: EUR)',
              default: 'EUR'
            },
            language: {
              type: 'string',
              description: 'Language code (default: en)',
              enum: ['en', 'de', 'it', 'fr', 'sl', 'hr', 'pl', 'cz'],
              default: 'en'
            }
          },
          required: ['accommodation_id', 'arrival_date']
        }
      },
      {
        name: 'research_accommodations',
        description: 'Advanced research tool that mimics human vacation booking behavior - searches multiple regions, finds best dates, applies filters, and compares options',
        inputSchema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            regions: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of regions to search (e.g., ["French Alps", "Italian Dolomites"])'
            },
            preferred_dates: {
              type: 'object',
              additionalProperties: false,
              properties: {
                arrival: {
                  type: 'string',
                  description: 'Preferred arrival date (YYYY-MM-DD)'
                },
                departure: {
                  type: 'string',
                  description: 'Preferred departure date (YYYY-MM-DD)'
                },
                flexible_days: {
                  type: 'integer',
                  description: 'Days of flexibility (+/- around preferred dates)',
                  default: 3
                }
              },
              required: ['arrival', 'departure']
            },
            persons_ages: {
              type: 'string',
              description: 'Comma-separated list of person ages (e.g., "18,18" for 2 adults)'
            },
            budget: {
              type: 'object',
              additionalProperties: false,
              properties: {
                max_total: {
                  type: 'number',
                  description: 'Maximum total budget for the stay'
                },
                currency: {
                  type: 'string',
                  description: 'Currency code',
                  default: 'EUR'
                }
              }
            },
            requirements: {
              type: 'object',
              additionalProperties: false,
              properties: {
                accommodation_type: {
                  type: 'string',
                  description: 'hotel, apartment, etc.'
                },
                board_type: {
                  type: 'string',
                  description: 'HB (half board), BB (bed & breakfast), OV (self catered), FB (full board)'
                },
                amenities: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Required amenities: pool, wellness, fitness, parking, wifi, pets'
                },
                proximity: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    ski_slopes: {
                      type: 'integer',
                      description: 'Max distance to ski slopes in meters'
                    },
                    center: {
                      type: 'integer',
                      description: 'Max distance to center in meters'
                    }
                  }
                }
              }
            },
            results_per_region: {
              type: 'integer',
              description: 'Number of best results to return per region',
              default: 3
            }
          },
          required: ['regions', 'preferred_dates', 'persons_ages']
        }
      }
    ];
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
                version: '2.2.0'
              }
            }
          };

        case 'tools/list':
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              tools: this.tools
            }
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

  // Send initialization notification (some MCP clients expect this)
  console.log(JSON.stringify({
    jsonrpc: '2.0',
    method: 'notifications/initialized'
  }));

  // Handle stdin input line by line (proper MCP protocol)
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on('line', async (line) => {
    try {
      const request = JSON.parse(line.trim());
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
