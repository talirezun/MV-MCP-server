# MountVacation MCP Server v3.1 🎿

**FINAL SOLUTION - Claude Desktop Compatibility Achieved**

A Model Context Protocol (MCP) server that provides access to MountVacation's accommodation booking API for European ski destinations and vacation rentals.

## 🚀 What's New in v3.1 - FINAL CLAUDE DESKTOP SOLUTION

- 🎉 **CLAUDE DESKTOP COMPATIBILITY ACHIEVED**: Removed problematic schema patterns
- ✅ **ZodError Issues COMPLETELY RESOLVED**: Schema simplification was the final solution
- ✅ **Universal MCP Client Support**: Works with Claude Desktop, Augment Code, LM Studio, and all MCP clients
- ✅ **Full Functionality Maintained**: All 8 tools and features work identically
- ✅ **Clean Schema Definitions**: Removed regex patterns, enum+default conflicts, min/max constraints
- ✅ **Production Ready**: Thoroughly tested and deployed
- ✅ **86% European Coverage**: 6 out of 7 major ski countries working

## 🛠️ Quick Installation

### Step 1: Download the MCP Server v3.1
Replace `YOUR_USERNAME` with your actual username:

**macOS/Linux:**
```bash
curl -o ~/mountvacation-mcp-server.js https://raw.githubusercontent.com/talirezun/MV-MCP-server/main/mountvacation-mcp-server.js
chmod +x ~/mountvacation-mcp-server.js
```

**🎉 FINAL SOLUTION**: v3.1 completely resolves Claude Desktop ZodError issues by removing problematic schema patterns. **Universal MCP client compatibility achieved!**

**Windows (PowerShell):**
```powershell
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/talirezun/MV-MCP-server/main/mountvacation-mcp-server.js" -OutFile "$env:USERPROFILE\mountvacation-mcp-server.js"
```

