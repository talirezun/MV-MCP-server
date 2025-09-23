# MountVacation MCP Server - Troubleshooting Guide

## 🚨 **Common Issues & Solutions**

### **1. "Server disconnected" in Claude Desktop**

#### **Symptoms**
- Red "failed" status in MCP servers panel
- "Server disconnected" error message
- MountVacation tool not available

#### **Causes & Solutions**

**A. Incorrect File Path**
```json
// ❌ Wrong - placeholder path
"args": ["/path/to/MV-MCP-server/scripts/mcp-cloud-bridge.js"]

// ✅ Correct - actual path
"args": ["/Users/talirezun/Desktop/mountvacation-cloud-bridge.js"]
```

**B. Missing Bridge File**
```bash
# Check if file exists
ls -la ~/Desktop/mountvacation-cloud-bridge.js

# If missing, copy from repository
cp /Users/talirezun/MV-MCP-server/standalone-cloud-bridge.js ~/Desktop/mountvacation-cloud-bridge.js
chmod +x ~/Desktop/mountvacation-cloud-bridge.js
```

**C. Node.js Not Found**
```bash
# Check Node.js installation
node --version

# If not installed, install Node.js from https://nodejs.org
```

**D. Bridge Script Issues**
```bash
# Test bridge manually
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node ~/Desktop/mountvacation-cloud-bridge.js

# Should return JSON response with tools
```

#### **Debug Steps**
1. **Enable Debug Logging**:
   ```json
   {
     "mcpServers": {
       "mountvacation": {
         "command": "node",
         "args": ["/Users/talirezun/Desktop/mountvacation-cloud-bridge.js"],
         "env": {
           "MCP_DEBUG": "1"
         }
       }
     }
   }
   ```

2. **Check Claude Desktop Logs**:
   - Click "Open Logs Folder" in Claude Desktop
   - Look for MCP-related error messages

3. **Restart Claude Desktop**:
   - Completely quit Claude Desktop
   - Wait 5 seconds
   - Restart application

### **2. "No accommodations found" Errors**

#### **Symptoms**
- Tool executes but returns no results
- Error message about location not found
- Suggestions to try different locations

#### **Causes & Solutions**

**A. Location Not in Database**
```
❌ Unsupported: "Aspen", "Whistler", "St. Moritz"
✅ Supported: "Madonna di Campiglio", "Italian Dolomites", "Kronplatz"
```

**B. Spelling/Formatting Issues**
```
❌ Wrong: "madonna campiglio", "dolomiti", "kronplats"
✅ Correct: "Madonna di Campiglio", "Italian Dolomites", "Kronplatz"
```

**C. API Coverage Limitations**
- MountVacation API has limited geographic coverage
- Primarily covers Italian Dolomites region
- Some popular ski resorts may not be available

#### **Workarounds**
1. **Try Alternative Names**:
   - "Alps" instead of specific resort
   - "Italian Dolomites" for broader search
   - Nearby major cities

2. **Check Supported Locations**:
   - See `docs/API_REFERENCE.md` for full list
   - Use exact spelling from supported list

### **3. Timeout Errors**

#### **Symptoms**
- Requests taking longer than 30 seconds
- "Request timeout" error messages
- Intermittent connection issues

#### **Causes & Solutions**

**A. Network Issues**
```bash
# Test connectivity to server
curl -I https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev/health

# Should return 200 OK
```

**B. Server Overload**
- Wait a few minutes and retry
- Try during off-peak hours
- Check server status

**C. Cloudflare Issues**
- Check Cloudflare status page
- Try different network connection
- Use VPN if regional issues

### **4. Bridge Script Errors**

#### **Symptoms**
- Bridge process crashes
- JSON parsing errors
- HTTP connection failures

