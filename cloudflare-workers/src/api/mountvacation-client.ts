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

  // French Alps - CORRECTED RESORT IDs (verified with API)
  'chamonix': { resort: 9233 },
  'chamonix mont blanc': { resort: 9233 },
  'avoriaz': { resort: 9236 },
  // Note: Other French resort IDs need to be discovered from API
  // For now, using coordinates for reliable search
  'val d\'isere': { coordinates: { lat: 45.4486, lng: 6.9786, radius: 8000 } },
  'val d\'isère': { coordinates: { lat: 45.4486, lng: 6.9786, radius: 8000 } },
  'tignes': { coordinates: { lat: 45.4669, lng: 6.9062, radius: 8000 } },
  'les arcs': { coordinates: { lat: 45.5707, lng: 6.8125, radius: 8000 } },
  'la plagne': { coordinates: { lat: 45.5133, lng: 6.6778, radius: 8000 } },
  'courchevel': { coordinates: { lat: 45.4167, lng: 6.6333, radius: 8000 } },
  'meribel': { coordinates: { lat: 45.3833, lng: 6.5667, radius: 8000 } },
  'méribel': { coordinates: { lat: 45.3833, lng: 6.5667, radius: 8000 } },
  'val thorens': { coordinates: { lat: 45.2983, lng: 6.5797, radius: 8000 } },
  'les menuires': { coordinates: { lat: 45.3167, lng: 6.5333, radius: 8000 } },
  'alpe d\'huez': { coordinates: { lat: 45.0906, lng: 6.0678, radius: 8000 } },
  'les deux alpes': { coordinates: { lat: 45.0133, lng: 6.1233, radius: 8000 } },
  'serre chevalier': { coordinates: { lat: 44.9417, lng: 6.5500, radius: 8000 } },

  // Austrian Alps - Using coordinates for reliable search
  'innsbruck': { coordinates: { lat: 47.2692, lng: 11.4041, radius: 15000 } },
  'kitzbuhel': { coordinates: { lat: 47.4467, lng: 12.3914, radius: 10000 } },
  'kitzbühel': { coordinates: { lat: 47.4467, lng: 12.3914, radius: 10000 } },
  'st anton': { coordinates: { lat: 47.1275, lng: 10.2606, radius: 10000 } },
  'st. anton am arlberg': { coordinates: { lat: 47.1275, lng: 10.2606, radius: 10000 } },
  'zell am see': { coordinates: { lat: 47.3254, lng: 12.7941, radius: 10000 } },
  'kaprun': { coordinates: { lat: 47.2697, lng: 12.7558, radius: 10000 } },
  'saalbach': { coordinates: { lat: 47.3889, lng: 12.6347, radius: 10000 } },
  'hinterglemm': { coordinates: { lat: 47.3889, lng: 12.6347, radius: 10000 } },
  'bad gastein': { coordinates: { lat: 47.1156, lng: 13.1344, radius: 10000 } },
  'schladming': { coordinates: { lat: 47.3928, lng: 13.6872, radius: 10000 } },

  // Swiss Alps - Using coordinates for reliable search
  'zermatt': { coordinates: { lat: 46.0207, lng: 7.7491, radius: 10000 } },
  'st moritz': { coordinates: { lat: 46.4908, lng: 9.8355, radius: 10000 } },
  'davos': { coordinates: { lat: 46.8043, lng: 9.8307, radius: 10000 } },
  'klosters': { coordinates: { lat: 46.8781, lng: 9.8775, radius: 10000 } },
  'verbier': { coordinates: { lat: 46.0964, lng: 7.2281, radius: 10000 } },
  'crans montana': { coordinates: { lat: 46.3111, lng: 7.4850, radius: 10000 } },
  'saas fee': { coordinates: { lat: 46.1097, lng: 7.9286, radius: 10000 } },
  'grindelwald': { coordinates: { lat: 46.6244, lng: 8.0411, radius: 10000 } },
  'wengen': { coordinates: { lat: 46.6081, lng: 7.9219, radius: 10000 } },
  'murren': { coordinates: { lat: 46.5581, lng: 7.8919, radius: 10000 } },
  'mürren': { coordinates: { lat: 46.5581, lng: 7.8919, radius: 10000 } },

  // Generic regions for broader searches
  'dolomites': { region: 4252 },
  'dolomiti': { region: 4252 },
  'trentino': { region: 4252 },
  'alto adige': { region: 4251 },
  'south tyrol': { region: 4251 },
  'italian alps': { region: 4252 },
  'austrian alps': { region: 4255 },
  'swiss alps': { region: 4256 },
  'alps': { region: 4252 }, // Default to Italian Dolomites

  // European mountain destinations - broader terms
  'europe ski': { region: 4252 }, // Start with popular Italian region
  'european ski resorts': { region: 4252 },
  'europe skiing': { region: 4252 },
  'european alps': { region: 4252 },
  'mountain vacation europe': { region: 4252 },
  'ski vacation europe': { region: 4252 },

  // Country-specific ski destinations
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

  // French ski destinations
  'france ski': { region: 4254 },
  'french ski': { region: 4254 },
  'france skiing': { region: 4254 },
  'french skiing': { region: 4254 },
  'ski france': { region: 4254 },
  'skiing france': { region: 4254 },
  'ski in france': { region: 4254 },

  // Austrian ski destinations
  'austria ski': { region: 4255 },
  'austrian ski': { region: 4255 },
  'austria skiing': { region: 4255 },
  'austrian skiing': { region: 4255 },
  'ski austria': { region: 4255 },
  'skiing austria': { region: 4255 },
  'ski in austria': { region: 4255 },

  // Swiss ski destinations
  'switzerland ski': { region: 4256 },
  'swiss ski': { region: 4256 },
  'switzerland skiing': { region: 4256 },
  'swiss skiing': { region: 4256 },
  'ski switzerland': { region: 4256 },
  'skiing switzerland': { region: 4256 },
  'ski in switzerland': { region: 4256 },

  // Fallback coordinates for major areas (if IDs don't work)
  'italy skiing fallback': { coordinates: { lat: 46.4982, lng: 11.3548, radius: 50000 } },
  'italy ski fallback': { coordinates: { lat: 46.4982, lng: 11.3548, radius: 50000 } },

  // Additional French Alps destinations - using multiple search strategies
  'french alps': { resort: 9233 }, // Default to Chamonix for French Alps searches
  'les trois vallees': { coordinates: { lat: 45.3333, lng: 6.6000, radius: 12000 } },
  'paradiski': { coordinates: { lat: 45.5420, lng: 6.7450, radius: 12000 } },
  'espace killy': { coordinates: { lat: 45.4577, lng: 6.9423, radius: 12000 } },
};

