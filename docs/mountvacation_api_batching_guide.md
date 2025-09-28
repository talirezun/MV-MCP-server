# MountVacation API Batching: Complete Implementation Guide

## Overview

The MountVacation API implements **pagination/batching** to handle large search results efficiently. Instead of returning all accommodations in a single response (which could be hundreds of properties), the API returns results in **batches** (pages) of typically 20-30 accommodations per request.

This document provides comprehensive guidance on implementing proper batching support in the MountVacation MCP to ensure users get complete search results equivalent to the mountvacation.com website experience.

## Understanding API Batching Mechanics

### What is Batching?

**Batching** (also called pagination) is a technique where:
1. A search might find 200+ accommodations
2. The API returns only the first 25-30 in the initial response
3. Additional API calls are needed to retrieve remaining results
4. Each "batch" contains a subset of the total results

### Why Does MountVacation Use Batching?

- **Performance**: Faster response times for initial results
- **Memory efficiency**: Smaller payloads reduce bandwidth usage
- **User experience**: Users can start viewing results immediately
- **Server load**: Distributed processing reduces server strain

## MountVacation Batching Response Structure

### Standard Search Response Format

```json
{
  "arrival": "2025-09-28",
  "departure": "2025-09-29",
  "nights": 1,
  "personsAges": [18, 18],
  "accommodations": [
    {
      "id": "12345",
      "title": "Alpine Chalet Deluxe",
      "city": "Chamonix",
      "country": "France",
      "offers": [
        {
          "totalPrice": 450.00,
          "currency": "EUR",
          "reservationUrl": "https://mountvacation.com/book/12345",
          "beds": 2,
          "bedrooms": 1
        }
      ]
    }
    // ... more accommodations (typically 20-30 per batch)
  ],
  "links": {
    "next": "https://api.mountvacation.com/accommodations/search?arrival=2025-09-28&departure=2025-09-29&resort=9436&currency=EUR&lang=si&personsAges=18,18&page=2",
    "nextRel": "/accommodations/search?arrival=2025-09-28&departure=2025-09-29&resort=9436&currency=EUR&lang=si&personsAges=18,18&page=2",
    "nextPage": 2,
    "extendedAreaSearch": "https://api.mountvacation.com/accommodations/search?arrival=2025-09-28&departure=2025-09-29&region=4252&currency=EUR&lang=si&personsAges=18,18"
  }
}
```

### Links Object Explanation

| Field | Purpose | Example |
|-------|---------|---------|
| `next` | Full URL for the next batch of results | `https://api.mountvacation.com/...&page=2` |
| `nextRel` | Relative URL for the next batch | `/accommodations/search?...&page=2` |
| `nextPage` | Page number for the next batch | `2`, `3`, `4`, etc. |
| `extendedAreaSearch` | URL to search broader geographic area | Search region instead of specific resort |

### End of Results Detection

**Batching is complete** when the response **lacks** these fields in the `links` object:
- `next`
- `nextRel`
- `nextPage`

```json
{
  "accommodations": [
    // Last batch of results
  ],
  "links": {
    "extendedAreaSearch": "https://api.mountvacation.com/..."
    // Notice: NO next, nextRel, or nextPage fields
  }
}
```

## Implementation Strategies

### Strategy 1: Single Batch (Fast & Simple)

**Best for**: Quick searches, mobile users, initial MVP

