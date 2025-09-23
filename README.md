# MountVacation MCP Server

A robust Model Context Protocol (MCP) server that enables AI assistants to search for mountain vacation accommodations using the MountVacation API.

## 🏔️ Features

- **Multi-Strategy Search**: Resort, city, and geolocation-based searches
- **AI Client Support**: Claude Desktop, VS Code (Cline), Cursor, LM Studio
- **Production Ready**: Cloudflare Workers deployment with global edge caching
- **Robust Error Handling**: Graceful fallbacks and comprehensive error messages
- **Performance Optimized**: Sub-3-second response times with intelligent caching
- **Secure**: Environment-based credential management and rate limiting

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd MV-MCP-server
cp .env.example .env
```

### 2. Add MountVacation API Key

Edit `.env` file with your MountVacation API key:

```bash
MOUNTVACATION_API_KEY=your_api_key_here
```

### 3. Setup Local Server

#### Quick Setup (Recommended)

```bash
./scripts/setup-local-server.sh
```

#### Manual Setup

```bash
cd python-fastmcp
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 4. Test Your Setup

#### Test Local Server
```bash
cd python-fastmcp
source venv/bin/activate
python mountvacation_mcp.py --test
```

#### Test Deployed Server
```bash
node scripts/test-deployed-server.js
```

#### Test with MCP Inspector
```bash
npm install -g @modelcontextprotocol/inspector
mcp-inspector
```
Connect to: `stdio://python python-fastmcp/mountvacation_mcp.py`

## 🔧 Client Integration

### 🏠 Local Python Server (Recommended)

#### Claude Desktop
```json
{
  "mcpServers": {
    "mountvacation": {
      "command": "python",
      "args": ["/full/path/to/python-fastmcp/mountvacation_mcp.py"],
      "env": {
        "MOUNTVACATION_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

#### VS Code (Cline)
```json
{
  "mountvacation": {
    "command": "python",
    "args": ["mountvacation_mcp.py"],
    "cwd": "/full/path/to/python-fastmcp",
    "env": {
      "MOUNTVACATION_API_KEY": "your_api_key_here"
    }
  }
}
```

📖 **[Complete Integration Guide](docs/CLIENT_INTEGRATION.md)** | 📁 **[Example Configs](client-configs/)**

## 🚀 Cloud-Hosted Option (No Setup Required!)

**Want to use MountVacation MCP without any local setup?** Use our cloud-hosted server!

### For Claude Desktop

Add this to your `claude_desktop_config.json`:

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
1. Clone this repository: `git clone https://github.com/talirezun/MV-MCP-server.git`
2. Update the path in the config above to your actual path
3. Add the config to your Claude Desktop configuration file
4. Restart Claude Desktop

**Benefits:**
- ✅ **No API keys required** - Server handles authentication
- ✅ **No local setup** - Runs on Cloudflare's global network
- ✅ **Always up-to-date** - Automatically maintained
- ✅ **Fast & reliable** - Sub-3-second response times

## 🌐 Production Deployment

### Cloudflare Workers

**Already Deployed**: `https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev`
*Note: Custom domain `mcp.blocklabs.technology` coming soon*

To deploy your own instance:

```bash
cd cloudflare-workers
npm install -g wrangler
wrangler login
wrangler secret put MOUNTVACATION_API_KEY
wrangler deploy
```

## 📖 Usage Examples

Ask your AI assistant:

- "Find ski accommodations in Madonna di Campiglio for January 2026, 2 adults, 7 nights"
- "Search for mountain hotels in the Italian Dolomites for March 2026, 4 people"
- "Look for family-friendly places in the Alps with breakfast included"

**Available Locations**: Madonna di Campiglio, Italian Dolomites, Kronplatz area, and other European mountain destinations.

## 🧪 Testing

```bash
# Python tests
cd python-fastmcp
python -m pytest tests/

# TypeScript tests
cd cloudflare-workers
npm test
```

## 🌐 Live Server (Experimental)

**Production URL**: `https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev`
*Custom domain `mcp.blocklabs.technology` will be available once DNS is configured*

### 🌐 Custom Domain Setup (Optional)

To use the clean `mcp.blocklabs.technology` domain instead of the workers.dev URL:

1. **Add blocklabs.technology domain to Cloudflare account**
2. **Configure DNS A record**: `mcp.blocklabs.technology` → Cloudflare proxy
3. **Update wrangler.toml** to enable custom routes (already configured)
4. **Deploy to production**: `wrangler deploy --env production`

The current workers.dev URL works perfectly and will be replaced with the custom domain once DNS is configured.

- ✅ **Health Check**: `/health` (Working)
- ⚠️ **MCP Endpoint**: `/mcp` (In Development)
- ✅ **Global Edge Network**: Sub-3s response times worldwide
- ✅ **Rate Limited**: 60 requests/minute per client
- ✅ **Secure**: API keys stored as Cloudflare secrets

*Note: Use local Python server for production MCP integration*

## 📁 Project Structure

```
├── python-fastmcp/          # FastMCP Python implementation
├── cloudflare-workers/      # TypeScript Cloudflare Workers (DEPLOYED)
├── client-configs/          # AI client integration examples
├── docs/                    # Documentation and guides
├── scripts/                 # Deployment utilities
└── tests/                   # Integration tests
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- Check the [documentation](./docs/)
- Open an [issue](https://github.com/your-repo/issues)
- Review [client configuration examples](./client-configs/)
