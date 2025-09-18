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

### 2. Add Your Credentials

Edit `.env` file with your MountVacation API credentials:

```bash
MOUNTVACATION_USERNAME=your_username
MOUNTVACATION_PASSWORD=your_password
```

### 3. Choose Your Implementation

#### Option A: Python FastMCP (Local Development)

```bash
cd python-fastmcp
pip install -r requirements.txt
python mountvacation_mcp.py
```

#### Option B: TypeScript Cloudflare Workers (Production)

```bash
cd cloudflare-workers
npm install
npm run dev
```

### 4. Test with MCP Inspector

```bash
npm install -g @modelcontextprotocol/inspector
mcp-inspector
```

Connect to: `stdio://python python-fastmcp/mountvacation_mcp.py`

## 🔧 Client Integration

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mountvacation": {
      "command": "python",
      "args": ["path/to/python-fastmcp/mountvacation_mcp.py"],
      "env": {
        "MOUNTVACATION_USERNAME": "your_username",
        "MOUNTVACATION_PASSWORD": "your_password"
      }
    }
  }
}
```

### VS Code (Cline)

Add to `.vscode/mcp.json`:

```json
{
  "mountvacation": {
    "command": "python",
    "args": ["mountvacation_mcp.py"],
    "cwd": "path/to/python-fastmcp",
    "env": {
      "MOUNTVACATION_USERNAME": "your_username",
      "MOUNTVACATION_PASSWORD": "your_password"
    }
  }
}
```

## 🌐 Production Deployment

### Cloudflare Workers

```bash
cd cloudflare-workers
npm install -g wrangler
wrangler login
wrangler secret put MOUNTVACATION_USERNAME
wrangler secret put MOUNTVACATION_PASSWORD
wrangler deploy
```

## 📖 Usage Examples

Ask your AI assistant:

- "Find me a ski chalet in Chamonix for 4 people from March 10-17"
- "Search for mountain accommodations in Zermatt for 2 adults, July 15-22"
- "Look for family-friendly places in the Alps for 2 adults and 2 kids (ages 12, 8)"

## 🧪 Testing

```bash
# Python tests
cd python-fastmcp
python -m pytest tests/

# TypeScript tests
cd cloudflare-workers
npm test
```

## 📁 Project Structure

```
├── python-fastmcp/          # FastMCP Python implementation
├── cloudflare-workers/      # TypeScript Cloudflare Workers
├── client-configs/          # AI client integration examples
├── docs/                    # Documentation
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