```python
@mcp.tool("search_accommodations")
def search_accommodations_single_batch(
    location: str,
    arrival_date: str,
    departure_date: str,
    persons_ages: str,
    max_results: int = 10
) -> dict:
    """
    Get accommodations from the first batch only (fastest response)
    """
    
    # Build initial search URL
    api_url = "https://api.mountvacation.com/accommodations/search/"
    params = {
        'arrival': arrival_date,
        'departure': departure_date,
        'personsAges': persons_ages,
        'currency': 'EUR',
        'lang': 'en'
    }
    
    # Try resort search first, then city
    search_strategies = [
        {'resort': location},
        {'city': location}
    ]
    
    for strategy in search_strategies:
        search_params = {**params, **strategy}
        
        try:
            response = requests.get(
                api_url,
                params=search_params,
                auth=(api_user, api_password),
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                accommodations = data.get('accommodations', [])[:max_results]
                
                # Check if more results are available
                links = data.get('links', {})
                has_more = bool(links.get('next'))
                total_in_batch = len(data.get('accommodations', []))
                
                return {
                    'search_info': {
                        'location': location,
                        'arrival': data.get('arrival'),
                        'departure': data.get('departure'),
                        'nights': data.get('nights'),
                        'persons': len(data.get('personsAges', []))
                    },
                    'results': {
                        'showing': len(accommodations),
                        'total_in_first_batch': total_in_batch,
                        'more_available': has_more,
                        'message': f"Showing first {len(accommodations)} results" + 
                                 (f". {total_in_batch - len(accommodations)} more in this batch, plus additional pages available." if has_more else ".")
                    },
                    'accommodations': format_accommodations(accommodations)
                }
                
        except Exception as e:
            continue
    
    return {"error": f"No accommodations found for '{location}'"}
```

### Strategy 2: Complete Results Collection (Comprehensive)

**Best for**: Desktop users, detailed searches, when completeness is critical

```python
@mcp.tool("search_accommodations_complete")
def search_accommodations_complete(
    location: str,
    arrival_date: str,
    departure_date: str,
    persons_ages: str,
    max_total_results: int = 50
) -> dict:
    """
    Get all available accommodations by following pagination links
    """
    
    all_accommodations = []
    current_url = None
    page_count = 0
    max_pages = 10  # Safety limit to prevent infinite loops
    
    # Build initial search URL
    api_url = "https://api.mountvacation.com/accommodations/search/"
    params = {
        'arrival': arrival_date,
        'departure': departure_date,
        'personsAges': persons_ages,
        'currency': 'EUR',
        'lang': 'en'
    }
    
    # Try different search strategies
    search_strategies = [
        {'resort': location},
        {'city': location}
    ]
    
    for strategy in search_strategies:
        search_params = {**params, **strategy}
        current_url = f"{api_url}?{urlencode(search_params)}"
        
        # Collect all batches
        while current_url and page_count < max_pages:
            try:
                if page_count == 0:
                    # First request with auth
                    response = requests.get(
                        current_url,
                        auth=(api_user, api_password),
                        timeout=30
                    )
                else:
                    # Subsequent requests (URLs already include auth params)
                    response = requests.get(current_url, timeout=30)
                
                if response.status_code != 200:
                    break
                
                data = response.json()
                batch_accommodations = data.get('accommodations', [])
                
                if not batch_accommodations:
                    break
                
                all_accommodations.extend(batch_accommodations)
                page_count += 1
                
                # Check for next page
                links = data.get('links', {})
                current_url = links.get('next')
                
                # Stop if we have enough results
                if len(all_accommodations) >= max_total_results:
                    all_accommodations = all_accommodations[:max_total_results]
                    break
                
                # Stop if no more pages
                if not current_url:
                    break
                    
                # Small delay to be respectful to the API
                time.sleep(0.5)
                
            except Exception as e:
                print(f"Error fetching page {page_count + 1}: {e}")
                break
        
        # If we found results, stop trying other strategies
        if all_accommodations:
            break
    
    if not all_accommodations:
        return {"error": f"No accommodations found for '{location}'"}
    
    return {
        'search_info': {
            'location': location,
            'arrival': arrival_date,
            'departure': departure_date,
            'total_pages_fetched': page_count,
            'collection_method': 'complete_pagination'
        },
        'results': {
            'total_found': len(all_accommodations),
            'pages_searched': page_count,
            'truncated': len(all_accommodations) >= max_total_results
        },
        'accommodations': format_accommodations(all_accommodations)
    }
```

