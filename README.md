# 🏔️ MountVacation MCP Server

A production-ready Model Context Protocol (MCP) server that provides AI assistants with intelligent access to MountVacation's accommodation booking API, specializing in year-round mountain vacations across Europe, spa & terme holidays in Slovenia, and extensive Croatia coverage.

## ✨ **Key Features**

- 🏔️ **Year-Round Mountain Vacations**: All-season mountain accommodations across Europe (skiing, hiking, wellness, spa)
- 🌍 **Comprehensive European Coverage**: 6+ countries with extensive destination coverage
- 🏨 **Spa & Terme Holidays**: Specialized coverage of Slovenia's spa and thermal destinations
- 🇭🇷 **Extensive Croatia Coverage**: Comprehensive accommodation options throughout Croatia
- 👨‍👩‍👧‍👦 **Family Support**: Children pricing, age-based discounts, family room configurations
- 🔗 **Direct Booking**: Real-time pricing with direct booking links
- 📄 **Complete Pagination**: Advanced API batching for comprehensive results (350% more accommodations)
- 🔄 **Universal Compatibility**: Tested with LM Studio (gpt-oss 20B), Claude Desktop App, Augment Code, Cline.bot
- 🧠 **Intelligent Search**: Cross-border discovery, extended area search, destination prioritization

---

## 🏗️ **Server Architecture**

This repository contains multiple server versions optimized for different MCP clients:

### **📁 Server Versions**
- **`/server-versions/mountvacation-mcp-server.js`** - Standard MCP server for most clients
- **`/server-versions/mountvacation-mcp-server-cline.js`** - Optimized for Cline.bot within VS Code
- **`/cloudflare-workers/`** - Cloudflare Workers deployment for production use

### **🔧 Configuration Files**
- **`/mcp-configs/mcp-config.json`** - Generic configuration
- **`/mcp-configs/mcp-config-macos-linux.json`** - macOS/Linux specific
- **`/mcp-configs/mcp-config-windows.json`** - Windows specific
- **`/mcp-configs/mcp-config-for-augment.json`** - Augment Code specific

---

## 🚀 **Quick Start**

### **1. Clone the Repository**
```bash
git clone https://github.com/talirezun/MV-MCP-server.git
cd MV-MCP-server
```

### **2. Choose Your Server Version**
Select the appropriate server file based on your MCP client (see Client-Specific Instructions below).

