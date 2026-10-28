# 🏗️ MV Travel MCP Server - Project Architecture

**Version**: 2.2.0 (Cloudflare Worker) / 3.5.0 (client script)
**Last Updated**: 2026-10-28

## 📋 **Project Overview**

The MV Travel MCP Server is a Model Context Protocol (MCP) server that provides AI assistants with access to MV Travel's accommodation booking API. It enables natural language queries for vacation planning across European destinations — ski resorts, coastal towns, thermal spas, and lake regions.

### **Key Features**
- 🏔️ **Year-Round Vacations**: Mountain, coastal, spa, and lake accommodations across Europe
- 🌍 **European Coverage**: 8+ countries with 150+ mapped destinations (ski, sea, lake, thermal)
- 🇭🇷 **Full Croatia Coverage**: Umag, Rovinj, Dubrovnik, Split, Hvar, Zadar, Makarska, Istria
- 🇸🇮 **Full Slovenia Coverage**: Bled, Bohinj, Portorož, Piran, Maribor, Kranjska Gora, Terme Čatež
- 👨‍👩‍👧‍👦 **Family Support**: Children pricing, age-based discounts, family room configurations
- 🔗 **Direct Booking**: Real-time pricing with direct booking links
- 📄 **Complete Pagination**: Advanced API batching for comprehensive results
- 🔄 **Universal Compatibility**: Works with all MCP clients (Claude Desktop, Augment Code, LM Studio, etc.)
- 🛡️ **Cross-Border Validation**: Prevents incorrect results from multi-country ski areas (e.g., Via Lattea)

---

## 🏛️ **Architecture Overview**

```
┌─────────────────────────────────────────────────────────────────┐
│                    MCP CLIENT LAYER                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │Claude Desktop│ │Augment Code │ │  LM Studio  │ │   Others    ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │   MCP PROTOCOL        │
                    │   (JSON-RPC 2.0)      │
                    └───────────┬───────────┘
                                │
┌─────────────────────────────────────────────────────────────────┐
│                 MCP SERVER LAYER                                │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │           mountvacation-mcp-server.js                       ││
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           ││
│  │  │  10 Tools   │ │ MCP Handler │ │ HTTP Client │           ││
│  │  └─────────────┘ └─────────────┘ └─────────────┘           ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │   CLOUDFLARE WORKER   │
                    │   (API Orchestration) │
                    └───────────┬───────────┘
                                │
┌─────────────────────────────────────────────────────────────────┐
│                 MV TRAVEL API LAYER                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │ Countries   │ │   Resorts   │ │   Cities    │ │ Ski Areas   ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │   Regions   │ │Accommodations│ │   Booking   │ │   Details   ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 **Project Structure**

```
MV-MCP-server/
├── 📄 README.md                      # Project documentation
├── 📄 CLAUDE.md                      # Project context for Claude Code
├── 📄 .env.example                   # Example environment variables
├── 📁 server-versions/               # Client scripts (what users download)
│   ├── 📄 mountvacation-mcp-server.js        # Standard MCP server
│   ├── 📄 mountvacation-mcp-server-cline.js  # Cline.bot version
│   └── 📄 mountvacation-mcp-server-v2.js     # Alternate version
├── 📁 docs/                          # Documentation folder
│   ├── 📄 PROJECT-ARCHITECTURE.md    # This file — system architecture & reference
│   ├── 📄 CHANGELOG.md               # Version history & release notes
│   ├── 📄 MV-MCP-Location-Resolution-Bug-Report.md  # Bug diagnosis (resolved)
│   ├── 📄 mountvacation_api_batching_guide.md  # API batching/pagination guide
│   └── 📁 foundations/               # Architecture and decision notes
│       ├── 📄 architecture.md
│       └── 📄 decisions.md
├── 📁 cloudflare-workers/            # Cloudflare Worker deployment
│   ├── 📄 package.json               # Dependencies
│   ├── 📄 wrangler.toml              # Cloudflare configuration
│   └── 📁 src/                       # Worker source code
│       ├── 📄 index.ts               # Main worker entry point
│       ├── 📄 types.ts               # TypeScript type definitions
│       ├── 📁 api/                   # API integration layer
│       │   ├── 📄 mountvacation-client.ts  # MV Travel API client
│       │   └── 📄 id-mapping.ts      # Location ID resolution
│       └── 📁 utils/                 # Cache, logger, rate limiter
└── 📁 mcp-configs/                   # MCP client configurations
    ├── 📄 mcp-config.json            # Generic configuration
    ├── 📄 mcp-config-macos-linux.json  # macOS/Linux specific
    ├── 📄 mcp-config-windows.json    # Windows specific
    └── 📄 mcp-config-for-augment.json  # Augment Code
