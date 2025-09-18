# MountVacation MCP Server API Documentation

## Overview

The MountVacation MCP Server provides a Model Context Protocol interface for searching mountain vacation accommodations. It supports both local development (Python FastMCP) and production deployment (TypeScript on Cloudflare Workers).

## Tool: search_accommodations

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
        "full_address": "Chamonix, France"
      },
      "property_details": {
        "category": "Chalet",
        "type": "Apartment",
        "beds": 4,
        "bedrooms": 2,
        "size_sqm": 85,
        "max_occupancy": 6
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
        "kitchen": true
      },
      "distances": {
        "to_resort_center": "200m",
        "to_ski_runs": "50m",
        "to_city_center": "500m"
      },
      "booking": {
        "reservation_url": "https://mountvacation.com/book/12345",
        "free_cancellation_until": "2024-03-05",
        "booking_conditions": "Standard terms apply"
      },
      "property_url": "https://mountvacation.com/property/12345",
      "images": [
        "https://images.mountvacation.com/12345/1.jpg",
        "https://images.mountvacation.com/12345/2.jpg",
        "https://images.mountvacation.com/12345/3.jpg"
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
