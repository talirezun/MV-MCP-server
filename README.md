# MountVacation MCP Server

A comprehensive Model Context Protocol (MCP) server that provides **complete access to the MountVacation API** for AI assistants. Search and book accommodations across **all of Europe** including Slovenia, Croatia, Italy, Austria, Switzerland, France, Spain, Germany, and more.

## 🌍 Complete European Coverage

**MountVacation covers the entire European mountain vacation market** - from Alpine ski resorts to Mediterranean coastal retreats. This MCP server provides **100% API feature coverage** with no geographic limitations.

### 🏔️ **Supported Regions**
- **🇸🇮 Slovenia**: Lake Bled, Kranjska Gora, Bovec
- **🇭🇷 Croatia**: Plitvice Lakes, Istria, Dalmatian Coast
- **🇮🇹 Italy**: Dolomites, Trentino-Alto Adige, Valle d'Aosta
- **🇦🇹 Austria**: Tyrol, Salzburg, Carinthia
- **🇨🇭 Switzerland**: Valais, Graubünden, Bernese Oberland
- **🇫🇷 France**: French Alps, Pyrenees, Provence
- **🇪🇸 Spain**: Pyrenees, Picos de Europa, Sierra Nevada
- **🇩🇪 Germany**: Bavarian Alps, Black Forest, Harz Mountains
- **And more** - automatically supports new regions as MountVacation expands

## 🛠️ Complete API Integration

### **7 Comprehensive MCP Tools**
1. **`search_accommodations`** - Main search with location/geolocation support + **🔗 Prominent booking links**
2. **`get_booking_links`** - **NEW!** Direct booking URLs with multiple offers per accommodation
3. **`get_accommodation_details`** - Detailed property information with photos
4. **`get_facility_details`** - Room-specific amenities and equipment
5. **`search_by_resort_id`** - Resort-based search for ski areas
6. **`search_by_city_id`** - City-based search for urban areas
7. **`search_by_geolocation`** - GPS coordinate search with radius

### **Complete Parameter Support**
- **Search Methods**: Location name, resort ID, city ID, GPS coordinates, accommodation IDs
- **Date Parameters**: Arrival/departure dates, number of nights
- **Guest Parameters**: Person ages, guest count, group configurations
- **Localization**: Multi-currency (EUR, USD, GBP, etc.), multi-language (EN, DE, IT, FR, ES, etc.)
- **Advanced Options**: Additional fees, pagination, result limits
- **🔗 Enhanced Booking Integration**: Prominent "BOOK NOW" links + multiple booking offers per accommodation

### **Rich Property Data**
- **Property Information**: Photos, descriptions, amenities, GPS coordinates
- **Facility Details**: Room types, views, kitchen equipment, bathrooms
- **Pricing**: Real-time rates with currency conversion
- **Availability**: Live booking status and restrictions
- **Location Data**: Distances to ski runs, city centers, attractions

## 🚀 Quick Start

### **🎯 ULTRA-SIMPLE SETUP (2 Minutes!)**

**No git clone, no dependencies, no SDK installation required!**

**Step 1:** Download the MCP bridge (30 seconds)
```bash
curl -L -o mountvacation-mcp.js "https://raw.githubusercontent.com/talirezun/MV-MCP-server/main/scripts/standalone-mcp-bridge.js"
chmod +x mountvacation-mcp.js
```