```

---

## 🔧 **Core Components**

### **1. MCP Server (`server-versions/mountvacation-mcp-server.js`)**
- **Protocol**: JSON-RPC 2.0 over stdio
- **Version**: 3.5.0 (Protocol compliant, Claude Desktop compatible)
- **Tools**: 10 comprehensive accommodation search tools
- **Architecture**: Purely reactive, protocol-compliant server

### **2. Cloudflare Worker (`cloudflare-workers/`)**
- **Purpose**: API orchestration and intelligent routing
- **Version**: 2.2.0
- **Features**:
  - **150+ verified static location mappings** using resort/skiarea/region/city IDs
  - Dynamic ID mapping with fuzzy location matching
  - Comma-separated location parsing ("Umag, Croatia" → primary="umag", hint="croatia")
  - **Search strategy prioritization: resort → city → skiarea → region** (most specific first)
  - **Cross-border validation**: SkiArea/region results are validated against the search query to prevent mismatches (e.g., French results for Italian searches within multi-country ski areas)
  - **Early exit for high-confidence mappings**: Static mappings with high confidence return "no results" instead of falling back to incorrect broader searches
  - Location results from skiarea/region searches are filtered to the requested place
  - Auth failures and upstream errors are reported, not shown as "no results"
  - Rate limiting and error handling
  - Trailing-slash-free API endpoint for reliable connectivity

### **3. Tool Definitions**
1. `search_accommodations` - Main search with location intelligence
2. `search_accommodations_complete` - Complete pagination support for comprehensive results
3. `load_more_accommodations` - Manual pagination control for additional results
4. `get_accommodation_details` - Detailed property information
5. `get_facility_details` - Room/facility specific details
6. `search_by_resort_id` - Resort-specific searches
7. `search_by_city_id` - City-specific searches
8. `search_by_geolocation` - GPS-based proximity search
9. `get_booking_links` - Direct booking URL generation
10. `research_accommodations` - Multi-region comparison tool

---

## 🌐 **API Integration**

### **MV Travel API Endpoints**
- `https://api.mountvacation.com/countries` - Country listings
- `https://api.mountvacation.com/resorts` - Resort database
- `https://api.mountvacation.com/regions` - Regional groupings
- `https://api.mountvacation.com/cities` - City listings
- `https://api.mountvacation.com/skiareas` - Ski area database

### **Search Strategy Prioritization (v2.1.0)**
1. **Resorts** (most specific match — e.g., resort=9146 for Katschberg) — *trusted without validation*
2. **Cities** (specific area searches — e.g., city=13402 for Split) — *trusted without validation*
3. **Ski Areas** (broader coverage — e.g., Dolomiti Superski, Les 3 Vallées) — *validated against search query*
4. **Regions** (broadest area — e.g., region=911 for Trentino-Alto Adige) — *validated against search query*
5. **Dynamic ID Mapping** (fuzzy text match against API metadata)

> **Validation Trust Model (v2.1.0)**: Resort and City IDs are specific to a single location and are trusted without further validation. SkiArea and Region IDs can span multiple countries (e.g., Via Lattea covers Italy and France), so results from these strategies are validated against the user's search query using keyword matching to prevent cross-border mismatches.