### Strategy 3: Progressive Loading (Best User Experience)

**Best for**: Interactive applications, allowing user control over data loading

```python
@mcp.tool("search_accommodations")
def search_accommodations_progressive(
    location: str,
    arrival_date: str,
    departure_date: str,
    persons_ages: str,
    initial_batch_size: int = 10
) -> dict:
    """
    Get first batch with option to load more
    """
    
    # Get first batch (same as Strategy 1)
    result = search_accommodations_single_batch(
        location, arrival_date, departure_date, persons_ages, initial_batch_size
    )
    
    # Add pagination context if more results available
    if result.get('results', {}).get('more_available'):
        result['pagination'] = {
            'has_more_batches': True,
            'use_tool': 'load_more_accommodations',
            'instructions': 'Use load_more_accommodations tool to get additional results'
        }
    
    return result

@mcp.tool("load_more_accommodations")
def load_more_accommodations(
    next_page_url: str,
    max_additional_results: int = 20
) -> dict:
    """
    Load the next batch of accommodations using pagination URL
    """
    
    try:
        # The next_page_url already contains all necessary parameters
        response = requests.get(next_page_url, timeout=30)
        
        if response.status_code != 200:
            return {"error": f"Failed to load more results: HTTP {response.status_code}"}
        
        data = response.json()
        accommodations = data.get('accommodations', [])[:max_additional_results]
        
        # Check for even more results
        links = data.get('links', {})
        has_more = bool(links.get('next'))
        
        result = {
            'batch_info': {
                'page_number': links.get('nextPage', 1) - 1,  # Current page
                'accommodations_in_batch': len(accommodations),
                'more_available': has_more
            },
            'accommodations': format_accommodations(accommodations)
        }
        
        if has_more:
            result['pagination'] = {
                'next_page_url': links.get('next'),
                'instructions': 'Call load_more_accommodations again with the new next_page_url to get more results'
            }
        
        return result
        
    except Exception as e:
        return {"error": f"Failed to load more accommodations: {str(e)}"}

@mcp.tool("search_extended_area")
def search_extended_area(extended_area_url: str) -> dict:
    """
    Search a broader geographic area when local results are limited
    """
    
    try:
        response = requests.get(extended_area_url, timeout=30)
        
        if response.status_code != 200:
            return {"error": f"Extended area search failed: HTTP {response.status_code}"}
        
        data = response.json()
        accommodations = data.get('accommodations', [])
        
        return {
            'search_type': 'extended_area',
            'results': {
                'total_found': len(accommodations),
                'area_expanded': True
            },
            'accommodations': format_accommodations(accommodations)
        }
        
    except Exception as e:
        return {"error": f"Extended area search failed: {str(e)}"}
```

## Utility Functions

### Accommodation Formatting

