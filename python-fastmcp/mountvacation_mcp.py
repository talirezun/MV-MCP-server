#!/usr/bin/env python3
"""
MountVacation MCP Server - FastMCP Implementation
A robust MCP server for searching mountain vacation accommodations.
"""

import os
import sys
import json
import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Union
from urllib.parse import urlencode
import time

# Third-party imports
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from fastmcp import FastMCP
from dotenv import load_dotenv
from cachetools import TTLCache
import structlog

# Load environment variables
load_dotenv()

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Configuration
class Config:
    MOUNTVACATION_API_KEY = os.getenv("MOUNTVACATION_API_KEY")
    # Legacy fields (kept for backward compatibility)
    MOUNTVACATION_USERNAME = os.getenv("MOUNTVACATION_USERNAME")
    MOUNTVACATION_PASSWORD = os.getenv("MOUNTVACATION_PASSWORD")
    API_TIMEOUT = int(os.getenv("API_TIMEOUT_SECONDS", "30"))
    MAX_RESULTS_DEFAULT = int(os.getenv("MAX_RESULTS_DEFAULT", "5"))
    MAX_RESULTS_LIMIT = int(os.getenv("MAX_RESULTS_LIMIT", "20"))
    CACHE_TTL = int(os.getenv("CACHE_TTL_SECONDS", "300"))
    MAX_CACHE_SIZE = int(os.getenv("MAX_CACHE_SIZE", "1000"))
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# Validate configuration
if not Config.MOUNTVACATION_API_KEY:
    logger.error("Missing required environment variable: MOUNTVACATION_API_KEY")
    logger.info("Please contact cs@mountvacation.com or +44 20 3514 1200 to get your API key")
    sys.exit(1)

# Initialize cache
search_cache = TTLCache(maxsize=Config.MAX_CACHE_SIZE, ttl=Config.CACHE_TTL)

# Initialize FastMCP server
mcp = FastMCP("MountVacation Search", version="1.0.0")

