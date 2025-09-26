# Installing MountVacation MCP in Augment Code

## Quick Setup

1. **Copy the MCP configuration** from `mcp-config-for-augment.json` in this repository
2. **Add it to your Augment Code MCP settings**
3. **Restart Augment Code**
4. **Test the integration**

## Configuration

Add this to your Augment Code MCP configuration:

```json
{
  "mcpServers": {
    "mountvacation": {
      "command": "node",
      "args": ["/Users/talirezun/MV-MCP-server/standalone-mcp-server.js"],
      "env": {
        "MOUNTVACATION_API_KEY": "0e9147e2a4316bfd6c69a8d1ae6044e4879764a7783f8898a87ec976b420800e2570d234863e2a2ac62dfe0d595014e145ea3a89d69dc6213ef99d94cb3a71e2"
      }
    }
  }
}
```

## Testing

Once installed, you can test with queries like:

- **"Search for accommodations in French Alps for December 2025, 2 adults, 7 days"**
- **"Find ski resorts in France or Italy for January 2026, budget under €2000"**
- **"Look for hotels in Italian Dolomites with pool and spa"**

## Expected Results

✅ **French Alps searches** → Returns French ski resorts (Chamonix, Val d'Isère, etc.)  
✅ **Italian searches** → Returns Italian ski resorts (Madonna di Campiglio, Cortina, etc.)  
✅ **Multi-country searches** → Returns results from both countries  
✅ **Direct booking links** → Included in all results  

## Troubleshooting

If you get Slovenia results for French Alps searches, the old version might be cached. Try:
1. Restart Augment Code completely
2. Clear any MCP caches
3. Test with a specific resort name like "Chamonix" first

## Features Available

- **Basic search**: `search_accommodations` tool
- **Advanced research**: `research_accommodations` tool (human-like vacation planning)
- **Multi-region comparison**
- **Budget filtering**
- **Amenity requirements** (pool, spa, parking, etc.)
- **Date flexibility**
- **Direct booking links**

## Support

The MCP server is hosted at: `https://blocklabs-mountvacation-mcp.4thtech.workers.dev`

All searches are powered by the MountVacation API with comprehensive European ski destination coverage.