```python
def format_accommodations(accommodations_list: list) -> list:
    """
    Format raw API accommodation data for LLM consumption
    """
    
    formatted = []
    
    for acc in accommodations_list:
        # Get best offer (usually first one)
        best_offer = acc.get('offers', [{}])[0] if acc.get('offers') else {}
        
        formatted_acc = {
            'property_id': acc.get('id'),
            'name': acc.get('title', 'N/A'),
            'location': {
                'city': acc.get('city', 'N/A'),
                'country': acc.get('country', 'N/A'),
                'resort': acc.get('resort', 'N/A'),
                'altitude': acc.get('altitude', 'N/A')
            },
            'property_details': {
                'category': acc.get('category', 'N/A'),
                'type': acc.get('type', 'N/A'),
                'size_sqm': best_offer.get('sizeSqM', 'N/A'),
                'bedrooms': best_offer.get('bedrooms', 'N/A'),
                'beds': best_offer.get('beds', 'N/A'),
                'max_persons': best_offer.get('maxPersons', 'N/A')
            },
            'pricing': {
                'total_price': best_offer.get('totalPrice', 'N/A'),
                'currency': acc.get('currency', 'EUR'),
                'price_per_night': best_offer.get('pricePerNight', 'N/A'),
                'includes_breakfast': best_offer.get('breakfastIncluded', False)
            },
            'amenities': {
                'wifi': acc.get('internetWifi', False),
                'parking': acc.get('parking', False),
                'pets_allowed': acc.get('pets', False),
                'balcony': acc.get('balcony', False),
                'kitchen': acc.get('kitchen', False)
            },
            'distances': {
                'to_resort_center': f"{acc.get('distResort', 'N/A')}m",
                'to_ski_runs': f"{acc.get('distRuns', 'N/A')}m",
                'to_city_center': f"{acc.get('distCentre', 'N/A')}m"
            },
            'booking': {
                'reservation_url': best_offer.get('reservationUrl', 'N/A'),
                'free_cancellation_until': best_offer.get('freeCancellationBefore', 'Check policy'),
                'booking_reference': best_offer.get('bookingReference', 'N/A')
            },
            'property_url': acc.get('url', 'N/A'),
            'images': acc.get('imageUrls', [])
        }
        
        formatted.append(formatted_acc)
    
    return formatted

def urlencode(params: dict) -> str:
    """URL encode parameters for API requests"""
    from urllib.parse import urlencode as url_encode
    return url_encode(params)
```

### Error Handling

```python
def handle_api_error(response, context: str = "API request"):
    """
    Standardized error handling for MountVacation API responses
    """
    
    if response.status_code == 401:
        return {"error": "Authentication failed. Check API credentials."}
    elif response.status_code == 403:
        return {"error": "API access forbidden. Verify account permissions."}
    elif response.status_code == 429:
        return {"error": "Rate limit exceeded. Please wait before making more requests."}
    elif response.status_code == 500:
        return {"error": "MountVacation server error. Please try again later."}
    elif response.status_code != 200:
        return {"error": f"{context} failed with HTTP {response.status_code}"}
    
    try:
        return response.json()
    except ValueError:
        return {"error": f"Invalid JSON response from {context}"}
```

## Recommended Implementation Approach

### For MountVacation MCP Development

**Phase 1: MVP (Use Strategy 1)**
- Implement single batch retrieval for fast initial results
- Show users if more results are available
- Simple and reliable for early testing

**Phase 2: Enhanced (Add Strategy 3)**
- Add `load_more_accommodations` tool for user-controlled pagination
- Implement extended area search capability
- Provides flexibility while maintaining performance

**Phase 3: Complete (Optional Strategy 2)**
- Add complete results collection for power users
- Include safety limits and rate limiting
- Use for specific use cases requiring comprehensive data

### Configuration Recommendations

```python
# Configuration constants
BATCH_CONFIG = {
    'initial_batch_size': 10,        # Results to show initially
    'max_additional_per_request': 20, # Results per "load more" request
    'max_total_results': 100,        # Safety limit for complete collection
    'max_pages_per_search': 10,      # Prevent infinite pagination
    'api_timeout_seconds': 30,       # Request timeout
    'rate_limit_delay': 0.5          # Delay between batch requests
}
```

### Error Recovery Strategy

```python
def robust_batch_collection(initial_url, max_retries=3):
    """
    Collect batches with retry logic and graceful degradation
    """
    
    all_accommodations = []
    current_url = initial_url
    retry_count = 0
    
    while current_url and retry_count < max_retries:
        try:
            response = requests.get(current_url, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                batch = data.get('accommodations', [])
                all_accommodations.extend(batch)
                
                # Reset retry count on success
                retry_count = 0
                
                # Get next URL
                current_url = data.get('links', {}).get('next')
                
            else:
                retry_count += 1
                time.sleep(1 * retry_count)  # Exponential backoff
                
        except Exception as e:
            retry_count += 1
            time.sleep(1 * retry_count)
            
            if retry_count >= max_retries:
                # Return partial results rather than failing completely
                break
    
    return all_accommodations
```

