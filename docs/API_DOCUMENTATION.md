# MountVacation MCP Server API Documentation

## 🌍 Complete European API Coverage

The MountVacation MCP Server provides **100% MountVacation API integration** with no geographic limitations. This comprehensive Model Context Protocol interface enables AI assistants to search, explore, and book accommodations across **all of Europe**.

### **Supported Regions**
- **🇸🇮 Slovenia** - Lake Bled, Kranjska Gora, Bovec, Julian Alps
- **🇭🇷 Croatia** - Plitvice Lakes, Istria, Dalmatian Coast, Velebit Mountains  
- **🇮🇹 Italy** - Dolomites, Trentino-Alto Adige, Valle d'Aosta, Italian Alps
- **🇦🇹 Austria** - Tyrol, Salzburg, Carinthia, Austrian Alps
- **🇨🇭 Switzerland** - Valais, Graubünden, Bernese Oberland, Swiss Alps
- **🇫🇷 France** - French Alps, Pyrenees, Provence, Massif Central
- **🇪🇸 Spain** - Pyrenees, Picos de Europa, Sierra Nevada, Cantabrian Mountains
- **🇩🇪 Germany** - Bavarian Alps, Black Forest, Harz Mountains, Eifel
- **And more** - Automatically supports new regions as MountVacation expands

### **Production Infrastructure**
- **🌐 Cloudflare Workers**: Global edge deployment at `blocklabs-mountvacation-mcp-production.4thtech.workers.dev`
- **🐍 Python FastMCP**: Local development server option
- **🔐 Authentication**: User API keys via HTTP headers or environment variables
- **⚡ Performance**: Sub-3-second response times with intelligent caching
- **🛡️ Reliability**: 99.9% uptime with rate limiting and error handling

## 🛠️ Complete MCP Tool Suite

The MountVacation MCP server provides **6 comprehensive tools** that expose all MountVacation API capabilities:

### 1. **search_accommodations** - Primary Search Tool

**Description**: Main accommodation search supporting all MountVacation search methods including location names, GPS coordinates, and advanced filtering.

**Parameters**:
- `location` (string, optional) - Location name (city, resort, region)
- `accommodation_id` (number, optional) - Single accommodation search
- `accommodation_ids` (array, optional) - Multiple accommodations search
- `latitude` (number, optional) - GPS latitude for geolocation search
- `longitude` (number, optional) - GPS longitude for geolocation search
- `radius` (number, optional) - Search radius in meters for geolocation
- `arrival_date` (string, required) - Check-in date (YYYY-MM-DD)
- `departure_date` (string, optional) - Check-out date (YYYY-MM-DD)
- `nights` (number, optional) - Number of nights (alternative to departure_date)
- `persons_ages` (string, optional) - Comma-separated ages (e.g., "30,28,8")
- `persons` (number, optional) - Number of persons (all adults)
- `currency` (string, optional) - Currency code (EUR, USD, GBP, etc.)
- `language` (string, optional) - Language code (en, de, it, fr, es, etc.)
- `include_additional_fees` (boolean, optional) - Include additional fees
- `max_results` (number, optional) - Maximum results (1-100, default: 10)
- `page` (number, optional) - Page number for pagination

**Response**: Complete accommodation data with photos, amenities, pricing, booking links, and GPS coordinates.

### 2. **get_accommodation_details** - Property Information

**Description**: Get comprehensive details for a specific accommodation including all facilities, photos, and booking information.

**Parameters**:
- `accommodation_id` (number, required) - MountVacation accommodation ID
- `language` (string, optional) - Language code (default: "en")
- `include_facilities` (boolean, optional) - Include facility details (default: true)

**Response**: Detailed property information, facility list, photo galleries, amenities, and booking options.

### 3. **get_facility_details** - Room-Specific Information

**Description**: Get detailed information about a specific facility (room/unit) within an accommodation.

**Parameters**:
- `accommodation_id` (number, required) - MountVacation accommodation ID
- `facility_id` (number, required) - Specific facility/room ID
- `language` (string, optional) - Language code (default: "en")

**Response**: Room-specific details including views, kitchen equipment, bathroom facilities, and amenities.

### 4. **search_by_resort_id** - Resort-Based Search

**Description**: Search accommodations by specific resort ID for ski areas and mountain resorts.

**Parameters**:
- `resort_id` (number, required) - MountVacation resort ID
- `arrival_date` (string, required) - Check-in date (YYYY-MM-DD)
- `departure_date` (string, optional) - Check-out date (YYYY-MM-DD)
- `persons_ages` (string, optional) - Comma-separated ages
- `currency` (string, optional) - Currency code
- `language` (string, optional) - Language code
- `max_results` (number, optional) - Maximum results

**Response**: Resort-specific accommodations with ski-in/ski-out options and resort amenities.

### 5. **search_by_city_id** - City-Based Search

**Description**: Search accommodations by specific city ID for urban and city-based destinations.

**Parameters**:
- `city_id` (number, required) - MountVacation city ID
- `arrival_date` (string, required) - Check-in date (YYYY-MM-DD)
- `departure_date` (string, optional) - Check-out date (YYYY-MM-DD)
- `persons_ages` (string, optional) - Comma-separated ages
- `currency` (string, optional) - Currency code
- `language` (string, optional) - Language code
- `max_results` (number, optional) - Maximum results