class MountVacationAPI:
    """Handles all interactions with the MountVacation API"""
    
    BASE_URL = "https://api.mountvacation.com"
    SEARCH_ENDPOINT = "/accommodations/search/"
    
    def __init__(self):
        self.session = requests.Session()
        
        # Configure retry strategy
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
        
        # Set headers (no auth headers needed - API key goes in URL params)
        self.session.headers.update({
            'User-Agent': 'MountVacation-MCP/1.0',
            'Accept': 'application/json'
        })
    
    def search_accommodations(
        self,
        location: str,
        arrival_date: str,
        departure_date: str,
        persons_ages: str,
        currency: str = "EUR",
        max_results: int = 5
    ) -> Dict[str, Any]:
        """Search for accommodations using multiple strategies"""
        
        # Create cache key
        cache_key = f"{location}:{arrival_date}:{departure_date}:{persons_ages}:{currency}:{max_results}"
        
        # Check cache first
        if cache_key in search_cache:
            logger.info("Cache hit", cache_key=cache_key)
            return search_cache[cache_key]
        
        # Validate dates
        try:
            arrival = datetime.strptime(arrival_date, "%Y-%m-%d")
            departure = datetime.strptime(departure_date, "%Y-%m-%d")
            if arrival >= departure:
                raise ValueError("Departure date must be after arrival date")
            if arrival < datetime.now():
                raise ValueError("Arrival date cannot be in the past")
        except ValueError as e:
            return {"error": f"Invalid date format or range: {str(e)}"}
        
        # Base search parameters
        base_params = {
            'arrival': arrival_date,
            'departure': departure_date,
            'personsAges': persons_ages,
            'currency': currency,
            'lang': 'en'
        }
        
        # Try multiple search strategies with location name to ID mapping
        # Since API requires integer IDs, we need to map common location names
        location_mappings = self._get_location_mappings()

        search_strategies = []

        # Try to find location in our mappings
        location_lower = location.lower()
        for mapping in location_mappings:
            if location_lower in mapping['names']:
                if mapping['type'] == 'resort':
                    search_strategies.append({'resort': mapping['id']})
                elif mapping['type'] == 'city':
                    search_strategies.append({'city': mapping['id']})
                elif mapping['type'] == 'region':
                    search_strategies.append({'region': mapping['id']})
                elif mapping['type'] == 'skiarea':
                    search_strategies.append({'skiarea': mapping['id']})

        # If no mappings found, try geolocation search for common ski areas
        if not search_strategies:
            geo_coords = self._get_geolocation_for_area(location_lower)
            if geo_coords:
                search_strategies.append({
                    'latitude': geo_coords['lat'],
                    'longitude': geo_coords['lng'],
                    'radius': geo_coords['radius']
                })
        
        for strategy in search_strategies:
            try:
                params = {**base_params, **strategy}
                result = self._make_api_request(params)
                
                if result and not result.get('error'):
                    formatted_result = self._format_results(result, max_results)
                    # Cache successful results
                    search_cache[cache_key] = formatted_result
                    logger.info("Search successful", strategy=strategy, results_count=len(formatted_result.get('accommodations', [])))
                    return formatted_result
                    
            except Exception as e:
                logger.warning("Search strategy failed", strategy=strategy, error=str(e))
                continue
        
        # If all strategies failed
        error_result = {
            "error": f"No accommodations found for '{location}'. Please try a different location or check the spelling.",
            "suggestions": [
                "Try a nearby city or resort name",
                "Check if the location is a mountain destination",
                "Verify the spelling of the location"
            ]
        }
        search_cache[cache_key] = error_result
        return error_result
    
    def _make_api_request(self, params: Dict[str, str]) -> Optional[Dict[str, Any]]:
        """Make API request with error handling"""

        url = f"{self.BASE_URL}{self.SEARCH_ENDPOINT}"

        # Add API key to parameters
        params_with_key = {**params, 'apiKey': Config.MOUNTVACATION_API_KEY}

        try:
            logger.info("Making API request", url=url, params={k: v for k, v in params_with_key.items() if k != 'apiKey'})
            response = self.session.get(url, params=params_with_key, timeout=Config.API_TIMEOUT)
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 401:
                logger.error("Authentication failed - check credentials")
                return {"error": "Authentication failed. Please check your API credentials."}
            elif response.status_code == 429:
                logger.warning("Rate limit exceeded")
                return {"error": "Rate limit exceeded. Please try again later."}
            else:
                logger.warning("API request failed", status_code=response.status_code, response=response.text)
                return {"error": f"API request failed with status {response.status_code}"}
                
        except requests.exceptions.Timeout:
            logger.error("API request timeout")
            return {"error": "Request timeout. Please try again."}
        except requests.exceptions.ConnectionError:
            logger.error("API connection error")
            return {"error": "Connection error. Please check your internet connection."}
        except Exception as e:
            logger.error("Unexpected API error", error=str(e))
            return {"error": f"Unexpected error: {str(e)}"}
    
    def _format_results(self, data: Dict[str, Any], max_results: int) -> Dict[str, Any]:
        """Format API response for LLM consumption"""
        
        accommodations = data.get('accommodations', [])[:max_results]
        
        if not accommodations:
            return {
                "message": "No accommodations found for your search criteria.",
                "search_info": {
                    'arrival': data.get('arrival'),
                    'departure': data.get('departure'),
                    'nights': data.get('nights'),
                    'persons': len(data.get('personsAges', []))
                }
            }
        
        # Check if user searched for unavailable location
        location_warning = None
        if location.lower() in ['colfosco', 'corvara', 'alta badia', 'val badia']:
            location_warning = f"Note: {location} is not available in the MountVacation API. Showing results from the closest available Dolomites area (Anterselva/Kronplatz, about 1 hour drive from Alta Badia)."

        results = {
            'search_summary': {
                'arrival_date': data.get('arrival'),
                'departure_date': data.get('departure'),
                'nights': data.get('nights'),
                'persons_count': len(data.get('personsAges', [])),
                'total_found': len(accommodations),
                'currency': data.get('currency', 'EUR'),
                'location_searched': location,
                'location_warning': location_warning
            },
            'accommodations': []
        }
        
        for acc in accommodations:
            # Get the best offer (usually first one)
            offers = acc.get('offers', [])
            best_offer = offers[0] if offers else {}
            
            formatted_acc = {
                'name': acc.get('title', 'N/A'),
                'location': {
                    'city': acc.get('city', 'N/A'),
                    'country': acc.get('country', 'N/A'),
                    'resort': acc.get('resort', 'N/A'),
                    'full_address': f"{acc.get('city', 'N/A')}, {acc.get('country', 'N/A')}"
                },
                'property_details': {
                    'category': acc.get('category', 'N/A'),
                    'type': acc.get('type', 'N/A'),
                    'beds': best_offer.get('beds', 'N/A'),
                    'bedrooms': best_offer.get('bedrooms', 'N/A'),
                    'size_sqm': best_offer.get('sizeSqM', 'N/A'),
                    'max_occupancy': best_offer.get('maxPersons', 'N/A')
                },
                'pricing': {
                    'total_price': best_offer.get('totalPrice', 'N/A'),
                    'currency': data.get('currency', 'EUR'),
                    'nights': data.get('nights', 'N/A'),
                    'price_per_night': round(best_offer.get('totalPrice', 0) / max(data.get('nights', 1), 1), 2) if best_offer.get('totalPrice') else 'N/A'
                },
                'amenities': {
                    'wifi': acc.get('internetWifi', False),
                    'parking': acc.get('parking', False),
                    'pets_allowed': acc.get('pets', False),
                    'breakfast_included': best_offer.get('breakfastIncluded', False),
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
                    'booking_conditions': best_offer.get('conditions', 'Standard terms apply')
                },
                'property_url': acc.get('url', 'N/A'),
                'images': acc.get('images', [])[:3]  # Limit to first 3 images
            }
            
            results['accommodations'].append(formatted_acc)
        
        return results

    def _get_location_mappings(self) -> List[Dict[str, Any]]:
        """Get location name to ID mappings for common ski destinations"""
        return [
            # Italian Dolomites & Alps (Working IDs found!)
            {
                'names': ['madonna di campiglio', 'campiglio', 'trentino'],
                'type': 'resort',
                'id': '7',
                'description': 'Madonna di Campiglio - Famous Italian ski resort'
            },
            {
                'names': ['anterselva', 'antholz', 'south tyrol', 'alto adige', 'dolomites', 'dolomiti'],
                'type': 'resort',
                'id': '11',
                'description': 'Anterselva di Mezzo - South Tyrol Dolomites area'
            },
            {
                'names': ['pinzolo', 'val rendena'],
                'type': 'resort',
                'id': '18',
                'description': 'Pinzolo - Italian Alps'
            },
            {
                'names': ['folgaria', 'alpe cimbra'],
                'type': 'resort',
                'id': '42',
                'description': 'Folgaria - Italian ski area'
            },
            {
                'names': ['chienes', 'kiens', 'val pusteria'],
                'type': 'city',
                'id': '82',
                'description': 'Chienes - South Tyrol, close to Dolomites'
            },
            {
                'names': ['bormio', 'valtellina'],
                'type': 'skiarea',
                'id': '19',
                'description': 'Bormio - Famous Italian ski resort'
            },
            {
                'names': ['vason', 'monte bondone'],
                'type': 'skiarea',
                'id': '4',
                'description': 'Vason - Italian Alps ski area'
            },
            # Note: Colfosco/Corvara/Alta Badia not available in API
            # Using closest available Dolomites locations
            {
                'names': ['colfosco', 'corvara', 'alta badia', 'val badia'],
                'type': 'resort',
                'id': '11',  # Anterselva/Kronplatz - closest available (1hr drive)
                'description': 'Anterselva/Kronplatz area - closest to Colfosco/Corvara (Alta Badia not available in API)'
            },
            {
                'names': ['italy dolomites', 'italian dolomites', 'dolomites', 'dolomiti'],
                'type': 'resort',
                'id': '7',  # Madonna di Campiglio - popular Italian ski resort
                'description': 'Madonna di Campiglio - major Italian Dolomites ski resort'
            },
            # French Alps (Working IDs)
            {
                'names': ['val thorens', 'les trois vallees', '3 vallees'],
                'type': 'resort',
                'id': '10',
                'description': 'Val Thorens - Highest ski resort in Europe'
            },
            {
                'names': ['meribel', 'les bruyeres', 'courchevel area'],
                'type': 'skiarea',
                'id': '1',
                'description': 'Méribel/Les Bruyères - Three Valleys ski area'
            },
            # Austrian/Slovenian Alps (Working IDs)
            {
                'names': ['cerklje', 'slovenia', 'kranj area'],
                'type': 'resort',
                'id': '142',
                'description': 'Cerklje na Gorenjskem - Slovenian Alps'
            },
            {
                'names': ['slovenia city', 'slovenian alps'],
                'type': 'city',
                'id': '1152',
                'description': 'Slovenian Alps city area'
            }
        ]

    def _get_geolocation_for_area(self, location: str) -> Optional[Dict[str, str]]:
        """Get geolocation coordinates for common ski areas"""
        # Fallback geolocation mapping for areas not in main mappings
        fallback_coords = {
            'italy': {'lat': '46.0', 'lng': '11.0', 'radius': '50000'},
            'france': {'lat': '45.5', 'lng': '6.5', 'radius': '50000'},
            'austria': {'lat': '47.0', 'lng': '11.0', 'radius': '50000'},
            'switzerland': {'lat': '46.5', 'lng': '8.0', 'radius': '50000'},
            'alps': {'lat': '46.0', 'lng': '8.0', 'radius': '100000'}
        }

        return fallback_coords.get(location)

