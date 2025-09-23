# MountVacation MCP - Production Setup Guide

## 🌍 **Complete European Accommodation Search**

MountVacation MCP provides access to the **complete MountVacation database** covering accommodations across **all of Europe** - not just ski resorts! Search for hotels, apartments, chalets, and vacation rentals in any European destination.

### **🏨 What You Can Search For:**
- **🎿 Ski Resorts**: French Alps, Italian Dolomites, Austrian Alps, Swiss mountains
- **🏖️ Beach Destinations**: Mediterranean coast, Atlantic shores, lake resorts
- **🏛️ City Breaks**: Paris, Rome, Vienna, Prague, Amsterdam, Barcelona
- **🏔️ Mountain Retreats**: Hiking areas, wellness resorts, nature lodges
- **🍷 Wine Regions**: Tuscany, Bordeaux, Rhine Valley, Douro Valley
- **🏰 Historic Towns**: Medieval cities, castle regions, cultural destinations

---

## 🚀 **Two Setup Options**

### **Option 1: MVP Setup (No API Key Required)**
Perfect for testing and immediate use. Uses shared server resources.

### **Option 2: Production Setup (Your API Key)**
Recommended for regular use. Uses your personal MountVacation API key for better rate limits and dedicated access.

---

## 🎯 **MVP Setup (Instant Access)**

**Perfect for:** Testing, demos, occasional use

### **Step 1: Download Bridge Script**
```bash
curl -o mcp-mountvacation.js https://raw.githubusercontent.com/talirezun/MV-MCP-server/main/scripts/mcp-cloud-bridge.js
```

### **Step 2: Configure Your MCP Client**

**Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "mountvacation": {
      "command": "node",
      "args": ["/path/to/mcp-mountvacation.js"]
    }
  }
}
```

**LM Studio** (`~/.config/lmstudio/mcp_config.json`):
```json
{
  "mcpServers": {
    "mountvacation": {
      "command": "node",
      "args": ["/path/to/mcp-mountvacation.js"]
    }
  }
}
```

### **Step 3: Test**
Restart your client and try: *"Find accommodations in Paris for 2 adults from March 15-20, 2026"*

---

## 🔑 **Production Setup (Recommended)**

**Perfect for:** Regular use, better performance, dedicated access

### **Step 1: Get Your API Key**
1. Visit: **[https://mountvacation.com/api](https://mountvacation.com/api)**
2. Sign up for a MountVacation account
3. Generate your personal API key
4. Keep it secure!

### **Step 2: Download Production Bridge Script**
```bash
curl -o mcp-mountvacation-auth.js https://raw.githubusercontent.com/talirezun/MV-MCP-server/main/scripts/mcp-cloud-bridge-with-auth.js
```

### **Step 3: Configure Your API Key**

**Method A: Edit the file directly**
```bash
# Edit the downloaded file
nano mcp-mountvacation-auth.js

# Replace this line:
const API_KEY = process.env.MOUNTVACATION_API_KEY || 'YOUR_API_KEY_HERE';

