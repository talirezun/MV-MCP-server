# MountVacation MCP: Project Architecture & Development Blueprint

## Project Overview (Non-Technical Summary)

**What we're building:** A smart connector that allows AI assistants (like Claude Desktop, Cursor, VS Code with Cline, LM Studio) to search for mountain vacation accommodations using the MountVacation API.

**How it works:**
1. **User installs our connector** by copying a small piece of code into their AI assistant's configuration file
2. **User asks their AI** "Find me a ski chalet in the Alps for 4 people from March 10-17"
3. **AI uses our connector** to search MountVacation's database automatically
4. **AI presents top options** with prices, amenities, and direct booking links
5. **User clicks to book** - no additional steps needed

**Architecture:** We host the main server on Cloudflare (fast, reliable, global), and users just add a simple configuration to connect their AI assistant to our server.

## Technical Architecture

### Core Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   AI Clients    │───▶│  MCP Server      │───▶│ MountVacation   │
│ (Claude/Cursor/ │    │ (Cloudflare      │    │ API             │
│  VS Code/LM     │    │  Workers)        │    │                 │
│  Studio)        │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
    JSON config            FastMCP Server         REST API calls
    copy/paste              TypeScript            username/password
                              deployment              auth
```

### Technology Stack

- **Development Framework**: FastMCP (Python) for rapid MVP development
- **Production Runtime**: TypeScript on Cloudflare Workers
- **Authentication**: Username/password to MountVacation API (MVP), OAuth 2.1 (production)
- **Protocol**: Model Context Protocol (MCP) over JSON-RPC 2.0
- **Deployment**: Cloudflare Workers with global edge distribution

## API Integration Analysis

### MountVacation Search API Capabilities

Based on analysis of `https://api.mountvacation.com/docs/MountVacation-search-available-accommodation-API.html`:

**Search Methods Available:**
- Single accommodation search
- Multiple accommodations search
- Resort-based search
- City-based search
- Geolocation radius search

**Key Response Features:**
- Complete availability and pricing data
- **Direct reservation URLs** (`reservationUrl` field) - Critical for user booking
- Rich property metadata (location, amenities, facilities)
- Multiple currencies and languages support
- Pagination for large result sets
- Comprehensive fee structure (mandatory/optional, prepayment/on-spot)

**Authentication:** 
- Current: Username/password authentication
- Production: User-specific API keys (500 free calls/month)

## Development Roadmap

### Phase 1: MVP Development (Week 1)
**Goal**: Working local MCP server with basic search functionality

#### Development Environment Setup

```bash
# Clone FastMCP repository
git clone https://github.com/jlowin/fastmcp.git
cd fastmcp

# Set up Python environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install fastmcp requests python-dotenv

# Clone MCP Inspector for testing
git clone https://github.com/modelcontextprotocol/inspector.git mcp-inspector
```

#### Core MCP Server Implementation

Create `mountvacation_mcp.py`:

