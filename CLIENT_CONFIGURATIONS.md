# MountVacation MCP Client Configurations

## 🌐 **Cloud-Based Setup for All MCP Clients**

This guide provides copy-paste configuration templates for connecting any MCP client to the cloud-hosted MountVacation MCP server. **No local installation required!**

### **📋 Prerequisites**

1. **Get your MountVacation API Key**:
   - Visit: [https://mountvacation.com/api](https://mountvacation.com/api)
   - Sign up and obtain your API key
   - Keep it secure - you'll need it for the configuration

2. **Download the bridge script**:
   ```bash
   curl -o mcp-mountvacation-bridge.js https://raw.githubusercontent.com/talirezun/MV-MCP-server/main/scripts/mcp-cloud-bridge-with-auth.js
   ```

3. **Set your API key** (choose one method):
   - **Method A**: Edit the downloaded file and replace `YOUR_API_KEY_HERE` with your actual API key
   - **Method B**: Set environment variable: `export MOUNTVACATION_API_KEY="your_api_key_here"`

---

## 🖥️ **Claude Desktop**

**Configuration File Location:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

**Configuration:**
```json
{
  "mcpServers": {
    "mountvacation": {
      "command": "node",
      "args": [
        "/path/to/your/mcp-mountvacation-bridge.js"
      ],
      "env": {
        "MOUNTVACATION_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

**Alternative (if you edited the file directly):**
```json
{
  "mcpServers": {
    "mountvacation": {
      "command": "node",
      "args": [
        "/path/to/your/mcp-mountvacation-bridge.js"
      ]
    }
  }
}
```

---

## 🧠 **LM Studio**

**Configuration File Location:**
- **macOS**: `~/.config/lmstudio/mcp_config.json`
- **Windows**: `%USERPROFILE%\.config\lmstudio\mcp_config.json`
- **Linux**: `~/.config/lmstudio/mcp_config.json`

**Configuration:**
```json
{
  "mcpServers": {
    "mountvacation": {
      "command": "node",
      "args": [
        "/path/to/your/mcp-mountvacation-bridge.js"
      ],
      "env": {
        "MOUNTVACATION_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

---

## 🔧 **Continue.dev**

**Configuration File Location:**
- **macOS**: `~/.continue/config.json`
- **Windows**: `%USERPROFILE%\.continue\config.json`
- **Linux**: `~/.continue/config.json`

**Configuration:**
```json
{
  "mcpServers": [
    {
      "name": "mountvacation",
      "command": "node",
      "args": [
        "/path/to/your/mcp-mountvacation-bridge.js"
      ],
      "env": {
        "MOUNTVACATION_API_KEY": "your_api_key_here"
      }
    }
  ]
}
```

---

## 🤖 **Cline (formerly Claude Dev)**

**Configuration File Location:**
- **VS Code Settings**: Open VS Code → Settings → Extensions → Cline → MCP Servers

**Configuration:**
```json
{
  "cline.mcpServers": {
    "mountvacation": {
      "command": "node",
      "args": [
        "/path/to/your/mcp-mountvacation-bridge.js"
      ],
      "env": {
        "MOUNTVACATION_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

---

## 🐍 **Python MCP Client**

**Configuration:**
```python
import os
from mcp import ClientSession, StdioServerParameters

# Set your API key
os.environ['MOUNTVACATION_API_KEY'] = 'your_api_key_here'

# Configure the server
server_params = StdioServerParameters(
    command="node",
    args=["/path/to/your/mcp-mountvacation-bridge.js"]
)

# Use the client
async with ClientSession(server_params) as session:
    # Your MCP client code here
    pass
```

---

## 🌐 **Generic MCP Client**

For any other MCP client that supports the standard MCP protocol:

**Command:** `node`
**Arguments:** `["/path/to/your/mcp-mountvacation-bridge.js"]`
**Environment Variables:** `MOUNTVACATION_API_KEY=your_api_key_here`

---

## 🧪 **Testing Your Setup**

After configuring your client, test the connection:

1. **Restart your MCP client** completely
2. **Try this query**:
   ```
   Search for accommodations in Chamonix, France for 2 adults from January 15-20, 2026
   ```
3. **Expected results**:
   - ✅ List of accommodations in Chamonix
   - ✅ Pricing in EUR/USD/other currencies
   - ✅ Property links and booking URLs
   - ✅ Detailed amenities and descriptions

---

## 🛠️ **Troubleshooting**

### **"API key not configured" Error**
- Verify your API key is set correctly
- Check environment variable: `echo $MOUNTVACATION_API_KEY`
- Ensure no extra spaces or quotes in the API key

### **"Failed to connect" Error**
- Check internet connection
- Verify Node.js is installed: `node --version`
- Test the bridge manually: `node /path/to/your/mcp-mountvacation-bridge.js`

### **"No results found" Error**
- Try broader search terms (e.g., "French Alps" instead of specific resort)
- Check dates are in YYYY-MM-DD format
- Verify location spelling

### **"Server disconnected" Error**
- Restart your MCP client
- Check file path is correct and absolute
- Ensure bridge script has execute permissions

---

## 📞 **Support**

- **GitHub Issues**: [MV-MCP-server Issues](https://github.com/talirezun/MV-MCP-server/issues)
- **Documentation**: [Full Setup Guide](https://github.com/talirezun/MV-MCP-server)
- **API Documentation**: [MountVacation API](https://mountvacation.com/api)

**The setup works with any MCP client that supports the standard MCP protocol!** 🎉
