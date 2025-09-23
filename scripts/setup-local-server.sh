#!/bin/bash

# MountVacation MCP Server - Local Setup Script
# This script sets up the local Python MCP server

set -e

echo "🏔️  MountVacation MCP Server Setup"
echo "=================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    echo "Please install Python 3.8+ and try again."
    exit 1
fi

echo "✅ Python found: $(python3 --version)"

# Navigate to python-fastmcp directory
if [ ! -d "python-fastmcp" ]; then
    echo "❌ python-fastmcp directory not found."
    echo "Please run this script from the MV-MCP-server root directory."
    exit 1
fi

cd python-fastmcp

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Check if .env file exists
if [ ! -f "../.env" ]; then
    echo "⚠️  .env file not found. Creating template..."
    echo "MOUNTVACATION_API_KEY=your_api_key_here" > ../.env
    echo "📝 Please edit .env file with your MountVacation API key"
else
    echo "✅ .env file found"
fi

# Test the server
echo "🧪 Testing server..."
if python mountvacation_mcp.py --test 2>/dev/null; then
    echo "✅ Server test passed!"
else
    echo "⚠️  Server test failed. Please check your API key in .env file."
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your MountVacation API key"
echo "2. Add this to your Claude Desktop config:"
echo ""
echo '{'
echo '  "mcpServers": {'
echo '    "mountvacation": {'
echo '      "command": "python",'
echo "      \"args\": [\"$(pwd)/mountvacation_mcp.py\"],"
echo '      "env": {'
echo '        "MOUNTVACATION_API_KEY": "your_api_key_here"'
echo '      }'
echo '    }'
echo '  }'
echo '}'
echo ""
echo "📖 Full guide: docs/CLIENT_INTEGRATION.md"
