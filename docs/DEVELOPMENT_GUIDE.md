# MountVacation MCP Server - Development Guide

## 🚀 **Quick Start for New Developers**

### **Repository Overview**
```bash
git clone https://github.com/talirezun/MV-MCP-server.git
cd MV-MCP-server

# Project structure
tree -L 2
```

### **Development Environment Setup**

#### **Prerequisites**
- **Node.js 18+**: For Cloudflare Workers development
- **Python 3.8+**: For local server development  
- **Git**: Version control
- **Wrangler CLI**: Cloudflare Workers deployment
- **Code Editor**: VS Code recommended with TypeScript support

#### **Initial Setup**
```bash
# 1. Install Node.js dependencies
cd cloudflare-workers
npm install

# 2. Install Wrangler globally
npm install -g wrangler

# 3. Authenticate with Cloudflare
wrangler login

# 4. Set up Python environment (optional)
cd ../python-fastmcp
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 5. Copy environment template
cp ../.env.example .env
# Edit .env with your MountVacation API key
```

## 🏗️ **Architecture Deep Dive**

### **System Components**

#### **1. Cloudflare Workers Server** (`cloudflare-workers/src/index.ts`)
**Primary Production Server**

**Key Classes & Functions**:
```typescript
// Main request handler
export default {
  async fetch(request: Request, env: Env): Promise<Response>
}

// MCP request router
async function handleMCPRequest(request: Request, env: Env): Promise<Response>

// Tool implementations
async function handleToolsList(request: MCPRequest): Promise<Response>
async function handleToolCall(request: MCPRequest, env: Env, ...): Promise<Response>

// Core business logic
async function handleSearchAccommodations(args: SearchParams, ...): Promise<any>
```

**Dependencies**: Pure Web APIs, no external packages
**Deployment**: Cloudflare Workers with global edge distribution

#### **2. Cloud Bridge** (`standalone-cloud-bridge.js`)
**STDIO ↔ HTTP Protocol Converter**

**Key Functions**:
```javascript
// Main STDIO handler
process.stdin.on('data', async (chunk) => { ... })

// HTTP request forwarder
async function forwardToCloudServer(request): Promise<Response>

// MCP initialization handler
if (request.method === 'initialize') { ... }
```

**Purpose**: Enables Claude Desktop (STDIO) to communicate with HTTP server
**Dependencies**: Node.js built-in modules only

#### **3. Python Local Server** (`python-fastmcp/mountvacation_mcp.py`)
**Local Development Server**

**Key Components**:
```python
# FastMCP server setup
server = Server("mountvacation")

# Tool registration
@server.tool()
async def search_accommodations(location: str, ...): -> list[TextContent]

# Location mapping
LOCATION_MAPPINGS = { ... }
```

**Purpose**: Local development, advanced users, direct API access
**Dependencies**: FastMCP, requests, python-dotenv

### **Data Flow Architecture**
```
User Query → Claude Desktop → Bridge → Cloudflare Workers → MountVacation API
                ↓              ↓              ↓                    ↓
            STDIO JSON    HTTP JSON-RPC   REST API Call      JSON Response
                ↑              ↑              ↑                    ↑
User Display ← Claude Desktop ← Bridge ← Cloudflare Workers ← API Response
```

## 🔧 **Development Workflows**

### **Making Changes to Cloudflare Workers**

#### **Development Cycle**
```bash
cd cloudflare-workers

# 1. Start local development server
wrangler dev

# 2. Make changes to src/index.ts
# 3. Test locally at http://localhost:8787

# 4. Build for production
npm run build

# 5. Deploy to production
wrangler deploy --env production

# 6. Test production deployment
node ../scripts/test-deployed-server.js
```

#### **Key Files to Modify**
- **`src/index.ts`**: Main server logic
- **`wrangler.toml`**: Configuration and environment variables
- **`package.json`**: Dependencies and build scripts

### **Testing Strategy**

#### **Local Testing**
```bash
# Test health endpoint
curl http://localhost:8787/health

# Test MCP protocol
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

#### **Production Testing**
```bash
# Comprehensive test suite
node scripts/test-deployed-server.js

# Manual health check
curl https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev/health

# Manual MCP test
curl -X POST "https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev/mcp" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

#### **Bridge Testing**
```bash
# Test bridge functionality
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node standalone-cloud-bridge.js

# Test with Claude Desktop simulation
node -e "
const child = require('child_process').spawn('node', ['standalone-cloud-bridge.js']);
child.stdin.write('{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"initialize\",\"params\":{\"protocolVersion\":\"2024-11-05\"}}\n');
child.stdin.write('{\"jsonrpc\":\"2.0\",\"method\":\"notifications/initialized\"}\n');
child.stdin.write('{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"tools/list\"}\n');
child.stdout.on('data', console.log);
setTimeout(() => child.kill(), 5000);
"
```

## 🛠️ **Common Development Tasks**

