# MountVacation MCP Client Configurations

**Ultra-simple setup** - just download one file and copy-paste the configuration. No repository cloning required!

## 🚀 One-File Setup

### **Step 1: Download the Bridge Script**

**Method A: Direct Download (Recommended)**
```bash
curl -L -o mountvacation-mcp.js "https://github.com/talirezun/MV-MCP-server/raw/main/scripts/standalone-mcp-bridge.js"
chmod +x mountvacation-mcp.js
```

**Method B: If Method A doesn't work**
```bash
git clone --depth 1 https://github.com/talirezun/MV-MCP-server.git temp-download
cp temp-download/scripts/standalone-mcp-bridge.js ./mountvacation-mcp.js
rm -rf temp-download
chmod +x mountvacation-mcp.js
```

### **Step 2: Get Your API Key (Optional)**
- **For testing**: Skip this step, use the configuration as-is
- **For production**:
  1. Visit [MountVacation.si](https://www.mountvacation.si/)
  2. Contact their team for API access
  3. Set your API key: `export MOUNTVACATION_API_KEY="your_api_key_here"`

## 📋 Client Configurations

### **Claude Desktop**

**Copy this into your `claude_desktop_config.json`:**
```json
{
  "mcpServers": {
    "mountvacation": {
      "command": "node",
      "args": ["/full/path/to/your/mountvacation-mcp.js"]
    }
  }
}
```

**With your own API key (production):**
```json
{
  "mcpServers": {
    "mountvacation": {
      "command": "node",
      "args": ["/full/path/to/your/mountvacation-mcp.js"],
      "env": {
        "MOUNTVACATION_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

**Configuration file location:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

### **VS Code (Cline)**

**Basic configuration:**
```json
{
  "mcpServers": {
    "mountvacation": {
      "command": "node",
      "args": ["/full/path/to/your/mountvacation-mcp.js"]
    }
  }
}
```

**With your API key:**
```json
{
  "mcpServers": {
    "mountvacation": {
      "command": "node",
      "args": ["/full/path/to/your/mountvacation-mcp.js"],
      "env": {
        "MOUNTVACATION_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### **Cursor**

**With your API key:**
```json
{
  "mcpServers": {
    "mountvacation": {
      "transport": "http",
      "url": "https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev/mcp",
      "headers": {
        "X-MountVacation-API-Key": "your_api_key_here"
      }
    }
  }
}
```

**Testing mode:**
```json
{
  "mcpServers": {
    "mountvacation": {
      "transport": "http",
      "url": "https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev/mcp"
    }
  }
}
```

### **LM Studio**

**With your API key:**
```json
{
  "mcpServers": {
    "mountvacation": {
      "transport": "http",
      "url": "https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev/mcp",
      "headers": {
        "X-MountVacation-API-Key": "your_api_key_here"
      }
    }
  }
}
```

### **Continue.dev**

Add to your `.continue/config.json`:
```json
{
  "mcpServers": {
    "mountvacation": {
      "transport": "http",
      "url": "https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev/mcp",
      "headers": {
        "X-MountVacation-API-Key": "your_api_key_here"
      }
    }
  }
}
```

### **Open WebUI**

Configure in your Open WebUI MCP settings:
```json
{
  "mountvacation": {
    "transport": "http",
    "url": "https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev/mcp",
    "headers": {
      "X-MountVacation-API-Key": "your_api_key_here"
    }
  }
}
```

### **Aider**

Use with Aider command-line:
```bash
aider --mcp-server "http://blocklabs-mountvacation-mcp-production.4thtech.workers.dev/mcp" \
      --mcp-header "X-MountVacation-API-Key: your_api_key_here"
```

## 🧪 Testing Your Setup

### 1. **Basic Connection Test**
Ask your AI assistant:
> "Are you connected to the MountVacation MCP server?"

### 2. **Simple Search Test**
> "Find accommodations in Austria for March 2025"

### 3. **Advanced Feature Test**
> "Search for ski accommodations in Italian Dolomites for 4 people, ages 35,33,12,8, from March 15-22, 2025, with pool and sauna"

### 4. **Expected Results**
You should see:
- ✅ European accommodation listings
- ✅ Property photos and details  
- ✅ Direct booking links
- ✅ GPS coordinates and amenities
- ✅ Multi-currency pricing

## 🚨 Troubleshooting

### **Common Issues**

**"Connection failed" error:**
- Check your internet connection
- Verify the URL is correct
- Try the testing mode without API key first

**"Invalid API key" error:**
- Ensure your API key is correctly formatted
- Contact MountVacation support to verify your key
- Try using testing mode to isolate the issue

**"No results found" error:**
- Try different location names (e.g., "Austria" instead of "Austrian Alps")
- Check that the MountVacation API is accessible
- Verify your search parameters are valid

### **Getting Help**

1. **Check client logs** for detailed error messages
2. **Test the server directly**: Visit `https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev/health`
3. **Try testing mode** without API key to isolate authentication issues
4. **Open an issue** on GitHub with your configuration and error details

## ✨ What You Get

### **6 Comprehensive Tools**
1. **search_accommodations** - Main search with location/geolocation
2. **get_accommodation_details** - Complete property information
3. **get_facility_details** - Room-specific details
4. **search_by_resort_id** - Resort-based search
5. **search_by_city_id** - City-based search
6. **search_by_geolocation** - GPS coordinate search

### **Complete European Coverage**
- **🇸🇮 Slovenia** - Lake Bled, Kranjska Gora, Julian Alps
- **🇭🇷 Croatia** - Plitvice Lakes, Istria, Dalmatian Coast
- **🇮🇹 Italy** - Dolomites, Trentino-Alto Adige, Valle d'Aosta
- **🇦🇹 Austria** - Tyrol, Salzburg, Austrian Alps
- **🇨🇭 Switzerland** - Valais, Graubünden, Swiss Alps
- **🇫🇷 France** - French Alps, Pyrenees, Provence
- **🇪🇸 Spain** - Pyrenees, Picos de Europa, Sierra Nevada
- **🇩🇪 Germany** - Bavarian Alps, Black Forest, Harz Mountains
- **And more** - All MountVacation destinations

### **Rich Property Data**
- **Photos & Galleries** - Property images and virtual tours
- **Booking Links** - Direct booking with pre-filled dates
- **GPS Coordinates** - Exact location data
- **Amenities** - Pool, spa, ski-in/ski-out, WiFi, parking
- **Pricing** - Multi-currency with real-time rates
- **Availability** - Live booking status

---

**🏔️ Ready to explore European mountain vacations with AI? Just copy, paste, and start searching!**
