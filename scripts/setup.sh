#!/bin/bash

# MountVacation MCP Server Setup Script
# This script sets up both Python FastMCP and TypeScript Cloudflare Workers environments

set -e

echo "🏔️  MountVacation MCP Server Setup"
echo "=================================="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your MountVacation API credentials"
    echo "   MOUNTVACATION_USERNAME=your_username"
    echo "   MOUNTVACATION_PASSWORD=your_password"
    echo ""
fi

# Setup Python FastMCP environment
echo "🐍 Setting up Python FastMCP environment..."
cd python-fastmcp

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "✅ Python FastMCP environment ready!"
cd ..

# Setup TypeScript Cloudflare Workers environment
echo "🌐 Setting up TypeScript Cloudflare Workers environment..."
cd cloudflare-workers

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

# Install dependencies
echo "📥 Installing Node.js dependencies..."
npm install

# Install Wrangler CLI globally if not present
if ! command -v wrangler &> /dev/null; then
    echo "🔧 Installing Wrangler CLI..."
    npm install -g wrangler
fi

echo "✅ TypeScript Cloudflare Workers environment ready!"
cd ..

# Setup MCP Inspector for testing
echo "🔍 Setting up MCP Inspector for testing..."
if [ ! -d "mcp-inspector" ]; then
    echo "📥 Cloning MCP Inspector..."
    git clone https://github.com/modelcontextprotocol/inspector.git mcp-inspector
    cd mcp-inspector
    npm install
    cd ..
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your MountVacation API credentials"
echo "2. Test locally:"
echo "   • Python: cd python-fastmcp && source venv/bin/activate && python mountvacation_mcp.py"
echo "   • TypeScript: cd cloudflare-workers && npm run dev"
echo "3. Test with MCP Inspector:"
echo "   • cd mcp-inspector && npm start"
echo "   • Connect to: stdio://python ../python-fastmcp/mountvacation_mcp.py"
echo "4. Deploy to Cloudflare Workers:"
echo "   • cd cloudflare-workers"
echo "   • wrangler login"
echo "   • wrangler secret put MOUNTVACATION_USERNAME"
echo "   • wrangler secret put MOUNTVACATION_PASSWORD"
echo "   • wrangler deploy"
echo ""
echo "📚 Check README.md for detailed usage instructions"
