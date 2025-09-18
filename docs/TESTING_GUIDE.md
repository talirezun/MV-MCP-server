# 🧪 MountVacation MCP Server Testing Guide

## 📋 Prerequisites

1. **Get MountVacation API Key**

2. **Environment Setup**
   - Run `./scripts/setup.sh` (already completed)
   - Ensure all dependencies are installed

## 🔍 Step 1: Test API Connection

First, verify your API key works with the MountVacation API:

```bash
# Test your API credentials
python test_api.py
```

**Expected Output:**
```
🏔️  MountVacation API Test
==================================================
🔑 Testing API key: abcd1234...

🧪 Testing: Resort Search (Chamonix)
   Status: 200
   ✅ Success! Found 15 accommodations
   📍 Example: Hotel Mont-Blanc in Chamonix
   💰 Price: 250 EUR

🧪 Testing: City Search (Innsbruck)
   Status: 200
   ✅ Success! Found 8 accommodations
   📍 Example: Alpine Lodge in Innsbruck
   💰 Price: 180 EUR

🎉 API test completed successfully!
```

## 🐍 Step 2: Test Python FastMCP Server

Test the local Python MCP server:

```bash
# Activate Python environment
cd python-fastmcp
source venv/bin/activate

# Run the MCP server
python mountvacation_mcp.py
```

**Expected Output:**
```
🏔️ MountVacation MCP Server starting...
✅ Configuration loaded successfully
✅ API connection verified
🚀 Server running on stdio://
```

## 🔍 Step 3: Test with MCP Inspector

The MCP Inspector provides a web interface to test your MCP server:

```bash
# Start MCP Inspector (in a new terminal)
cd mcp-inspector
npm start
```

**Then:**
1. Open http://localhost:3000 in your browser
2. Connect to: `stdio://python ../python-fastmcp/mountvacation_mcp.py`
3. Test the `search_accommodations` tool with parameters:
   ```json
   {
     "location": "Chamonix",
     "arrival_date": "2024-12-15",
     "departure_date": "2024-12-22",
     "persons_ages": "30,28",
     "currency": "EUR",
     "max_results": 5
   }
   ```

## 🌐 Step 4: Test TypeScript Cloudflare Workers

Test the Cloudflare Workers implementation locally:

```bash
cd cloudflare-workers

# Start local development server
npm run dev
```

**Test the endpoint:**
```bash
# Test health check
curl http://localhost:8787/health

# Test MCP tools list
curl -X POST http://localhost:8787/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'

# Test accommodation search
curl -X POST http://localhost:8787/ \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"tools/call",
    "params":{
      "name":"search_accommodations",
      "arguments":{
        "location":"Chamonix",
        "arrival_date":"2024-12-15",
        "departure_date":"2024-12-22",
        "persons_ages":"30,28",
        "currency":"EUR",
        "max_results":3
      }
    }
  }'
```

## 🚀 Step 5: Deploy to Cloudflare Workers

Deploy your MCP server to Cloudflare Workers for production use:

```bash
cd cloudflare-workers

# Login to Cloudflare (if not already logged in)
wrangler login

# Set your API key as a secret
wrangler secret put MOUNTVACATION_API_KEY
# Enter your actual API key when prompted

# Deploy to Cloudflare Workers
wrangler deploy
```

**Expected Output:**
```
✨ Successfully deployed to Cloudflare Workers!
🌍 Your MCP server is now available at: https://mountvacation-mcp.your-subdomain.workers.dev
```

## 🤖 Step 6: Connect to AI Clients

### Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "mountvacation": {
      "command": "python",
      "args": ["/path/to/MV-MCP-server/python-fastmcp/mountvacation_mcp.py"],
      "env": {
        "MOUNTVACATION_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### VS Code with Cline

Add to your Cline MCP settings:

```json
{
  "mountvacation": {
    "command": "python",
    "args": ["/path/to/MV-MCP-server/python-fastmcp/mountvacation_mcp.py"],
    "env": {
      "MOUNTVACATION_API_KEY": "your_api_key_here"
    }
  }
}
```

## 🧪 Test Scenarios

Try these test cases to verify everything works:

### Basic Search
```
"Find ski accommodations in Chamonix for 2 adults from December 15-22, 2024"
```

### Multi-Person Search
```
"Search for family accommodations in Innsbruck for 2 adults and 2 children (ages 8, 12) from January 5-12, 2025"
```

### Currency Conversion
```
"Find accommodations in Zermatt for 1 person, show prices in USD, from March 1-8, 2025"
```

### Specific Requirements
```
"Look for luxury accommodations (4+ stars) in St. Moritz for 2 adults, February 14-21, 2025"
```

## 🐛 Troubleshooting

### Common Issues

1. **API Key Invalid**
   ```
   Error: Authentication failed
   Solution: Verify your API key with MountVacation support
   ```

2. **No Results Found**
   ```
   Error: No accommodations found
   Solution: Try different locations or date ranges
   ```

3. **Connection Timeout**
   ```
   Error: Request timeout
   Solution: Check internet connection and API status
   ```

4. **Rate Limiting**
   ```
   Error: Rate limit exceeded
   Solution: Wait and retry, or contact MountVacation for higher limits
   ```

### Debug Mode

Enable debug logging by setting in `.env`:
```
LOG_LEVEL=debug
```

### Check Logs

- **Python**: Logs output to console
- **Cloudflare Workers**: Check `wrangler tail` for live logs
- **MCP Inspector**: Check browser console for client-side logs

## 📊 Performance Monitoring

The MCP server includes built-in monitoring:

- **Caching**: 5-minute TTL for search results
- **Rate Limiting**: 60 requests per minute by default
- **Error Handling**: Graceful fallbacks and retries
- **Logging**: Structured JSON logs for analysis

## 🎯 Next Steps

Once testing is complete:

1. **Production Deployment**: Deploy to Cloudflare Workers
2. **Monitoring**: Set up alerts for errors and performance
3. **Scaling**: Adjust rate limits and caching as needed
4. **Integration**: Connect to your preferred AI clients
5. **Documentation**: Share with your team or users

## 📞 Support

If you encounter issues:

1. **MountVacation API**: cs@mountvacation.com
2. **MCP Protocol**: https://github.com/modelcontextprotocol/specification
3. **Cloudflare Workers**: https://developers.cloudflare.com/workers/

Happy testing! 🏔️✨