**Response**: City-specific accommodations with urban amenities and city center proximity.

### 6. **search_by_geolocation** - GPS Coordinate Search

**Description**: Search accommodations by GPS coordinates with customizable radius for precise location-based searches.

**Parameters**:
- `latitude` (number, required) - GPS latitude coordinate
- `longitude` (number, required) - GPS longitude coordinate
- `radius` (number, required) - Search radius in meters
- `arrival_date` (string, required) - Check-in date (YYYY-MM-DD)
- `departure_date` (string, optional) - Check-out date (YYYY-MM-DD)
- `persons_ages` (string, optional) - Comma-separated ages
- `currency` (string, optional) - Currency code
- `language` (string, optional) - Language code
- `max_results` (number, optional) - Maximum results

**Response**: Location-based accommodations with distance calculations and GPS coordinates.

## 🔐 Authentication

### **API Key Methods**
1. **HTTP Headers** (Recommended for production):
   - `X-MountVacation-API-Key: your_api_key`
   - `Authorization: Bearer your_api_key`

2. **Environment Variables**:
   - `MOUNTVACATION_API_KEY=your_api_key`

3. **MVP Mode**: Fallback API key for testing (no user key required)

### **Getting Your API Key**
1. Visit [MountVacation.si](https://www.mountvacation.si/)
2. Contact their sales team for API access
3. Receive your unique API key for production use

## 📊 Response Data Structure

### **Standard Accommodation Response**
```json
{
  "search_summary": {
    "arrival_date": "2025-03-15",
    "departure_date": "2025-03-22", 
    "nights": 7,
    "persons_count": 4,
    "total_found": 15,
    "currency": "EUR",
    "language": "en"
  },
  "accommodations": [
    {
      "name": "Alpine Mountain Resort",
      "accommodation_id": 12345,
      "location": {
        "city": "Innsbruck",
        "country": "Austria", 
        "region": "Tyrol",
        "coordinates": {
          "latitude": 47.2692,
          "longitude": 11.4041
        }
      },
      "property_details": {
        "category": "4",
        "type": "hotel",
        "beds": 2,
        "bedrooms": 1,
        "max_occupancy": 4,
        "size_sqm": 45
      },
      "pricing": {
        "total_price": 1400,
        "currency": "EUR",
        "nights": 7,
        "price_per_night": 200,
        "additional_fees": []
      },
      "amenities": {
        "wifi": true,
        "parking": true,
        "pool": true,
        "spa": true,
        "ski_in_out": true,
        "restaurant": true,
        "breakfast_included": false
      },
      "images": {
        "thumbnail": "https://example.com/thumb.jpg",
        "gallery": ["https://example.com/1.jpg", "https://example.com/2.jpg"]
      },
      "booking": {
        "property_url": "https://mountvacation.si/property/12345",
        "booking_url": "https://mountvacation.si/book/12345?dates=2025-03-15_2025-03-22&guests=4"
      }
    }
  ]
}
```

## 🌐 Multi-Language & Currency Support

### **Supported Languages**
- `en` - English (default)
- `de` - German  
- `it` - Italian
- `fr` - French
- `es` - Spanish
- `sl` - Slovenian
- `hr` - Croatian

### **Supported Currencies**
- `EUR` - Euro (default)
- `USD` - US Dollar
- `GBP` - British Pound
- `CHF` - Swiss Franc
- `CZK` - Czech Koruna
- `PLN` - Polish Zloty
- And more regional currencies

## 🚀 Performance & Reliability

### **Response Times**
- **Average**: < 2 seconds globally
- **95th percentile**: < 3 seconds
- **Caching**: 5-minute TTL for optimal performance

### **Rate Limits**
- **Standard**: 60 requests/minute per client
- **Burst**: Up to 100 requests/minute for short periods
- **Graceful degradation**: Queuing during high load

### **Error Handling**
- **Comprehensive error messages** with suggested solutions
- **Fallback strategies** for location mapping
- **Retry logic** for transient failures
- **Detailed logging** for debugging

## 📖 Usage Examples

### **Basic European Search**
```json
{
  "tool": "search_accommodations",
  "arguments": {
    "location": "Austrian Alps",
    "arrival_date": "2025-02-15",
    "departure_date": "2025-02-22",
    "persons_ages": "35,33,12,8",
    "currency": "EUR",
    "language": "en",
    "max_results": 10
  }
}
```

### **GPS Coordinate Search**
```json
{
  "tool": "search_by_geolocation", 
  "arguments": {
    "latitude": 46.8182,
    "longitude": 10.5478,
    "radius": 25000,
    "arrival_date": "2025-03-01",
    "nights": 7,
    "persons": 2,
    "currency": "USD"
  }
}
```

### **Multi-Currency Property Details**
```json
{
  "tool": "get_accommodation_details",
  "arguments": {
    "accommodation_id": 12345,
    "language": "de",
    "include_facilities": true
  }
}
```

---

**🏔️ Ready to integrate? Check out our [CLIENT_CONFIGURATIONS.md](../CLIENT_CONFIGURATIONS.md) for copy-paste setup guides!**
