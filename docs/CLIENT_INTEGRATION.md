# MountVacation MCP Client Integration Guide

This guide shows you how to integrate the MountVacation MCP Server with various AI clients. The server provides comprehensive mountain vacation accommodation search with property links, image galleries, and detailed facility information.

## 🏠 Option 1: Local Python Server (Recommended)

**Requirements:**
- Python 3.8+
- MountVacation API key

✅ **Advantages:**
- Full MCP protocol support with all 3 tools
- Property page URLs and direct booking links
- Rich image galleries with multiple formats
- Detailed accommodation and facility properties
- GPS coordinates and enhanced location data
- Complete feature set with latest API coverage

### Setup

1. Clone the repository:
```bash
git clone https://github.com/talirezun/MV-MCP-server.git
cd MV-MCP-server
```

2. Set up Python environment:
```bash
cd python-fastmcp
pip install -r requirements.txt
```

3. Create `.env` file:
```bash
MOUNTVACATION_API_KEY=your_api_key_here
```

### Claude Desktop

1. Open your Claude Desktop configuration file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

2. Add this configuration:

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

3. Restart Claude Desktop

### VS Code (Cline Extension)

1. Create or edit `.vscode/mcp.json` in your project:

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

2. Restart VS Code

## 🌐 Option 2: Cloud-Hosted Server (No Setup Required!)

**Live Server**: `https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev`
*Note: Custom domain `mcp.blocklabs.technology` will replace this URL once DNS is configured*

✅ **Status**: Fully functional MCP server with JSON-RPC 2.0 support

### Claude Desktop (Cloud Configuration)

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

**Setup Steps:**
1. Clone: `git clone https://github.com/talirezun/MV-MCP-server.git`
2. Update the path above to your actual repository path
3. Add config to `~/Library/Application Support/Claude/claude_desktop_config.json`
4. Restart Claude Desktop

**Benefits:**
- ✅ **No API keys required** - Server handles authentication
- ✅ **No local setup** - Just clone and configure
- ✅ **Always up-to-date** - Automatically maintained
- ✅ **Global performance** - Cloudflare edge network

## 🧪 Testing

After setup, test by asking your AI assistant:

> "Search for ski accommodations in Madonna di Campiglio for January 2026, 2 adults, 7 nights"

## 🔧 Troubleshooting

### Common Issues

1. **"Command not found"**: Ensure Node.js is installed for deployed server option
2. **"Module not found"**: For local setup, ensure Python dependencies are installed
3. **"API Error"**: Check your API key is correct (local setup only)

### Getting Help

- Check the [main README](../README.md)
- Open an [issue](https://github.com/talirezun/MV-MCP-server/issues)
- Review example configurations in [`client-configs/`](../client-configs/)
