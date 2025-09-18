# LM Studio MCP Configuration

## Setup Instructions

1. Open LM Studio
2. Go to Settings → MCP Servers
3. Click "Add New Server"
4. Fill in the following details:

### Server Configuration

- **Name**: MountVacation Search
- **Description**: Search for mountain vacation accommodations
- **Command**: `python`
- **Arguments**: `path/to/python-fastmcp/mountvacation_mcp.py`
- **Working Directory**: `path/to/python-fastmcp/`

### Environment Variables

Add the following environment variables:

| Variable | Value |
|----------|-------|
| `MOUNTVACATION_USERNAME` | your_username_here |
| `MOUNTVACATION_PASSWORD` | your_password_here |
| `LOG_LEVEL` | info |

### Optional Settings

- **Timeout**: 30 seconds
- **Auto-restart**: Enabled
- **Log Level**: Info

## Usage Examples

Once configured, you can ask LM Studio:

- "Find me a ski chalet in Chamonix for 4 people from March 10-17"
- "Search for mountain accommodations in Zermatt for 2 adults, July 15-22"
- "Look for family-friendly places in the Alps for 2 adults and 2 kids (ages 12, 8)"

## Troubleshooting

### Common Issues

1. **Python not found**: Make sure Python is in your PATH
2. **Module not found**: Run `pip install -r requirements.txt` in the python-fastmcp directory
3. **Authentication failed**: Check your MountVacation credentials
4. **No results**: Try different location names or check spelling

### Log Files

LM Studio logs are typically found at:
- **Windows**: `%APPDATA%\LMStudio\logs\`
- **macOS**: `~/Library/Application Support/LMStudio/logs/`
- **Linux**: `~/.config/LMStudio/logs/`
