# MountVacation MCP Server API Documentation

## Overview

The MountVacation MCP Server provides a comprehensive Model Context Protocol interface for searching, exploring, and researching mountain vacation accommodations. It offers complete access to the MountVacation API suite including accommodation search, detailed property information, facility details, and booking capabilities.

**Supported Deployments:**
- **Local Development**: Python FastMCP server
- **Production**: TypeScript on Cloudflare Workers with global edge caching
- **Cloud-Hosted**: Public server at `blocklabs-mountvacation-mcp-production.4thtech.workers.dev`

## Available Tools

### 1. search_accommodations (Primary Search Tool)

### Description

Search for mountain vacation accommodations using the MountVacation API. This tool searches for available accommodations in mountain destinations and returns detailed information including pricing, amenities, and booking links.

### Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `location` | string | Yes | City, resort, or region name | "Chamonix", "Zermatt", "Alps" |
| `arrival_date` | string | Yes | Check-in date in YYYY-MM-DD format | "2024-03-10" |
| `departure_date` | string | Yes | Check-out date in YYYY-MM-DD format | "2024-03-17" |
| `persons_ages` | string | Yes | Comma-separated ages of all guests | "18,18,12,8" |
| `currency` | string | No | Currency code for pricing (default: "EUR") | "USD", "GBP", "CHF" |
| `max_results` | number | No | Maximum accommodations to return (default: 5, max: 20) | 10 |

### Response Format

#### Successful Response

```json
{
  "search_summary": {
    "arrival_date": "2024-03-10",
    "departure_date": "2024-03-17",
    "nights": 7,
    "persons_count": 4,
    "total_found": 5,
    "currency": "EUR"
  },
  "accommodations": [
    {
      "name": "Luxury Alpine Chalet",
      "location": {
        "city": "Chamonix",
        "country": "France",
        "resort": "Chamonix Mont-Blanc",
        "region": "Auvergne-Rhône-Alpes",
        "full_address": "Chamonix, Chamonix Mont-Blanc, France",
        "coordinates": {
          "latitude": 45.9237,
          "longitude": 6.8694
        }
      },
      "property_details": {
        "category": "4",
        "type": "apartment",
        "beds": 4,
        "bedrooms": 2,
        "size_sqm": 85,
        "max_occupancy": 6,
        "accommodation_id": 12345
      },
      "pricing": {
        "total_price": 2100,
        "currency": "EUR",
        "nights": 7,
        "price_per_night": 300
      },
      "amenities": {
        "wifi": true,
        "parking": true,
        "pets_allowed": false,
        "breakfast_included": false,
        "balcony": true,
        "kitchen": true,
        "pool": true,
        "wellness": false,
        "ski_in_out": true
      },
      "distances": {
        "to_resort_center": "200m",
        "to_ski_runs": "50m",
        "to_city_center": "500m"
      },
      "booking": {
        "reservation_url": "https://www.mountvacation.co.uk/apartment/luxury-alpine-chalet_chamonix?arrival=2024-03-10&departure=2024-03-17&currency=EUR&lang=en&personsAges=18,18,12,8",
        "free_cancellation_until": "2024-03-05",
        "booking_conditions": "Standard terms apply"
      },
      "property_url": "https://www.mountvacation.co.uk/apartment/luxury-alpine-chalet_chamonix",
      "property_page_url": "https://www.mountvacation.co.uk/apartment/luxury-alpine-chalet_chamonix",
      "images": [
        "https://www.mountvacationmedia.com//a/12345/w/1",
        "https://www.mountvacationmedia.com//a/12345/w/2",
        "https://www.mountvacationmedia.com//a/12345/w/3",
        "https://www.mountvacationmedia.com//a/12345/w/4",
        "https://www.mountvacationmedia.com//a/12345/w/5"
      ],
      "image_gallery": {
        "thumbnail_urls": [
          "https://www.mountvacationmedia.com//a/12345/w/1/t",
          "https://www.mountvacationmedia.com//a/12345/w/2/t",
          "https://www.mountvacationmedia.com//a/12345/w/3/t",
          "https://www.mountvacationmedia.com//a/12345/w/4/t",
          "https://www.mountvacationmedia.com//a/12345/w/5/t"
        ],
        "full_size_urls": [
          "https://www.mountvacationmedia.com//a/12345/w/1/o",
          "https://www.mountvacationmedia.com//a/12345/w/2/o",
          "https://www.mountvacationmedia.com//a/12345/w/3/o",
          "https://www.mountvacationmedia.com//a/12345/w/4/o",
          "https://www.mountvacationmedia.com//a/12345/w/5/o"
        ]
      }
      ]
    }
  ]
}
```

#### Error Response