#### **Debug Commands**
```bash
# Test bridge with debug output
MCP_DEBUG=1 node ~/Desktop/mountvacation-cloud-bridge.js

# Test HTTP connectivity
curl -X POST "https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev/mcp" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

#### **Solutions**
1. **Update Bridge Script**:
   ```bash
   # Get latest version
   cp /Users/talirezun/MV-MCP-server/standalone-cloud-bridge.js ~/Desktop/mountvacation-cloud-bridge.js
   ```

2. **Check Permissions**:
   ```bash
   chmod +x ~/Desktop/mountvacation-cloud-bridge.js
   ```

3. **Verify Node.js Version**:
   ```bash
   node --version  # Should be 14+ for ES modules support
   ```

### **5. Performance Issues**

#### **Symptoms**
- Slow response times (>5 seconds)
- Frequent timeouts
- Inconsistent performance

#### **Optimization Steps**
1. **Check Network Speed**:
   ```bash
   # Test download speed
   curl -o /dev/null -s -w "%{time_total}\n" https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev/health
   ```

2. **Reduce Result Count**:
   ```json
   {
     "location": "Madonna di Campiglio",
     "max_results": 3  // Reduce from default 5
   }
   ```

3. **Use Cached Locations**:
   - Stick to previously searched locations
   - Cache improves subsequent requests

## 🔧 **Development Issues**

### **Cloudflare Workers Deployment**

#### **Build Errors**
```bash
# Clear build cache
cd cloudflare-workers
rm -rf dist/
npm run build

# Check TypeScript errors
npx tsc --noEmit
```

#### **Deployment Failures**
```bash
# Check Wrangler authentication
wrangler whoami

# Re-login if needed
wrangler login

# Deploy with verbose output
wrangler deploy --env production --verbose
```

#### **Runtime Errors**
```bash
# Check Cloudflare Workers logs
wrangler tail --env production

# Test specific endpoints
curl -X POST "https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev/mcp" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### **Local Development**

#### **Python Server Issues**
```bash
# Check Python environment
cd python-fastmcp
source venv/bin/activate
python --version

# Install dependencies
pip install -r requirements.txt

# Test server
python mountvacation_mcp.py --test
```

#### **Environment Variables**
```bash
# Check .env file
cat .env

# Should contain:
# MOUNTVACATION_API_KEY=your_api_key_here
```

## 📊 **Monitoring & Health Checks**

### **Server Health**
```bash
# Basic health check
curl https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev/health

# Expected response:
# {"status":"healthy","timestamp":"2025-09-23T12:00:00.000Z","version":"1.0.0"}
```

### **MCP Protocol Test**
```bash
# Test tools list
curl -X POST "https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev/mcp" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Should return tools array with search_accommodations
```

### **End-to-End Test**
```bash
# Run comprehensive test suite
cd /Users/talirezun/MV-MCP-server
node scripts/test-deployed-server.js
```

## 🆘 **Getting Help**

### **Log Collection**
1. **Claude Desktop Logs**:
   - Open Claude Desktop
   - Go to MCP servers panel
   - Click "Open Logs Folder"
   - Look for recent error logs

2. **Bridge Debug Logs**:
   ```bash
   # Enable debug mode
   MCP_DEBUG=1 node ~/Desktop/mountvacation-cloud-bridge.js
   ```

3. **Server Logs**:
   ```bash
   # Cloudflare Workers logs
   cd /Users/talirezun/MV-MCP-server/cloudflare-workers
   wrangler tail --env production
   ```

### **Reporting Issues**
When reporting issues, include:
- **Error Message**: Exact error text
- **Configuration**: Your claude_desktop_config.json
- **Environment**: OS, Node.js version, Claude Desktop version
- **Steps to Reproduce**: What you did before the error
- **Logs**: Relevant log excerpts

### **Quick Fixes Checklist**
- [ ] Restart Claude Desktop
- [ ] Check file paths in configuration
- [ ] Verify bridge script exists and is executable
- [ ] Test server health endpoint
- [ ] Try with supported location (Madonna di Campiglio)
- [ ] Check network connectivity
- [ ] Enable debug logging
- [ ] Review Claude Desktop logs

---

**Troubleshooting Guide Version**: 1.0.0  
**Last Updated**: September 23, 2025  
**Support**: Use GitHub Issues for additional help