> **Note**: Coordinate/geolocation-based search has been deprecated as a primary strategy due to unreliable results from the MV Travel API. All 150+ static mappings now use verified resort/skiarea/region/city IDs.

---

## 🔄 **Data Flow**

### **Typical Search Flow**
1. **User Query** → MCP Client (Claude Desktop, etc.)
2. **MCP Protocol** → JSON-RPC request to server
3. **Server Processing** → Tool validation and routing
4. **API Orchestration** → Client calls `mv-travel-mcp.talirezun.com`; the Cloudflare Worker processes the request
5. **Location Resolution** → ID mapping for optimal search
6. **API Calls** → Multiple MV Travel API endpoints
7. **Data Aggregation** → Results compilation and formatting
8. **Response** → Structured accommodation data with booking links

### **Error Handling & Fallbacks**
- **Strategy Cascade**: Resort → City → SkiArea → Region (most specific first)
- **Cross-border Validation**: SkiArea/Region results validated against search query
- **Early Exit**: High-confidence static mappings return "no results" instead of incorrect fallbacks
- **Extended Area Search**: Automatic fallback to broader regions when specific matches are empty
- **Graceful Degradation**: Partial results when some endpoints fail

---

## 🛠️ **Development & Deployment**

### **Local Development**
```bash
# Test server locally
echo '{"jsonrpc": "2.0", "id": 1, "method": "initialize"}' | node server-versions/mountvacation-mcp-server.js

# Deploy Cloudflare Worker
cd cloudflare-workers
npm run deploy
```

### **Production Deployment**
- **GitHub**: https://github.com/talirezun/MV-MCP-server
- **Cloudflare Workers** (identical code, v2.2.0):
  - `mv-travel-mcp` → https://mv-travel-mcp.talirezun.com (custom domain, used by client v3.5.0)
  - `mountvacation-mcp-final` → https://mountvacation-mcp-final.4thtech.workers.dev (legacy alias; stays up permanently because client scripts up to v3.3.0 hardcode this hostname)
- **Deploy both**: `cd cloudflare-workers && npm run deploy` (runs `wrangler deploy && wrangler deploy --env legacy`)
- **Download URL**: `https://raw.githubusercontent.com/talirezun/MV-MCP-server/main/server-versions/mountvacation-mcp-server.js`

### **Version Management**
- **Server Version**: Embedded in `serverInfo.version`
- **Protocol Version**: `2024-11-05` (Claude Desktop compatible)
- **API Version**: Cloudflare Worker handles versioning

---

## 🎯 **Quality Assurance**

### **Testing Strategy**
- **Protocol Compliance**: MCP specification adherence (JSON-RPC 2.0 notification handling)
- **Cross-client Compatibility**: Claude Desktop, Augment Code, LM Studio, Cline.bot
- **Functional Testing**: Real accommodation searches
- **Error Handling**: Graceful failure scenarios
- **Notification Handling**: Silent acceptance of JSON-RPC 2.0 notifications (no response for `notifications/initialized`, `notifications/cancelled`, etc.)

---

## 📊 **Supported Destinations**

### **Full Coverage (8+ Countries, 150+ Mapped Destinations)**

**🇦🇹 Austria** (Tirol region=607):
- Innsbruck (resort 39), Kitzbühel (resort 9222), St. Anton (resort 9224), Saalbach (resort 3), Zell am See (resort 148), Kaprun (resort 9216), Bad Gastein (resort 95), Schladming (resort 9195), Lech (resort 159)

**🇮🇹 Italy** (Trentino region=911, Dolomiti Superski skiarea=5):
- Madonna di Campiglio (resort 7), Cortina d'Ampezzo (resort 9209), Val Gardena (resort 9218), Livigno (resort 127), Bormio (resort 9220), Kronplatz (resort 11), Val di Fassa (resort 53), San Martino (resort 140), Cervinia (resort 54), Courmayeur (resort 113), Sestriere (resort 9221), Lake Garda Nord (resort 4)

