#!/bin/bash

# MountVacation MCP Server Deployment Script
# Deploys the TypeScript implementation to Cloudflare Workers

set -e

echo "🚀 MountVacation MCP Server Deployment"
echo "====================================="

# Check if we're in the right directory
if [ ! -f "cloudflare-workers/package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

cd cloudflare-workers

# Check if Wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "📦 Installing Wrangler CLI..."
    npm install -g wrangler
fi

# Check if user is logged in to Cloudflare
echo "🔐 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "🔑 Please log in to Cloudflare..."
    wrangler login
fi

# Build the project
echo "🔨 Building TypeScript project..."
npm run build

# Run tests if they exist
if [ -f "package.json" ] && grep -q '"test"' package.json; then
    echo "🧪 Running tests..."
    npm test
fi

# Check if secrets are set
echo "🔍 Checking required secrets..."
SECRETS_MISSING=false

if ! wrangler secret list | grep -q "MOUNTVACATION_USERNAME"; then
    echo "⚠️  MOUNTVACATION_USERNAME secret not found"
    SECRETS_MISSING=true
fi

if ! wrangler secret list | grep -q "MOUNTVACATION_PASSWORD"; then
    echo "⚠️  MOUNTVACATION_PASSWORD secret not found"
    SECRETS_MISSING=true
fi

if [ "$SECRETS_MISSING" = true ]; then
    echo ""
    echo "🔐 Setting up required secrets..."
    echo "Please enter your MountVacation API credentials:"
    
    echo -n "Username: "
    read -r USERNAME
    echo "$USERNAME" | wrangler secret put MOUNTVACATION_USERNAME
    
    echo -n "Password: "
    read -rs PASSWORD
    echo
    echo "$PASSWORD" | wrangler secret put MOUNTVACATION_PASSWORD
    
    echo "✅ Secrets configured!"
fi

# Deploy to staging first (if staging environment exists)
if grep -q "env.staging" wrangler.toml; then
    echo "🧪 Deploying to staging environment..."
    wrangler deploy --env staging
    
    echo "🔍 Testing staging deployment..."
    STAGING_URL=$(wrangler subdomain list | grep staging | awk '{print $2}' || echo "mountvacation-mcp-staging.your-subdomain.workers.dev")
    
    # Test health endpoint
    if curl -f -s "https://$STAGING_URL/health" > /dev/null; then
        echo "✅ Staging health check passed"
    else
        echo "❌ Staging health check failed"
        exit 1
    fi
    
    echo "🤔 Deploy to production? (y/N)"
    read -r DEPLOY_PROD
    
    if [ "$DEPLOY_PROD" != "y" ] && [ "$DEPLOY_PROD" != "Y" ]; then
        echo "🛑 Deployment stopped at staging"
        echo "📍 Staging URL: https://$STAGING_URL"
        exit 0
    fi
fi

# Deploy to production
echo "🚀 Deploying to production..."
wrangler deploy

# Get the production URL
PROD_URL=$(wrangler subdomain list | grep -v staging | head -1 | awk '{print $2}' || echo "mountvacation-mcp.your-subdomain.workers.dev")

echo ""
echo "🎉 Deployment successful!"
echo ""
echo "📍 Production URL: https://$PROD_URL"
echo "🏥 Health check: https://$PROD_URL/health"
echo "🔗 MCP endpoint: https://$PROD_URL/mcp"
echo ""

# Test the deployment
echo "🧪 Testing production deployment..."

# Test health endpoint
if curl -f -s "https://$PROD_URL/health" > /dev/null; then
    echo "✅ Production health check passed"
else
    echo "❌ Production health check failed"
    echo "🔍 Check the logs: wrangler tail"
fi

echo ""
echo "📚 Next steps:"
echo "1. Update client configurations with the new URL"
echo "2. Test with MCP Inspector or AI clients"
echo "3. Monitor with: wrangler tail"
echo "4. View analytics in Cloudflare dashboard"
echo ""
echo "🔧 Useful commands:"
echo "• View logs: wrangler tail"
echo "• Update secrets: wrangler secret put SECRET_NAME"
echo "• Rollback: wrangler rollback"