export class MountVacationClient {
  private baseUrl = 'https://api.mountvacation.com';
  private searchEndpoint = '/accommodations/search/';
  private timeout: number;
  private logger: Logger;
  private apiKey: string;

  constructor(env: Env, logger: Logger, userApiKey: string) {
    this.timeout = parseInt(env.API_TIMEOUT_SECONDS) * 1000;
    this.logger = logger;
    this.apiKey = userApiKey; // Use user-provided API key, not environment variable
  }

  /**
   * Search for accommodations using location mapping and multiple strategies
   */
  async searchAccommodations(params: SearchParams, env: Env): Promise<SearchResult> {
    const {
      location,
      accommodation_id,
      accommodation_ids,
      resort_id,
      city_id,
      latitude,
      longitude,
      radius,
      arrival_date,
      departure_date,
      nights,
      persons_ages,
      persons,
      currency = 'EUR',
      language = 'en',
      include_additional_fees = false,
      max_results = 5
    } = params;

    // Calculate departure_date if not provided but nights is provided
    let finalDepartureDate = departure_date;
    if (!departure_date && nights) {
      const arrivalDate = new Date(arrival_date);
      arrivalDate.setDate(arrivalDate.getDate() + nights);
      finalDepartureDate = arrivalDate.toISOString().split('T')[0];
    } else if (!departure_date && !nights) {
      // Default to 1 night if neither departure_date nor nights provided
      const arrivalDate = new Date(arrival_date);
      arrivalDate.setDate(arrivalDate.getDate() + 1);
      finalDepartureDate = arrivalDate.toISOString().split('T')[0];
    }

    // Validate dates
    const dateValidation = this.validateDates(arrival_date, finalDepartureDate!);
    if (dateValidation.error) {
      return dateValidation;
    }

    // Handle persons parameter - convert to persons_ages format if needed
    let finalPersonsAges = persons_ages;
    if (!persons_ages && persons) {
      // Convert persons count to ages (assume all adults age 30)
      finalPersonsAges = Array(persons).fill(30).join(',');
    }

    // Base search parameters
    const baseParams: Record<string, string> = {
      arrival: arrival_date,
      departure: finalDepartureDate!,
      personsAges: finalPersonsAges || '',
      currency: currency.toUpperCase(),
      lang: language,
      ...(include_additional_fees && { includeAdditionalFees: 'true' }),
    };

    // Handle direct ID searches first (highest priority)
    if (accommodation_id) {
      return await this.searchByDirectParams({
        ...baseParams,
        accommodation: accommodation_id.toString()
      }, env, max_results, 'accommodation_id');
    }

    if (accommodation_ids && accommodation_ids.length > 0) {
      return await this.searchByDirectParams({
        ...baseParams,
        accommodations: accommodation_ids.join(',')
      }, env, max_results, 'accommodation_ids');
    }

    if (resort_id) {
      return await this.searchByDirectParams({
        ...baseParams,
        resort: resort_id.toString()
      }, env, max_results, 'resort_id');
    }

    if (city_id) {
      return await this.searchByDirectParams({
        ...baseParams,
        city: city_id.toString()
      }, env, max_results, 'city_id');
    }

    if (latitude && longitude && radius) {
      return await this.searchByDirectParams({
        ...baseParams,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        radius: radius.toString()
      }, env, max_results, 'geolocation');
    }

    // Handle location-based search
    if (location) {
      // Try to find location mapping
      const locationMapping = this.findLocationMapping(location);

      if (locationMapping) {
        // Use mapped location data
        const searchStrategies = this.buildSearchStrategies(baseParams, locationMapping, location);

        for (const strategy of searchStrategies) {
          try {
            this.logger.debug('Trying mapped search strategy', {
              strategy: strategy.name,
              location: location,
              params: strategy.params
            });

            const result = await this.makeApiRequest(strategy.params, env);

            if (result && !(result as any).error && result.accommodations && result.accommodations.length > 0) {
              const formatted = this.formatResults(result, max_results);
              this.logger.info('Search successful with mapping', {
                strategy: strategy.name,
                location: location,
                mapping: locationMapping,
                results_count: formatted.accommodations?.length || 0,
              });
              return formatted;
            }
          } catch (error) {
            this.logger.warn('Mapped search strategy failed', {
              strategy: strategy.name,
              location: location,
              error: error instanceof Error ? error.message : String(error),
            });
            continue;
          }
        }
      }

      // If mapping failed or no mapping found, try fallback strategies
      this.logger.info('No results with location mapping, trying fallback strategies', { location: location });

      // Fallback: try generic region searches for common terms
      const fallbackStrategies = this.buildFallbackStrategies(baseParams, location);

      for (const strategy of fallbackStrategies) {
        try {
          this.logger.debug('Trying fallback search strategy', {
            strategy: strategy.name,
            location: location,
            params: strategy.params
          });

          const result = await this.makeApiRequest(strategy.params, env);

          if (result && !(result as any).error && result.accommodations && result.accommodations.length > 0) {
            const formatted = this.formatResults(result, max_results);
            this.logger.info('Search successful with fallback', {
              strategy: strategy.name,
              location: location,
              results_count: formatted.accommodations?.length || 0,
            });
            return formatted;
          }
        } catch (error) {
          this.logger.warn('Fallback search strategy failed', {
            strategy: strategy.name,
            location: location,
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
        available_locations: this.getSuggestedLocations(location),
        timestamp: new Date().toISOString(),
      };
    }

    // If no search parameters provided
    return {
      error: 'No search parameters provided. Please specify a location, accommodation ID, resort ID, city ID, or coordinates.',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Search using direct API parameters (accommodation ID, resort ID, etc.)
   */
  private async searchByDirectParams(
    params: Record<string, string>,
    env: Env,
    maxResults: number,
    searchType: string
  ): Promise<SearchResult> {
    try {
      this.logger.info('Direct parameter search', { searchType, params });

      const result = await this.makeApiRequest(params, env);

      if (result && !(result as any).error && result.accommodations && result.accommodations.length > 0) {
        const formatted = this.formatResults(result, maxResults);
        this.logger.info('Direct search successful', {
          searchType,
          results_count: formatted.accommodations?.length || 0,
        });
        return formatted;
      } else {
        return {
          error: `No accommodations found for the specified ${searchType}.`,
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      this.logger.error('Direct parameter search failed', {
        searchType,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        error: `Search failed: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString(),
      };
    }
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
      // DEBUG: Log detailed request info
      this.logger.debug('Making API request', {
        url: url.toString(),
        timeout_ms: this.timeout,
        params: Object.fromEntries(url.searchParams),
        api_key_length: this.apiKey.length,
        api_key_prefix: this.apiKey.substring(0, 8) + '...',
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

        // DEBUG: Log the actual API response
        this.logger.debug('MountVacation API Response', {
          accommodations_count: data.accommodations?.length || 0,
          has_accommodations: !!data.accommodations,
          response_keys: Object.keys(data),
          first_accommodation: data.accommodations?.[0] ? {
            id: data.accommodations[0].id,
            title: data.accommodations[0].title,
            city: data.accommodations[0].city,
            country: data.accommodations[0].country,
            resort: data.accommodations[0].resort
          } : null
        });

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

      // Process multiple offers for booking options
      const bookingOffers = offers.slice(0, 3).map((offer: any) => ({
        facility_title: offer.facilityTitle || offer.title || 'Room',
        price: offer.totalPrice || offer.price || 'N/A',
        currency: data.currency || 'EUR',
        beds: offer.beds || 'N/A',
        service_type: offer.service ? Object.keys(offer.service)[0] || 'N/A' : 'N/A',
        booking_url: offer.reservationUrl || 'N/A',
        free_cancellation_until: offer.freeCancellationBefore || 'Check policy',
        breakfast_included: Boolean(offer.breakfastIncluded),
        promotion: offer.promotion || null,
      }));

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
          primary_booking_url: bestOffer.reservationUrl || 'N/A',
          free_cancellation_until: bestOffer.freeCancellationBefore || 'Check policy',
          booking_conditions: bestOffer.conditions || 'Standard terms apply',
        },
        // NEW: Multiple booking offers with direct links
        booking_offers: bookingOffers,
        // NEW: Quick booking link (most prominent)
        book_now_url: bestOffer.reservationUrl || 'N/A',
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