**🇫🇷 France** (Rhône-Alpes region=807):
- Chamonix (resort 9233), Val d'Isère (resort 9227), Tignes (resort 70), Les Arcs (resort 9278), La Plagne (resort 9270), Courchevel (resort 9229), Méribel (resort 9485), Val Thorens (resort 10), Alpe d'Huez (resort 9325), Les Deux Alpes (resort 110), Serre Chevalier (resort 155), Morzine (resort 9244), Avoriaz (resort 9236)

**🇨🇭 Switzerland**:
- Zermatt (resort 22), Verbier (resort 9240), St. Moritz (resort 72), Davos (resort 8), Crans Montana (resort 9239), Saas-Fee (resort 5), Grindelwald (resort 9484), Engelberg (resort 89), Arosa (resort 9238)

**🇭🇷 Croatia** (Istra region=5207):
- Umag (resort 9487), Rovinj (resort 9489), Pula (resort 9491), Opatija (resort 9492), Dubrovnik (resort 9538), Hvar (resort 9520), Makarska (resort 9528), Zadar (resort 9504), Split (city 13402), Poreč/Istria (region 5207)

**🇸🇮 Slovenia** (Gorenjska region=4252):
- Bled (resort 9436), Bohinj (resort 76), Portorož (resort 9469), Piran (resort 9467), Maribor (resort 9215), Kranjska Gora (resort 87)

**🇧🇦 Bosnia**: Jahorina, Bjelašnica

---

## 🔐 **Security & Authentication**

### **Authentication Architecture**
The MV Travel MCP server uses a **user-provided API key architecture** for maximum security and scalability:

1. **User Responsibility**: Each user obtains their own API key from MV Travel
2. **Client-side Configuration**: API keys are stored in MCP client configurations
3. **Secure Transmission**: Keys are transmitted via HTTPS headers to Cloudflare Workers
4. **No Server Storage**: No API keys are stored in the server or cloud infrastructure

### **Authentication Flow**
```
User API Key → MCP Client → Local Server → Cloudflare Workers → MV Travel API
     ↓              ↓            ↓               ↓                    ↓
[Client Config] [Env Var] [HTTP Header] [URL Parameter] [API Authentication]
```

### **API Key Management**
- **Environment Variable**: `MOUNTVACATION_API_KEY` in client configuration
- **Header Transmission**: `X-MountVacation-API-Key` header to Cloudflare Workers
- **URL Parameter**: `apiKey` parameter in MV Travel API requests
- **Pagination Support**: Authentication automatically included in paginated requests

### **MCP Client Setup Examples**

#### **Claude Desktop**
```json
{
  "mcpServers": {
    "mv-travel": {
      "command": "node",
      "args": ["/absolute/path/to/mountvacation-mcp-server.js"],
      "env": {
        "MOUNTVACATION_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

#### **Augment Code**
```json
{
  "mcpServers": {
    "mv-travel": {
      "command": "node",
      "args": ["/absolute/path/to/mountvacation-mcp-server.js"],
      "env": {
        "MOUNTVACATION_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

#### **LM Studio**
```json
{
  "name": "MV Travel MCP",
  "command": "node",
  "args": ["/absolute/path/to/mountvacation-mcp-server.js"],
  "env": {
    "MOUNTVACATION_API_KEY": "your-api-key-here"
  }
}
```

### **Security Best Practices**
- ✅ **Individual API Keys**: Each user uses their own key
- ✅ **No Shared Credentials**: No centralized API key storage
- ✅ **HTTPS Only**: All communications encrypted
- ✅ **Environment Variables**: Keys stored in secure client configs
- ✅ **No Logging**: API keys never logged or stored

---

## 🚀 **Future Enhancements**

### **Planned Features**
- Real-time availability checking
- Price comparison across booking platforms
- Weather integration for ski conditions
- Multi-language support expansion

### **Technical Improvements**
- Caching layer for frequently accessed data
- WebSocket support for real-time updates
- Enhanced error reporting and diagnostics
- Performance monitoring and analytics

