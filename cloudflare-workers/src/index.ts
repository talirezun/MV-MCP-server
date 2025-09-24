/**
 * MountVacation MCP Server - Cloudflare Workers Implementation
 * A robust HTTP-based MCP server for searching mountain vacation accommodations
 */

import { Env, SearchParams } from './types';
import { createLogger } from './utils/logger';
import { CacheManager } from './utils/cache';
import { RateLimiter } from './utils/rate-limiter';
import { MountVacationClient } from './api/mountvacation-client';

// MCP JSON-RPC types
interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number | null;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    // Initialize logger with request context
    const requestId = crypto.randomUUID();
    const logger = createLogger(env, { requestId });

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);
      
      // Health check endpoint
      if (url.pathname === '/health') {
        return new Response(JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '2.0.0',
        }), {
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          },
        });
      }

      // MCP endpoint
      if (url.pathname === '/mcp' && request.method === 'POST') {
        return await handleMCPRequest(request, env, logger);
      }

      // Default response
      return new Response(JSON.stringify({
        name: 'MountVacation MCP Server',
        version: '2.0.0',
        description: 'Comprehensive Model Context Protocol server for mountain vacation accommodations with property links, image galleries, and detailed facility information',
        endpoints: {
          mcp: '/mcp',
          health: '/health',
        },
        documentation: 'https://github.com/talirezun/MV-MCP-server',
      }), {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        },
      });

    } catch (error) {
      logger.error('Request handling failed', {
        error: error instanceof Error ? error.message : String(error),
        url: request.url,
        method: request.method,
      });

      return new Response(JSON.stringify({
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        },
      });
    }
  },
};

async function handleMCPRequest(request: Request, env: Env, logger: any): Promise<Response> {
  // Extract API key from headers - PRODUCTION MODE: User API key required
  const apiKey = request.headers.get('X-MountVacation-API-Key') ||
                 request.headers.get('Authorization')?.replace('Bearer ', '');

  // PRODUCTION: Require user API key - no fallback
  if (!apiKey) {
    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32602,
        message: 'MountVacation API key required. Please provide your API key in the MCP client configuration.',
        data: {
          required_header: 'X-MountVacation-API-Key',
          alternative_header: 'Authorization: Bearer <your_api_key>',
          get_api_key: 'https://www.mountvacation.si/',
          setup_guide: 'Add MOUNTVACATION_API_KEY to your MCP client env variables',
          documentation: 'https://github.com/talirezun/MV-MCP-server#api-key-setup'
        }
      }
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate API key format (basic validation)
  if (apiKey.length < 10) {
    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32602,
        message: 'Invalid API key format. Please check your MountVacation API key.',
        data: {
          get_api_key: 'https://www.mountvacation.si/',
          documentation: 'https://github.com/talirezun/MV-MCP-server#api-key-setup'
        }
      }
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Initialize components
  const cacheManager = new CacheManager(
    parseInt(env.MAX_CACHE_SIZE),
    parseInt(env.CACHE_TTL_SECONDS),
    logger
  );

  const rateLimiter = new RateLimiter(
    parseInt(env.RATE_LIMIT_REQUESTS_PER_MINUTE),
    1,
    logger
  );

  const apiClient = new MountVacationClient(env, logger, apiKey);

  // Rate limiting
  const clientId = rateLimiter.getClientId(request);
  if (rateLimiter.isRateLimited(clientId)) {
    const rateLimitInfo = rateLimiter.getRateLimitInfo(clientId);
    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32603,
        message: 'Rate limit exceeded',
        data: {
          resetTime: rateLimitInfo?.resetTime.toISOString(),
          maxRequests: rateLimitInfo?.maxRequests,
        }
      }
    }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '60',
      },
    });
  }

  try {
    // Parse JSON-RPC request
    const mcpRequest: MCPRequest = await request.json();

    logger.info('MCP request received', {
      method: mcpRequest.method,
      id: mcpRequest.id,
    });

    // Handle different MCP methods
    switch (mcpRequest.method) {
      case 'tools/list':
        return handleToolsList(mcpRequest, logger);

      case 'tools/call':
        return await handleToolCall(mcpRequest, env, cacheManager, apiClient, logger);

      default:
        return createErrorResponse(mcpRequest.id, -32601, `Method not found: ${mcpRequest.method}`);
    }

  } catch (error) {
    logger.error('MCP request parsing failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    return createErrorResponse(null, -32700, 'Parse error');
  }
    }

