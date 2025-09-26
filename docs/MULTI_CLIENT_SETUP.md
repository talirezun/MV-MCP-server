# 🔧 Multi-Client Setup Guide - MountVacation MCP Server

This guide provides configuration snippets for using the MountVacation MCP Server with different AI clients and LLM interfaces.

## 📋 Prerequisites

**For ALL clients, you need:**

1. **Download the MCP bridge** (one-time setup):
   ```bash
   curl -L -o mountvacation-mcp.js "https://raw.githubusercontent.com/talirezun/MV-MCP-server/main/scripts/standalone-mcp-bridge.js"
   chmod +x mountvacation-mcp.js
   ```

2. **Get your MountVacation API key** from [MountVacation.si](https://www.mountvacation.si/)

3. **Note the full path** to your downloaded `mountvacation-mcp.js` file

---

## 🤖 Client Configurations

### 1. **Claude Desktop** (Anthropic)

**Config file location:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

**Configuration:**
```json
{
  "mcpServers": {
    "mountvacation": {
      "command": "node",
      "args": ["/full/path/to/mountvacation-mcp.js"],
      "env": {
        "MOUNTVACATION_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

**Setup steps:**
1. Open Claude Desktop config file
2. Add the configuration above
3. Replace `/full/path/to/mountvacation-mcp.js` with actual path
4. Replace `your_api_key_here` with your actual API key
5. Restart Claude Desktop

---

### 2. **LM Studio**

LM Studio supports MCP through its server configuration.

**Configuration:**
```json
{
  "servers": {
    "mountvacation": {
      "command": "node",
      "args": ["/full/path/to/mountvacation-mcp.js"],
      "env": {
        "MOUNTVACATION_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

**Setup steps:**
1. Open LM Studio
2. Go to Settings → MCP Servers
3. Add new server with the configuration above
4. Replace paths and API key as needed
5. Restart LM Studio

---

### 3. **Cline** (VS Code Extension)

Cline (formerly Claude Dev) can use MCP servers through VS Code settings.

**VS Code settings.json:**
```json
{
  "cline.mcpServers": {
    "mountvacation": {
      "command": "node",
      "args": ["/full/path/to/mountvacation-mcp.js"],
      "env": {
        "MOUNTVACATION_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

**Setup steps:**
1. Open VS Code
2. Go to Settings (Cmd/Ctrl + ,)
3. Search for "cline mcp"
4. Add the configuration to settings.json
5. Reload VS Code window

---

### 4. **Open WebUI**

For Open WebUI installations that support MCP.

**Configuration file** (usually `config.json`):
```json
{
  "mcp": {
    "servers": {
      "mountvacation": {
        "command": "node",
        "args": ["/full/path/to/mountvacation-mcp.js"],
        "env": {
          "MOUNTVACATION_API_KEY": "your_api_key_here"
        }
      }
    }
  }
}
```

---

### 5. **Continue** (VS Code Extension)

For Continue extension that supports MCP.

**Continue config** (`~/.continue/config.json`):
```json
{
  "mcpServers": [
    {
      "name": "mountvacation",
      "command": "node",
      "args": ["/full/path/to/mountvacation-mcp.js"],
      "env": {
        "MOUNTVACATION_API_KEY": "your_api_key_here"
      }
    }
  ]
}
```

---

### 6. **Generic MCP Client**

For any MCP-compatible client:

**Standard MCP configuration:**
```json
{
  "name": "mountvacation",
  "command": "node",
  "args": ["/full/path/to/mountvacation-mcp.js"],
  "env": {
    "MOUNTVACATION_API_KEY": "your_api_key_here"
  }
}
```

---

## 🔧 Environment Variables

### Alternative Setup Methods

**Option 1: System Environment Variable**
```bash
export MOUNTVACATION_API_KEY="your_api_key_here"
```

**Option 2: .env File**
Create `.env` file in the same directory as `mountvacation-mcp.js`:
```
MOUNTVACATION_API_KEY=your_api_key_here
```

**Option 3: Direct in Config** (shown in examples above)
```json
"env": {
  "MOUNTVACATION_API_KEY": "your_api_key_here"
}
```

---

## ✅ Verification

After setup, test your configuration:

1. **Restart your AI client**
2. **Ask a test question**: "Find ski hotels in Madonna di Campiglio for December 2024"
3. **Check for tools**: The client should show MountVacation tools available
4. **Verify results**: You should get accommodation results with booking links

---

## 🛠️ Troubleshooting

### Common Issues:

**❌ "Command not found" error:**
- Verify Node.js is installed: `node --version`
- Check the full path to `mountvacation-mcp.js`
- Ensure file has execute permissions: `chmod +x mountvacation-mcp.js`

**❌ "API key required" error:**
- Verify your API key is correct
- Check environment variable is set properly
- Ensure no extra spaces in the API key

**❌ "No results found" error:**
- Try different location names (e.g., "Madonna di Campiglio" instead of "Campiglio")
- Check dates are in the future
- Verify person ages format: "35,32,8,5"

**❌ Client doesn't recognize MCP server:**
- Restart the client completely
- Check config file syntax (valid JSON)
- Verify config file location is correct

---

## 📞 Support

- **GitHub Issues**: [MV-MCP-server Issues](https://github.com/talirezun/MV-MCP-server/issues)
- **MountVacation API**: [MountVacation.si](https://www.mountvacation.si/)
- **MCP Protocol**: [Model Context Protocol](https://modelcontextprotocol.io/)

---

## 🔄 Updates

**Do I need to reinstall?**
- **MCP Bridge**: No, the existing `mountvacation-mcp.js` file works with server updates
- **Config**: No changes needed to client configurations
- **API Key**: Same API key continues to work

The MCP bridge automatically connects to the latest server version deployed on Cloudflare Workers.