**Step 2:** Add to Claude Desktop config (1 minute)
```json
{
  "mcpServers": {
    "mountvacation": {
      "command": "node",
      "args": ["/full/path/to/mountvacation-mcp.js"],
      "env": {
        "MOUNTVACATION_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

**Step 3:** Restart Claude Desktop - Done! 🎉

👉 **[Complete Setup Guide](SIMPLE_SETUP_GUIDE.md)** - Detailed instructions for all AI clients

### 🔑 Getting Your API Key

1. Visit [MountVacation.si](https://www.mountvacation.si/)
2. Contact their sales team for API access
3. Receive your unique API key
4. Add it to the configuration above

**⚠️ IMPORTANT**: You MUST have your own MountVacation API key for the MCP server to work.

## 🔧 Multi-Client Support

This MCP server works with **all major AI clients**. See our comprehensive configuration guides:

### **Supported Clients**
- **Claude Desktop** - Primary development target
- **VS Code (Cline)** - Full integration support
- **Cursor** - Complete compatibility
- **LM Studio** - Local model support
- **Continue.dev** - Development environment integration
- **Open WebUI** - Web-based interface
- **Aider** - Command-line coding assistant
- **Any MCP-compatible client** - Standard JSON-RPC 2.0 protocol

### **Configuration Templates**

📖 **[SIMPLE_SETUP_GUIDE.md](SIMPLE_SETUP_GUIDE.md)** - Complete setup guide for all AI clients

## 🌐 Production Infrastructure

### **Live Cloudflare Workers Deployment**

**Production URL**: `https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev`

- ✅ **Global Edge Network** - Sub-3-second response times worldwide
- ✅ **99.9% Uptime** - Enterprise-grade reliability
- ✅ **Auto-scaling** - Handles thousands of concurrent requests
- ✅ **Rate Limited** - 60 requests/minute per client with graceful degradation
- ✅ **Secure** - API keys stored as encrypted Cloudflare secrets
- ✅ **Cached** - Intelligent caching with 5-minute TTL for optimal performance

### **Deploy Your Own Instance**

```bash
cd cloudflare-workers
npm install -g wrangler
wrangler login
wrangler secret put MOUNTVACATION_API_KEY
wrangler deploy --env production
```

## 📖 Usage Examples

### 🔍 **European Mountain Vacation Searches**
Ask your AI assistant:

**🇦🇹 Austria:**
- *"Find ski accommodations in Innsbruck for February 2025, family of 4, with pool and sauna"*
- *"Search for luxury chalets in Salzburg region for Christmas week 2024"*

**🇮🇹 Italy:**
- *"Look for apartments in Italian Dolomites for March 2025, 6 adults, ski-in/ski-out"*
- *"Find romantic hotels in Cortina d'Ampezzo with wellness facilities"*

**🇨🇭 Switzerland:**
- *"Search for family-friendly accommodations in Zermatt area for Easter 2025"*
- *"Find budget-friendly places in Swiss Alps under €150/night"*

**🇫🇷 France:**
- *"Look for ski apartments in French Alps for New Year's week, 8 people"*
- *"Find mountain hotels in Chamonix with breakfast included"*

**🇸🇮 Slovenia:**
- *"Search for accommodations near Lake Bled for summer 2025, with mountain views"*
- *"Find eco-friendly hotels in Slovenian Alps for hiking vacation"*

### 🏨 **Advanced Property Research**
- *"Get detailed information about accommodation ID 6307 including all room types and facilities"*
- *"Show me facility details for room 39646 - what kitchen equipment and views does it have?"*
- *"What wellness amenities are available? Include spa, pool, and fitness facilities"*
- *"Compare prices in different currencies and show me the booking terms"*

### 🖼️ **Visual Property Exploration**
- *"Show me all available photos of this property including room interiors and exterior views"*
- *"Get the MountVacation property page URL so I can browse the full image gallery"*
- *"What does the surrounding area look like? Include location and nearby attractions"*

### 📍 **Location & Booking Integration**
- *"What's the exact GPS location and how far is it from the nearest ski lift?"*
- *"Generate a direct booking link with my dates (March 15-22, 2025) and guest info pre-filled"*
- *"Show me the distance to city center, airport, and major attractions"*
- *"What's the cancellation policy and are there any additional fees?"*

### 🌍 **Multi-Country & Currency Support**
- *"Search across Austria and Switzerland for ski accommodations under €200/night"*
- *"Find accommodations in multiple currencies - show prices in USD, EUR, and GBP"*
- *"Compare similar properties in different countries for the same dates"*
- *"Search by GPS coordinates: find accommodations within 50km of 46.8182,10.5478"*

## 🧪 Testing & Validation

### **Test the Live Server**
```bash
# Health check
curl https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev/health