// Helper function to create error responses
function createErrorResponse(id: string | number | null, code: number, message: string, data?: any): Response {
  const response: MCPResponse = {
    jsonrpc: '2.0',
    id,
    error: {
      code,
      message,
      ...(data && { data })
    }
  };

  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Helper function to create success responses
function createSuccessResponse(id: string | number | null, result: any): Response {
  const response: MCPResponse = {
    jsonrpc: '2.0',
    id,
    result
  };

  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Handle tools/list requests
function handleToolsList(request: MCPRequest, logger: any): Response {
  const tools = [
    {
      name: 'search_accommodations',
      description: 'Search for accommodations using the MountVacation API. Supports location-based search (city, resort, region names), specific accommodation IDs, resort IDs, city IDs, and geolocation-based search. Returns comprehensive accommodation details including pricing, amenities, pictures, distances, and booking information.',
      inputSchema: {
        type: 'object',
        properties: {
          // Search by location name (most common)
          location: {
            type: 'string',
            description: 'Location name: city, resort, region, or country (e.g., "Madonna di Campiglio", "French Alps", "Slovenia"). Leave empty if using other search methods.',
          },
          // Search by specific IDs
          accommodation_id: {
            type: 'integer',
            description: 'Specific accommodation ID for direct search. Use instead of location.',
          },
          accommodation_ids: {
            type: 'array',
            items: { type: 'integer' },
            description: 'Array of accommodation IDs for searching multiple specific accommodations. Use instead of location.',
          },
          resort_id: {
            type: 'integer',
            description: 'Resort ID to search all accommodations in a specific resort. Use instead of location.',
          },
          city_id: {
            type: 'integer',
            description: 'City ID to search all accommodations in a specific city. Use instead of location.',
          },
          // Geolocation search
          latitude: {
            type: 'number',
            description: 'Latitude for geolocation-based search. Requires longitude and radius.',
          },
          longitude: {
            type: 'number',
            description: 'Longitude for geolocation-based search. Requires latitude and radius.',
          },
          radius: {
            type: 'integer',
            description: 'Search radius in meters for geolocation search (e.g., 10000 for 10km). Requires latitude and longitude.',
          },
          // Date parameters (required)
          arrival_date: {
            type: 'string',
            description: 'Check-in date in YYYY-MM-DD format (e.g., "2024-03-10"). Must not be in the past.',
            pattern: '^\\d{4}-\\d{2}-\\d{2}$',
          },
          departure_date: {
            type: 'string',
            description: 'Check-out date in YYYY-MM-DD format (e.g., "2024-03-17"). Alternative: use nights instead.',
            pattern: '^\\d{4}-\\d{2}-\\d{2}$',
          },
          nights: {
            type: 'integer',
            description: 'Number of nights to stay. Alternative to departure_date.',
            minimum: 1,
          },
          // Person parameters (required - choose one)
          persons_ages: {
            type: 'string',
            description: 'Ages of all persons separated by commas (e.g., "30,28,8,5" for 2 adults and 2 children). Recommended for accurate pricing with children discounts.',
            pattern: '^\\d+(,\\d+)*$',
          },
          persons: {
            type: 'integer',
            description: 'Number of persons (all treated as adults). Alternative to persons_ages.',
            minimum: 1,
          },
          // Optional parameters
          currency: {
            type: 'string',
            description: 'Currency code for pricing. Supported: AUD, BGN, BRL, CAD, CHF, CNY, CZK, DKK, EUR, GBP, HKD, HRK, HUF, IDR, ILS, INR, JPY, KRW, LTL, MXN, MYR, NOK, NZD, PHP, PLN, RON, RUB, SEK, SGD, THB, TRY, USD, ZAR',
            default: 'EUR',
          },
          language: {
            type: 'string',
            description: 'Language for translated content. Supported: en, de, it, fr, sl, hr, pl, cz',
            enum: ['en', 'de', 'it', 'fr', 'sl', 'hr', 'pl', 'cz'],
            default: 'en',
          },
          include_additional_fees: {
            type: 'boolean',
            description: 'Include additional fees in search results for more accurate total pricing',
            default: false,
          },
          max_results: {
            type: 'integer',
            description: 'Maximum number of accommodations to return per page (1-100)',
            minimum: 1,
            maximum: 100,
            default: 10,
          },
          page: {
            type: 'integer',
            description: 'Page number for pagination (starts from 1)',
            minimum: 1,
            default: 1,
          },
        },
        required: ['arrival_date'],
      },
    },
    {
      name: 'get_accommodation_details',
      description: 'Get detailed properties and amenities for a specific accommodation including facilities, wellness options, distances, and comprehensive image galleries.',
      inputSchema: {
        type: 'object',
        properties: {
          accommodation_id: {
            type: 'number',
            description: 'The accommodation ID from search results',
          },
          language: {
            type: 'string',
            description: 'Language for descriptions (default: "en")',
            enum: ['en', 'de', 'it', 'fr', 'sl', 'hr', 'pl', 'cz'],
            default: 'en',
          },
          include_facilities: {
            type: 'boolean',
            description: 'Include detailed facility properties (default: true)',
            default: true,
          },
        },
        required: ['accommodation_id'],
      },
    },
    {
      name: 'get_facility_details',
      description: 'Get detailed properties for a specific room or facility within an accommodation, including amenities, views, kitchen facilities, and bathroom details.',
      inputSchema: {
        type: 'object',
        properties: {
          accommodation_id: {
            type: 'number',
            description: 'The accommodation ID',
          },
          facility_id: {
            type: 'number',
            description: 'The facility/room ID',
          },
          language: {
            type: 'string',
            description: 'Language for descriptions (default: "en")',
            enum: ['en', 'de', 'it', 'fr', 'sl', 'hr', 'pl', 'cz'],
            default: 'en',
          },
        },
        required: ['accommodation_id', 'facility_id'],
      },
    },
    {
      name: 'search_by_resort_id',
      description: 'Search all accommodations in a specific resort using resort ID. Returns all available accommodations in that resort with full details.',
      inputSchema: {
        type: 'object',
        properties: {
          resort_id: {
            type: 'integer',
            description: 'The resort ID to search accommodations in',
          },
          arrival_date: {
            type: 'string',
            description: 'Check-in date in YYYY-MM-DD format',
            pattern: '^\\d{4}-\\d{2}-\\d{2}$',
          },
          departure_date: {
            type: 'string',
            description: 'Check-out date in YYYY-MM-DD format. Alternative: use nights',
            pattern: '^\\d{4}-\\d{2}-\\d{2}$',
          },
          nights: {
            type: 'integer',
            description: 'Number of nights. Alternative to departure_date',
            minimum: 1,
          },
          persons_ages: {
            type: 'string',
            description: 'Ages separated by commas (e.g., "30,28,8")',
            pattern: '^\\d+(,\\d+)*$',
          },
          persons: {
            type: 'integer',
            description: 'Number of persons (all adults). Alternative to persons_ages',
            minimum: 1,
          },
          currency: {
            type: 'string',
            description: 'Currency code (default: EUR)',
            default: 'EUR',
          },
          language: {
            type: 'string',
            description: 'Language code (default: en)',
            enum: ['en', 'de', 'it', 'fr', 'sl', 'hr', 'pl', 'cz'],
            default: 'en',
          },
          include_additional_fees: {
            type: 'boolean',
            description: 'Include additional fees for accurate pricing',
            default: false,
          },
        },
        required: ['resort_id', 'arrival_date'],
      },
    },
    {
      name: 'search_by_city_id',
      description: 'Search all accommodations in a specific city using city ID. Returns all available accommodations in that city with full details.',
      inputSchema: {
        type: 'object',
        properties: {
          city_id: {
            type: 'integer',
            description: 'The city ID to search accommodations in',
          },
          arrival_date: {
            type: 'string',
            description: 'Check-in date in YYYY-MM-DD format',
            pattern: '^\\d{4}-\\d{2}-\\d{2}$',
          },
          departure_date: {
            type: 'string',
            description: 'Check-out date in YYYY-MM-DD format. Alternative: use nights',
            pattern: '^\\d{4}-\\d{2}-\\d{2}$',
          },
          nights: {
            type: 'integer',
            description: 'Number of nights. Alternative to departure_date',
            minimum: 1,
          },
          persons_ages: {
            type: 'string',
            description: 'Ages separated by commas (e.g., "30,28,8")',
            pattern: '^\\d+(,\\d+)*$',
          },
          persons: {
            type: 'integer',
            description: 'Number of persons (all adults). Alternative to persons_ages',
            minimum: 1,
          },
          currency: {
            type: 'string',
            description: 'Currency code (default: EUR)',
            default: 'EUR',
          },
          language: {
            type: 'string',
            description: 'Language code (default: en)',
            enum: ['en', 'de', 'it', 'fr', 'sl', 'hr', 'pl', 'cz'],
            default: 'en',
          },
          include_additional_fees: {
            type: 'boolean',
            description: 'Include additional fees for accurate pricing',
            default: false,
          },
        },
        required: ['city_id', 'arrival_date'],
      },
    },
    {
      name: 'search_by_geolocation',
      description: 'Search accommodations within a specific radius from geographic coordinates. Useful for finding accommodations near specific locations.',
      inputSchema: {
        type: 'object',
        properties: {
          latitude: {
            type: 'number',
            description: 'Latitude coordinate',
          },
          longitude: {
            type: 'number',
            description: 'Longitude coordinate',
          },
          radius: {
            type: 'integer',
            description: 'Search radius in meters (e.g., 10000 for 10km)',
            minimum: 100,
          },
          arrival_date: {
            type: 'string',
            description: 'Check-in date in YYYY-MM-DD format',
            pattern: '^\\d{4}-\\d{2}-\\d{2}$',
          },
          departure_date: {
            type: 'string',
            description: 'Check-out date in YYYY-MM-DD format. Alternative: use nights',
            pattern: '^\\d{4}-\\d{2}-\\d{2}$',
          },
          nights: {
            type: 'integer',
            description: 'Number of nights. Alternative to departure_date',
            minimum: 1,
          },
          persons_ages: {
            type: 'string',
            description: 'Ages separated by commas (e.g., "30,28,8")',
            pattern: '^\\d+(,\\d+)*$',
          },
          persons: {
            type: 'integer',
            description: 'Number of persons (all adults). Alternative to persons_ages',
            minimum: 1,
          },
          currency: {
            type: 'string',
            description: 'Currency code (default: EUR)',
            default: 'EUR',
          },
          language: {
            type: 'string',
            description: 'Language code (default: en)',
            enum: ['en', 'de', 'it', 'fr', 'sl', 'hr', 'pl', 'cz'],
            default: 'en',
          },
          include_additional_fees: {
            type: 'boolean',
            description: 'Include additional fees for accurate pricing',
            default: false,
          },
        },
        required: ['latitude', 'longitude', 'radius', 'arrival_date'],
      },
    },
    {
      name: 'get_booking_links',
      description: 'Get direct booking links for specific accommodations. This tool extracts and formats booking URLs prominently for easy access.',
      inputSchema: {
        type: 'object',
        properties: {
          accommodation_id: {
            type: 'integer',
            description: 'The accommodation ID to get booking links for',
          },
          arrival_date: {
            type: 'string',
            description: 'Check-in date in YYYY-MM-DD format',
            pattern: '^\\d{4}-\\d{2}-\\d{2}$',
          },
          departure_date: {
            type: 'string',
            description: 'Check-out date in YYYY-MM-DD format. Alternative: use nights',
            pattern: '^\\d{4}-\\d{2}-\\d{2}$',
          },
          nights: {
            type: 'integer',
            description: 'Number of nights. Alternative to departure_date',
            minimum: 1,
          },
          persons_ages: {
            type: 'string',
            description: 'Ages separated by commas (e.g., "30,28,8")',
            pattern: '^\\d+(,\\d+)*$',
          },
          persons: {
            type: 'integer',
            description: 'Number of persons (all adults). Alternative to persons_ages',
            minimum: 1,
          },
          currency: {
            type: 'string',
            description: 'Currency code (default: EUR)',
            default: 'EUR',
          },
          language: {
            type: 'string',
            description: 'Language code (default: en)',
            enum: ['en', 'de', 'it', 'fr', 'sl', 'hr', 'pl', 'cz'],
            default: 'en',
          },
        },
        required: ['accommodation_id', 'arrival_date'],
      },
    },
  ];

  logger.info('Tools list requested', { toolCount: tools.length });

  return createSuccessResponse(request.id, { tools });
}

// Handle tools/call requests
async function handleToolCall(
  request: MCPRequest,
  env: Env,
  cacheManager: CacheManager,
  apiClient: MountVacationClient,
  logger: any
): Promise<Response> {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'search_accommodations':
        const searchResult = await handleSearchAccommodations(
          args as SearchParams,
          env,
          cacheManager,
          apiClient,
          logger
        );
        return createSuccessResponse(request.id, searchResult);

      case 'get_accommodation_details':
        const accommodationDetails = await apiClient.getAccommodationProperties(
          args.accommodation_id,
          args.language || 'en',
          args.include_facilities !== false
        );
        return createSuccessResponse(request.id, { accommodation_details: accommodationDetails });

      case 'get_facility_details':
        const facilityDetails = await apiClient.getFacilityProperties(
          args.accommodation_id,
          args.facility_id,
          args.language || 'en'
        );
        return createSuccessResponse(request.id, { facility_details: facilityDetails });

      case 'search_by_resort_id':
        const resortSearchResult = await handleSearchByResortId(
          args,
          env,
          cacheManager,
          apiClient,
          logger
        );
        return createSuccessResponse(request.id, resortSearchResult);

      case 'search_by_city_id':
        const citySearchResult = await handleSearchByCityId(
          args,
          env,
          cacheManager,
          apiClient,
          logger
        );
        return createSuccessResponse(request.id, citySearchResult);

      case 'search_by_geolocation':
        const geoSearchResult = await handleSearchByGeolocation(
          args,
          env,
          cacheManager,
          apiClient,
          logger
        );
        return createSuccessResponse(request.id, geoSearchResult);

      case 'get_booking_links':
        const bookingLinksResult = await handleGetBookingLinks(
          args,
          env,
          cacheManager,
          apiClient,
          logger
        );
        return createSuccessResponse(request.id, bookingLinksResult);

      default:
        return createErrorResponse(request.id, -32601, `Unknown tool: ${name}`);
    }
  } catch (error) {
    logger.error('Tool call failed', {
      tool: name,
      error: error instanceof Error ? error.message : String(error),
    });

    return createErrorResponse(
      request.id,
      -32603,
      'Internal error',
      { tool: name, error: String(error) }
    );
  }
}