### **3. Get Your MountVacation API Key**
[Get your API key here](#-get-your-mountvacation-api-key) (see section below for details)

### **4. Configure Your MCP Client**
Use the appropriate configuration file from `/mcp-configs/` or follow the client-specific instructions below.

### **5. Restart Your MCP Client**
The server will be available with 12 comprehensive accommodation search tools including advanced pagination support.

---

## 💻 **Installation Instructions**

### **📋 Prerequisites**
- Node.js (version 14 or higher)
- Your MountVacation API key

### **🍎 macOS Installation**
```bash
# Clone the repository
git clone https://github.com/talirezun/MV-MCP-server.git
cd MV-MCP-server

# Make server executable
chmod +x server-versions/mountvacation-mcp-server.js

# Set up environment variable (add to ~/.zshrc or ~/.bash_profile)
echo 'export MOUNTVACATION_API_KEY="your-api-key-here"' >> ~/.zshrc
source ~/.zshrc

# Test the server
echo '{"jsonrpc": "2.0", "id": 1, "method": "initialize"}' | node server-versions/mountvacation-mcp-server.js
```

### **🐧 Linux Installation**
```bash
# Clone the repository
git clone https://github.com/talirezun/MV-MCP-server.git
cd MV-MCP-server

# Make server executable
chmod +x server-versions/mountvacation-mcp-server.js

# Set up environment variable (add to ~/.bashrc)
echo 'export MOUNTVACATION_API_KEY="your-api-key-here"' >> ~/.bashrc
source ~/.bashrc

# Test the server
echo '{"jsonrpc": "2.0", "id": 1, "method": "initialize"}' | node server-versions/mountvacation-mcp-server.js
```

### **🪟 Windows Installation**
```cmd
# Clone the repository
git clone https://github.com/talirezun/MV-MCP-server.git
cd MV-MCP-server

# Set environment variable (PowerShell)
$env:MOUNTVACATION_API_KEY="your-api-key-here"

# Or set permanently (Command Prompt as Administrator)
setx MOUNTVACATION_API_KEY "your-api-key-here"

# Test the server (PowerShell)
echo '{"jsonrpc": "2.0", "id": 1, "method": "initialize"}' | node server-versions/mountvacation-mcp-server.js
```

## 🔄 **MCP Client Compatibility**

### **✅ Tested and Working**
- **🧠 LM Studio** - gpt-oss 20B model (excellent performance)
- **🤖 Claude Desktop App** - Full compatibility with protocol v3.2.0
- **⚡ Augment Code** - Native integration support
- **🔧 Cline.bot** - VS Code extension (use cline-specific server version)

### **🔜 More Clients Testing**
Additional MCP client testing is ongoing. The server follows MCP protocol standards for universal compatibility.

---

## 📱 **Client-Specific Instructions**

### **🧠 LM Studio Setup**
```bash
# Use standard server version
cp mcp-configs/mcp-config-macos-linux.json ~/.config/lm-studio/mcp-config.json

# Edit the config file to set your API key and correct path
# Path should point to: /path/to/MV-MCP-server/server-versions/mountvacation-mcp-server.js
```

### **🤖 Claude Desktop Setup**
```bash
# macOS
cp mcp-configs/mcp-config-macos-linux.json ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Windows
copy mcp-configs\mcp-config-windows.json %APPDATA%\Claude\claude_desktop_config.json

# Edit the config file to set your API key and correct path
```

### **⚡ Augment Code Setup**
```bash
# Use the Augment-specific configuration
cp mcp-configs/mcp-config-for-augment.json ~/.config/augment/mcp-config.json

# Edit the config file to set your API key and correct path
```

### **🔧 Cline.bot Setup (VS Code)**
```bash
# Use the Cline-specific server version
# In VS Code with Cline extension, configure MCP server:
# Server path: /path/to/MV-MCP-server/server-versions/mountvacation-mcp-server-cline.js
# Environment: MOUNTVACATION_API_KEY=your-api-key-here
```

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

### **🏔️ Year-Round Mountain Destinations**
- 🇦🇹 **Austria**: Tirol, Salzburg regions - Skiing, hiking, wellness (Hotel Goldried, Gradonna Mountain Resort)
- 🇮🇹 **Italy**: Dolomites, Trentino-Alto Adige - All seasons (San Martino di Castrozza, Andalo)
- 🇸🇮 **Slovenia**: Mountain resorts, spa & terme destinations (Kranjska Gora, Bovec, Rogla)
- 🇫🇷 **France**: French Alps, Pyrenees - Winter sports & summer activities (Les Menuires, Val Thorens)
- 🇧🇦 **Bosnia**: Jahorina, Bjelašnica - Mountain tourism (Termag Hotel)
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

### **🔍 Partial Coverage**
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

## 🔑 **Get Your MountVacation API Key**

To use this MCP server, you need a valid MountVacation API key:

### **📝 How to Obtain Your API Key**
1. **Visit MountVacation.si** - [Get your API key here](https://www.mountvacation.si/) *(Link will be added manually)*
2. **Register or Login** to your MountVacation account
3. **Navigate to API section** in your account dashboard
4. **Generate your API key** - You'll receive a 64-character key
5. **Copy the key** and use it in your MCP client configuration

### **🔒 Security Note**
- Keep your API key secure and never share it publicly
- The API key provides access to MountVacation's booking system
- Each key is tied to your account for billing and usage tracking

### **⚙️ Configuration**
Use your API key in any of the provided configuration files:
- **Generic**: `mcp-config.json`
- **macOS/Linux**: `mcp-config-macos-linux.json`
- **Windows**: `mcp-config-windows.json`
- **Augment Code**: `mcp-config-for-augment.json`

---

## 🎥 **Video Demonstration**

Watch our comprehensive video guide showing the MountVacation MCP Server in action:

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

## ⚠️ **Disclaimer**

### **🧪 Experimental Software**
This MCP server is experimental software provided "as is" without any warranties. Users should be aware of the following:

### **📋 Liability Limitations**
- **Code Author**: The author of this code is not liable for any damages, issues, or problems arising from the use of this software
- **MountVacation**: MountVacation.si is not liable for any issues related to this third-party integration
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
