# Changelog

All notable changes to the MountVacation MCP Server project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-09-23

### 🔗 MAJOR: Fixed Missing Property Links Issue

**BREAKING CHANGES:**
- Enhanced response format with new fields for property links and image galleries
- Updated type definitions for comprehensive property data

**FIXED:**
- ✅ **Property Page URLs**: Added `property_page_url` field with direct MountVacation property pages
- ✅ **Reservation URLs**: Enhanced `reservation_url` with complete booking parameters (dates, guests, currency)
- ✅ **accommodationUrl Extraction**: Fixed API response parsing to capture property page links

### 🖼️ NEW: Rich Image Galleries

**ADDED:**
- **Image Gallery Object**: New `image_gallery` field with organized thumbnail and full-size URL arrays
- **Multiple Image Formats**: Support for thumbnail (`/t`), standard, and full-size (`/o`) image URLs
- **MountVacation Media URLs**: Proper formatting for MountVacation's media CDN
- **Up to 5 Images**: Per property with automatic URL generation for different sizes

### 🏨 NEW: Enhanced Property Data

**ADDED:**
- **Accommodation IDs**: `accommodation_id` field for detailed property lookups
- **GPS Coordinates**: Exact `latitude` and `longitude` for mapping integration
- **Region Information**: Enhanced location context with region names
- **Enhanced Amenities**: Pool, wellness, and ski-in/out indicators
- **Property Categories**: Star ratings and accommodation types

### 🛠️ NEW: Additional MCP Tools

**ADDED:**
- **`get_accommodation_details`**: Comprehensive property information tool
  - Detailed amenities across multiple categories (wellness, freetime, food, etc.)
  - Facility properties for all rooms/apartments
  - Contact information and official URLs
  - Cancellation policies and terms
  - Distance information to key locations

- **`get_facility_details`**: Room-specific information tool
  - Individual room amenities (balcony, kitchen, WiFi, etc.)
  - Bathroom facilities (shower, bath, hairdryer, etc.)
  - Kitchen equipment (refrigerator, microwave, dishwasher, etc.)
  - Views (mountain, valley, lake, slopes, etc.)
  - Occupancy limits and bed configurations

### 📊 NEW: Complete API Coverage

**ADDED:**
- **Accommodation Properties API**: Full integration with comprehensive property details
- **Facility Properties API**: Complete room-level information access
- **Booking API Foundation**: Infrastructure for future booking functionality
- **Enhanced Type Definitions**: Complete TypeScript interfaces for all data structures

### 🚀 INFRASTRUCTURE: Enhanced Deployment

**IMPROVED:**
- **Cloudflare Workers**: Updated deployment with all new features
- **API Key Management**: Streamlined authentication using `MOUNTVACATION_API_KEY`
- **Error Handling**: Enhanced error messages and fallback strategies
- **Performance**: Optimized response formatting and caching

### 🧪 TESTING: Comprehensive Validation

**ADDED:**
- **Property Links Testing**: Verified working links to MountVacation property pages
- **Image Gallery Testing**: Confirmed proper URL formatting for all image sizes
- **New Tools Testing**: Validated accommodation and facility details APIs
- **Italian Ski Destinations**: Tested with Madonna di Campiglio and Cortina d'Ampezzo

### 📚 DOCUMENTATION: Complete Updates

**UPDATED:**
- **README.md**: Enhanced feature descriptions and usage examples
- **API_DOCUMENTATION.md**: Added new tools with complete parameter and response documentation
- **CLIENT_INTEGRATION.md**: Updated integration guides with new capabilities
- **DEPLOYMENT_GUIDE.md**: Revised for API key authentication
- **PROJECT_BLUEPRINT.md**: Updated architecture and current status

## [1.2.0] - 2025-09-22

### FIXED: Italian Ski Resort Search

**FIXED:**
- ✅ **Location Mapping**: Fixed Italian ski resort searches using correct region IDs
- ✅ **API Parameters**: Resolved validation errors by using integer IDs instead of strings
- ✅ **Region Coverage**: Added comprehensive mapping for Italian ski areas:
  - Trentino-Alto Adige (Region 911): Madonna di Campiglio, Val Gardena, etc.
  - Veneto (Region 914): Cortina d'Ampezzo, Arabba
  - Valle d'Aosta (Region 913): Cervinia, Courmayeur
  - Lombardy (Region 904): Livigno, Bormio
  - Piedmont (Region 906): Sestriere, Bardonecchia

**IMPROVED:**
- **Search Strategies**: Multiple fallback approaches for location resolution
- **Error Messages**: Better suggestions when locations aren't found
- **API Integration**: Proper parameter validation and error handling

## [1.1.0] - 2025-09-21

### ADDED: Production Deployment

**ADDED:**
- **Cloudflare Workers**: Production deployment infrastructure
- **Global Edge Caching**: Sub-3-second response times worldwide
- **Rate Limiting**: 60 requests/minute per client protection
- **Environment Management**: Secure API key storage with Cloudflare secrets

**IMPROVED:**
- **Performance**: Intelligent caching with TTL-based expiration
- **Reliability**: Robust error handling and graceful degradation
- **Security**: Environment-based credential management

## [1.0.0] - 2025-09-20

### Initial Release

**ADDED:**
- **MCP Protocol Support**: Full Model Context Protocol implementation
- **Accommodation Search**: Basic search functionality for mountain destinations
- **Multi-Client Support**: Claude Desktop, VS Code (Cline), Cursor integration
- **Python FastMCP**: Local development server implementation
- **Basic Documentation**: Setup and integration guides

**FEATURES:**
- Location-based accommodation search
- Pricing and availability information
- Basic amenity filtering
- Multi-currency support
- Error handling and validation

---

## Migration Guide

### Upgrading from 1.x to 2.0

**New Response Fields:**
- `property_page_url`: Direct link to MountVacation property page
- `image_gallery`: Object with thumbnail and full-size image URLs
- `location.coordinates`: GPS coordinates for mapping
- `location.region`: Regional context information
- `property_details.accommodation_id`: For detailed property lookups
- `amenities.pool`, `amenities.wellness`, `amenities.ski_in_out`: Enhanced amenity indicators

**New Tools Available:**
- `get_accommodation_details`: Use with `accommodation_id` from search results
- `get_facility_details`: Use with `accommodation_id` and `facility_id` for room details

**Breaking Changes:**
- Response format includes additional fields (backward compatible)
- Enhanced type definitions may require TypeScript updates if using custom implementations

**Recommended Actions:**
1. Update client integrations to utilize new property links
2. Implement image gallery display for better user experience
3. Use new tools for detailed property research capabilities
4. Update documentation references to new field names