# Initialize API client
api_client = MountVacationAPI()

@mcp.tool("search_accommodations")
def search_accommodations(
    location: str,
    arrival_date: str,
    departure_date: str,
    persons_ages: str,
    currency: str = "EUR",
    max_results: int = Config.MAX_RESULTS_DEFAULT
) -> Dict[str, Any]:
    """
    Search for mountain vacation accommodations using the MountVacation API.
    
    This tool searches for available accommodations in mountain destinations
    and returns detailed information including pricing, amenities, and booking links.
    
    Args:
        location: City, resort, or region name (e.g., "Chamonix", "Zermatt", "Alps")
        arrival_date: Check-in date in YYYY-MM-DD format (e.g., "2024-03-10")
        departure_date: Check-out date in YYYY-MM-DD format (e.g., "2024-03-17")
        persons_ages: Comma-separated ages of all guests (e.g., "18,18,12,8" for 2 adults and 2 children)
        currency: Currency code for pricing (default: "EUR", also supports "USD", "GBP", "CHF")
        max_results: Maximum number of accommodations to return (default: 5, max: 20)
    
    Returns:
        Dictionary containing search results with accommodation details, pricing, and booking information.
        Each result includes property details, amenities, distances to key locations, and direct booking links.
    
    Example:
        search_accommodations(
            location="Chamonix",
            arrival_date="2024-03-10", 
            departure_date="2024-03-17",
            persons_ages="18,18,12,8",
            currency="EUR",
            max_results=5
        )
    """
    
    # Validate max_results
    max_results = min(max_results, Config.MAX_RESULTS_LIMIT)
    
    logger.info("Search request received", 
                location=location, 
                arrival_date=arrival_date, 
                departure_date=departure_date,
                persons_ages=persons_ages,
                currency=currency,
                max_results=max_results)
    
    try:
        result = api_client.search_accommodations(
            location=location,
            arrival_date=arrival_date,
            departure_date=departure_date,
            persons_ages=persons_ages,
            currency=currency,
            max_results=max_results
        )
        
        logger.info("Search completed", 
                    success=not result.get('error'),
                    results_count=len(result.get('accommodations', [])))
        
        return result
        
    except Exception as e:
        logger.error("Search failed with exception", error=str(e))
        return {
            "error": f"Search failed: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }

if __name__ == "__main__":
    logger.info("Starting MountVacation MCP Server", version="1.0.0")
    try:
        mcp.run()
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error("Server crashed", error=str(e))
        sys.exit(1)