async function handleSearchAccommodations(
  args: SearchParams,
  env: Env,
  cacheManager: CacheManager,
  apiClient: MountVacationClient,
  logger: any
) {
  const {
    location,
    arrival_date,
    departure_date,
    persons_ages,
    persons,
    currency = 'EUR',
    max_results = parseInt(env.MAX_RESULTS_DEFAULT),
  } = args;

  // Handle persons parameter - convert to persons_ages format
  let finalPersonsAges = persons_ages;
  if (!persons_ages && persons) {
    // Convert persons count to ages (assume all adults age 30)
    finalPersonsAges = Array(persons).fill(30).join(',');
  }

  // Validate max_results
  const validatedMaxResults = Math.min(max_results, parseInt(env.MAX_RESULTS_LIMIT));

  logger.info('Search request received', {
    location,
    arrival_date,
    departure_date,
    persons_ages: finalPersonsAges,
    original_persons: persons,
    currency,
    max_results: validatedMaxResults,
  });

  try {
    // Check cache first
    const cacheKey = cacheManager.generateKey(
      location || '',
      arrival_date,
      departure_date || '',
      finalPersonsAges || '',
      currency,
      validatedMaxResults
    );

    const cachedResult = await cacheManager.get(cacheKey, env.CACHE);
    if (cachedResult) {
      logger.info('Cache hit', { cache_key: cacheKey });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(cachedResult),
          },
        ],
      };
    }

    // Make API request
    const searchParams: SearchParams = {
      arrival_date,
      ...(location && { location }),
      ...(departure_date && { departure_date }),
      ...(finalPersonsAges && { persons_ages: finalPersonsAges }),
      ...(currency && { currency }),
      max_results: validatedMaxResults,
    };

    const result = await apiClient.searchAccommodations(searchParams, env);

    // Cache successful results
    if (!result.error) {
      await cacheManager.set(cacheKey, result, env.CACHE);
    }

    logger.info('Search completed', {
      success: !result.error,
      results_count: result.accommodations?.length || 0,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result),
        },
      ],
    };

  } catch (error) {
    logger.error('Search failed with exception', {
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: `Search failed: ${error instanceof Error ? error.message : String(error)}`,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    };
  }
}