```python
from fastmcp import FastMCP
import requests
from datetime import datetime
from typing import Optional, List
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize FastMCP server
mcp = FastMCP("MountVacation Search")

@mcp.tool("search_accommodations")
def search_accommodations(
    location: str,
    arrival_date: str,  # YYYY-MM-DD format
    departure_date: str,  # YYYY-MM-DD format
    persons_ages: str,  # comma-separated ages, e.g. "18,18,12,8"
    currency: str = "EUR",
    max_results: int = 5
) -> dict:
    """
    Search for mountain vacation accommodations
    
    Args:
        location: City, resort, or region name (e.g. "Chamonix", "Alps")
        arrival_date: Check-in date in YYYY-MM-DD format
        departure_date: Check-out date in YYYY-MM-DD format  
        persons_ages: Comma-separated ages of all guests (e.g. "18,18,12,8")
        currency: Currency code (EUR, USD, GBP, etc.)
        max_results: Maximum number of accommodations to return (default: 5)
    
    Returns:
        Dictionary with search results including prices and booking links
    """
    
    # MountVacation API endpoint
    api_url = "https://api.mountvacation.com/accommodations/search/"
    
    # API credentials (from environment variables)
    api_user = os.getenv("MOUNTVACATION_USERNAME")
    api_pass = os.getenv("MOUNTVACATION_PASSWORD")
    
    # Build search parameters
    params = {
        'arrival': arrival_date,
        'departure': departure_date,
        'personsAges': persons_ages,
        'currency': currency,
        'lang': 'en'
    }
    
    # Try different search strategies
    # 1. Try as resort first
    search_params = params.copy()
    search_params['resort'] = location
    
    try:
        response = requests.get(
            api_url, 
            params=search_params,
            auth=(api_user, api_pass),
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            return format_accommodation_results(data, max_results)
            
    except Exception as e:
        pass
    
    # 2. Try as city if resort search failed
    search_params = params.copy()
    search_params['city'] = location
    
    try:
        response = requests.get(
            api_url,
            params=search_params, 
            auth=(api_user, api_pass),
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            return format_accommodation_results(data, max_results)
            
    except Exception as e:
        return {"error": f"Search failed: {str(e)}"}
    
    return {"error": f"No accommodations found for '{location}'. Try a different location or check spelling."}

def format_accommodation_results(data: dict, max_results: int) -> dict:
    """Format API response for LLM consumption"""
    
    accommodations = data.get('accommodations', [])[:max_results]
    
    results = {
        'search_summary': {
            'arrival': data.get('arrival'),
            'departure': data.get('departure'), 
            'nights': data.get('nights'),
            'persons': len(data.get('personsAges', [])),
            'total_found': len(accommodations)
        },
        'accommodations': []
    }
    
    for acc in accommodations:
        # Get the best offer (usually first one)
        best_offer = acc.get('offers', [{}])[0] if acc.get('offers') else {}
        
        formatted_acc = {
            'name': acc.get('title', 'N/A'),
            'location': f"{acc.get('city', 'N/A')}, {acc.get('country', 'N/A')}",
            'resort': acc.get('resort', 'N/A'),
            'category': acc.get('category', 'N/A'),
            'type': acc.get('type', 'N/A'),
            'price': {
                'total': best_offer.get('totalPrice', 'N/A'),
                'currency': acc.get('currency', 'EUR'),
                'nights': data.get('nights', 'N/A')
            },
            'key_features': {
                'beds': best_offer.get('beds', 'N/A'),
                'bedrooms': best_offer.get('bedrooms', 'N/A'),
                'size_sqm': best_offer.get('sizeSqM', 'N/A'),
                'wifi': acc.get('internetWifi', False),
                'parking': acc.get('parking', False),
                'pets_allowed': acc.get('pets', False)
            },
            'distances': {
                'to_resort': f"{acc.get('distResort', 'N/A')}m",
                'to_runs': f"{acc.get('distRuns', 'N/A')}m", 
                'to_centre': f"{acc.get('distCentre', 'N/A')}m"
            },
            'booking': {
                'reservation_url': best_offer.get('reservationUrl', 'N/A'),
                'free_cancellation_until': best_offer.get('freeCancellationBefore', 'Check policy'),
                'breakfast_included': best_offer.get('breakfastIncluded', False)
            },
            'property_url': acc.get('url', 'N/A')
        }
        
        results['accommodations'].append(formatted_acc)
    
    return results

if __name__ == "__main__":
    mcp.run()
```

#### Environment Configuration

Create `.env` file:
```bash
MOUNTVACATION_USERNAME=your_username_here
MOUNTVACATION_PASSWORD=your_password_here
```

#### Local Testing Setup

```bash
# Test MCP server locally
python mountvacation_mcp.py

# In another terminal, test with MCP Inspector
cd mcp-inspector
npm install
npm start

# Connect to: stdio://python mountvacation_mcp.py
```

### Phase 2: Client Integration Testing (Week 2)

#### Claude Desktop Integration

