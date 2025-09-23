# MountVacation MCP Server - API Reference

## 🌐 **MCP Server Endpoints**

### **Base URL**
- **Production**: `https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev`
- **Health Check**: `https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev/health`
- **MCP Endpoint**: `https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev/mcp`

## 🔧 **MCP Protocol Implementation**

### **JSON-RPC 2.0 Format**
All MCP requests and responses follow JSON-RPC 2.0 specification:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "method_name",
  "params": { ... }
}
```

### **Supported Methods**

#### **1. initialize**
**Purpose**: Initialize MCP connection  
**Request**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {
      "name": "client_name",
      "version": "1.0.0"
    }
  }
}
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "tools": {}
    },
    "serverInfo": {
      "name": "mountvacation-cloud",
      "version": "1.0.0"
    }
  }
}
```

#### **2. tools/list**
**Purpose**: Get available tools  
**Request**:
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list"
}
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "tools": [
      {
        "name": "search_accommodations",
        "description": "Search for mountain vacation accommodations using the MountVacation API...",
        "inputSchema": {
          "type": "object",
          "properties": {
            "location": {
              "type": "string",
              "description": "City, resort, or region name"
            },
            "arrival_date": {
              "type": "string",
              "description": "Check-in date in YYYY-MM-DD format",
              "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
            },
            "departure_date": {
              "type": "string", 
              "description": "Check-out date in YYYY-MM-DD format",
              "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
            },
            "persons_ages": {
              "type": "string",
              "description": "Comma-separated ages of all guests",
              "pattern": "^\\d+(,\\d+)*$"
            },
            "currency": {
              "type": "string",
              "description": "Currency code for pricing",
              "enum": ["EUR", "USD", "GBP", "CHF", "CAD", "AUD"],
              "default": "EUR"
            },
            "max_results": {
              "type": "number",
              "description": "Maximum number of accommodations to return",
              "minimum": 1,
              "maximum": 20,
              "default": 5
            }
          },
          "required": ["location", "arrival_date", "departure_date", "persons_ages"]
        }
      }
    ]
  }
}
```

#### **3. tools/call**
**Purpose**: Execute a tool  
**Request**:
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "search_accommodations",
    "arguments": {
      "location": "Madonna di Campiglio",
      "arrival_date": "2026-01-15",
      "departure_date": "2026-01-22",
      "persons_ages": "30,28",
      "currency": "EUR",
      "max_results": 5
    }
  }
}
```

**Success Response**:
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"accommodations\":[{\"name\":\"Hotel Example\",\"price\":\"€150/night\",\"rating\":4.5,\"amenities\":[\"WiFi\",\"Spa\"],\"booking_url\":\"https://...\"}],\"total_found\":1,\"search_params\":{\"location\":\"Madonna di Campiglio\",\"dates\":\"2026-01-15 to 2026-01-22\",\"guests\":2},\"timestamp\":\"2025-09-23T12:00:00.000Z\"}"
      }
    ]
  }
}
```

**Error Response**:
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"error\":\"No accommodations found for 'Invalid Location'. Please try a different location or check the spelling.\",\"suggestions\":[\"Try a nearby city or resort name\",\"Check if the location is a mountain destination\"],\"timestamp\":\"2025-09-23T12:00:00.000Z\"}"
      }
    ]
  }
}
```

## 🏔️ **Location Database**

### **Supported Locations**
The server includes mappings for these locations:

| Location Name | API ID | Region |
|---------------|--------|---------|
| Madonna di Campiglio | 1234 | Italian Dolomites |
| Italian Dolomites | 5678 | Northern Italy |
| Kronplatz | 9012 | South Tyrol |
| Val Gardena | 3456 | Italian Dolomites |
| Cortina d'Ampezzo | 7890 | Veneto |

### **Location Matching**
- **Case Insensitive**: "madonna di campiglio" = "Madonna di Campiglio"
- **Partial Matching**: "madonna" may match "Madonna di Campiglio"
- **Alternative Names**: Multiple names can map to same location
- **Fuzzy Matching**: Basic typo tolerance

## 📊 **Response Formats**

### **Successful Accommodation Search**
```json
{
  "accommodations": [
    {
      "name": "Hotel Alpine Resort",
      "description": "Luxury ski resort with spa facilities",
      "price": "€180/night",
      "total_price": "€1,260 for 7 nights",
      "rating": 4.5,
      "review_count": 234,
      "amenities": ["WiFi", "Spa", "Restaurant", "Ski Storage"],
      "location": "Madonna di Campiglio",
      "distance_to_slopes": "50m",
      "booking_url": "https://mountvacation.com/book/12345",
      "contact": {
        "phone": "+39 0465 441001",
        "email": "info@alpineresort.com"
      },
      "images": ["https://..."]
    }
  ],
  "total_found": 15,
  "showing": 5,
  "search_params": {
    "location": "Madonna di Campiglio",
    "dates": "2026-01-15 to 2026-01-22",
    "guests": 2,
    "currency": "EUR"
  },
  "timestamp": "2025-09-23T12:00:00.000Z"
}
```

### **Error Response Format**
```json
{
  "error": "No accommodations found for 'Invalid Location'.",
  "error_code": "LOCATION_NOT_FOUND",
  "suggestions": [
    "Try a nearby city or resort name",
    "Check if the location is a mountain destination",
    "Verify the spelling of the location"
  ],
  "supported_locations": [
    "Madonna di Campiglio",
    "Italian Dolomites",
    "Kronplatz"
  ],
  "timestamp": "2025-09-23T12:00:00.000Z"
}
```

## 🔒 **Authentication & Security**

### **API Key Management**
- **Server-Side**: API key stored securely in Cloudflare Workers
- **Client-Side**: No API key required for end users
- **Rate Limiting**: 60 requests per minute per client

### **Input Validation**
- **Date Format**: YYYY-MM-DD validation
- **Age Format**: Comma-separated integers
- **Currency**: Enum validation
- **Max Results**: Range validation (1-20)

## ⚡ **Performance Specifications**

### **Response Times**
- **Health Check**: < 100ms
- **Tools List**: < 200ms
- **Accommodation Search**: < 3000ms
- **Cache Hit**: < 500ms

### **Rate Limits**
- **Per Client**: 60 requests/minute
- **Global**: 1000 requests/minute
- **Burst**: Up to 10 requests/second

### **Caching**
- **Location Mappings**: Permanent cache
- **Search Results**: 5 minutes TTL
- **Error Responses**: 1 minute TTL

## 🛠️ **Development & Testing**

### **Health Check Endpoint**
```bash
curl https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev/health
```

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-09-23T12:00:00.000Z",
  "version": "1.0.0"
}
```

### **Test Commands**
```bash
# Test tools list
curl -X POST "https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev/mcp" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Test accommodation search
curl -X POST "https://blocklabs-mountvacation-mcp-production.4thtech.workers.dev/mcp" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"search_accommodations","arguments":{"location":"Madonna di Campiglio","arrival_date":"2026-01-15","departure_date":"2026-01-22","persons_ages":"30,28"}}}'
```

## 🚨 **Error Codes**

| Code | Description | HTTP Status |
|------|-------------|-------------|
| -32700 | Parse error | 400 |
| -32600 | Invalid Request | 400 |
| -32601 | Method not found | 400 |
| -32602 | Invalid params | 400 |
| -32603 | Internal error | 500 |

---

**API Version**: 1.0.0  
**Last Updated**: September 23, 2025  
**Protocol**: JSON-RPC 2.0 over HTTP
