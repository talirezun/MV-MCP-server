# MountVacation MCP Client Integration Guide

This guide provides **copy-paste configurations** for integrating the MountVacation MCP server with all major AI clients. Choose between **cloud-hosted** (no setup required) or **local** deployment options.

## 🌐 Cloud-Hosted Integration (Recommended)

**Zero setup required!** Use our production Cloudflare Workers deployment for instant access to European accommodation search.

**Benefits:**
- ✅ **No API key required** for testing
- ✅ **No local installation** needed
- ✅ **Always up-to-date** with latest features
- ✅ **Global performance** via Cloudflare edge network
- ✅ **Enterprise reliability** with 99.9% uptime

### Claude Desktop (Cloud-Hosted)

**Step 1:** Clone the repository
```bash
git clone https://github.com/talirezun/MV-MCP-server.git
```

**Step 2:** Add to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "mountvacation": {
      "command": "node",
      "args": ["/full/path/to/MV-MCP-server/scripts/mcp-cloud-bridge.js"]
    }
  }
}
```

**Step 3:** Update the path to your actual repository location and restart Claude Desktop.

### VS Code (Cline) - Cloud-Hosted

Add to your Cline MCP configuration:
```json
{
  "mountvacation": {
    "command": "node",
    "args": ["mcp-cloud-bridge.js"],
    "cwd": "/full/path/to/MV-MCP-server/scripts"
  }
}
```

### Cursor - Cloud-Hosted

Add to your Cursor MCP settings:
```json
{
  "mcpServers": {
    "mountvacation": {
      "command": "node",
      "args": ["/full/path/to/MV-MCP-server/scripts/mcp-cloud-bridge.js"]
    }
  }
}
```

## 🔐 Production with Your API Key

For production use with your own MountVacation API key:

### Get Your MountVacation API Key
1. Visit [MountVacation.si](https://www.mountvacation.si/)
2. Contact their sales team for API access
3. Receive your unique API key

### Claude Desktop (Production)

```json
{
  "mcpServers": {
    "mountvacation": {
      "command": "node",
      "args": ["/full/path/to/MV-MCP-server/scripts/mcp-cloud-bridge-with-auth.js"],
      "env": {
        "MOUNTVACATION_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### VS Code (Cline) - Production

```json
{
  "mountvacation": {
    "command": "node",
    "args": ["mcp-cloud-bridge-with-auth.js"],
    "cwd": "/full/path/to/MV-MCP-server/scripts",
    "env": {
      "MOUNTVACATION_API_KEY": "your_api_key_here"
    }
  }
}
```

### Cursor - Production

```json
{
  "mcpServers": {
    "mountvacation": {
      "command": "node",
      "args": ["/full/path/to/MV-MCP-server/scripts/mcp-cloud-bridge-with-auth.js"],
      "env": {
        "MOUNTVACATION_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## 🐍 Local Python Server (Advanced)

For developers who prefer local deployment:

### Prerequisites
- Python 3.8+
- pip package manager

### Setup
```bash
git clone https://github.com/talirezun/MV-MCP-server.git
cd MV-MCP-server/python-fastmcp
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Claude Desktop (Local Python)

```json
{
  "mcpServers": {
    "mountvacation": {
      "command": "python",
      "args": ["/full/path/to/MV-MCP-server/python-fastmcp/mountvacation_mcp.py"],
      "env": {
        "MOUNTVACATION_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### VS Code (Cline) - Local Python

```json
{
  "mountvacation": {
    "command": "python",
    "args": ["mountvacation_mcp.py"],
    "cwd": "/full/path/to/MV-MCP-server/python-fastmcp",
    "env": {
      "MOUNTVACATION_API_KEY": "your_api_key_here"
    }
  }
}
```

## 🔧 Additional Client Support

### LM Studio

Add to your LM Studio MCP configuration:
```json
{
  "mountvacation": {
    "command": "node",
    "args": ["/full/path/to/MV-MCP-server/scripts/mcp-cloud-bridge.js"]
  }
}
```

### Continue.dev

Add to your `.continue/config.json`:
```json
{
  "mcpServers": {
    "mountvacation": {
      "command": "node",
      "args": ["/full/path/to/MV-MCP-server/scripts/mcp-cloud-bridge.js"]
    }
  }
}
```

### Open WebUI

Configure in your Open WebUI MCP settings:
```json
{
  "mountvacation": {
    "command": "node",
    "args": ["/full/path/to/MV-MCP-server/scripts/mcp-cloud-bridge.js"]
  }
}
```

### Aider

Use with Aider command-line:
```bash
aider --mcp-server "node /full/path/to/MV-MCP-server/scripts/mcp-cloud-bridge.js"
```

## 🧪 Testing Your Setup

### 1. Basic Connection Test
Ask your AI assistant:
> "Are you connected to the MountVacation MCP server?"

### 2. Simple Search Test
> "Find accommodations in Austria for March 2025"

### 3. Advanced Feature Test
> "Search for ski accommodations in Italian Dolomites for 4 people, ages 35,33,12,8, from March 15-22, 2025, with pool and sauna"

### 4. Expected Results
You should see:
- ✅ European accommodation listings
- ✅ Property photos and details
- ✅ Direct booking links
- ✅ GPS coordinates and amenities
- ✅ Multi-currency pricing

## 🚨 Troubleshooting

### Common Issues

**"Server disconnected" error:**
- Ensure the path to the script is correct and absolute
- Check that Node.js is installed and accessible
- Restart your AI client after configuration changes

**"No results found" error:**
- Try different location names (e.g., "Austria" instead of "Austrian Alps")
- Check your internet connection
- Verify the MountVacation API is accessible

**"API key invalid" error:**
- Ensure your API key is correctly set in environment variables
- Contact MountVacation support to verify your API key status
- Try using the cloud-hosted version without API key first

### Getting Help

1. **Check logs** in your AI client for detailed error messages
2. **Test the server directly** using the health check endpoint
3. **Review configuration** files for syntax errors
4. **Open an issue** on GitHub with your configuration and error details

## 📖 Next Steps

- **[API Documentation](API_DOCUMENTATION.md)** - Complete tool reference
- **[Production Setup Guide](../PRODUCTION_SETUP_GUIDE.md)** - Usage examples and best practices
- **[Example Configurations](../client-configs/)** - Ready-to-use config files

---

**🏔️ Ready to explore European mountain vacations with AI? Your setup should be working in under 2 minutes!**