Create `claude_desktop_config.json` in Claude Desktop config folder:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mountvacation": {
      "command": "python",
      "args": ["/path/to/your/mountvacation_mcp.py"],
      "env": {
        "MOUNTVACATION_USERNAME": "your_username",
        "MOUNTVACATION_PASSWORD": "your_password"
      }
    }
  }
}
```

#### VS Code (Cline) Integration

Create or update `.vscode/mcp.json`:

```json
{
  "mountvacation": {
    "command": "python",
    "args": ["mountvacation_mcp.py"],
    "cwd": "/path/to/your/mcp/folder",
    "env": {
      "MOUNTVACATION_USERNAME": "your_username", 
      "MOUNTVACATION_PASSWORD": "your_password"
    }
  }
}
```

#### Cursor Integration

Add to global or project-specific MCP config:

```json
{
  "servers": {
    "mountvacation": {
      "command": "python",
      "args": ["path/to/mountvacation_mcp.py"],
      "env": {
        "MOUNTVACATION_USERNAME": "your_username",
        "MOUNTVACATION_PASSWORD": "your_password"
      }
    }
  }
}
```

#### LM Studio Integration

1. Open LM Studio → Settings → MCP Servers
2. Add new server:
   - **Name**: MountVacation Search
   - **Command**: `python`
   - **Args**: `path/to/mountvacation_mcp.py`
   - **Environment Variables**: Add credentials

### Phase 3: Cloud Deployment (Week 3)

#### Cloudflare Workers Deployment

Clone the TypeScript MCP framework:
```bash
git clone https://github.com/modelcontextprotocol/typescript-sdk.git
cd typescript-sdk
npm install
```

Create `mountvacation-worker.ts`:

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Cloudflare Worker implementation
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method === 'POST' && request.url.endsWith('/mcp')) {
      return handleMCPRequest(request, env);
    }
    
    return new Response('MountVacation MCP Server', { status: 200 });
  },
};

async function handleMCPRequest(request: Request, env: Env): Promise<Response> {
  const server = new Server(
    {
      name: 'mountvacation-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register accommodation search tool
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'search_accommodations',
          description: 'Search for mountain vacation accommodations',
          inputSchema: {
            type: 'object',
            properties: {
              location: { type: 'string', description: 'City, resort, or region name' },
              arrival_date: { type: 'string', description: 'Check-in date (YYYY-MM-DD)' },
              departure_date: { type: 'string', description: 'Check-out date (YYYY-MM-DD)' },
              persons_ages: { type: 'string', description: 'Comma-separated ages of guests' },
              currency: { type: 'string', default: 'EUR' },
              max_results: { type: 'number', default: 5 }
            },
            required: ['location', 'arrival_date', 'departure_date', 'persons_ages']
          }
        }
      ]
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === 'search_accommodations') {
      return await searchAccommodations(request.params.arguments, env);
    }
    
    throw new Error(`Unknown tool: ${request.params.name}`);
  });

  // Handle MCP protocol communication
  const body = await request.text();
  // Process MCP JSON-RPC request and return response
  // (Implementation details depend on Cloudflare Workers MCP adapter)
  
  return new Response(JSON.stringify({}), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function searchAccommodations(args: any, env: Env) {
  const apiUrl = 'https://api.mountvacation.com/accommodations/search/';
  
  // Use environment variables for credentials
  const credentials = btoa(`${env.MOUNTVACATION_USERNAME}:${env.MOUNTVACATION_PASSWORD}`);
  
  const searchParams = new URLSearchParams({
    arrival: args.arrival_date,
    departure: args.departure_date,
    personsAges: args.persons_ages,
    currency: args.currency || 'EUR',
    lang: 'en'
  });

  // Try resort search first, then city search
  const searchStrategies = [
    { resort: args.location },
    { city: args.location }
  ];

  for (const strategy of searchStrategies) {
    const params = new URLSearchParams(searchParams);
    Object.entries(strategy).forEach(([key, value]) => {
      params.set(key, value as string);
    });

    try {
      const response = await fetch(`${apiUrl}?${params}`, {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'User-Agent': 'MountVacation-MCP/1.0'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return { content: [{ type: 'text', text: JSON.stringify(formatResults(data, args.max_results || 5)) }] };
      }
    } catch (error) {
      continue;
    }
  }

  return { 
    content: [{ 
      type: 'text', 
      text: JSON.stringify({ error: `No accommodations found for '${args.location}'` }) 
    }] 
  };
}

function formatResults(data: any, maxResults: number) {
  // Same formatting logic as Python version
  // (Implementation details same as Phase 1)
}
```

#### Deployment Commands

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create new Worker
wrangler init mountvacation-mcp --template typescript

# Deploy to Cloudflare
wrangler publish