# With your actual API key:
const API_KEY = process.env.MOUNTVACATION_API_KEY || 'your_actual_api_key_here';
```

**Method B: Use environment variable**
```bash
export MOUNTVACATION_API_KEY="your_actual_api_key_here"
```

### **Step 4: Configure Your MCP Client**

**Claude Desktop**:
```json
{
  "mcpServers": {
    "mountvacation": {
      "command": "node",
      "args": ["/path/to/mcp-mountvacation-auth.js"],
      "env": {
        "MOUNTVACATION_API_KEY": "your_actual_api_key_here"
      }
    }
  }
}
```

**LM Studio**:
```json
{
  "mcpServers": {
    "mountvacation": {
      "command": "node",
      "args": ["/path/to/mcp-mountvacation-auth.js"],
      "env": {
        "MOUNTVACATION_API_KEY": "your_actual_api_key_here"
      }
    }
  }
}
```

**Continue.dev**:
```json
{
  "mcpServers": [
    {
      "name": "mountvacation",
      "command": "node",
      "args": ["/path/to/mcp-mountvacation-auth.js"],
      "env": {
        "MOUNTVACATION_API_KEY": "your_actual_api_key_here"
      }
    }
  ]
}
```

---

## 🧪 **Testing Your Setup**

### **Basic Test Queries:**

1. **European Cities:**
   - *"Find hotels in Barcelona for 2 adults, March 10-15, 2026"*
   - *"Search for apartments in Prague for a family of 4, July 2026"*

2. **Ski Destinations:**
   - *"Find ski accommodations in French Alps for January 2026"*
   - *"Search for chalets in Austrian ski resorts with spa facilities"*

3. **Beach & Coastal:**
   - *"Find beachfront hotels on the French Riviera for summer 2026"*
   - *"Search for coastal accommodations in Portugal for 2 weeks"*

4. **Wine & Cultural Regions:**
   - *"Find accommodations in Tuscany wine region with vineyard views"*
   - *"Search for hotels in Rhine Valley, Germany for wine tours"*

### **Expected Results:**
- ✅ **Diverse accommodation types**: Hotels, apartments, chalets, B&Bs
- ✅ **Complete European coverage**: All countries and regions
- ✅ **Rich details**: Amenities, pricing, photos, booking links
- ✅ **Multiple currencies**: EUR, USD, GBP, CHF, etc.
- ✅ **Direct booking**: Property pages and reservation URLs

---

## 🌍 **Supported Destinations**

### **Major Countries & Regions:**
- 🇫🇷 **France**: Paris, Lyon, French Alps, Provence, Normandy, Loire Valley
- 🇮🇹 **Italy**: Rome, Florence, Venice, Tuscany, Italian Dolomites, Amalfi Coast
- 🇩🇪 **Germany**: Berlin, Munich, Rhine Valley, Black Forest, Bavarian Alps
- 🇦🇹 **Austria**: Vienna, Salzburg, Innsbruck, Austrian Alps, Hallstatt
- 🇨🇭 **Switzerland**: Zurich, Geneva, Swiss Alps, Interlaken, Zermatt
- 🇪🇸 **Spain**: Madrid, Barcelona, Seville, Costa del Sol, Balearic Islands
- 🇵🇹 **Portugal**: Lisbon, Porto, Algarve, Douro Valley, Azores
- 🇳🇱 **Netherlands**: Amsterdam, Rotterdam, Keukenhof, Giethoorn
- 🇧🇪 **Belgium**: Brussels, Bruges, Ghent, Antwerp
- 🇨🇿 **Czech Republic**: Prague, Český Krumlov, Karlovy Vary
- 🇭🇺 **Hungary**: Budapest, Lake Balaton, Eger
- 🇵🇱 **Poland**: Krakow, Warsaw, Zakopane, Gdansk
- 🇸🇮 **Slovenia**: Ljubljana, Lake Bled, Piran, Julian Alps
- 🇭🇷 **Croatia**: Dubrovnik, Split, Plitvice Lakes, Istria

### **Accommodation Types:**
- 🏨 **Hotels**: Luxury, boutique, business, budget
- 🏠 **Apartments**: City centers, vacation rentals, serviced apartments
- 🏔️ **Chalets**: Ski chalets, mountain lodges, alpine retreats
- 🏰 **Historic Properties**: Castles, palaces, manor houses
- 🍷 **Wine Estates**: Vineyard accommodations, wine hotels
- 🌊 **Coastal Properties**: Beachfront hotels, seaside villas
- 🧘 **Wellness Resorts**: Spa hotels, thermal baths, wellness retreats

---

## 🛠️ **Troubleshooting**

### **"API key not configured" Error**
- Check your API key is set correctly
- Verify no extra spaces or quotes
- Test: `echo $MOUNTVACATION_API_KEY`

### **"No results found" Error**
- Try broader search terms (e.g., "France" instead of specific city)
- Check date format: YYYY-MM-DD
- Verify location spelling

### **"Server disconnected" Error**
- Restart your MCP client
- Check file path is absolute and correct
- Ensure Node.js is installed: `node --version`

---

## 📞 **Support & Resources**

- **🐛 Issues**: [GitHub Issues](https://github.com/talirezun/MV-MCP-server/issues)
- **📚 Documentation**: [Full Guide](https://github.com/talirezun/MV-MCP-server)
- **🔑 API Key**: [Get Your Key](https://mountvacation.com/api)
- **🌐 MountVacation**: [Official Website](https://mountvacation.com)

**Access the complete European accommodation database with just a few lines of configuration!** 🎉
