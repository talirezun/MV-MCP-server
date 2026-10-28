# 🏔️ MV Travel MCP Server

A Model Context Protocol (MCP) server that provides AI assistants with intelligent access to [MV Travel](https://mv-travel.com/)'s (formerly MountVacation) accommodation booking API, specializing in year-round mountain vacations across Europe, spa & terme holidays in Slovenia, and extensive Croatia coverage.

## 🚀 **Install (about 1 minute)**

**Before you start you need:**
- **Node.js 18 or newer**: download the LTS version from [nodejs.org](https://nodejs.org) if you don't have it.
- **Your MV Travel API key**: see [how to get one](#-get-your-mv-travel-api-key).

**Step 1. Run one command**

On **Mac or Linux**, open Terminal and paste:
```bash
curl -fsSL https://raw.githubusercontent.com/talirezun/MV-MCP-server/main/install/install.sh | bash
```

On **Windows**, open PowerShell and paste:
```powershell
irm https://raw.githubusercontent.com/talirezun/MV-MCP-server/main/install/install.ps1 | iex
```

**Step 2. Paste your API key** when asked. It stays hidden while you type, and the installer checks it with MV Travel.

**Step 3. Choose your apps.** The installer lists the AI apps it found on your computer. Press **Enter** to set up all of them.

**Step 4. Restart your AI app.** For Claude Desktop, fully quit it (Cmd+Q on Mac, or File → Exit on Windows) and open it again.

That's it. Try asking: *"Find a ski apartment in Kitzbühel for 2 adults, 7 nights in February."*

### Already using the old MountVacation version?
Run the same command. It replaces the old `mountvacation` entry with the new `mv-travel` one. Nothing else changes, and your other MCP servers are left alone.

### Update or remove
- **Update:** run the same command again.
- **Remove (Mac/Linux):** `curl -fsSL https://raw.githubusercontent.com/talirezun/MV-MCP-server/main/install/install.sh | bash -s -- --uninstall`
- **Remove (Windows):** `$env:MV_TRAVEL_ARGS='--uninstall'; irm https://raw.githubusercontent.com/talirezun/MV-MCP-server/main/install/install.ps1 | iex`

### Works with
Claude Desktop, Claude Code, Cursor, VS Code (GitHub Copilot), Windsurf, Cline, Roo Code, LM Studio, Kiro, Gemini CLI, Codex CLI, Antigravity, opencode and Zed. For any other app, or a config file it can't safely edit, the installer prints the exact text to paste instead.

### If something goes wrong
- **"needs Node.js 18 or newer":** install Node.js from [nodejs.org](https://nodejs.org), close and reopen the terminal, then run the command again.
- **"That API key was rejected":** copy the key again from your MV Travel account and make sure there are no extra spaces.
- **The app doesn't show MV Travel:** fully quit and reopen the app. If it still doesn't appear, run the command again and check the summary at the end.
- Every config file is backed up before it's changed (`*.mv-travel-backup-*` next to the file).

---

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
- 📄 **Complete Pagination**: Advanced API batching for comprehensive results
- 🔄 **Universal Compatibility**: Tested with LM Studio (gpt-oss 20B), Claude Desktop App, Augment Code, Cline.bot
- 🧠 **Intelligent Search**: Comma-separated location parsing, resort/region ID-based search, destination prioritization

---

## 🛠️ **Available Tools**

### **🔍 Core Search Tools**
| Tool | Description | Use Case |
|------|-------------|----------|
| `search_accommodations` | Main search with intelligent location resolution | General accommodation searches (first batch) |
| `search_accommodations_complete` | Complete search with automatic pagination | Comprehensive results (all available pages) |
| `load_more_accommodations` | Load additional results from pagination URLs | Progressive loading of more results |

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
- ✅ Use complete pagination to collect all available results
- ✅ Filter for specific amenities (pools, spa, wellness, etc.)
- ✅ Provide direct booking links with real-time pricing
- ✅ Include proximity to attractions and activity information

---

## 🌍 **Supported Destinations**

### **🏔️ Year-Round Mountain & Coastal Destinations**
- 🇦🇹 **Austria**: Innsbruck, Kitzbühel, St. Anton, Saalbach, Zell am See, Bad Gastein, Lech (Tirol region)
- 🇮🇹 **Italy**: Madonna di Campiglio, Cortina, Val Gardena, Livigno, Bormio, Lake Garda Nord, Cervinia, Courmayeur (Trentino, Dolomites)
- 🇫🇷 **France**: Chamonix, Val d'Isère, Tignes, Courchevel, Méribel, Val Thorens, Alpe d'Huez, Morzine (French Alps)
- 🇨🇭 **Switzerland**: Zermatt, Verbier, St. Moritz, Davos, Crans Montana, Saas-Fee, Grindelwald
- 🇭🇷 **Croatia**: Umag, Rovinj, Pula, Opatija, Dubrovnik, Split, Hvar, Zadar, Makarska (full Istria & Dalmatia)
- 🇸🇮 **Slovenia**: Bled, Bohinj, Portorož, Piran, Maribor, Kranjska Gora (mountain & coastal)
- 🇧🇦 **Bosnia**: Jahorina, Bjelašnica - Mountain tourism

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

---

## 📄 **Pagination Support**

### **🚀 Complete Results Collection**
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
- **API Integration**: Cloudflare Worker orchestration layer
- **Location Intelligence**: 150+ verified static mappings using resort/skiarea/region/city IDs
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
4. **Generate your API key** - You'll receive an API key
5. **Copy the key** and paste it into the installer when it asks

### **🔒 Security Note**
- Keep your API key secure and never share it publicly
- The API key provides access to MV Travel's booking system
- Each key is tied to your account for billing and usage tracking

For a manual setup, sample configs are in [`mcp-configs/`](mcp-configs/).

---

## 🛠️ **Manual Install (advanced)**

Use this only if you can't run the installer.

1. Download [`mountvacation-mcp-server.js`](https://raw.githubusercontent.com/talirezun/MV-MCP-server/main/server-versions/mountvacation-mcp-server.js). For Cline, use [`mountvacation-mcp-server-cline.js`](https://raw.githubusercontent.com/talirezun/MV-MCP-server/main/server-versions/mountvacation-mcp-server-cline.js) instead.
2. Add this to your app's MCP config. Use the **full path** to the downloaded file, because a relative path won't work:

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

   Claude Desktop's config file is at:
   - **Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux:** `~/.config/Claude/claude_desktop_config.json`
3. Restart the app.

---

## 🔧 **Troubleshooting**

### **Claude Desktop Issues**
The server follows JSON-RPC 2.0 notification handling, so it works with Claude Desktop.

### **Common Solutions**
1. **Restart your MCP client** after configuration changes
2. **Check file paths** in your configuration  
3. **Verify API key** is correctly set in environment variables
4. **Test with command line** for debugging:
   ```bash
   echo '{"jsonrpc": "2.0", "id": 1, "method": "initialize"}' | node server-versions/mountvacation-mcp-server.js
   ```

---

## 🧪 **Development & Testing**

### **Local Testing**
```bash
# Test initialization
echo '{"jsonrpc": "2.0", "id": 1, "method": "initialize"}' | node server-versions/mountvacation-mcp-server.js

# Test tools list  
echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/list"}' | node server-versions/mountvacation-mcp-server.js
```

### **Cloudflare Worker Deployment**
```bash
cd cloudflare-workers
npm install
npm run deploy
```

`npm run deploy` deploys both the main Worker (`mv-travel-mcp`) and the legacy alias (`mountvacation-mcp-final`): `wrangler deploy && wrangler deploy --env legacy`.

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

Client script (v3.x) and Cloudflare Worker (v2.x) are versioned separately.

- **CF Worker v2.2.0** ✅ **Location fixes and honest errors**: Fixes dynamic place lookup crash (Ischgl, Mayrhofen, Kitzbühel, Katschberg, Poreč, Terme Čatež now resolve), "Town, Country" inputs, cross-border filtering for multi-country ski areas, clear authentication errors, "no availability" messages, API key redaction in logs, and caching of non-empty results only. Deployed to `mv-travel-mcp` and the legacy alias `mountvacation-mcp-final`.
- **v3.5.0** ✅ Client script calls `mv-travel-mcp.talirezun.com` and reports serverInfo name `mv-travel-mcp-server`. No action needed for existing users.
- **CF Worker v2.1.0** ✅ **Location resolution fix**: Strategy reordering (resort→city→skiarea→region) + cross-border validation. Prevents incorrect results from multi-country ski areas (e.g., Via Lattea). Fixes Sestriere, Katschberg, Terme Čatež, Obergurgl, Sölden. (shipped to users in v2.2.0)
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