# Set environment variables
wrangler secret put MOUNTVACATION_USERNAME
wrangler secret put MOUNTVACATION_PASSWORD
```

## User Installation Guide

### For Users (Simple Copy-Paste Installation)

Once deployed to Cloudflare Workers, users can install the MCP by adding this configuration to their AI client:

#### Claude Desktop
Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "mountvacation": {
      "command": "npx",
      "args": ["-y", "@mountvacation/mcp-server"],
      "env": {
        "MOUNTVACATION_API_KEY": "your_api_key_from_mountvacation"
      }
    }
  }
}
```

#### VS Code (Cline)
Add to `.vscode/mcp.json`:
```json
{
  "mountvacation": {
    "url": "https://your-worker.your-subdomain.workers.dev/mcp",
    "apiKey": "your_api_key_from_mountvacation"
  }
}
```

#### How Users Get API Keys
1. Visit MountVacation developer portal
2. Create free account (500 API calls/month)
3. Copy API key
4. Paste into MCP configuration
5. Restart AI client

## Development Resources

### Essential GitHub Repositories

```bash
# Core MCP resources
git clone https://github.com/modelcontextprotocol/python-sdk.git
git clone https://github.com/modelcontextprotocol/typescript-sdk.git
git clone https://github.com/jlowin/fastmcp.git
git clone https://github.com/modelcontextprotocol/inspector.git

# Example MCP servers for reference
git clone https://github.com/modelcontextprotocol/servers.git
git clone https://github.com/punkpeye/awesome-mcp-servers.git

# Travel/accommodation MCP examples
git clone https://github.com/skarlekar/mcp_travelassistant.git
```

### Testing and Validation Tools

```bash
# MCP Inspector for protocol testing
npm install -g @modelcontextprotocol/inspector

# MCP Validator for compliance testing
git clone https://github.com/Janix-ai/mcp-validator.git

# FastMCP testing utilities
pip install fastmcp[test]
```

## Quality Assurance & Testing Strategy

### Testing Phases

1. **Protocol Compliance**: Use MCP Inspector to verify JSON-RPC 2.0 compliance
2. **Multi-Client Testing**: Test across Claude Desktop, VS Code, Cursor, LM Studio
3. **API Integration Testing**: Verify all MountVacation search methods work correctly
4. **Performance Testing**: Ensure sub-3-second response times
5. **Error Handling**: Test network failures, API errors, invalid inputs

### Key Test Cases

```python
# Example test cases for development
test_cases = [
    {
        "location": "Chamonix",
        "arrival": "2024-03-10", 
        "departure": "2024-03-17",
        "persons": "18,18,12,8",
        "expected": "Should return ski chalets"
    },
    {
        "location": "Zermatt",
        "arrival": "2024-07-15",
        "departure": "2024-07-22", 
        "persons": "25,23",
        "expected": "Should return summer mountain accommodations"
    },
    {
        "location": "NonExistentPlace123",
        "arrival": "2024-06-01",
        "departure": "2024-06-08",
        "persons": "30",
        "expected": "Should return graceful error message"
    }
]
```

## Production Deployment Considerations

### Security
- Environment variable management for API credentials
- Rate limiting to prevent API abuse
- Input validation and sanitization
- CORS configuration for web clients

### Performance
- Response caching for popular destinations
- Connection pooling for API requests
- Pagination handling for large result sets
- Timeout configuration (30 seconds max)

### Monitoring
- API usage tracking
- Error rate monitoring
- Response time metrics
- User adoption analytics

### Scalability
- Cloudflare Workers auto-scaling
- API quota management
- Regional deployment optimization
- Fallback mechanisms for API failures

## Success Metrics

- **User Adoption**: Number of active MCP installations
- **Search Success Rate**: Percentage of searches returning valid results  
- **Booking Conversion**: Click-through rate on reservation URLs
- **Performance**: Average response time < 3 seconds
- **Reliability**: 99.5% uptime target
- **User Satisfaction**: Community feedback and GitHub stars

## Maintenance & Updates

### Regular Tasks
- API endpoint monitoring
- MCP protocol version updates
- Client compatibility testing
- Security patch deployment
- Performance optimization

### Feature Roadmap
- Advanced filtering (price range, amenities)
- Multi-location search support
- Seasonal recommendations
- Booking integration (Phase 2)
- Mobile app support
- Enterprise features (bulk booking, reporting)

This architecture provides a clear path from local development to production deployment while maintaining simplicity for end users and comprehensive functionality for AI assistants.