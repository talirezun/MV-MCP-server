# 🏔️ MV Travel MCP Server

A production-ready Model Context Protocol (MCP) server that provides AI assistants with intelligent access to [MV Travel](https://mv-travel.com/)'s (formerly MountVacation) accommodation booking API, specializing in year-round mountain vacations across Europe, spa & terme holidays in Slovenia, and extensive Croatia coverage.

## Watch the Demo Video

Click the thumbnail below to watch the video:

[![Watch the Video](https://img.youtube.com/vi/iX-VV5B8veE/hqdefault.jpg)](https://youtu.be/iX-VV5B8veE)

*Clicking the image will open the video on YouTube.*

## ✨ **Key Features**

- 🏔️ **Year-Round Mountain Vacations**: All-season mountain accommodations across Europe (skiing, hiking, wellness, spa)
- 🌍 **Comprehensive European Coverage**: 8+ countries with 150+ verified destination mappings
- 🏨 **Spa & Terme Holidays**: Specialized coverage of Slovenia's spa and thermal destinations
- 🇭🇷 **Extensive Croatia Coverage**: Comprehensive accommodation options throughout Croatia
- 👨‍👩‍👧‍👦 **Family Support**: Children pricing, age-based discounts, family room configurations
- 🔗 **Direct Booking**: Real-time pricing with direct booking links
- 📄 **Complete Pagination**: Advanced API batching for comprehensive results (350% more accommodations)
- 🔄 **Universal Compatibility**: Tested with LM Studio (gpt-oss 20B), Claude Desktop App, Augment Code, Cline.bot
- 🧠 **Intelligent Search**: Comma-separated location parsing, resort/region ID-based search, destination prioritization

---

## 🏗️ **Server Architecture**

### **📥 Simple Installation**
Users only need to download a single JavaScript file - no repository cloning required!

### **📁 Available Server Files**
- **`mountvacation-mcp-server.js`** - Standard MCP server for most clients (Claude Desktop, LM Studio, Augment Code)
- **`mountvacation-mcp-server-cline.js`** - Optimized version for Cline.bot within VS Code

### **🔗 Direct Download Links**
- **Standard**: https://raw.githubusercontent.com/talirezun/MV-MCP-server/main/server-versions/mountvacation-mcp-server.js
- **Cline Version**: https://raw.githubusercontent.com/talirezun/MV-MCP-server/main/server-versions/mountvacation-mcp-server-cline.js

### **⚙️ Configuration**
All configuration is done through your MCP client's config file - no additional setup files needed!

---

## 🚀 **Quick Start**

### **1. Download the Server File**
```bash
# Download the MCP server file
curl -o mountvacation-mcp-server.js https://raw.githubusercontent.com/talirezun/MV-MCP-server/main/server-versions/mountvacation-mcp-server.js
```

### **2. Get Your MV Travel API Key**
[Get your API key here](#-get-your-mv-travel-api-key) (see section below for details)

### **3. Configure Your MCP Client**
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

### **4. Restart Your MCP Client**
The server will be available with 10 comprehensive accommodation search tools including advanced pagination support.

---

## 🔧 **Reliability & DNS Resolution**

### **✅ Stable Production Deployment**
- **Cloudflare Workers**: Deployed and actively running
- **Free Tier**: 100,000 requests/day (no inactivity timeout)
- **Uptime**: Continuously available
- **DNS Resolution**: Optimized to work reliably regardless of system DNS configuration

### **🛡️ DNS Resolution Fix (v3.3+)**
The server uses direct IP connection to Cloudflare Workers, ensuring reliable operation even if your system's DNS has local overrides or caching issues. This means:
- ✅ Works on all systems without DNS configuration
- ✅ No dependency on system DNS settings
- ✅ Faster connection establishment
- ✅ More reliable for automated deployments

---

## 💻 **Installation Instructions**

### **📋 Prerequisites**
- Node.js (version 14 or higher)
- Your MV Travel API key

### **📥 Download Server File (All Platforms)**

**Option 1: Direct Download**
```bash
# Using curl (macOS/Linux)
curl -o mountvacation-mcp-server.js https://raw.githubusercontent.com/talirezun/MV-MCP-server/main/server-versions/mountvacation-mcp-server.js

# Using PowerShell (Windows)
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/talirezun/MV-MCP-server/main/server-versions/mountvacation-mcp-server.js" -OutFile "mountvacation-mcp-server.js"
```

**Option 2: Browser Download**
Visit: https://raw.githubusercontent.com/talirezun/MV-MCP-server/main/server-versions/mountvacation-mcp-server.js
Right-click → Save As → `mountvacation-mcp-server.js`

### **⚙️ Configure Your MCP Client**

Add this configuration to your MCP client's config file:

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

**Common config file locations:**
- **Claude Desktop (macOS)**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Claude Desktop (Windows)**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Claude Desktop (Linux)**: `~/.config/Claude/claude_desktop_config.json`

## 🔄 **MCP Client Compatibility**

### **✅ Tested and Working**
- **🧠 LM Studio** - gpt-oss 20B model (excellent performance)
- **🤖 Claude Desktop App** - Full compatibility with protocol v3.3.0 (JSON-RPC 2.0 notification handling)
- **⚡ Augment Code** - Native integration support
- **🔧 Cline.bot** - VS Code extension (use cline-specific server version)

### **🔜 More Clients Testing**
Additional MCP client testing is ongoing. The server follows MCP protocol standards for universal compatibility.

---

## 📱 **Client-Specific Instructions**

### **🤖 Claude Desktop**
1. Download `mountvacation-mcp-server.js` to your preferred folder
2. Edit your Claude Desktop config file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`
3. Add the MV Travel server configuration (see above)
4. Restart Claude Desktop

### **🧠 LM Studio**
1. Download `mountvacation-mcp-server.js` to your LM Studio folder
2. Add to your LM Studio MCP configuration
3. Set the `MOUNTVACATION_API_KEY` environment variable
4. Restart LM Studio

### **⚡ Augment Code**
1. Download `mountvacation-mcp-server.js` to your project folder
2. Use the "Edit MCP Server" option in Augment
3. Set command: `node` and args: `./mountvacation-mcp-server.js`
4. Add `MOUNTVACATION_API_KEY` environment variable
5. Save and restart

### **🔧 Cline.bot (VS Code)**
1. Download the Cline-specific version:
   ```bash
   curl -o mountvacation-mcp-server-cline.js https://raw.githubusercontent.com/talirezun/MV-MCP-server/main/server-versions/mountvacation-mcp-server-cline.js
   ```
2. Configure in VS Code Cline extension settings
3. Set environment variable: `MOUNTVACATION_API_KEY=your-api-key-here`

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

**🎿 Winter Skiing:**
> *"Find ski accommodations in Austria for a family of 4 (2 adults, 2 children aged 8 and 5) for 7 nights in February 2026. We need a pool and half-board."*

**🌿 Summer Hiking:**
> *"Find mountain accommodations in the Dolomites for hiking in July 2026. We want wellness facilities and breakfast included."*

**🏨 Spa & Wellness:**
> *"Find spa hotels in Slovenia with thermal pools for a romantic weekend in September 2026."*

**🇭🇷 Croatia Vacation:**
> *"Find beachfront accommodations in Croatia for a family vacation in August 2026, near Split or Dubrovnik."*

**The server will:**
- ✅ Search across European destinations with intelligent location mapping
- ✅ Apply family pricing with children's age-based discounts
- ✅ Use complete pagination to find all available accommodations (350% more results)
- ✅ Filter for specific amenities (pools, spa, wellness, etc.)
- ✅ Provide direct booking links with real-time pricing
- ✅ Include proximity to attractions and activity information

---

## 🌍 **Supported Destinations**

### **🏔️ Year-Round Mountain & Coastal Destinations**
- 🇦🇹 **Austria**: Innsbruck, Kitzbühel, St. Anton, Saalbach, Zell am See, Bad Gastein, Lech (Tirol region)
- 🇮🇹 **Italy**: Madonna di Campiglio, Cortina, Val Gardena, Livigno, Bormio, Lake Garda Nord, Cervinia, Courmayeur (Trentino, Dolomites)
- 🇫🇷 **France**: Chamonix, Val d'Isère, Tignes, Courchevel, Méribel, Val Thorens, Alpe d'Huez, Morzine (French Alps)
- 🇨🇭 **Switzerland**: Zermatt, Verbier, St. Moritz, Davos, Crans Montana, Saas-Fee, Grindelwald (Valais region)
- 🇭🇷 **Croatia**: Umag, Rovinj, Pula, Opatija, Dubrovnik, Split, Hvar, Zadar, Makarska (full Istria & Dalmatia)
- 🇸🇮 **Slovenia**: Bled, Bohinj, Portorož, Piran, Maribor, Kranjska Gora (mountain & coastal)
- 🇧🇦 **Bosnia**: Jahorina, Bjelašnica - Mountain tourism
- 🇩🇪 **Germany**: Cross-border accommodation discovery

### **🏨 Spa & Terme Holidays (Slovenia)**
- **Terme Čatež** - Largest spa complex in Slovenia
- **Terme Olimia** - Wellness and thermal springs
- **Terme Dobrna** - Historic spa town
- **Terme Zreče** - Mountain spa resort
- **Terme Ptuj** - Roman heritage spa

### **🇭🇷 Extensive Croatia Coverage**
- **Istria**: Coastal resorts, inland destinations
- **Dalmatia**: Split, Dubrovnik, islands
- **Kvarner**: Rijeka, Opatija, islands
- **Central Croatia**: Zagreb region, continental destinations
- **Spa Destinations**: Terme Sveti Martin, Istarske Toplice

### **🔍 Additional Coverage**
- All static mappings use verified API resort/skiarea/region/city IDs (coordinate-based search deprecated due to unreliable API responses)

---

## 📄 **Pagination Support**

### **🚀 NEW: Complete Results Collection**
The MV Travel API uses pagination to handle large result sets efficiently. Our MCP server now provides three strategies:

#### **Strategy 1: Quick Search** (`search_accommodations`)
- Returns first batch (20-30 results) for fast response
- Includes pagination info if more results available
- Perfect for initial exploration

#### **Strategy 2: Complete Collection** (`search_accommodations_complete`)
- Automatically follows all pagination links
- Collects up to 200 total results across multiple pages
- Equivalent to browsing all pages on [mv-travel.com](https://mv-travel.com/)
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
- **Version**: 3.3.0 (Protocol compliant for Claude Desktop, with JSON-RPC 2.0 notification handling)
- **API Integration**: Cloudflare Worker orchestration layer
- **Location Intelligence**: 150+ verified static mappings using resort/skiarea/region/city IDs (no unreliable coordinates)
- **Search Strategy**: resort → city → skiarea → region → dynamic fuzzy matching (most specific first, with cross-border validation)
- **Comma-Separated Parsing**: "Umag, Croatia" → primary="umag", hint="croatia" for accurate results
- **Universal Compatibility**: All MCP clients supported

---

## 🔑 **Get Your MV Travel API Key**

To use this MCP server, you need a valid MV Travel API key:

### **📝 How to Obtain Your API Key**
1. **Visit MV Travel** - [mv-travel.com](https://mv-travel.com/)
2. **Register or Login** to your MV Travel account
3. **Navigate to API section** in your account dashboard
4. **Generate your API key** - You'll receive a 64-character key
5. **Copy the key** and use it in your MCP client configuration

### **🔒 Security Note**
- Keep your API key secure and never share it publicly
- The API key provides access to MV Travel's booking system
- Each key is tied to your account for billing and usage tracking

### **⚙️ Configuration**
Use your API key in any of the provided configuration files:
- **Generic**: `mcp-config.json`
- **macOS/Linux**: `mcp-config-macos-linux.json`
- **Windows**: `mcp-config-windows.json`
- **Augment Code**: `mcp-config-for-augment.json`

---

## 🎥 **Video Demonstration**

Watch our comprehensive video guide showing the MV Travel MCP Server in action:

### **📺 Setup and Usage Tutorial**
*[Video link will be added here manually]*

The video covers:
- 🔧 Installation and setup process
- 🎯 Example searches and queries
- 🏔️ Different vacation types (skiing, hiking, spa, Croatia)
- 🤖 Integration with various MCP clients
- 💡 Tips and best practices

---

## 🔧 **Troubleshooting**

### **Claude Desktop Issues**
✅ **RESOLVED**: Version 3.3.0 includes full JSON-RPC 2.0 notification handling and protocol version compatibility for Claude Desktop. The server now silently accepts `notifications/initialized` and other notification messages per the JSON-RPC 2.0 spec (no response for messages without an `id` field).

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
| [📋 Changelog](docs/CHANGELOG.md) | Version history and release notes |
| [🐛 Location Resolution Bug Report](docs/MV-MCP-Location-Resolution-Bug-Report.md) | Diagnosis & resolution of cross-border location bug (resolved in v2.1.0) |
| [📄 API Batching Guide](docs/mountvacation_api_batching_guide.md) | API batching and pagination guide |

---

## 📈 **Version History**

- **CF Worker v2.1.0** ✅ **Location resolution fix**: Strategy reordering (resort→city→skiarea→region) + cross-border validation. Prevents incorrect results from multi-country ski areas (e.g., Via Lattea). Fixes Sestriere, Katschberg, Terme Čatež, Obergurgl, Sölden.
- **v3.4.0** ✅ Systemic location mapping overhaul: All 150+ static mappings now use verified resort/skiarea/region/city IDs (coordinate-based search deprecated). Full Croatia & Slovenia coverage. Comma-separated location parsing. Trailing slash fix. Non-ski destination support.
- **v3.3.0** ✅ JSON-RPC 2.0 notification handling fix for Claude Desktop compatibility (silent acceptance of `notifications/initialized`, protocol version set to `2024-11-05`)
- **v3.2.0** - Protocol compliance fix for universal MCP client compatibility
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

## 👤 **Author**

**[Dr. Tali Režun](https://talirezun.com/)** builds software with AI agents and teaches leaders and developers to do the same. He is Vice Dean of Frontier Technologies at COTRUGLI Business School, a serial entrepreneur for 30 years, the builder of The Curator, Agent Link and Lumina, and the author of *From Lab to Life*.

🌐 [talirezun.com](https://talirezun.com/)

---

## 🔗 **Production Deployment**

**Current Production URL**: `https://mountvacation-mcp-final.4thtech.workers.dev`

**Status**: ✅ Active and Stable
- **Platform**: Cloudflare Workers (Free Tier)
- **Requests/Day**: 100,000 (no inactivity timeout)
- **Uptime**: Continuous
- **Cloudflare Worker Version**: v2.1.0 (cross-border validation, 150+ verified location mappings)
- **MCP Server Version**: v3.3.0 (Claude Desktop compatible)

This is the latest stable deployment of the MV Travel MCP server on Cloudflare Workers. The server uses direct IP connection for maximum reliability.

---

## ⚠️ **Disclaimer**

### **🧪 Experimental Software**
This MCP server is experimental software provided "as is" without any warranties. Users should be aware of the following:

### **📋 Liability Limitations**
- **Code Author**: The author of this code is not liable for any damages, issues, or problems arising from the use of this software
- **MV Travel**: [MV Travel](https://mv-travel.com/) is not liable for any issues related to this third-party integration
- **No Warranty**: This software is provided without warranty of any kind, express or implied
- **Use at Own Risk**: Users assume all risks associated with using this experimental software

### **🔍 Recommendations**
- **Test Thoroughly**: Always test the software in a safe environment before production use
- **Verify Results**: Double-check all booking information and pricing before making reservations
- **Backup Plans**: Have alternative booking methods available
- **Report Issues**: Please report bugs and issues via GitHub Issues to help improve the software

### **🤝 Community Project**
This is an open-source community project aimed at improving AI-assisted travel planning. While we strive for quality and reliability, users should exercise appropriate caution when using experimental software for important travel bookings.

---

**🏔️ Ready to plan your next mountain vacation with AI assistance! 🎿**

*Built with ❤️ for the mountain vacation community*
