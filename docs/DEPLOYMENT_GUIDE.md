# MountVacation MCP Server Deployment Guide

This guide covers **all deployment options** for the MountVacation MCP Server, from zero-setup cloud hosting to custom enterprise deployments.

## 🌐 Production Cloud Deployment (Live)

**Already deployed and ready to use!** Our production Cloudflare Workers deployment provides enterprise-grade reliability with global edge distribution.

### **Live Production Server**
- **URL**: `https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev`
- **Status**: ✅ Live and operational
- **Uptime**: 99.9% SLA with global redundancy
- **Performance**: Sub-3-second response times worldwide
- **Capacity**: Auto-scaling to handle thousands of concurrent requests

### **Production Features**
- ✅ **Complete API Coverage** - All 6 MCP tools with full MountVacation API integration
- ✅ **European Coverage** - Slovenia, Croatia, Italy, Austria, Switzerland, France, Spain, Germany, and more
- ✅ **Multi-language Support** - EN, DE, IT, FR, ES, SL, HR
- ✅ **Multi-currency** - EUR, USD, GBP, CHF, and regional currencies
- ✅ **Rate Limiting** - 60 requests/minute with graceful degradation
- ✅ **Intelligent Caching** - 5-minute TTL for optimal performance
- ✅ **Error Handling** - Comprehensive error messages and fallback strategies

### **Health Check**
```bash
curl https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "timestamp": "2024-12-19T10:30:00Z",
  "features": {
    "tools": 6,
    "api_coverage": "100%",
    "regions": "Europe",
    "languages": 7,
    "currencies": 8
  }
}
```

## 🚀 Deploy Your Own Instance

Want to deploy your own MountVacation MCP server? Follow these steps:

### **Prerequisites**
- Cloudflare account (free tier works)
- MountVacation API key
- Node.js 18+ and npm
- Wrangler CLI

### **Step 1: Clone and Setup**
```bash
git clone https://github.com/talirezun/MV-MCP-server.git
cd MV-MCP-server/cloudflare-workers
npm install
npm install -g wrangler
```

### **Step 2: Cloudflare Authentication**
```bash
wrangler login
```

### **Step 3: Configure Environment**
```bash
# Set your MountVacation API key
wrangler secret put MOUNTVACATION_API_KEY

# Optional: Configure custom settings
wrangler secret put LOG_LEVEL  # info, debug, warn, error
wrangler secret put CACHE_TTL_SECONDS  # default: 300
wrangler secret put MAX_RESULTS_DEFAULT  # default: 5
wrangler secret put RATE_LIMIT_REQUESTS_PER_MINUTE  # default: 60
```

### **Step 4: Deploy**
```bash
# Deploy to production
wrangler deploy --env production

# Or deploy to staging
wrangler deploy --env staging
```

### **Step 5: Verify Deployment**
```bash
# Test your deployment
curl https://your-worker-name.your-subdomain.workers.dev/health
```

## 🔧 Custom Configuration

### **Environment Variables**
Configure your deployment with these environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `MOUNTVACATION_API_KEY` | Required | Your MountVacation API key |
| `NODE_ENV` | `production` | Environment mode |
| `LOG_LEVEL` | `info` | Logging level (debug, info, warn, error) |
| `CACHE_TTL_SECONDS` | `300` | Cache time-to-live in seconds |
| `MAX_CACHE_SIZE` | `1000` | Maximum cache entries |
| `API_TIMEOUT_SECONDS` | `30` | API request timeout |
| `MAX_RESULTS_DEFAULT` | `5` | Default max results per search |
| `MAX_RESULTS_LIMIT` | `20` | Maximum allowed results per search |
| `RATE_LIMIT_REQUESTS_PER_MINUTE` | `60` | Rate limit per client |

### **Custom Domain Setup**
```bash
# Add custom domain to your worker
wrangler route add "mcp.yourdomain.com/*" your-worker-name

# Update wrangler.toml
[env.production.routes]
pattern = "mcp.yourdomain.com/*"
zone_name = "yourdomain.com"
```

### **Advanced Configuration**
Edit `wrangler.toml` for advanced settings:

