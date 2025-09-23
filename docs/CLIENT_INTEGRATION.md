# MountVacation MCP Client Integration Guide

This guide shows you how to integrate the MountVacation MCP Server with various AI clients.

## 🏠 Option 1: Local Python Server (Recommended)

**Requirements:**
- Python 3.8+
- MountVacation API key

✅ **Advantages:**
- Full MCP protocol support
- Tested and working
- Direct API integration
- Complete feature set

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

## 🌐 Option 2: Deployed Server (Experimental)

**Live Server**: `https://mountvacation-mcp.4thtech.workers.dev`

⚠️ **Status**: MCP protocol implementation in development

✅ **Working**: Health check endpoint
⚠️ **In Progress**: Full MCP JSON-RPC support

*Use local Python server for production integration*

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
