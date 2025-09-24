# MountVacation MCP Server - Complete Installation Guide

## 🎯 Overview

This guide will help you install the MountVacation MCP Server on any system and connect it to your preferred MCP client.

## 📋 Prerequisites

1. **Node.js** (version 16 or higher)
   - Download from [nodejs.org](https://nodejs.org)
   - Verify installation: `node --version`

2. **MCP Client** (one of the following):
   - Augment Code
   - Claude Desktop
   - LM Studio
   - Cline
   - Any other MCP-compatible client

3. **MountVacation API Key**
   - Get from [MountVacation Developer Portal](https://www.mountvacation.com/api)
   - Or use demo key for testing

## 🚀 Installation Steps

### Step 1: Download the MCP Server

Choose your operating system:

#### macOS/Linux
```bash
# Download to home directory
curl -o ~/mountvacation-mcp-server.js https://raw.githubusercontent.com/talirezun/MV-MCP-server/main/mountvacation-mcp-server.js

# Make executable
chmod +x ~/mountvacation-mcp-server.js

# Verify download
ls -la ~/mountvacation-mcp-server.js
```

#### Windows (PowerShell)
```powershell
# Download to user profile directory
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/talirezun/MV-MCP-server/main/mountvacation-mcp-server.js" -OutFile "$env:USERPROFILE\mountvacation-mcp-server.js"

# Verify download
Get-Item "$env:USERPROFILE\mountvacation-mcp-server.js"
```

### Step 2: Test the Server

Before configuring your MCP client, test that the server works:

#### macOS/Linux
```bash
# Test initialization
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node ~/mountvacation-mcp-server.js
```

#### Windows (PowerShell)
```powershell
# Test initialization
'{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node "$env:USERPROFILE\mountvacation-mcp-server.js"
```

**Expected output**: JSON response with 8 tools listed.

### Step 3: Configure Your MCP Client

#### For Augment Code

1. Open Augment Code
2. Go to Settings → MCP Servers
3. Click "Add Server" or edit your configuration
4. Use the appropriate configuration below:

**macOS/Linux Configuration:**
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

**Windows Configuration:**
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

#### For Claude Desktop

1. Locate your Claude Desktop configuration file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

2. Add the MountVacation server configuration to the file
3. Use the same JSON configuration as above

#### For Other MCP Clients

Follow your client's specific instructions for adding MCP servers, using the configuration above.

### Step 4: Restart and Verify

1. **Restart your MCP client completely**
2. **Check connection status**:
   - Look for a green dot next to "mountvacation"
   - Verify 8 tools are available
3. **Test with a query**:
   > "Find ski accommodations in French Alps for December 15-20, 2025, for 2 adults"

## 🔧 Troubleshooting

### ❌ Red Dot (Connection Failed)

**Check file path:**
```bash
# macOS/Linux - verify file exists
ls -la ~/mountvacation-mcp-server.js

# Windows - verify file exists
Get-Item "$env:USERPROFILE\mountvacation-mcp-server.js"
```

**Check Node.js:**
```bash
node --version
which node  # macOS/Linux
where node  # Windows
```

**Test server directly:**
```bash
# Should return JSON with tools
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node ~/mountvacation-mcp-server.js
```

### ❌ Green Dot but No Tools

1. **Check API key** - Make sure it's valid
2. **Check server response** - Test with command line
3. **Restart client** - Close and reopen completely

### ❌ Wrong Results (Slovenia instead of France)

1. **Remove old configurations** with different names
2. **Use exact configuration** from this guide
3. **Re-download server file** to get latest version
4. **Restart client completely**

## 🎯 Success Criteria

✅ Green dot next to "mountvacation" in MCP client
✅ 8 tools visible and available
✅ Search for "France or Italy" returns French results
✅ Can successfully plan ski vacations

## 📞 Support

If you encounter issues:
1. Follow the troubleshooting steps above
2. Test the server with command line first
3. Check [GitHub Issues](https://github.com/talirezun/MV-MCP-server/issues)
4. Ensure you're using the latest version

---

**🎉 Enjoy planning your ski vacations with MountVacation MCP!**