```json
{
  "error": "No accommodations found for 'NonExistentPlace'. Please try a different location or check the spelling.",
  "suggestions": [
    "Try a nearby city or resort name",
    "Check if the location is a mountain destination",
    "Verify the spelling of the location"
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### No Results Response

```json
{
  "message": "No accommodations found for your search criteria.",
  "search_summary": {
    "arrival_date": "2024-03-10",
    "departure_date": "2024-03-17",
    "nights": 7,
    "persons_count": 4,
    "total_found": 0,
    "currency": "EUR"
  }
}
```

## Search Strategies

The MCP server uses multiple search strategies to find accommodations:

1. **Resort Search**: Searches by resort name (e.g., "Chamonix Mont-Blanc")
2. **City Search**: Searches by city name (e.g., "Chamonix")
3. **Region Search**: Searches by broader region (e.g., "Alps")

The server tries each strategy in order and returns the first successful result.

## Supported Currencies

- EUR (Euro) - Default
- USD (US Dollar)
- GBP (British Pound)
- CHF (Swiss Franc)
- CAD (Canadian Dollar)
- AUD (Australian Dollar)

## Rate Limiting

### Python FastMCP
- No built-in rate limiting (relies on MountVacation API limits)
- Caching reduces API calls for repeated searches

### Cloudflare Workers
- 60 requests per minute per client IP
- Configurable via environment variables
- Automatic cleanup of rate limit data

## Caching

### Memory Cache
- TTL: 300 seconds (5 minutes) by default
- Max size: 1000 entries by default
- LRU eviction when cache is full

### Cloudflare Workers KV (Production)
- Persistent cache across worker instances
- Automatic expiration based on TTL
- Global edge caching for better performance

### 2. get_accommodation_details (Property Details Tool)

#### Description

Get comprehensive property information for a specific accommodation including detailed amenities, facilities, contact information, and property features.

#### Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `accommodation_id` | number | Yes | The accommodation ID from search results | 6307 |
| `language` | string | No | Language for descriptions (default: "en") | "en", "de", "it", "fr" |
| `include_facilities` | boolean | No | Include detailed facility properties (default: true) | true |

#### Response Format

```json
{
  "accommodation_details": {
    "accommodation": 6307,
    "properties": {
      "main": {
        "id": 6307,
        "title": "Veronza Clubresidence",
        "description": "Modern apartment complex with pool and wellness facilities...",
        "category": 3,
        "type": "apartment",
        "city": "Carano",
        "resort": "Val di Fiemme Alpe Cermis",
        "country": "Italy"
      },
      "geolocation": {
        "latitude": 46.290089,
        "longitude": 11.433581
      },
      "accommodationContactInfo": {
        "accommodationUrl": "https://www.mountvacation.co.uk/apartment/veronza-clubresidence_carano"
      },
      "wellness": {
        "pool": true,
        "sauna": false,
        "massage": true
      },
      "distance": {
        "distRuns": 4500,
        "distResort": 4500,
        "distCentre": 1100
      }
    },
    "facilitiesProperties": {
      "39646": {
        "main": {
          "id": 39646,
          "title": "Two-bedroom apartment",
          "beds": 4,
          "bedrooms": 2,
          "bathrooms": 1,
          "sizeSqM": 28
        },
        "amenities": {
          "balcony": true,
          "kitchen": true,
          "wifi": true
        }
      }
    }
  }
}
```

### 3. get_facility_details (Room Details Tool)

#### Description

Get detailed properties for a specific room or facility within an accommodation, including amenities, views, kitchen facilities, and bathroom details.

#### Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `accommodation_id` | number | Yes | The accommodation ID | 6307 |
| `facility_id` | number | Yes | The facility/room ID | 39646 |
| `language` | string | No | Language for descriptions (default: "en") | "en", "de", "it", "fr" |

#### Response Format

```json
{
  "facility_details": {
    "facilityID": 39646,
    "properties": {
      "main": {
        "id": 39646,
        "accommodationID": 6307,
        "beds": 4,
        "bedrooms": 2,
        "bathrooms": 1,
        "sizeSqM": 28,
        "title": "Two-bedroom apartment",
        "type": "apartment"
      },
      "amenities": {
        "balcony": true,
        "internet": true,
        "internetWifi": true,
        "safe": true,
        "tv": true,
        "equippedKitchenette": true
      },
      "bathroom": {
        "bathroomShower": true,
        "hairDryer": true,
        "towelsIncluded": true
      },
      "kitchen": {
        "refrigerator": true,
        "cookingPlates": true,
        "microwaveOven": true,
        "coffeeMachine": true
      },
      "view": {
        "mountainView": true,
        "valleyView": false,
        "southView": true
      }
    }
  }
}
```

## Error Handling

### Common Error Types

1. **Authentication Errors**
   - Invalid credentials
   - Expired credentials
   - Insufficient permissions

2. **Validation Errors**
   - Invalid date format
   - Past arrival date
   - Departure before arrival date

3. **API Errors**
   - Network timeouts
   - Service unavailable
   - Rate limit exceeded

4. **Search Errors**
   - Location not found
   - No accommodations available
   - Invalid search parameters

### Error Response Format

All errors include:
- `error`: Human-readable error message
- `timestamp`: ISO 8601 timestamp
- `suggestions`: Array of helpful suggestions (when applicable)

## Performance

### Response Times
- Target: < 3 seconds for most searches
- Cached results: < 100ms
- Network timeout: 30 seconds

### Optimization Features
- Intelligent caching
- Multiple search strategies
- Connection pooling (Python)
- Edge caching (Cloudflare Workers)

## Monitoring

### Logs
- Structured JSON logging
- Request/response tracking
- Performance metrics
- Error tracking

### Metrics (Cloudflare Workers)
- Request count
- Response times
- Error rates
- Cache hit rates
- Geographic distribution

## Security

### Authentication
- Basic HTTP authentication with MountVacation API
- Environment variable credential storage
- No credential logging

### Input Validation
- Date format validation
- Parameter sanitization
- SQL injection prevention
- XSS protection

### Rate Limiting
- Per-client IP limiting
- Configurable thresholds
- Automatic blocking of abusive clients
