/**
 * MountVacation API Client for Cloudflare Workers
 */

import {
  Env,
  SearchParams,
  SearchResult,
  APIResponse,
  RawAccommodation,
  FormattedAccommodation,
  AccommodationProperties,
  FacilityProperties,
  BookingRequest,
  BookingResponse
} from '../types';
import { Logger } from '../utils/logger';

// Location mapping for popular ski destinations
// This maps location names to MountVacation API IDs
interface LocationMapping {
  resort?: number;
  city?: number;
  region?: number;
  skiarea?: number;
  coordinates?: { lat: number; lng: number; radius?: number };
}

const LOCATION_MAPPINGS: Record<string, LocationMapping> = {
  // Italian Dolomites - Use correct region IDs
  'madonna di campiglio': { region: 911 }, // Trentino-Alto Adige
  'campiglio': { region: 911 },
  'val di sole': { region: 911 },
  'cortina d\'ampezzo': { region: 914 }, // Veneto
  'cortina': { region: 914 },
  'val gardena': { region: 911 }, // Trentino-Alto Adige
  'selva di val gardena': { region: 911 },
  'ortisei': { region: 911 },
  'santa cristina': { region: 911 },
  'alpe di siusi': { region: 911 },
  'kronplatz': { region: 911 },
  'plan de corones': { region: 911 },
  'alta badia': { region: 911 },
  'corvara': { region: 911 },
  'la villa': { region: 911 },
  'san cassiano': { region: 911 },
  'arabba': { region: 914 }, // Veneto
  'marmolada': { region: 914 },
  'canazei': { region: 911 },
  'campitello': { region: 911 },
  'moena': { region: 911 },
  'predazzo': { region: 911 },
  'cavalese': { region: 911 },

  // Other Italian ski areas
  'livigno': { region: 904 }, // Lombardy
  'bormio': { region: 904 }, // Lombardy
  'ponte di legno': { region: 904 }, // Lombardy
  'tonale': { region: 911 }, // Trentino-Alto Adige
  'passo tonale': { region: 911 },
  'cervinia': { region: 913 }, // Valle d'Aosta
  'breuil-cervinia': { region: 913 },
  'courmayeur': { region: 913 }, // Valle d'Aosta
  'la thuile': { region: 913 },
  'san martino di castrozza': { region: 911 }, // Trentino-Alto Adige
  'folgaria': { region: 911 },
  'andalo': { region: 911 },
  'molveno': { region: 911 },
  'pinzolo': { region: 911 },
  'folgarida': { region: 911 },
  'marilleva': { region: 911 },
  'sestriere': { region: 906 }, // Piedmont
  'bardonecchia': { region: 906 },
  'sauze d\'oulx': { region: 906 },
  'claviere': { region: 906 },
  'limone piemonte': { region: 906 },
  'pila': { region: 913 }, // Valle d'Aosta
  'via lattea': { region: 906 }, // Piedmont

  // French Alps
  'chamonix': { resort: 9471 },
  'val d\'isere': { resort: 9472 },
  'tignes': { resort: 9473 },
  'les arcs': { resort: 9474 },
  'la plagne': { resort: 9475 },
  'courchevel': { resort: 9476 },
  'meribel': { resort: 9477 },
  'val thorens': { resort: 9478 },
  'les menuires': { resort: 9479 },
  'alpe d\'huez': { resort: 9480 },
  'les deux alpes': { resort: 9481 },
  'serre chevalier': { resort: 9482 },

  // Austrian Alps
  'innsbruck': { city: 1152 },
  'kitzbuhel': { resort: 9483 },
  'st anton': { resort: 9484 },
  'st. anton am arlberg': { resort: 9484 },
  'zell am see': { resort: 9485 },
  'kaprun': { resort: 9486 },
  'saalbach': { resort: 9487 },
  'hinterglemm': { resort: 9488 },
  'bad gastein': { resort: 9489 },
  'schladming': { resort: 9490 },

  // Swiss Alps
  'zermatt': { resort: 9491 },
  'st moritz': { resort: 9492 },
  'davos': { resort: 9493 },
  'klosters': { resort: 9494 },
  'verbier': { resort: 9495 },
  'crans montana': { resort: 9496 },
  'saas fee': { resort: 9497 },
  'grindelwald': { resort: 9498 },
  'wengen': { resort: 9499 },
  'murren': { resort: 9500 },

  // Generic regions for broader searches
  'dolomites': { region: 4252 },
  'dolomiti': { region: 4252 },
  'trentino': { region: 4252 },
  'alto adige': { region: 4251 },
  'south tyrol': { region: 4251 },
  'italian alps': { region: 4252 },
  'french alps': { region: 4254 },
  'austrian alps': { region: 4255 },
  'swiss alps': { region: 4256 },
  'alps': { region: 4252 }, // Default to Italian Dolomites

  // Italian ski destinations (prioritize Italian regions)
  'italy ski resort': { region: 911 }, // Trentino-Alto Adige
  'italy ski resorts': { region: 911 },
  'italian ski resort': { region: 911 },
  'italian ski resorts': { region: 911 },
  'italy skiing': { region: 911 },
  'italian skiing': { region: 911 },
  'italy ski': { region: 911 },
  'italian ski': { region: 911 },
  'italian dolomites': { region: 911 }, // Trentino-Alto Adige for Dolomites
  'italy dolomites': { region: 911 },
  'ski italy': { region: 911 },
  'skiing italy': { region: 911 },
  'ski in italy': { region: 911 },
  'skiing in italy': { region: 911 },

  // Fallback coordinates for major areas (if IDs don't work)
  'italy skiing fallback': { coordinates: { lat: 46.4982, lng: 11.3548, radius: 50000 } },
  'italy ski fallback': { coordinates: { lat: 46.4982, lng: 11.3548, radius: 50000 } },
};

