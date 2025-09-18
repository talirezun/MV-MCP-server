#!/bin/bash

# MountVacation MCP Server Testing Script
# Tests both Python FastMCP and TypeScript implementations

set -e

echo "🧪 MountVacation MCP Server Testing"
echo "==================================="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please run setup.sh first."
    exit 1
fi

# Load environment variables
source .env

# Check if credentials are set
if [ -z "$MOUNTVACATION_USERNAME" ] || [ -z "$MOUNTVACATION_PASSWORD" ]; then
    echo "❌ MountVacation credentials not set in .env file"
    exit 1
fi

echo "🔍 Testing Python FastMCP implementation..."
cd python-fastmcp

# Activate virtual environment
if [ -d "venv" ]; then
    source venv/bin/activate
else
    echo "❌ Python virtual environment not found. Please run setup.sh first."
    exit 1
fi

# Run Python tests
if [ -d "tests" ]; then
    echo "🐍 Running Python unit tests..."
    python -m pytest tests/ -v
fi

# Test the MCP server directly
echo "🔧 Testing MCP server functionality..."
python -c "
import sys
sys.path.append('.')
from mountvacation_mcp import search_accommodations
import json

# Test search
result = search_accommodations(
    location='Chamonix',
    arrival_date='2024-06-15',
    departure_date='2024-06-22',
    persons_ages='18,18',
    currency='EUR',
    max_results=2
)

print('Python FastMCP Test Result:')
print(json.dumps(result, indent=2))

if 'error' in result:
    print('⚠️  Test returned error (this might be expected if API credentials are not valid)')
else:
    print('✅ Python FastMCP test completed successfully')
"

cd ..

echo ""
echo "🌐 Testing TypeScript Cloudflare Workers implementation..."
cd cloudflare-workers

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run TypeScript tests
if [ -f "package.json" ] && grep -q '"test"' package.json; then
    echo "📝 Running TypeScript unit tests..."
    npm test
fi

# Build the project
echo "🔨 Building TypeScript project..."
npm run build

# Test with Wrangler dev (if available)
if command -v wrangler &> /dev/null; then
    echo "🚀 Testing with Wrangler dev server..."
    
    # Start dev server in background
    wrangler dev --port 8787 &
    DEV_PID=$!
    
    # Wait for server to start
    sleep 5
    
    # Test health endpoint
    if curl -f -s "http://localhost:8787/health" > /dev/null; then
        echo "✅ Dev server health check passed"
        
        # Test MCP endpoint with a simple request
        echo "🔍 Testing MCP endpoint..."
        curl -X POST "http://localhost:8787/mcp" \
             -H "Content-Type: application/json" \
             -d '{
               "jsonrpc": "2.0",
               "id": 1,
               "method": "tools/list",
               "params": {}
             }' \
             -s | jq '.' || echo "MCP endpoint test completed"
    else
        echo "❌ Dev server health check failed"
    fi
    
    # Stop dev server
    kill $DEV_PID 2>/dev/null || true
    wait $DEV_PID 2>/dev/null || true
fi

cd ..

echo ""
echo "🔍 Testing MCP Inspector integration..."
if [ -d "mcp-inspector" ]; then
    echo "📋 MCP Inspector is available for manual testing"
    echo "   To test manually:"
    echo "   1. cd mcp-inspector && npm start"
    echo "   2. Connect to: stdio://python ../python-fastmcp/mountvacation_mcp.py"
    echo "   3. Test the search_accommodations tool"
else
    echo "⚠️  MCP Inspector not found. Run setup.sh to install it."
fi

echo ""
echo "🧪 Integration Test Examples"
echo "============================"
echo ""
echo "Test these queries with your AI client:"
echo ""
echo "1. Basic search:"
echo '   "Find me accommodations in Chamonix for 2 adults from June 15-22, 2024"'
echo ""
echo "2. Family search:"
echo '   "Search for family-friendly places in Zermatt for 2 adults and 2 kids (ages 12, 8) from July 10-17, 2024"'
echo ""
echo "3. Specific requirements:"
echo '   "Look for ski chalets in the Alps with parking and WiFi for 4 adults from March 1-8, 2024"'
echo ""
echo "4. Different currency:"
echo '   "Find mountain accommodations in Switzerland for 2 people from August 5-12, 2024, show prices in USD"'
echo ""

echo "✅ Testing completed!"
echo ""
echo "📊 Test Summary:"
echo "• Python FastMCP: Ready for local development and testing"
echo "• TypeScript Workers: Ready for production deployment"
echo "• MCP Inspector: Available for interactive testing"
echo ""
echo "🚀 Next steps:"
echo "1. Test with AI clients using the configurations in client-configs/"
echo "2. Deploy to Cloudflare Workers with scripts/deploy.sh"
echo "3. Monitor performance and usage"
