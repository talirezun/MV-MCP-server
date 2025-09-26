#!/bin/bash

echo "🔄 FORCE CLAUDE DESKTOP CACHE REFRESH - COMPLETE RESET"
echo "======================================================"

# 1. Kill all Claude processes
echo "1️⃣ Killing all Claude Desktop processes..."
pkill -f "Claude" 2>/dev/null || true
killall "Claude" 2>/dev/null || true
sleep 2

# 2. Clear all possible cache locations
echo "2️⃣ Clearing all Claude Desktop caches..."

# Main cache directory
if [ -d "$HOME/Library/Caches/Claude" ]; then
    echo "   - Clearing $HOME/Library/Caches/Claude"
    rm -rf "$HOME/Library/Caches/Claude"
fi

# Application Support caches
if [ -d "$HOME/Library/Application Support/Claude/logs" ]; then
    echo "   - Clearing logs: $HOME/Library/Application Support/Claude/logs"
    rm -rf "$HOME/Library/Application Support/Claude/logs"
fi

# Electron caches
if [ -d "$HOME/Library/Caches/com.anthropic.claude" ]; then
    echo "   - Clearing $HOME/Library/Caches/com.anthropic.claude"
    rm -rf "$HOME/Library/Caches/com.anthropic.claude"
fi

# 3. Update server name to force config refresh
echo "3️⃣ Updating Claude Desktop config with new server name..."
CONFIG_FILE="$HOME/Library/Application Support/Claude/claude_desktop_config.json"

if [ -f "$CONFIG_FILE" ]; then
    # Create backup
    cp "$CONFIG_FILE" "$CONFIG_FILE.backup.$(date +%s)"
    
    # Update config with new server name and timestamp
    cat > "$CONFIG_FILE" << 'EOF'
{
  "mcpServers": {
    "mountvacation-v3-FIXED": {
      "command": "node",
      "args": ["/Users/talirezun/mountvacation-mcp-server.js"],
      "env": {
        "MOUNTVACATION_API_KEY": "0e9147e2a4316bfd6c69a8d1ae6044e4879764a7783f8898a87ec976b420800e2570d2348636e2a2ac62dfe0d595014e145ea3a89d69dc6213ef99d94cb3a71e2"
      }
    }
  }
}
EOF
    echo "   ✅ Updated config with server name: mountvacation-v3-FIXED"
else
    echo "   ❌ Config file not found: $CONFIG_FILE"
fi

# 4. Verify the server file is correct
echo "4️⃣ Verifying server file..."
SERVER_FILE="/Users/talirezun/mountvacation-mcp-server.js"

if [ -f "$SERVER_FILE" ]; then
    VERSION=$(grep -o "version: '[^']*'" "$SERVER_FILE" | head -1)
    ADDITIONAL_PROPS=$(grep -A 5 "research_accommodations" "$SERVER_FILE" | grep "additionalProperties: false" | wc -l)
    
    echo "   - Server version: $VERSION"
    echo "   - research_accommodations has additionalProperties: false: $ADDITIONAL_PROPS times"
    
    if [ "$ADDITIONAL_PROPS" -gt 0 ]; then
        echo "   ✅ Server file is correctly fixed"
    else
        echo "   ❌ Server file still missing additionalProperties fix"
    fi
else
    echo "   ❌ Server file not found: $SERVER_FILE"
fi

# 5. Test server directly
echo "5️⃣ Testing server directly..."
echo '{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2025-06-18", "capabilities": {}, "clientInfo": {"name": "TestClient", "version": "1.0.0"}}}' | node "$SERVER_FILE" | head -1

echo ""
echo "🎯 NEXT STEPS:"
echo "1. Start Claude Desktop (should show 'mountvacation-v3-FIXED' server)"
echo "2. Look for GREEN connection indicator"
echo "3. Should see NO ZodError popup"
echo "4. Test with family ski vacation query"
echo ""
echo "🚀 If this doesn't work, the issue is deeper in Claude Desktop's MCP implementation!"