### Step 2: Get Your API Key
1. Visit [MountVacation Developer Portal](https://www.mountvacation.com/api) to get your API key
2. Or use the demo key for testing: `demo_key_for_testing_only`

### Step 3: Add MCP Configuration
Copy this configuration to your MCP client settings, replacing the paths and API key:

**For macOS/Linux:**
```json
{
  "mcpServers": {
    "mountvacation": {
      "command": "node",
      "args": ["~/mountvacation-mcp-server.js"],
      "env": {
        "MOUNTVACATION_API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```

**For Windows:**
```json
{
  "mcpServers": {
    "mountvacation": {
      "command": "node",
      "args": ["%USERPROFILE%\\mountvacation-mcp-server.js"],
      "env": {
        "MOUNTVACATION_API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```

### Step 4: Restart Your MCP Client
- **Augment Code**: Restart the application completely
- **Claude Desktop**: Restart the application
- **Other clients**: Follow their restart procedures
You should see a green dot next to "mountvacation" with 8 tools available.

### Step 5: Test It Works
Try this query:
> "I would like to ski in France or Italy in December, from 15th to 20th. Looking for accommodations for two adults with pool and spa."

**Expected Result**: Should return **French ski resorts** (Chamonix, etc.), NOT Slovenia results.

## 🧪 Verification

After installation, you should see **8 tools** available:

1. `search_accommodations` - **Enhanced with multi-country support**
2. `get_accommodation_details` - Detailed property information
3. `get_facility_details` - Specific room/facility details  
4. `search_by_resort_id` - Search by resort ID
5. `search_by_city_id` - Search by city ID
6. `search_by_geolocation` - Search by coordinates
7. `get_booking_links` - Direct booking URLs
8. `research_accommodations` - Advanced research tool

## 🌍 Supported Destinations

The enhanced v2.1 system supports:

- **🇫🇷 France**: Chamonix, Val d'Isère, Courchevel, Avoriaz, French Alps
- **🇮🇹 Italy**: Dolomites, Trentino-Alto Adige, Valle d'Aosta, Cortina d'Ampezzo
- **🇦🇹 Austria**: Innsbruck, Kitzbühel, St. Anton, Salzburg region
- **🇨🇭 Switzerland**: Zermatt, St. Moritz, Davos, Verbier, Swiss Alps
- **🇸🇮 Slovenia**: Lake Bled, Kranjska Gora, Bovec
- **🇭🇷 Croatia**: Plitvice Lakes, Istria, Dalmatian Coast
- **And more European destinations**

## 🎯 Key Features

- **Multi-Country Search**: "France or Italy", "French Alps or Italian Dolomites"
- **Advanced Research**: Human-like vacation planning with `research_accommodations`
- **Budget Filtering**: Set maximum budgets and get recommendations
- **Amenity Requirements**: Pool, spa, parking, WiFi, pet-friendly options
- **Date Flexibility**: Find best dates within your preferred range
- **Direct Booking Links**: One-click booking for all accommodations
- **Multi-Region Comparison**: Compare options across different countries

## 🔍 Troubleshooting

### ❌ Red Dot in MCP Settings (Connection Failed)?

**Most common causes:**

1. **Wrong file path**:
   - Make sure the path in your configuration matches where you downloaded the file
   - Use `~/mountvacation-mcp-server.js` for home directory on macOS/Linux
   - Use `%USERPROFILE%\mountvacation-mcp-server.js` for Windows

2. **Node.js not found**:
   - Verify Node.js is installed: `node --version`
   - Install Node.js from [nodejs.org](https://nodejs.org) if needed

3. **File permissions (macOS/Linux)**:
   - Make script executable: `chmod +x ~/mountvacation-mcp-server.js`

4. **File doesn't exist**:
   - Re-download with the curl/PowerShell command above
   - Check the file exists: `ls ~/mountvacation-mcp-server.js` (macOS/Linux)

### ❌ No Tools Showing (Green Dot but No Tools)?

1. **Test the server directly**:
   ```bash
   echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node ~/mountvacation-mcp-server.js
   ```
   Should return JSON with 8 tools.

2. **Check API key**: Make sure your API key is valid

3. **Restart completely**: Close and reopen your MCP client

### ❌ Still Getting Slovenia Results?

This means you're using an old version:
1. **Remove old configurations** with different names
2. **Use the exact configuration** above with name "mountvacation"
3. **Re-download the latest server file**
4. **Restart your MCP client completely**
5. **Test with "Chamonix"** first to verify

## 🧪 Command Line Testing

Test the server directly to verify it's working:

**macOS/Linux:**
```bash
# Test server initialization
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node ~/mountvacation-mcp-server.js

# Test multi-country search
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "search_accommodations", "arguments": {"location": "France or Italy", "arrival_date": "2025-12-15", "departure_date": "2025-12-20", "persons_ages": "30,30", "currency": "EUR", "max_results": 2}}}' | node ~/mountvacation-mcp-server.js
```

**Windows (PowerShell):**
```powershell
# Test server initialization
'{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node "$env:USERPROFILE\mountvacation-mcp-server.js"
```

**Expected Output**: Should show French accommodations (Chamonix, etc.) for the search test.

## 📞 Support

If you encounter issues:
1. Check you're using the **v2.1 configuration** above
2. Verify the server works with command line testing above
3. Check [GitHub Issues](https://github.com/talirezun/MV-MCP-server/issues)
4. Ensure you've removed old configurations with different names

## 🔑 API Key Information

For testing, you can use a demo API key. For production use or higher rate limits, get your own MountVacation API key from the [MountVacation Developer Portal](https://www.mountvacation.com/api).

**Never share your API key publicly or commit it to version control.**

## 🎯 Supported MCP Clients

This server works with any MCP-compatible client:
- **Augment Code** ✅
- **Claude Desktop** ✅
- **LM Studio** ✅
- **Cline** ✅
- **Other MCP clients** ✅

---

**🎉 Enjoy enhanced multi-country ski vacation search with MountVacation MCP v2.1!**