async function handleSearchByResortId(
  args: any,
  env: Env,
  cacheManager: CacheManager,
  apiClient: MountVacationClient,
  logger: any
) {
  try {
    logger.info('Starting resort ID search', { resort_id: args.resort_id });

    // Build search parameters for resort ID search
    const searchParams: SearchParams = {
      resort_id: args.resort_id,
      arrival_date: args.arrival_date,
      departure_date: args.departure_date,
      nights: args.nights,
      persons_ages: args.persons_ages,
      persons: args.persons,
      currency: args.currency || 'EUR',
      language: args.language || 'en',
      include_additional_fees: args.include_additional_fees || false,
      max_results: args.max_results || 10,
      page: args.page || 1,
    };

    const result = await apiClient.searchAccommodations(searchParams, env);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result),
        },
      ],
    };
  } catch (error) {
    logger.error('Resort ID search failed', {
      resort_id: args.resort_id,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: `Resort search failed: ${error instanceof Error ? error.message : String(error)}`,
            resort_id: args.resort_id,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    };
  }
}

async function handleSearchByCityId(
  args: any,
  env: Env,
  cacheManager: CacheManager,
  apiClient: MountVacationClient,
  logger: any
) {
  try {
    logger.info('Starting city ID search', { city_id: args.city_id });

    const searchParams: SearchParams = {
      city_id: args.city_id,
      arrival_date: args.arrival_date,
      departure_date: args.departure_date,
      nights: args.nights,
      persons_ages: args.persons_ages,
      persons: args.persons,
      currency: args.currency || 'EUR',
      language: args.language || 'en',
      include_additional_fees: args.include_additional_fees || false,
      max_results: args.max_results || 10,
      page: args.page || 1,
    };

    const result = await apiClient.searchAccommodations(searchParams, env);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result),
        },
      ],
    };
  } catch (error) {
    logger.error('City ID search failed', {
      city_id: args.city_id,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: `City search failed: ${error instanceof Error ? error.message : String(error)}`,
            city_id: args.city_id,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    };
  }
}

