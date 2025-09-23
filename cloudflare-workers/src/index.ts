/**
 * MountVacation MCP Server - Cloudflare Workers Implementation
 * A robust MCP server for searching mountain vacation accommodations
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  ListToolsResultSchema,
  CallToolResultSchema
} from '@modelcontextprotocol/sdk/types.js';

import { Env, SearchParams } from './types';
import { createLogger } from './utils/logger';
import { CacheManager } from './utils/cache';
import { RateLimiter } from './utils/rate-limiter';
import { MountVacationClient } from './api/mountvacation-client';

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
          version: '1.0.0',
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
        version: '1.0.0',
        description: 'A Model Context Protocol server for searching mountain vacation accommodations',
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

  const apiClient = new MountVacationClient(env, logger);

  // Rate limiting
  const clientId = rateLimiter.getClientId(request);
  if (rateLimiter.isRateLimited(clientId)) {
    const rateLimitInfo = rateLimiter.getRateLimitInfo(clientId);
    return new Response(JSON.stringify({
      error: 'Rate limit exceeded',
      resetTime: rateLimitInfo?.resetTime.toISOString(),
      maxRequests: rateLimitInfo?.maxRequests,
    }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '60',
      },
    });
  }

  // Create MCP server
  const server = new Server(
    {
      name: 'mountvacation-mcp',
      version: '1.0.0',
    }
  );

  // Register tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools: Tool[] = [
      {
        name: 'search_accommodations',
        description: 'Search for mountain vacation accommodations using the MountVacation API. This tool searches for available accommodations in mountain destinations and returns detailed information including pricing, amenities, and booking links.',
        inputSchema: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'City, resort, or region name (e.g., "Chamonix", "Zermatt", "Alps")',
            },
            arrival_date: {
              type: 'string',
              description: 'Check-in date in YYYY-MM-DD format (e.g., "2024-03-10")',
              pattern: '^\\d{4}-\\d{2}-\\d{2}$',
            },
            departure_date: {
              type: 'string',
              description: 'Check-out date in YYYY-MM-DD format (e.g., "2024-03-17")',
              pattern: '^\\d{4}-\\d{2}-\\d{2}$',
            },
            persons_ages: {
              type: 'string',
              description: 'Comma-separated ages of all guests (e.g., "18,18,12,8" for 2 adults and 2 children)',
              pattern: '^\\d+(,\\d+)*$',
            },
            currency: {
              type: 'string',
              description: 'Currency code for pricing (default: "EUR")',
              enum: ['EUR', 'USD', 'GBP', 'CHF', 'CAD', 'AUD'],
              default: 'EUR',
            },
            max_results: {
              type: 'number',
              description: 'Maximum number of accommodations to return (default: 5, max: 20)',
              minimum: 1,
              maximum: 20,
              default: 5,
            },
          },
          required: ['location', 'arrival_date', 'departure_date', 'persons_ages'],
        },
      },
    ];

    return { tools };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === 'search_accommodations') {
      return await handleSearchAccommodations(
        request.params.arguments as unknown as SearchParams,
        env,
        cacheManager,
        apiClient,
        logger
      );
    }

    throw new Error(`Unknown tool: ${request.params.name}`);
  });

  try {
    // Parse MCP request
    const body = await request.text();
    const mcpRequest = JSON.parse(body);

    logger.info('MCP request received', {
      method: mcpRequest.method,
      id: mcpRequest.id,
    });

    // Process request through MCP server
    // Note: This is a simplified implementation
    // In a full implementation, you'd need to properly handle the JSON-RPC protocol
    
    if (mcpRequest.method === 'tools/list') {
      const response = await server.request(
        { method: 'tools/list', params: {} } as any,
        ListToolsResultSchema
      );
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        id: mcpRequest.id,
        result: response,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (mcpRequest.method === 'tools/call') {
      const response = await server.request(mcpRequest as any, CallToolResultSchema);
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        id: mcpRequest.id,
        result: response,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      id: mcpRequest.id,
      error: {
        code: -32601,
        message: 'Method not found',
      },
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    logger.error('MCP request processing failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32700,
        message: 'Parse error',
      },
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
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
    currency = 'EUR',
    max_results = parseInt(env.MAX_RESULTS_DEFAULT),
  } = args;

  // Validate max_results
  const validatedMaxResults = Math.min(max_results, parseInt(env.MAX_RESULTS_LIMIT));

  logger.info('Search request received', {
    location,
    arrival_date,
    departure_date,
    persons_ages,
    currency,
    max_results: validatedMaxResults,
  });

  try {
    // Check cache first
    const cacheKey = cacheManager.generateKey(
      location,
      arrival_date,
      departure_date,
      persons_ages,
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
    const result = await apiClient.searchAccommodations({
      location,
      arrival_date,
      departure_date,
      persons_ages,
      currency,
      max_results: validatedMaxResults,
    }, env);

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
