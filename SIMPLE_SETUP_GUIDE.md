# 🏔️ MountVacation MCP - Ultra-Simple Setup Guide

**Get European mountain vacation search in your AI chat in under 2 minutes!**

## ✨ What You Get

- 🔍 **Search thousands of accommodations** across European ski resorts and mountain destinations
- 🏨 **Detailed property information** with photos, amenities, and pricing
- 🎿 **Ski resort integration** with slope distances and lift information
- 💰 **Multi-currency pricing** in 30+ currencies
- 🌍 **Multi-language support** (English, German, Italian, French, and more)
- 🔗 **Direct booking links** for instant reservations

## 🚀 Super Simple Setup (2 Steps!)

### Step 1: Download the MCP Bridge (30 seconds)

Open your terminal and run these two commands:

```bash
curl -L -o mountvacation-mcp.js "https://raw.githubusercontent.com/talirezun/MV-MCP-server/main/scripts/standalone-mcp-bridge.js"
chmod +x mountvacation-mcp.js
```

**That's it!** You now have the MountVacation MCP bridge on your computer.

### Step 2: Add to Claude Desktop (1 minute)

1. **Find your Claude Desktop config file:**
   - **Mac**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

2. **Add this configuration** (replace `YOUR_API_KEY_HERE` with your actual API key):

```json
{
  "mcpServers": {
    "mountvacation": {
      "command": "node",
      "args": ["/full/path/to/mountvacation-mcp.js"],
      "env": {
        "MOUNTVACATION_API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```

3. **Update the path**: Replace `/full/path/to/mountvacation-mcp.js` with the actual path where you downloaded the file.

4. **Restart Claude Desktop**

## 🔑 Getting Your API Key

1. Visit [MountVacation.si](https://www.mountvacation.si/)
2. Contact their sales team for API access
3. Receive your unique API key
4. Add it to the config above

## 🧪 Test Your Setup

Ask Claude:

> "Find ski accommodations in Italian Dolomites for 2 people from March 15-22, 2025, with pool and sauna"

You should see detailed accommodation listings with photos, pricing, and booking links!

## 📱 Other AI Clients

### VS Code (Cline)
```json
{
  "mountvacation": {
    "command": "node",
    "args": ["/full/path/to/mountvacation-mcp.js"],
    "env": {
      "MOUNTVACATION_API_KEY": "YOUR_API_KEY_HERE"
    }
  }
}
```

### Cursor
```json
{
  "mcpServers": {
    "mountvacation": {
      "command": "node",
      "args": ["/full/path/to/mountvacation-mcp.js"],
      "env": {
        "MOUNTVACATION_API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```

### LM Studio
```json
{
  "mountvacation": {
    "command": "node",
    "args": ["/full/path/to/mountvacation-mcp.js"],
    "env": {
      "MOUNTVACATION_API_KEY": "YOUR_API_KEY_HERE"
    }
  }
}
```

## 🚨 Troubleshooting

**"Server disconnected" error:**
- Make sure the path to `mountvacation-mcp.js` is correct and absolute
- Check that Node.js is installed: `node --version`
- Restart your AI client after configuration changes

**"API key invalid" error:**
- Verify your API key is correctly set in the `env` section
- Contact MountVacation support to verify your API key status

**"No results found" error:**
- Try different location names (e.g., "Austria" instead of "Austrian Alps")
- Check your internet connection

## 💡 Pro Tips

- **Use specific resort names** for best results: "Madonna di Campiglio", "Val d'Isère", "Zermatt"
- **Include person ages** for accurate pricing: "2 adults and 2 children ages 35,33,12,8"
- **Specify amenities** you want: "with pool", "with sauna", "ski-in ski-out"
- **Set your currency**: "prices in USD" or "prices in GBP"

## 🎯 Example Searches

- "Find luxury ski hotels in Swiss Alps for 4 people in February 2025"
- "Search for family-friendly accommodations in Austrian Tyrol with pool and kids club"
- "Show me budget ski apartments in French Alps under €100 per night"
- "Find accommodations in Italian Dolomites within 500m of ski lifts"

---

**🏔️ Ready to explore European mountain vacations with AI? Your setup should be working in under 2 minutes!**

Need help? Open an issue on [GitHub](https://github.com/talirezun/MV-MCP-server/issues) or contact support.
