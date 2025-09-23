# Claude Desktop Setup - Cloud-Based MountVacation MCP

## 🌐 **100% Cloud-Based Setup (No Local Server Required)**

This guide shows you how to connect Claude Desktop to the cloud-hosted MountVacation MCP server. **No API keys, no local setup, no dependencies required!**

### **✅ What You Get**
- **Instant Access**: Connect to production server immediately
- **No Setup**: No API keys or local installation needed
- **Full Features**: Property links, image galleries, detailed accommodation info
- **Italian Ski Specialization**: Optimized for Italian Dolomites and ski destinations
- **Global Performance**: Sub-3-second response times worldwide

---

## 🚀 **Quick Setup (2 Minutes)**

### **Step 1: Download the Cloud Bridge**

1. **Clone or download** this repository:
   ```bash
   git clone https://github.com/talirezun/MV-MCP-server.git
   ```

2. **Note the path** to the cloud bridge file:
   ```
   /path/to/MV-MCP-server/scripts/mcp-cloud-bridge.js
   ```

### **Step 2: Configure Claude Desktop**

1. **Open your Claude Desktop configuration file:**
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

2. **Add this configuration** (replace `/path/to/` with your actual path):

```json
{
  "mcpServers": {
    "mountvacation": {
      "command": "node",
      "args": [
        "/path/to/MV-MCP-server/scripts/mcp-cloud-bridge.js"
      ]
    }
  }
}
```

**Example for your setup:**
```json
{
  "mcpServers": {
    "mountvacation": {
      "command": "node",
      "args": [
        "/Users/talirezun/MV-MCP-server/scripts/mcp-cloud-bridge.js"
      ]
    }
  }
}
```

### **Step 3: Restart Claude Desktop**

1. **Quit Claude Desktop** completely
2. **Restart Claude Desktop**
3. **Verify connection** - you should see the MountVacation MCP server available

---

## 🧪 **Test Your Setup**

Try this message in Claude Desktop:

```
Use mount vacation MCP to help me plan for my skiing vacation. I would like to go to ski in Italy for five days from 15 to 20th of January 2026. I'm looking for a hotel close to the ski slopes with included breakfast and dinner, also car parking and a good hotel like four stars or more with good reviews and nice rooms. Let's try finding something in the range from 200 to 300 euro per night per two people with breakfast and dinner.
```

**Expected Results:**
- ✅ **Italian accommodations** (not Slovenian)
- ✅ **Property page links** for viewing photos and details
- ✅ **Direct booking URLs** with your dates pre-filled
- ✅ **Rich image galleries** with multiple photo formats
- ✅ **Detailed amenities** including pool, wellness, ski access
- ✅ **GPS coordinates** for exact locations

---

## 🎯 **Optimized for Italian Ski Destinations**

The server is specially optimized for Italian ski resorts:

### **🏔️ Major Italian Ski Areas Covered:**
- **Trentino-Alto Adige**: Madonna di Campiglio, Val Gardena, Canazei
- **Veneto**: Cortina d'Ampezzo, Arabba, Alleghe  
- **Valle d'Aosta**: Cervinia, Courmayeur, La Thuile
- **Lombardy**: Livigno, Bormio, Ponte di Legno
- **Piedmont**: Sestriere, Bardonecchia, Sauze d'Oulx

### **🔍 Search Terms That Work Best:**
- `"Madonna di Campiglio"` - Specific resort names
- `"Cortina d'Ampezzo"` - Famous destinations
- `"Italian Dolomites"` - Regional searches
- `"Italy ski resort"` - General Italian skiing
- `"Val Gardena"` - Valley names
- `"Trentino skiing"` - Regional skiing

---

## 🛠️ **Troubleshooting**

### **Problem: "Taking longer than usual" or No Results**

**Solution 1: Check File Path**
- Verify the path to `mcp-cloud-bridge.js` is correct
- Use absolute path (full path from root)
- Check file exists: `ls /path/to/MV-MCP-server/scripts/mcp-cloud-bridge.js`

**Solution 2: Test Cloud Bridge Manually**
```bash
cd /path/to/MV-MCP-server
node scripts/mcp-cloud-bridge.js
```
Then type: `{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}`
You should see a list of 3 tools.

**Solution 3: Check Node.js**
- Ensure Node.js is installed: `node --version`
- Should be v18 or higher

### **Problem: Getting Slovenian Results Instead of Italian**

**✅ FIXED!** The latest version (deployed) now prioritizes Italian destinations:
- Updated location mappings for Italian ski terms
- Improved search strategies for Italian regions
- Reduced geolocation radius to focus on Italian Alps

### **Problem: No Property Links**

**✅ FIXED!** All accommodations now include:
- `property_page_url`: Direct MountVacation property pages
- `reservation_url`: Pre-filled booking links
- `image_gallery`: Rich photo galleries

---

## 🌐 **Technical Details**

### **Cloud Server Information:**
- **URL**: `https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev`
- **Version**: 2.0.0
- **Platform**: Cloudflare Workers (Global Edge Network)
- **Performance**: Sub-3-second response times
- **Uptime**: 99.9% availability

### **Available MCP Tools:**
1. **`search_accommodations`**: Main search with property links and images
2. **`get_accommodation_details`**: Detailed property information
3. **`get_facility_details`**: Room-specific amenities and features

### **Data Sources:**
- **MountVacation API**: Live accommodation data
- **80+ Ski Destinations**: European mountain resorts
- **Real-time Pricing**: Current rates and availability
- **Rich Media**: Property photos and image galleries

---

## 📞 **Support**

If you encounter any issues:

1. **Check the GitHub repository**: [MV-MCP-server](https://github.com/talirezun/MV-MCP-server)
2. **Test the cloud server directly**: Visit the health endpoint
3. **Verify your configuration**: Double-check file paths and JSON syntax

**The setup should work immediately with no additional configuration required!** 🎉
