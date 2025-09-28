# 🎿 MountVacation MCP Server

A production-ready Model Context Protocol (MCP) server that provides AI assistants with intelligent access to MountVacation's accommodation booking API, specializing in European ski resort and mountain vacation planning.

## ✨ **Key Features**

- 🎿 **Ski-focused**: Specialized for mountain and ski resort accommodations
- 🌍 **European Coverage**: 6+ countries with 86% coverage of major ski destinations
- 👨‍👩‍👧‍👦 **Family Support**: Children pricing, age-based discounts, family room configurations
- 🔗 **Direct Booking**: Real-time pricing with direct booking links
- 📄 **Complete Pagination**: Advanced API batching for comprehensive results (350% more accommodations)
- 🔄 **Universal Compatibility**: Works with all MCP clients (Claude Desktop, Augment Code, LM Studio, etc.)
- 🧠 **Intelligent Search**: Cross-border discovery, extended area search, ski area prioritization

---

## 🚀 **Quick Start**

### **1. Download the Server**
```bash
curl -o mountvacation-mcp-server.js https://raw.githubusercontent.com/talirezun/MV-MCP-server/main/mountvacation-mcp-server.js
```

### **2. Configure Your MCP Client**
Add to your MCP client configuration (e.g., Claude Desktop's `config.json`):

```json
{
  "mcpServers": {
    "mountvacation": {
      "command": "node",
      "args": ["./mountvacation-mcp-server.js"],
      "env": {
        "MOUNTVACATION_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### **3. Get Your API Key**
1. Visit [MountVacation.si](https://www.mountvacation.si/) to obtain your API key
2. Replace `"your-api-key-here"` with your actual 64-character API key

### **4. Restart Your MCP Client**
The server will be available with 12 comprehensive accommodation search tools including advanced pagination support.

---

## 🛠️ **Available Tools**

### **🔍 Core Search Tools**
| Tool | Description | Use Case |
|------|-------------|----------|
| `search_accommodations` | Main search with intelligent location resolution | General accommodation searches (first batch) |
| `search_accommodations_complete` | **NEW**: Complete search with automatic pagination | Comprehensive results (all available pages) |
| `load_more_accommodations` | **NEW**: Load additional results from pagination URLs | Progressive loading of more results |

### **📋 Property Details**
| Tool | Description | Use Case |
|------|-------------|----------|
| `get_accommodation_details` | Detailed property information and amenities | Property deep-dive analysis |
| `get_facility_details` | Specific room/facility details | Room selection and comparison |
| `search_by_resort_id` | Resort-specific accommodation searches | Targeted resort searches |
| `search_by_city_id` | City-specific accommodation searches | Urban area accommodation |
| `search_by_geolocation` | GPS coordinate-based proximity search | Location-based discovery |
| `get_booking_links` | Direct booking URL generation | Booking facilitation |
| `research_accommodations` | Multi-region comparison and research tool | Comprehensive vacation planning |

---

## 🎯 **Example Usage**

Try asking your AI assistant:

> *"Find ski accommodations in Austria for a family of 4 (2 adults, 2 children aged 8 and 5) for 7 nights in February 2026. We need a pool and half-board."*

**The server will:**
- ✅ Search across Austrian ski resorts with intelligent location mapping
- ✅ Apply family pricing with children's age-based discounts
- ✅ Use complete pagination to find all available accommodations (350% more results)
- ✅ Filter for pool and half-board amenities
- ✅ Provide direct booking links with real-time pricing
- ✅ Include proximity to ski slopes and resort information

---

## 🌍 **Supported Destinations**

### **Full Coverage (86% of European Ski Destinations)**
- 🇦🇹 **Austria**: Tirol, Salzburg regions (Hotel Goldried, Gradonna Mountain Resort)
- 🇮🇹 **Italy**: Dolomites, Trentino-Alto Adige (San Martino di Castrozza, Andalo)
- 🇸🇮 **Slovenia**: Kranjska Gora, Bovec (Ramada Hotel, Vitranc Apartments)
- 🇫🇷 **France**: French Alps, Pyrenees (Les Menuires, Val Thorens)
- 🇧🇦 **Bosnia**: Jahorina, Bjelašnica (Termag Hotel)
- 🇩🇪 **Germany**: Cross-border accommodation discovery

### **Partial Coverage**
- 🇨🇭 **Switzerland**: Limited availability (under investigation)

---

## 📄 **Pagination Support**

### **🚀 NEW: Complete Results Collection**
The MountVacation API uses pagination to handle large result sets efficiently. Our MCP server now provides three strategies:

#### **Strategy 1: Quick Search** (`search_accommodations`)
- Returns first batch (20-30 results) for fast response
- Includes pagination info if more results available
- Perfect for initial exploration

#### **Strategy 2: Complete Collection** (`search_accommodations_complete`)
- Automatically follows all pagination links
- Collects up to 200 total results across multiple pages
- Equivalent to browsing all pages on mountvacation.com
- Configurable limits for performance

#### **Strategy 3: Progressive Loading** (`load_more_accommodations`)
- Load additional batches on demand
- User-controlled pagination
- Optimal for interactive applications

### **Example Usage**
```javascript
// Quick search (first batch)
search_accommodations({
  location: "Chamonix",
  arrival_date: "2026-02-15",
  departure_date: "2026-02-22",
  persons_ages: "30,28"
})

// Complete search (all results)
search_accommodations_complete({
  location: "Chamonix",
  arrival_date: "2026-02-15",
  departure_date: "2026-02-22",
  persons_ages: "30,28",
  max_total_results: 100,
  max_pages: 10
})

// Load more from pagination URL
load_more_accommodations({
  next_page_url: "https://api.mountvacation.com/...",
  max_additional_results: 20
})
```

---

## 🏗️ **Technical Architecture**

- **Protocol**: JSON-RPC 2.0 over stdio (MCP compliant)
- **Version**: 3.2.0 (Protocol compliant for Claude Desktop)
- **API Integration**: Cloudflare Worker orchestration layer
- **Location Intelligence**: 5 MountVacation API endpoints for optimal search
- **Fallback Strategy**: Extended area search with cross-border discovery
- **Universal Compatibility**: All MCP clients supported

---

## ⚙️ **Configuration**

### **MCP Client Configurations**
Choose the appropriate configuration for your platform:

- **Generic**: `mcp-config.json`
- **macOS/Linux**: `mcp-config-macos-linux.json`  
- **Windows**: `mcp-config-windows.json`

### **API Key**
The server includes a demo key for testing. For production use, obtain your own MountVacation API key.

---

## 🔧 **Troubleshooting**

### **Claude Desktop Issues**
✅ **RESOLVED**: Version 3.2.0 includes protocol compliance fixes for Claude Desktop compatibility.

### **Common Solutions**
1. **Restart your MCP client** after configuration changes
2. **Check file paths** in your configuration  
3. **Verify API key** is correctly set in environment variables
4. **Test with command line** for debugging:
   ```bash
   echo '{"jsonrpc": "2.0", "id": 1, "method": "initialize"}' | node mountvacation-mcp-server.js
   ```

---

## 🧪 **Development & Testing**

### **Local Testing**
```bash
# Test initialization
echo '{"jsonrpc": "2.0", "id": 1, "method": "initialize"}' | node mountvacation-mcp-server.js

# Test tools list  
echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/list"}' | node mountvacation-mcp-server.js
```

### **Cloudflare Worker Deployment**
```bash
cd cloudflare-workers
npm install
npm run deploy
```

---

## 📚 **Documentation**

| Document | Description |
|----------|-------------|
| [📋 Project Architecture](docs/PROJECT-ARCHITECTURE.md) | Comprehensive technical overview and system design |
| [🔧 Claude Desktop Fix](docs/CLAUDE-DESKTOP-PROTOCOL-FIX.md) | Protocol compliance details and troubleshooting |
| [📊 Solution Summary](docs/FINAL-SOLUTION-SUMMARY.md) | Complete implementation summary and verification |

---

## 📈 **Version History**

- **v3.2.0** ✅ Protocol compliance fix for universal MCP client compatibility
- **v3.1.0** - Schema simplification and enhanced error handling  
- **v3.0.0** - Full API utilization with extended area search
- **v2.x** - Initial MCP implementation

---

## 🤝 **Support & Contributing**

- **GitHub Repository**: https://github.com/talirezun/MV-MCP-server
- **Issues & Questions**: Use GitHub Issues for support
- **Contributions**: Pull requests welcome

---

## 📄 **License**

MIT License - See LICENSE file for details.

---

## 🔗 **Production Deployment**

**Current Production URL**: `https://mountvacation-mcp-final.4thtech.workers.dev`

This is the latest stable deployment of the MountVacation MCP server on Cloudflare Workers.

---

**🎿 Ready to plan your next ski vacation with AI assistance! ⛷️**

*Built with ❤️ for the skiing community*