export class MountVacationClient {
  private baseUrl = 'https://api.mountvacation.com';
  private searchEndpoint = '/accommodations/search/';
  private timeout: number;
  private logger: Logger;
  private apiKey: string;

  constructor(env: Env, logger: Logger) {
    this.timeout = parseInt(env.API_TIMEOUT_SECONDS) * 1000;
    this.logger = logger;
    this.apiKey = env.MOUNTVACATION_API_KEY;
  }

  /**
   * Search for accommodations using location mapping and multiple strategies
   */
  async searchAccommodations(params: SearchParams, env: Env): Promise<SearchResult> {
    const { location, arrival_date, departure_date, persons_ages, currency = 'EUR', max_results = 5 } = params;

    // Validate dates
    const dateValidation = this.validateDates(arrival_date, departure_date || '');
    if (dateValidation.error) {
      return dateValidation;
    }

    // Base search parameters
    const baseParams: Record<string, string> = {
      arrival: arrival_date,
      departure: departure_date || '',
      personsAges: persons_ages || '',
      currency: currency.toUpperCase(),
      lang: 'en',
    };

    // Try to find location mapping
    const locationMapping = location ? this.findLocationMapping(location) : null;

    if (locationMapping) {
      // Use mapped location data
      const searchStrategies = this.buildSearchStrategies(baseParams, locationMapping, location || '');

      for (const strategy of searchStrategies) {
        try {
          this.logger.debug('Trying mapped search strategy', {
            strategy: strategy.name,
            location: location || 'unknown',
            params: strategy.params
          });

          const result = await this.makeApiRequest(strategy.params, env);

          if (result && !(result as any).error && result.accommodations && result.accommodations.length > 0) {
            const formatted = this.formatResults(result, max_results);
            this.logger.info('Search successful with mapping', {
              strategy: strategy.name,
              location: location || 'unknown',
              mapping: locationMapping,
              results_count: formatted.accommodations?.length || 0,
            });
            return formatted;
          }
        } catch (error) {
          this.logger.warn('Mapped search strategy failed', {
            strategy: strategy.name,
            location: location || 'unknown',
            error: error instanceof Error ? error.message : String(error),
          });
          continue;
        }
      }
    }

    // If mapping failed or no mapping found, try fallback strategies
    this.logger.info('No results with location mapping, trying fallback strategies', { location: location || 'unknown' });

    // Fallback: try generic region searches for common terms
    const fallbackStrategies = this.buildFallbackStrategies(baseParams, location || '');

    for (const strategy of fallbackStrategies) {
      try {
        this.logger.debug('Trying fallback search strategy', {
          strategy: strategy.name,
          location: location || 'unknown',
          params: strategy.params
        });

        const result = await this.makeApiRequest(strategy.params, env);

        if (result && !(result as any).error && result.accommodations && result.accommodations.length > 0) {
          const formatted = this.formatResults(result, max_results);
          this.logger.info('Search successful with fallback', {
            strategy: strategy.name,
            location: location || 'unknown',
            results_count: formatted.accommodations?.length || 0,
          });
          return formatted;
        }
      } catch (error) {
        this.logger.warn('Fallback search strategy failed', {
          strategy: strategy.name,
          location: location || 'unknown',
          error: error instanceof Error ? error.message : String(error),
        });
        continue;
      }
    }

    // If all strategies failed
    return {
      error: `No accommodations found for '${location}'. This location may not be available in our database.`,
      suggestions: [
        'Try a popular ski resort name (e.g., "Madonna di Campiglio", "Cortina", "Val Gardena")',
        'Use broader search terms (e.g., "Italian Dolomites", "Alps")',
        'Check the spelling of the location name',
        'Try nearby resort or city names',
      ],
      available_locations: this.getSuggestedLocations(location || ''),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Find location mapping for a given location string
   */
  private findLocationMapping(location: string): LocationMapping | null {
    const normalizedLocation = location.toLowerCase().trim();

    // Direct match
    if (LOCATION_MAPPINGS[normalizedLocation]) {
      return LOCATION_MAPPINGS[normalizedLocation];
    }

    // Partial match - check if location contains any mapped location
    for (const [mappedLocation, mapping] of Object.entries(LOCATION_MAPPINGS)) {
      if (normalizedLocation.includes(mappedLocation) || mappedLocation.includes(normalizedLocation)) {
        return mapping;
      }
    }

    return null;
  }

  /**
   * Build search strategies based on location mapping
   */
  private buildSearchStrategies(baseParams: Record<string, string>, mapping: LocationMapping, location: string) {
    const strategies = [];

    // Resort search (highest priority)
    if (mapping.resort) {
      strategies.push({
        name: 'resort_mapped',
        params: { ...baseParams, resort: mapping.resort.toString() }
      });
    }

    // Skiarea search
    if (mapping.skiarea) {
      strategies.push({
        name: 'skiarea_mapped',
        params: { ...baseParams, skiarea: mapping.skiarea.toString() }
      });
    }

    // City search
    if (mapping.city) {
      strategies.push({
        name: 'city_mapped',
        params: { ...baseParams, city: mapping.city.toString() }
      });
    }

    // Region search
    if (mapping.region) {
      strategies.push({
        name: 'region_mapped',
        params: { ...baseParams, region: mapping.region.toString() }
      });
    }

    // Geolocation search (fallback)
    if (mapping.coordinates) {
      strategies.push({
        name: 'geolocation_mapped',
        params: {
          ...baseParams,
          latitude: mapping.coordinates.lat.toString(),
          longitude: mapping.coordinates.lng.toString(),
          radius: (mapping.coordinates.radius || 50000).toString()
        }
      });
    }

    return strategies;
  }

  /**
   * Build fallback search strategies for unmapped locations
   */
  private buildFallbackStrategies(baseParams: Record<string, string>, location: string) {
    const strategies = [];
    const normalizedLocation = location.toLowerCase();

    // If location contains "italy" or "italian", try Italian regions
    if (normalizedLocation.includes('italy') || normalizedLocation.includes('italian')) {
      strategies.push({
        name: 'italian_dolomites_fallback',
        params: { ...baseParams, region: '4252' } // Italian Dolomites
      });
      strategies.push({
        name: 'alto_adige_fallback',
        params: { ...baseParams, region: '4251' } // Alto Adige
      });
    }

    // If location contains "dolomites", try Dolomites region
    if (normalizedLocation.includes('dolomit')) {
      strategies.push({
        name: 'dolomites_fallback',
        params: { ...baseParams, region: '4252' }
      });
    }

    // If location contains "alps", try major Alpine regions
    if (normalizedLocation.includes('alps')) {
      strategies.push({
        name: 'italian_alps_fallback',
        params: { ...baseParams, region: '4252' }
      });
      strategies.push({
        name: 'french_alps_fallback',
        params: { ...baseParams, region: '4254' }
      });
    }

    // Italian ski destinations - prioritize Italian regions
    if (normalizedLocation.includes('italy') && (normalizedLocation.includes('ski') || normalizedLocation.includes('dolomit'))) {
      // Try Italian ski regions first
      strategies.push({
        name: 'trentino_alto_adige_fallback',
        params: { ...baseParams, region: '911' } // Trentino-Alto Adige
      });
      strategies.push({
        name: 'veneto_fallback',
        params: { ...baseParams, region: '914' } // Veneto (Cortina)
      });
      strategies.push({
        name: 'valle_aosta_fallback',
        params: { ...baseParams, region: '913' } // Valle d'Aosta
      });
      strategies.push({
        name: 'lombardy_fallback',
        params: { ...baseParams, region: '904' } // Lombardy (Livigno)
      });

      // Only use geolocation as last resort with smaller radius
      strategies.push({
        name: 'italy_geolocation_fallback',
        params: {
          ...baseParams,
          latitude: '46.4982',
          longitude: '11.3548',
          radius: '50000' // Smaller radius to focus on Italian Alps
        }
      });
    }

    return strategies;
  }

  /**
   * Get suggested locations based on user input
   */
  private getSuggestedLocations(location: string): string[] {
    const normalizedLocation = location.toLowerCase();
    const suggestions = [];

    // If user searched for something Italian-related
    if (normalizedLocation.includes('italy') || normalizedLocation.includes('italian') || normalizedLocation.includes('dolomit')) {
      suggestions.push(
        'Madonna di Campiglio',
        'Cortina d\'Ampezzo',
        'Val Gardena',
        'Alta Badia',
        'Italian Dolomites'
      );
    } else {
      // General popular destinations
      suggestions.push(
        'Madonna di Campiglio',
        'Chamonix',
        'Zermatt',
        'St. Anton',
        'Val d\'Isère'
      );
    }

    return suggestions;
  }

  /**
   * Make API request with error handling and retries
   */
  private async makeApiRequest(params: Record<string, string>, env: Env): Promise<APIResponse | SearchResult> {
    const url = new URL(this.searchEndpoint, this.baseUrl);
    
    // Add search parameters
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    // Add API key parameter
    url.searchParams.append('apiKey', this.apiKey);

    const requestOptions: RequestInit = {
      method: 'GET',
      headers: {
        'User-Agent': 'MountVacation-MCP-Worker/1.0',
        'Accept': 'application/json',
      },
      // Add timeout using AbortController
      signal: AbortSignal.timeout(this.timeout),
    };

    try {
      this.logger.debug('Making API request', { 
        url: url.toString(),
        timeout_ms: this.timeout 
      });

      const startTime = Date.now();
      const response = await fetch(url.toString(), requestOptions);
      const responseTime = Date.now() - startTime;

      this.logger.debug('API response received', {
        status: response.status,
        response_time_ms: responseTime,
        content_type: response.headers.get('content-type'),
      });

      if (response.ok) {
        const data = await response.json() as APIResponse;
        return data;
      } else {
        return this.handleApiError(response);
      }
    } catch (error) {
      return this.handleRequestError(error);
    }
  }

  /**
   * Handle API error responses
   */
  private async handleApiError(response: Response): Promise<SearchResult> {
    let errorMessage = `API request failed with status ${response.status}`;
    
    try {
      const errorData = await response.text();
      this.logger.error('API error response', {
        status: response.status,
        response_body: errorData,
      });
    } catch (e) {
      // Ignore parsing errors
    }

    switch (response.status) {
      case 401:
        errorMessage = 'Authentication failed. Please check your API credentials.';
        break;
      case 403:
        errorMessage = 'Access forbidden. Please check your API permissions.';
        break;
      case 429:
        errorMessage = 'Rate limit exceeded. Please try again later.';
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        errorMessage = 'MountVacation API is temporarily unavailable. Please try again later.';
        break;
    }

    return {
      error: errorMessage,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Handle request errors (network, timeout, etc.)
   */
  private handleRequestError(error: unknown): SearchResult {
    let errorMessage = 'Request failed';
    
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        errorMessage = 'Request timeout. Please try again.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        errorMessage = `Request error: ${error.message}`;
      }
    }

    this.logger.error('Request error', {
      error: error instanceof Error ? error.message : String(error),
      error_name: error instanceof Error ? error.name : 'Unknown',
    });

    return {
      error: errorMessage,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Validate search dates
   */
  private validateDates(arrival_date: string, departure_date: string): SearchResult | { error?: undefined } {
    try {
      const arrival = new Date(arrival_date);
      const departure = new Date(departure_date);
      const now = new Date();
      
      // Reset time to start of day for comparison
      now.setHours(0, 0, 0, 0);
      arrival.setHours(0, 0, 0, 0);
      departure.setHours(0, 0, 0, 0);

      if (isNaN(arrival.getTime()) || isNaN(departure.getTime())) {
        return {
          error: 'Invalid date format. Please use YYYY-MM-DD format.',
          timestamp: new Date().toISOString(),
        };
      }

      if (arrival >= departure) {
        return {
          error: 'Departure date must be after arrival date.',
          timestamp: new Date().toISOString(),
        };
      }

      if (arrival < now) {
        return {
          error: 'Arrival date cannot be in the past.',
          timestamp: new Date().toISOString(),
        };
      }

      // Check if dates are too far in the future (optional)
      const maxFutureDate = new Date();
      maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 2);
      if (arrival > maxFutureDate) {
        return {
          error: 'Arrival date is too far in the future. Please select a date within 2 years.',
          timestamp: new Date().toISOString(),
        };
      }

      return {};
    } catch (error) {
      return {
        error: 'Invalid date format. Please use YYYY-MM-DD format.',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Format API response for LLM consumption
   */
  private formatResults(data: APIResponse, maxResults: number): SearchResult {
    const accommodations = data.accommodations?.slice(0, maxResults) || [];

    if (accommodations.length === 0) {
      return {
        message: 'No accommodations found for your search criteria.',
        search_summary: {
          arrival_date: data.arrival || '',
          departure_date: data.departure || '',
          nights: data.nights || 0,
          persons_count: data.personsAges?.length || 0,
          total_found: 0,
          currency: data.currency || 'EUR',
        },
      };
    }

    const formattedAccommodations: FormattedAccommodation[] = accommodations.map((acc: RawAccommodation) => {
      const offers = acc.offers || [];
      const bestOffer = offers[0] || {};

      // Process images from pictures object
      const imageUrls: string[] = [];
      const thumbnailUrls: string[] = [];
      const fullSizeUrls: string[] = [];

      if (acc.pictures?.url && acc.pictures?.pictures) {
        acc.pictures.pictures.forEach(pic => {
          const baseUrl = `${acc.pictures!.url}${pic}`;
          imageUrls.push(baseUrl); // Default size
          thumbnailUrls.push(`${baseUrl}/t`); // Thumbnail
          fullSizeUrls.push(`${baseUrl}/o`); // Original/full size
        });
      }

      // Fallback to legacy images array
      if (imageUrls.length === 0 && acc.images) {
        imageUrls.push(...acc.images);
        thumbnailUrls.push(...acc.images);
        fullSizeUrls.push(...acc.images);
      }

      return {
        name: acc.title || 'N/A',
        location: {
          city: acc.city || 'N/A',
          country: acc.country || 'N/A',
          resort: acc.resort || 'N/A',
          region: acc.region || 'N/A',
          full_address: `${acc.city || 'N/A'}, ${acc.resort || 'N/A'}, ${acc.country || 'N/A'}`,
          coordinates: acc.latitude && acc.longitude ? {
            latitude: acc.latitude,
            longitude: acc.longitude
          } : undefined,
        },
        property_details: {
          category: acc.category || 'N/A',
          type: acc.type || 'N/A',
          beds: bestOffer.beds || 'N/A',
          bedrooms: bestOffer.bedrooms || 'N/A',
          size_sqm: bestOffer.sizeSqM || 'N/A',
          max_occupancy: bestOffer.maxPersons || 'N/A',
          accommodation_id: acc.accommodationID || acc.id || 'N/A',
        },
        pricing: {
          total_price: bestOffer.totalPrice || 'N/A',
          currency: data.currency || 'EUR',
          nights: data.nights || 'N/A',
          price_per_night: bestOffer.totalPrice && data.nights
            ? Math.round((bestOffer.totalPrice / Math.max(data.nights, 1)) * 100) / 100
            : 'N/A',
        },
        amenities: {
          wifi: acc.internetWifi || false,
          parking: acc.parking || false,
          pets_allowed: acc.pets || false,
          breakfast_included: bestOffer.breakfastIncluded || false,
          balcony: acc.balcony || false,
          kitchen: acc.kitchen || false,
          pool: acc.pool || false,
          wellness: acc.wellness || false,
          ski_in_out: acc.skiInOut || false,
        },
        distances: {
          to_resort_center: acc.distResort ? `${acc.distResort}m` : 'N/A',
          to_ski_runs: acc.distRuns ? `${acc.distRuns}m` : 'N/A',
          to_city_center: acc.distCentre ? `${acc.distCentre}m` : 'N/A',
        },
        booking: {
          reservation_url: bestOffer.reservationUrl || 'N/A',
          free_cancellation_until: bestOffer.freeCancellationBefore || 'Check policy',
          booking_conditions: bestOffer.conditions || 'Standard terms apply',
        },
        property_url: acc.url || 'N/A',
        property_page_url: acc.accommodationUrl || 'N/A', // Main MountVacation property page
        images: imageUrls.slice(0, 5), // Limit to first 5 images
        image_gallery: {
          thumbnail_urls: thumbnailUrls.slice(0, 5),
          full_size_urls: fullSizeUrls.slice(0, 5),
        },
      };
    });

    return {
      search_summary: {
        arrival_date: data.arrival || '',
        departure_date: data.departure || '',
        nights: data.nights || 0,
        persons_count: data.personsAges?.length || 0,
        total_found: formattedAccommodations.length,
        currency: data.currency || 'EUR',
      },
      accommodations: formattedAccommodations,
    };
  }

  /**
   * Get detailed properties for a specific accommodation
   */
  async getAccommodationProperties(
    accommodationId: number,
    language: string = 'en',
    includeFacilities: boolean = true
  ): Promise<AccommodationProperties> {
    const url = new URL(`${this.baseUrl}/accommodations/${accommodationId}/properties`);
    url.searchParams.set('apiKey', this.apiKey);
    url.searchParams.set('lang', language);
    if (includeFacilities) {
      url.searchParams.set('includeFacilitiesProperties', 'true');
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MountVacation-MCP-Server/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch accommodation properties: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get detailed properties for a specific facility within an accommodation
   */
  async getFacilityProperties(
    accommodationId: number,
    facilityId: number,
    language: string = 'en'
  ): Promise<{ facilityID: number; properties: FacilityProperties }> {
    const url = new URL(`${this.baseUrl}/accommodations/${accommodationId}/facilities/${facilityId}/properties`);
    url.searchParams.set('apiKey', this.apiKey);
    url.searchParams.set('lang', language);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MountVacation-MCP-Server/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch facility properties: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Submit a booking request
   */
  async submitBooking(bookingData: BookingRequest): Promise<BookingResponse> {
    const url = new URL(`${this.baseUrl}/bookings/`);
    url.searchParams.set('apiKey', this.apiKey);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'MountVacation-MCP-Server/1.0',
      },
      body: JSON.stringify(bookingData),
    });

    if (!response.ok) {
      throw new Error(`Failed to submit booking: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get booking details
   */
  async getBooking(bookingId: number, securityToken: string, currency: string = 'EUR'): Promise<BookingResponse> {
    const url = new URL(`${this.baseUrl}/bookings/${bookingId}`);
    url.searchParams.set('apiKey', this.apiKey);
    url.searchParams.set('securityToken', securityToken);
    url.searchParams.set('currency', currency);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MountVacation-MCP-Server/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch booking: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId: number, securityToken: string): Promise<{
    ID: number;
    price: number;
    paid: number;
    cancellationFee: number;
    cancellationAdmCosts: number;
    refund: number;
  }> {
    const url = new URL(`${this.baseUrl}/bookings/${bookingId}/cancel`);
    url.searchParams.set('apiKey', this.apiKey);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'MountVacation-MCP-Server/1.0',
      },
      body: JSON.stringify({ securityToken }),
    });

    if (!response.ok) {
      throw new Error(`Failed to cancel booking: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }
}
