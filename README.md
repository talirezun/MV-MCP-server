# MountVacation MCP Server v2.1 🎿

**Enhanced with Multi-Country Search Support**

A Model Context Protocol (MCP) server that provides access to MountVacation's accommodation booking API for European ski destinations and vacation rentals.

## 🚀 What's New in v2.1

- ✅ **Fixed Multi-Country Searches**: "France or Italy" now returns correct French/Italian results (not Slovenia)
- ✅ **Enhanced Location Mapping**: Better coverage for European ski destinations  
- ✅ **8 Comprehensive Tools**: Complete accommodation search and booking functionality
- ✅ **Simple Installation**: One-command setup with copy-paste configuration

## 🛠️ Quick Installation

### Step 1: Download the MCP Server
```bash
curl -o /Users/talirezun/mountvacation-mcp-server.js https://raw.githubusercontent.com/talirezun/MV-MCP-server/main/mountvacation-mcp-server.js
chmod +x /Users/talirezun/mountvacation-mcp-server.js
```

### Step 2: Add MCP Configuration
Copy this configuration to your Augment Code MCP settings:

```json
{
  "mcpServers": {
    "mountvacation": {
      "command": "node",
      "args": ["/Users/your folder/mountvacation-mcp-server.js"],
      "env": {
        "MOUNTVACATION_API_KEY": "your Mount Vacation API Key"
      }
    }
  }
}
```

### Step 3: Restart your Client
You should see a green dot next to "mountvacation" with 8 tools available.

### Step 4: Test It Works
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

### ❌ Still Getting Slovenia Results?

This means you're using the old version. Fix:
1. **Remove old configurations** with different names
2. **Use the exact configuration** above with name "mountvacation"
3. **Restart Augment Code completely**
4. **Test with "Chamonix"** first to verify

### ❌ No Tools Showing?

- Check the path to the server file is correct
- Verify Node.js is installed: `node --version`
- Make script executable: `chmod +x /Users/talirezun/mountvacation-mcp-server.js`

### ❌ Red Dot in MCP Settings?

- The file path might be wrong
- Try downloading the file again with the curl command above
- Check that Node.js is installed and accessible

## 🧪 Command Line Testing

Test the server directly:
```bash
# Test multi-country search
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "search_accommodations", "arguments": {"location": "France or Italy", "arrival_date": "2025-12-15", "departure_date": "2025-12-20", "persons_ages": "30,30", "currency": "EUR", "max_results": 2}}}' | node /Users/talirezun/mountvacation-mcp-server.js
```

**Expected Output**: Should show French accommodations (Chamonix, etc.)

## 📞 Support

If you encounter issues:
1. Check you're using the **v2.1 configuration** above
2. Verify the server works with command line testing above
3. Check [GitHub Issues](https://github.com/talirezun/MV-MCP-server/issues)
4. Ensure you've removed old configurations with different names

## 🔑 API Key Information

The configuration includes a demo API key that works for testing. For production use or higher rate limits, get your own MountVacation API key from the [MountVacation Developer Portal](https://www.mountvacation.com/api).

---

**🎉 Enjoy enhanced multi-country ski vacation search with MountVacation MCP v2.1!**