async function handleSearchByGeolocation(
  args: any,
  env: Env,
  cacheManager: CacheManager,
  apiClient: MountVacationClient,
  logger: any
) {
  try {
    logger.info('Starting geolocation search', {
      latitude: args.latitude,
      longitude: args.longitude,
      radius: args.radius
    });

    const searchParams: SearchParams = {
      latitude: args.latitude,
      longitude: args.longitude,
      radius: args.radius,
      arrival_date: args.arrival_date,
      departure_date: args.departure_date,
      nights: args.nights,
      persons_ages: args.persons_ages,
      persons: args.persons,
      currency: args.currency || 'EUR',
      language: args.language || 'en',
      include_additional_fees: args.include_additional_fees || false,
      max_results: args.max_results || 10,
      page: args.page || 1,
    };

    const result = await apiClient.searchAccommodations(searchParams, env);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result),
        },
      ],
    };
  } catch (error) {
    logger.error('Geolocation search failed', {
      latitude: args.latitude,
      longitude: args.longitude,
      radius: args.radius,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: `Geolocation search failed: ${error instanceof Error ? error.message : String(error)}`,
            coordinates: { latitude: args.latitude, longitude: args.longitude, radius: args.radius },
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    };
  }
}

async function handleGetBookingLinks(
  args: any,
  env: Env,
  cacheManager: CacheManager,
  apiClient: MountVacationClient,
  logger: any
) {
  try {
    logger.info('Getting booking links', { accommodation_id: args.accommodation_id });

    // Build search parameters for the specific accommodation
    const searchParams: SearchParams = {
      accommodation_id: args.accommodation_id,
      arrival_date: args.arrival_date,
      departure_date: args.departure_date,
      nights: args.nights,
      persons_ages: args.persons_ages,
      persons: args.persons,
      currency: args.currency || 'EUR',
      language: args.language || 'en',
      max_results: 1, // Only need this one accommodation
    };

    const result = await apiClient.searchAccommodations(searchParams, env);

    if (result.error || !result.accommodations || result.accommodations.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'No booking links found for this accommodation.',
              accommodation_id: args.accommodation_id,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      };
    }

    const accommodation = result.accommodations[0];

    if (!accommodation) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'No accommodation data found.',
              accommodation_id: args.accommodation_id,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      };
    }

    // Format booking links prominently
    const bookingInfo = {
      accommodation_name: accommodation.name,
      location: accommodation.location.full_address,
      primary_booking_url: accommodation.book_now_url,
      booking_offers: accommodation.booking_offers,
      search_summary: result.search_summary,
      message: `Found ${accommodation.booking_offers.length} booking option(s) for ${accommodation.name}`,
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(bookingInfo),
        },
      ],
    };
  } catch (error) {
    logger.error('Get booking links failed', {
      accommodation_id: args.accommodation_id,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: `Failed to get booking links: ${error instanceof Error ? error.message : String(error)}`,
            accommodation_id: args.accommodation_id,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    };
  }
}