```toml
name = "your-mountvacation-mcp"
main = "dist/index.js"
compatibility_date = "2024-12-01"

[env.production]
vars = { NODE_ENV = "production", LOG_LEVEL = "info" }

[env.production.routes]
pattern = "mcp.yourdomain.com/*"
zone_name = "yourdomain.com"

[[env.production.kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"
```

## 🐍 Local Python Development

For local development and testing:

### **Setup**
```bash
cd python-fastmcp
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### **Environment Configuration**
```bash
export MOUNTVACATION_API_KEY="your_api_key_here"
export LOG_LEVEL="debug"
export MAX_RESULTS_DEFAULT="10"
```

### **Run Local Server**
```bash
python mountvacation_mcp.py
```

### **Test Local Server**
```bash
python mountvacation_mcp.py --test
```

## 🔒 Security Best Practices

### **API Key Management**
- ✅ **Use Cloudflare Secrets** - Never hardcode API keys
- ✅ **Rotate Keys Regularly** - Update API keys periodically
- ✅ **Monitor Usage** - Track API key usage and costs
- ✅ **Restrict Access** - Use environment-specific keys

### **Rate Limiting**
- ✅ **Per-client Limits** - 60 requests/minute default
- ✅ **Burst Protection** - Handle traffic spikes gracefully
- ✅ **Error Responses** - Clear rate limit messages
- ✅ **Monitoring** - Track rate limit violations

### **Error Handling**
- ✅ **Comprehensive Logging** - Detailed error tracking
- ✅ **Fallback Strategies** - Multiple search approaches
- ✅ **User-friendly Messages** - Clear error explanations
- ✅ **Retry Logic** - Automatic retry for transient failures

## 📊 Monitoring & Analytics

### **Built-in Monitoring**
- **Health Checks** - `/health` endpoint for status monitoring
- **Performance Metrics** - Response times and success rates
- **Error Tracking** - Comprehensive error logging
- **Usage Analytics** - Request patterns and popular searches

### **Cloudflare Analytics**
Access detailed analytics in your Cloudflare dashboard:
- Request volume and patterns
- Geographic distribution
- Error rates and types
- Performance metrics
- Cache hit rates

### **Custom Monitoring**
```bash
# Monitor health endpoint
curl -f https://your-worker.workers.dev/health || echo "Server down"

# Check response times
time curl https://your-worker.workers.dev/health

# Monitor specific endpoints
curl -X POST https://your-worker.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/list"}'
```

## 🚀 Performance Optimization

### **Caching Strategy**
- **5-minute TTL** for search results
- **Geographic caching** via Cloudflare edge
- **Intelligent invalidation** for real-time data
- **Cache warming** for popular destinations

### **Response Optimization**
- **Compression** - Automatic gzip/brotli compression
- **Minification** - Optimized JSON responses
- **Image Optimization** - Efficient image URL handling
- **Pagination** - Efficient large result handling

### **Global Distribution**
- **200+ Edge Locations** - Cloudflare's global network
- **Smart Routing** - Optimal path selection
- **Load Balancing** - Automatic traffic distribution
- **Failover** - Automatic failover to healthy regions

## 🔄 Continuous Deployment

### **GitHub Actions**
Set up automated deployment with GitHub Actions:

```yaml
name: Deploy MountVacation MCP
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: wrangler deploy --env production
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

### **Version Management**
- **Semantic Versioning** - Clear version numbering
- **Release Notes** - Detailed change documentation
- **Rollback Strategy** - Quick rollback capabilities
- **Testing Pipeline** - Automated testing before deployment

## 🆘 Troubleshooting

### **Common Deployment Issues**

**Build Errors:**
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

**Authentication Issues:**
```bash
# Re-authenticate with Cloudflare
wrangler logout
wrangler login
```

**Secret Management:**
```bash
# List current secrets
wrangler secret list

# Update secrets
wrangler secret put MOUNTVACATION_API_KEY
```

### **Performance Issues**
- Check Cloudflare Analytics for bottlenecks
- Monitor API response times
- Review cache hit rates
- Analyze error patterns

### **Getting Help**
1. **Check Cloudflare Logs** - Review worker logs in dashboard
2. **Test Locally** - Reproduce issues in local environment
3. **GitHub Issues** - Report bugs with detailed information
4. **Community Support** - Join discussions for help

---

**🏔️ Ready to deploy? Your MountVacation MCP server will be live in under 10 minutes!**
