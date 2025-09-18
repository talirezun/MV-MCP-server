# MountVacation MCP Server Deployment Guide

## Overview

This guide covers deploying the MountVacation MCP Server to Cloudflare Workers for production use. The deployment provides global edge distribution, automatic scaling, and high availability.

## Prerequisites

### Required Accounts
1. **Cloudflare Account** (Free tier sufficient)
   - Sign up at [cloudflare.com](https://cloudflare.com)
   - Note your Account ID from the dashboard

2. **MountVacation API Account**
   - Get credentials from [api.mountvacation.com](https://api.mountvacation.com)
   - Username and password for authentication

### Required Tools
1. **Node.js** (v18 or higher)
2. **npm** (comes with Node.js)
3. **Wrangler CLI** (Cloudflare Workers CLI)

## Quick Deployment

### 1. Setup Environment

```bash
# Clone the repository
git clone <your-repo-url>
cd MV-MCP-server

# Run setup script
chmod +x scripts/setup.sh
./scripts/setup.sh

# Configure environment variables
cp .env.example .env
# Edit .env with your credentials
```

### 2. Configure Cloudflare

```bash
cd cloudflare-workers

# Install Wrangler CLI (if not already installed)
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Set up secrets
wrangler secret put MOUNTVACATION_USERNAME
wrangler secret put MOUNTVACATION_PASSWORD
```

### 3. Deploy

```bash
# Deploy using the script
cd ..
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

## Manual Deployment

### 1. Prepare the Project

```bash
cd cloudflare-workers

# Install dependencies
npm install

# Build the project
npm run build

# Run tests (optional)
npm test
```

### 2. Configure Wrangler

Edit `wrangler.toml` to customize your deployment:

```toml
name = "mountvacation-mcp"
main = "src/index.ts"
compatibility_date = "2023-12-01"

# Update with your domain
[env.production]
routes = [
  { pattern = "mountvacation-mcp.your-domain.workers.dev", zone_name = "your-domain.workers.dev" }
]

# Environment variables
[vars]
NODE_ENV = "production"
LOG_LEVEL = "info"
CACHE_TTL_SECONDS = "300"
MAX_RESULTS_DEFAULT = "5"
RATE_LIMIT_REQUESTS_PER_MINUTE = "60"
```

### 3. Set Secrets

```bash
# Set MountVacation API credentials
echo "your_username" | wrangler secret put MOUNTVACATION_USERNAME
echo "your_password" | wrangler secret put MOUNTVACATION_PASSWORD

# Optional: Set additional secrets
echo "your_sentry_dsn" | wrangler secret put SENTRY_DSN
```

### 4. Deploy to Production

```bash
# Deploy to production
wrangler deploy

# Or deploy to staging first
wrangler deploy --env staging
```

## Environment Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MOUNTVACATION_USERNAME` | MountVacation API username | `your_username` |
| `MOUNTVACATION_PASSWORD` | MountVacation API password | `your_password` |

### Optional Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `LOG_LEVEL` | `info` | Logging level (debug, info, warn, error) |
| `CACHE_TTL_SECONDS` | `300` | Cache time-to-live in seconds |
| `MAX_CACHE_SIZE` | `1000` | Maximum cache entries |
| `API_TIMEOUT_SECONDS` | `30` | API request timeout |
| `MAX_RESULTS_DEFAULT` | `5` | Default max results per search |
| `MAX_RESULTS_LIMIT` | `20` | Maximum allowed results per search |
| `RATE_LIMIT_REQUESTS_PER_MINUTE` | `60` | Rate limit per client |

## Advanced Configuration

### Custom Domain

1. **Add Domain to Cloudflare**
   ```bash
   # Add your domain to Cloudflare dashboard
   # Update DNS settings as instructed
   ```

2. **Update Wrangler Configuration**
   ```toml
   [env.production]
   routes = [
     { pattern = "api.yourdomain.com/mcp", zone_name = "yourdomain.com" }
   ]
   ```

3. **Deploy with Custom Domain**
   ```bash
   wrangler deploy --env production
   ```

### KV Storage for Caching

1. **Create KV Namespace**
   ```bash
   wrangler kv:namespace create "CACHE"
   wrangler kv:namespace create "CACHE" --preview
   ```

2. **Update Wrangler Configuration**
   ```toml
   [[kv_namespaces]]
   binding = "CACHE"
   id = "your-kv-namespace-id"
   preview_id = "your-preview-kv-namespace-id"
   ```

### Analytics and Monitoring

1. **Enable Analytics Engine**
   ```toml
   [[analytics_engine_datasets]]
   binding = "ANALYTICS"
   ```

2. **Add Monitoring Tools**
   ```bash
   # Set up Sentry for error tracking
   echo "your_sentry_dsn" | wrangler secret put SENTRY_DSN
   ```

## Testing Deployment

### Health Check

```bash
# Test health endpoint
curl https://your-worker.your-subdomain.workers.dev/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0"
}
```

### MCP Endpoint Test

```bash
# Test MCP tools list
curl -X POST https://your-worker.your-subdomain.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'
```

### Search Test

```bash
# Test accommodation search
curl -X POST https://your-worker.your-subdomain.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "search_accommodations",
      "arguments": {
        "location": "Chamonix",
        "arrival_date": "2024-06-15",
        "departure_date": "2024-06-22",
        "persons_ages": "18,18"
      }
    }
  }'
```

## Monitoring and Maintenance

### View Logs

```bash
# Real-time logs
wrangler tail

# Filtered logs
wrangler tail --format pretty --status error
```

### Performance Monitoring

1. **Cloudflare Analytics**
   - Visit Cloudflare dashboard
   - Navigate to Workers & Pages → your-worker → Analytics

2. **Custom Metrics**
   - Request count and response times
   - Error rates and types
   - Cache hit rates
   - Geographic distribution

### Update Deployment

```bash
# Update code and redeploy
git pull origin main
cd cloudflare-workers
npm run build
wrangler deploy
```

### Rollback

```bash
# Rollback to previous version
wrangler rollback
```

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   ```bash
   # Check if secrets are set
   wrangler secret list
   
   # Update secrets if needed
   wrangler secret put MOUNTVACATION_USERNAME
   ```

2. **Build Errors**
   ```bash
   # Clear cache and rebuild
   rm -rf node_modules dist
   npm install
   npm run build
   ```

3. **Deployment Failures**
   ```bash
   # Check wrangler configuration
   wrangler whoami
   wrangler subdomain list
   
   # Validate configuration
   wrangler validate
   ```

4. **Runtime Errors**
   ```bash
   # Check logs for errors
   wrangler tail --status error
   
   # Test locally first
   wrangler dev
   ```

### Performance Issues

1. **Slow Response Times**
   - Check MountVacation API status
   - Verify cache configuration
   - Monitor network latency

2. **High Error Rates**
   - Check API credentials
   - Verify rate limiting settings
   - Review error logs

3. **Memory Issues**
   - Reduce cache size
   - Optimize data structures
   - Check for memory leaks

## Security Considerations

### Secrets Management
- Never commit secrets to version control
- Use Wrangler's secret management
- Rotate credentials regularly

### Access Control
- Configure CORS appropriately
- Implement rate limiting
- Monitor for abuse

### Data Protection
- No sensitive data logging
- Secure API communications
- Regular security updates

## Cost Optimization

### Cloudflare Workers Pricing
- **Free Tier**: 100,000 requests/day
- **Paid Plan**: $5/month for 10M requests
- **Additional**: $0.50 per million requests

### Optimization Tips
1. **Efficient Caching**
   - Use appropriate TTL values
   - Cache popular searches
   - Implement cache warming

2. **Request Optimization**
   - Minimize API calls
   - Use connection pooling
   - Implement request batching

3. **Resource Management**
   - Monitor CPU usage
   - Optimize memory allocation
   - Use efficient data structures