## Testing Strategy

### Test Cases for Batching

```python
# Test scenarios to verify batching implementation
test_cases = [
    {
        'name': 'Small result set (single batch)',
        'location': 'Small Resort',
        'expected': 'Should return all results in first batch, no pagination links'
    },
    {
        'name': 'Large result set (multiple batches)',
        'location': 'Chamonix',
        'expected': 'Should return first batch with pagination links'
    },
    {
        'name': 'No results',
        'location': 'NonExistentPlace123',
        'expected': 'Should return appropriate error message'
    },
    {
        'name': 'Network timeout during pagination',
        'simulation': 'Mock timeout on page 3',
        'expected': 'Should return partial results from successful pages'
    },
    {
        'name': 'Invalid next page URL',
        'simulation': 'Corrupted pagination URL',
        'expected': 'Should handle gracefully and return available results'
    }
]
```

### Performance Monitoring

```python
import time

def monitor_batch_performance(search_function):
    """
    Decorator to monitor batching performance
    """
    
    def wrapper(*args, **kwargs):
        start_time = time.time()
        
        result = search_function(*args, **kwargs)
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Add performance metrics to result
        if isinstance(result, dict):
            result['performance'] = {
                'request_duration_seconds': round(duration, 2),
                'batches_processed': result.get('results', {}).get('pages_searched', 1),
                'average_time_per_batch': round(duration / max(1, result.get('results', {}).get('pages_searched', 1)), 2)
            }
        
        return result
    
    return wrapper
```

## Best Practices Summary

### Do's
- ✅ Always check for `links.next` to detect if more results are available
- ✅ Implement timeout handling for API requests
- ✅ Provide clear feedback to users about result completeness
- ✅ Include safety limits to prevent runaway pagination
- ✅ Use appropriate delays between batch requests
- ✅ Handle partial failures gracefully
- ✅ Cache results when appropriate to reduce API calls

### Don'ts
- ❌ Don't assume all results fit in the first batch
- ❌ Don't ignore pagination links in API responses
- ❌ Don't make unlimited pagination requests without safety limits
- ❌ Don't fail completely if one batch fails - return partial results
- ❌ Don't forget to handle network timeouts
- ❌ Don't make rapid successive requests without rate limiting
- ❌ Don't expose pagination complexity unnecessarily to end users

## Integration with MCP Framework

### FastMCP Implementation Example

```python
from fastmcp import FastMCP
import requests
import time
from urllib.parse import urlencode

mcp = FastMCP("MountVacation Search with Batching")

@mcp.tool("search_accommodations")
def search_accommodations(
    location: str,
    arrival_date: str,
    departure_date: str,
    persons_ages: str,
    strategy: str = "progressive"  # "single", "progressive", "complete"
) -> dict:
    """
    Search for mountain vacation accommodations with configurable batching strategy
    
    Args:
        location: City, resort, or region name
        arrival_date: Check-in date (YYYY-MM-DD)
        departure_date: Check-out date (YYYY-MM-DD)
        persons_ages: Comma-separated ages of guests
        strategy: Batching strategy - "single" (fast), "progressive" (balanced), "complete" (thorough)
    """
    
    if strategy == "single":
        return search_accommodations_single_batch(location, arrival_date, departure_date, persons_ages)
    elif strategy == "progressive":
        return search_accommodations_progressive(location, arrival_date, departure_date, persons_ages)
    elif strategy == "complete":
        return search_accommodations_complete(location, arrival_date, departure_date, persons_ages)
    else:
        return {"error": f"Unknown strategy '{strategy}'. Use 'single', 'progressive', or 'complete'."}
```

This comprehensive guide ensures your MountVacation MCP implementation properly handles the API's batching system, providing users with complete search results equivalent to the mountvacation.com website experience while maintaining good performance and user experience.