### **Adding New Locations**
```typescript
// In cloudflare-workers/src/index.ts
const LOCATION_MAPPINGS: Record<string, number> = {
  'madonna di campiglio': 1234,
  'italian dolomites': 5678,
  'new location': 9999,  // Add new mapping
  // ...
};
```

### **Modifying Search Parameters**
```typescript
// Update SearchParams interface
interface SearchParams {
  location: string;
  arrival_date: string;
  departure_date: string;
  persons_ages: string;
  currency?: string;
  max_results?: number;
  new_param?: string;  // Add new parameter
}

// Update tool schema in handleToolsList()
const tools = [{
  name: 'search_accommodations',
  inputSchema: {
    properties: {
      // ... existing properties
      new_param: {
        type: 'string',
        description: 'Description of new parameter'
      }
    }
  }
}];
```

### **Adding Error Handling**
```typescript
// In handleSearchAccommodations()
try {
  // API call logic
} catch (error) {
  logger.error('API call failed', { error: error.message });
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        error: 'Custom error message',
        error_code: 'CUSTOM_ERROR_CODE',
        suggestions: ['Suggestion 1', 'Suggestion 2'],
        timestamp: new Date().toISOString()
      })
    }]
  };
}
```

### **Performance Optimization**
```typescript
// Add caching
const cacheKey = `search:${location}:${arrival_date}:${departure_date}`;
const cached = await cacheManager.get(cacheKey);
if (cached) {
  return cached;
}

// ... perform search
const result = await performSearch();

// Cache result
await cacheManager.set(cacheKey, result, 300); // 5 minutes TTL
return result;
```

## 🔍 **Debugging Techniques**

### **Cloudflare Workers Debugging**
```typescript
// Add logging
console.log('Debug info:', { variable, request: request.url });

// Use Wrangler tail for live logs
// In terminal: wrangler tail --env production
```

### **Bridge Debugging**
```javascript
// Enable debug mode
const DEBUG = process.env.MCP_DEBUG === '1';
function log(...args) {
  if (DEBUG) {
    console.error('[MCP Bridge]', ...args);
  }
}

// Usage: MCP_DEBUG=1 node standalone-cloud-bridge.js
```

### **Python Server Debugging**
```python
# Add logging
import logging
logging.basicConfig(level=logging.DEBUG)

# Test mode
if __name__ == "__main__":
    if "--test" in sys.argv:
        # Run test scenarios
        test_search_accommodations()
```

## 📦 **Deployment Process**

### **Production Deployment Checklist**
- [ ] **Code Review**: All changes reviewed
- [ ] **Local Testing**: All tests pass locally
- [ ] **Build Success**: `npm run build` completes without errors
- [ ] **Environment Variables**: All secrets configured in Cloudflare
- [ ] **Deploy**: `wrangler deploy --env production`
- [ ] **Health Check**: Verify `/health` endpoint
- [ ] **Integration Test**: Run full test suite
- [ ] **Documentation**: Update relevant docs
- [ ] **Git Tag**: Tag release version

### **Rollback Procedure**
```bash
# List recent deployments
wrangler deployments list --env production

# Rollback to previous version if needed
wrangler rollback --env production

# Verify rollback
curl https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev/health
```

## 🧪 **Testing Guidelines**

### **Unit Testing**
```typescript
// Example test structure (to be implemented)
describe('handleSearchAccommodations', () => {
  it('should return accommodations for valid location', async () => {
    const result = await handleSearchAccommodations({
      location: 'Madonna di Campiglio',
      arrival_date: '2026-01-15',
      departure_date: '2026-01-22',
      persons_ages: '30,28'
    }, mockEnv, mockCache, mockClient, mockLogger);
    
    expect(result.content[0].text).toContain('accommodations');
  });
});
```

### **Integration Testing**
```bash
# Test complete flow
node scripts/test-deployed-server.js

# Test specific scenarios
curl -X POST "https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev/mcp" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_accommodations","arguments":{"location":"Madonna di Campiglio","arrival_date":"2026-01-15","departure_date":"2026-01-22","persons_ages":"30,28"}}}'
```

## 📚 **Code Style & Standards**

### **TypeScript Guidelines**
- Use strict TypeScript configuration
- Define interfaces for all data structures
- Use async/await for asynchronous operations
- Handle errors explicitly
- Add JSDoc comments for public functions

### **JavaScript Guidelines**
- Use ES6+ features
- Prefer const/let over var
- Use arrow functions for callbacks
- Handle promises properly
- Add error handling for all async operations

### **Documentation Standards**
- Update README.md for user-facing changes
- Update API_REFERENCE.md for API changes
- Add inline comments for complex logic
- Update HANDOFF_DOCUMENTATION.md for architecture changes

---

**Development Guide Version**: 1.0.0  
**Last Updated**: September 23, 2025  
**Target Audience**: New developers joining the project