# Test with your setup
node scripts/test-deployed-server.js
```

### **MCP Inspector (Development)**
```bash
npm install -g @modelcontextprotocol/inspector
mcp-inspector
```
Connect to: `stdio://node /path/to/scripts/mcp-cloud-bridge.js`

### **Validate Your Configuration**
1. **Check Claude Desktop logs** for connection errors
2. **Test basic search** - *"Find accommodations in Austria"*
3. **Verify API responses** - Should return European properties
4. **Test advanced features** - Property details, booking links, multi-currency

## 🔧 API Coverage & Features

### **Complete MountVacation API Integration**
- ✅ **All Search Methods** - Location, resort ID, city ID, GPS coordinates, accommodation IDs
- ✅ **All Parameters** - Dates, guests, currency, language, additional fees, pagination
- ✅ **All Response Data** - Properties, facilities, pricing, availability, booking links
- ✅ **All Regions** - Every country and destination MountVacation supports
- ✅ **Real-time Data** - Live pricing, availability, and property information
- ✅ **Multi-language** - EN, DE, IT, FR, ES, and more
- ✅ **Multi-currency** - EUR, USD, GBP, CHF, and regional currencies

## 📁 Project Architecture

```
MV-MCP-server/
├── 🌐 cloudflare-workers/           # Production Cloudflare Workers deployment
│   ├── src/
│   │   ├── index.ts                 # Main MCP server with 6 comprehensive tools
│   │   ├── api/mountvacation-client.ts  # Complete API client implementation
│   │   └── types.ts                 # TypeScript interfaces for all API data
│   └── wrangler.toml                # Cloudflare deployment configuration
├── 🐍 python-fastmcp/               # Alternative Python implementation
│   ├── mountvacation_mcp.py         # FastMCP Python server
│   └── requirements.txt             # Python dependencies
├── 📋 scripts/                      # Client integration bridges
│   ├── mcp-cloud-bridge.js          # Standard cloud bridge (no auth)
│   └── mcp-cloud-bridge-with-auth.js # Authenticated cloud bridge
├── 🔧 client-configs/               # Ready-to-use client configurations
│   ├── claude-desktop.json          # Claude Desktop setup
│   ├── vscode-cline.json            # VS Code Cline integration
│   └── cursor.json                  # Cursor IDE configuration
├── 📚 docs/                         # Comprehensive documentation
└── 📖 CLIENT_CONFIGURATIONS.md      # Copy-paste setup guides
└── 📖 PRODUCTION_SETUP_GUIDE.md     # Complete usage documentation
```

## 🚀 Key Benefits

### **For Users**
- ✅ **Zero Setup** - Works immediately with cloud-hosted deployment
- ✅ **Complete Coverage** - Access to entire European accommodation market
- ✅ **Multi-Client** - Works with Claude Desktop, VS Code, Cursor, and more
- ✅ **Real-time Data** - Live pricing, availability, and booking integration
- ✅ **Professional Grade** - Enterprise reliability with 99.9% uptime

### **For Developers**
- ✅ **Full API Access** - 100% MountVacation API feature coverage
- ✅ **TypeScript** - Type-safe implementation with comprehensive interfaces
- ✅ **Cloudflare Workers** - Serverless, globally distributed, auto-scaling
- ✅ **MCP Standard** - JSON-RPC 2.0 compliant Model Context Protocol
- ✅ **Open Source** - MIT licensed, community contributions welcome

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Make** your changes with comprehensive tests
4. **Update** documentation for any API changes
5. **Submit** a pull request with detailed description

## 📄 License

**MIT License** - see [LICENSE](LICENSE) file for details

## 🆘 Support & Resources

- 📖 **[Simple Setup Guide](SIMPLE_SETUP_GUIDE.md)** - Complete setup instructions for all AI clients
- 🐛 **[GitHub Issues](https://github.com/talirezun/MV-MCP-server/issues)** - Bug reports and feature requests
- 💬 **[Discussions](https://github.com/talirezun/MV-MCP-server/discussions)** - Community support and ideas

---

**🏔️ Ready to explore European mountain vacations with AI? Get started in under 2 minutes!**
