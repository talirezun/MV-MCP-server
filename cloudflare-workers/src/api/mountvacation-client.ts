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
import { IdMappingManager, LocationMatch } from './id-mapping';

// Location mapping for popular ski destinations
// This maps location names to MountVacation API IDs
interface LocationMapping {
  resort?: number;
  city?: number;
  region?: number;
  skiarea?: number;
  coordinates?: { lat: number; lng: number; radius?: number };
  latitude?: number;
  longitude?: number;
  radius?: number;
}

const LOCATION_MAPPINGS: Record<string, LocationMapping> = {
  // ===== VERIFIED WORKING MAPPINGS =====
  // These mappings have been tested and confirmed to return correct results

  // Italian Dolomites - VERIFIED RESORT IDs
  'alta badia': { resort: 69 }, // ✅ VERIFIED: Returns Hotel Lagació in San Cassiano
  'corvara': { resort: 69 },
  'corvara in badia': { resort: 69 },
  'la villa': { resort: 69 },
  'san cassiano': { resort: 69 },
  'colfosco': { resort: 69 },
  'badia': { resort: 69 },

  // French Alps - VERIFIED RESORT IDs
  'chamonix': { resort: 9233 }, // ✅ VERIFIED: Returns Grand Hôtel des Alpes in Chamonix
  'chamonix mont blanc': { resort: 9233 },

  // Austrian Alps - ENHANCED MULTI-STRATEGY MAPPINGS
  // Note: Alpbachtal requires multi-strategy search due to API limitations
  'alpbachtal': {
    resort: 9340,
    skiarea: 52,
    // Multi-strategy search coordinates for comprehensive coverage
    coordinates: { lat: 47.4, lng: 11.9, radius: 15000 }
  }, // ⚠️ API LIMITATION: Only returns 2/8+ accommodations, requires enhanced search

  // ===== RESORT ID-BASED MAPPINGS =====
  // All mappings updated with verified API resort IDs (coordinate fallbacks removed)

  // Austrian Alps - VERIFIED RESORT IDs from API
  'innsbruck': { resort: 39, region: 607 }, // ✅ Innsbruck, Tirol
  'kitzbuhel': { resort: 9222, skiarea: 41 }, // ✅ Kitzbühel
  'kitzbühel': { resort: 9222, skiarea: 41 },
  'st anton': { resort: 9224, skiarea: 36 }, // ✅ St. Anton am Arlberg
  'st. anton': { resort: 9224, skiarea: 36 },
  'st. anton am arlberg': { resort: 9224, skiarea: 36 },
  'zell am see': { resort: 148, skiarea: 33 }, // ✅ Zell am See
  'kaprun': { resort: 9216, skiarea: 39 }, // ✅ Kaprun
  'saalbach': { resort: 3, skiarea: 2 }, // ✅ Saalbach Hinterglemm
  'hinterglemm': { resort: 3, skiarea: 2 },
  'bad gastein': { resort: 95, skiarea: 2 }, // ✅ Bad Gastein Sportgastein
  'schladming': { resort: 9195, skiarea: 2 }, // ✅ Schladming-Dachstein
  'lech': { resort: 159, skiarea: 36 }, // ✅ Lech Zürs am Arlberg
  'lech am arlberg': { resort: 159, skiarea: 36 },

  // Alpbachtal region cities - VERIFIED RESORT ID from website analysis
  'alpbach': { resort: 9340, skiarea: 52 },
  'bruck am ziller': { resort: 9340, skiarea: 52 },
  'reith im alpbachtal': { resort: 9340, skiarea: 52 },
  'schlitters': { resort: 9340, skiarea: 52 },

  // Swiss Alps - VERIFIED RESORT IDs from API
  'zermatt': { resort: 22, skiarea: 10 }, // ✅ Zermatt, Matterhorn
  'verbier': { resort: 9240, skiarea: 8 }, // ✅ Verbier
  'st moritz': { resort: 72 }, // ✅ Saint Moritz
  'saint moritz': { resort: 72 },
  'davos': { resort: 8 }, // ✅ Davos Klosters
  'klosters': { resort: 8 },
  'crans montana': { resort: 9239 }, // ✅ Crans Montana
  'saas fee': { resort: 5, skiarea: 3 }, // ✅ Saas-Fee - Saastal
  'saas-fee': { resort: 5, skiarea: 3 },
  'grindelwald': { resort: 9484, skiarea: 25 }, // ✅ Grindelwald, Jungfrau
  'wengen': { resort: 9482, skiarea: 25 }, // ✅ Wengen, Jungfrau
  'murren': { skiarea: 25 }, // Jungfrau region (no direct resort ID)
  'mürren': { skiarea: 25 },
  'arosa': { resort: 9238 }, // ✅ Arosa
  'engelberg': { resort: 89 }, // ✅ Engelberg, Titlis

  // French Alps - VERIFIED RESORT IDs from API
  'val d\'isere': { resort: 9227, skiarea: 22 }, // ✅ Val d'Isere, Espace Killy
  'val d\'isère': { resort: 9227, skiarea: 22 },
  'tignes': { resort: 70, skiarea: 22 }, // ✅ Tignes, Espace Killy
  'les arcs': { resort: 9278, skiarea: 12 }, // ✅ Les Arcs, Paradiski
  'la plagne': { resort: 9270, skiarea: 12 }, // ✅ La Plagne, Paradiski
  'courchevel': { resort: 9229, skiarea: 1 }, // ✅ Courchevel, Les 3 Vallées
  'meribel': { resort: 9485, skiarea: 1 }, // ✅ Meribel, Les 3 Vallées
  'méribel': { resort: 9485, skiarea: 1 },
  'val thorens': { resort: 10, skiarea: 1 }, // ✅ Val Thorens, Les 3 Vallées
  'les menuires': { resort: 9283, skiarea: 1 }, // ✅ Les Menuires, Les 3 Vallées
  'alpe d\'huez': { resort: 9325, skiarea: 27 }, // ✅ Alpe d'Huez
  'les deux alpes': { resort: 110, skiarea: 27 }, // ✅ Les 2 Alpes
  'les 2 alpes': { resort: 110, skiarea: 27 },
  'serre chevalier': { resort: 155, skiarea: 35 }, // ✅ Serre Chevalier
  'morzine': { resort: 9244, skiarea: 38 }, // ✅ Morzine, Portes du Soleil
  'les gets': { resort: 9208, skiarea: 38 }, // ✅ Les Gets, Portes du Soleil
  'avoriaz': { resort: 9236, skiarea: 38 }, // ✅ Avoriaz, Portes du Soleil

  // Italian Alps - VERIFIED RESORT IDs from API
  'livigno': { resort: 127, skiarea: 19 }, // ✅ Livigno
  'bormio': { resort: 9220, skiarea: 19 }, // ✅ Bormio
  'cortina d\'ampezzo': { resort: 9209, skiarea: 5 }, // ✅ Cortina d'Ampezzo, Dolomiti Superski
  'cortina': { resort: 9209, skiarea: 5 },
  'madonna di campiglio': { resort: 7, skiarea: 4 }, // ✅ Madonna di Campiglio, Superskirama
  'campiglio': { resort: 7, skiarea: 4 },
  'val gardena': { resort: 9218, skiarea: 5 }, // ✅ Val Gardena, Dolomiti Superski
  'selva di val gardena': { resort: 9218, skiarea: 5 },
  'ortisei': { resort: 9218, skiarea: 5 }, // Val Gardena area
  'santa cristina': { resort: 9218, skiarea: 5 }, // Val Gardena area
  'san martino di castrozza': { resort: 140, skiarea: 5 }, // ✅ San Martino, Dolomiti Superski
  'cervinia': { resort: 54, skiarea: 18 }, // ✅ Cervinia
  'breuil-cervinia': { resort: 54, skiarea: 18 },
  'courmayeur': { resort: 113, skiarea: 28 }, // ✅ Courmayeur
  'sestriere': { resort: 9221, skiarea: 40 }, // ✅ Sestriere
  'kronplatz': { resort: 11, skiarea: 5 }, // ✅ Kronplatz / Plan de Corones
  'plan de corones': { resort: 11, skiarea: 5 },
  'val di fassa': { resort: 53, skiarea: 5 }, // ✅ Val di Fassa, Dolomiti Superski

  // Generic regions for broader searches - Use skiarea/region IDs
  'dolomites': { skiarea: 5 }, // ✅ Dolomiti Superski
  'dolomiti': { skiarea: 5 },
  'trentino': { region: 911 }, // ✅ Trentino-Alto Adige region
  'alto adige': { region: 911 },
  'south tyrol': { region: 911 },
  'italian alps': { region: 911 }, // Trentino-Alto Adige
  'austrian alps': { region: 607 }, // ✅ Tirol region
  'swiss alps': { region: 671 }, // ✅ Valais region
  'alps': { skiarea: 5 }, // Default to Dolomiti Superski

  // European mountain destinations - Use region for broader coverage
  'europe ski': { region: 911 }, // Default to Trentino
  'european ski resorts': { region: 911 },
  'europe skiing': { region: 911 },
  'european alps': { region: 911 },
  'mountain vacation europe': { region: 911 },
  'ski vacation europe': { region: 911 },

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

  // French ski destinations - Use ski areas for better coverage
  'france': { skiarea: 1 }, // Les 3 Vallées (includes Val Thorens, Les Menuires, Courchevel)
  'ski in france': { skiarea: 1 }, // Les 3 Vallées for specific ski searches

  // Austrian ski destinations - Use Tirol region
  'austria ski': { region: 607 }, // ✅ Tirol region
  'austrian ski': { region: 607 },
  'austria skiing': { region: 607 },
  'austrian skiing': { region: 607 },
  'ski austria': { region: 607 },
  'skiing austria': { region: 607 },
  'ski in austria': { region: 607 },

  // Swiss ski destinations - Use ski areas for better coverage
  'switzerland': { skiarea: 10 }, // Matterhorn ski paradise (Zermatt)
  'ski in switzerland': { skiarea: 10 },

  // Additional French Alps destinations - using ski area IDs
  'french alps': { resort: 9233 }, // Default to Chamonix for French Alps searches
  'les trois vallees': { skiarea: 1 }, // ✅ Les 3 Vallées
  '3 vallees': { skiarea: 1 },
  'paradiski': { skiarea: 12 }, // ✅ Paradiski (Les Arcs + La Plagne)
  'espace killy': { skiarea: 22 }, // ✅ Espace Killy (Tignes + Val d'Isère)
  'portes du soleil': { skiarea: 38 }, // ✅ Portes du Soleil (Morzine + Les Gets + Avoriaz)

  // Slovenia ski destinations - VERIFIED RESORT IDs from API
  'kranjska gora': { resort: 87 },
  'bohinj': { resort: 76 },
  'vogel': { resort: 76 },
  'pokljuka': { resort: 76 },
  'cerkno': { resort: 75 },
  'slovenia ski': { resort: 87 }, // Default to Kranjska Gora
  'slovenian ski': { resort: 87 },
  'slovenia skiing': { resort: 87 },
  'slovenian skiing': { resort: 87 },
  'ski slovenia': { resort: 87 },
  'skiing slovenia': { resort: 87 },
  'ski in slovenia': { resort: 87 },
  'skiing in slovenia': { resort: 87 },

  // Austria - Use Tirol region for broad country search
  'austria': { region: 607 }, // Tirol region

  // Additional France ski destinations - Use ski areas for better coverage
  'chamrousse': { resort: 45 },
  'la bresse': { resort: 43 },
  'besse super besse': { resort: 85 },
  'france ski': { skiarea: 1 }, // Les 3 Vallées
  'french ski': { skiarea: 1 },
  'france skiing': { skiarea: 1 },
  'french skiing': { skiarea: 1 },
  'ski france': { skiarea: 1 },
  'skiing france': { skiarea: 1 },

  // Additional Switzerland ski destinations - Use ski areas for better coverage
  'gstaad': { resort: 9 },
  'lenzerheide': { resort: 6 },
  'flims laax': { skiarea: 9 }, // Laax ski area

  'switzerland ski': { skiarea: 10 }, // Default to Matterhorn
  'swiss ski': { skiarea: 10 },
  'switzerland skiing': { skiarea: 10 },
  'swiss skiing': { skiarea: 10 },
  'ski switzerland': { skiarea: 10 },
  'skiing switzerland': { skiarea: 10 },

  // Germany ski destinations - VERIFIED RESORT IDs from API
  'garmisch partenkirchen': { resort: 35 },
  'oberstdorf': { resort: 55 },
  'germany ski': { resort: 35 }, // Default to Garmisch
  'german ski': { resort: 35 },
  'germany skiing': { resort: 35 },
  'german skiing': { resort: 35 },
  'ski germany': { resort: 35 },
  'skiing germany': { resort: 35 },

  // Bosnia ski destinations - VERIFIED RESORT IDs from API
  'jahorina': { resort: 9609 },
  'vlasic': { resort: 9608 },
  'bjelasnica': { resort: 9610 },
  'igman': { resort: 9613 },
  'bosnia ski': { resort: 9609 }, // Default to Jahorina
  'bosnian ski': { resort: 9609 },
  'bosnia skiing': { resort: 9609 },
  'bosnian skiing': { resort: 9609 },
  'ski bosnia': { resort: 9609 },
  'skiing bosnia': { resort: 9609 },

  // ===== NON-SKI DESTINATIONS =====
  // Croatian coastal/sea resorts - VERIFIED RESORT/REGION IDs from API
  'umag': { resort: 9487 }, // ✅ VERIFIED: Umag resort ID
  'porec': { region: 5207 }, // Istra region (no direct resort ID for Poreč)
  'poreč': { region: 5207 },
  'rovinj': { resort: 9489 }, // ✅ Rovinj
  'pula': { resort: 9491 }, // ✅ Pula
  'opatija': { resort: 9492 }, // ✅ Opatija
  'dubrovnik': { resort: 9538 }, // ✅ Dubrovnik
  'split': { city: 13402 }, // ✅ Split (city ID)
  'zadar': { resort: 9504 }, // ✅ Zadar
  'makarska': { resort: 9528 }, // ✅ Makarska
  'hvar': { resort: 9520 }, // ✅ Hvar
  'istria': { region: 5207 }, // ✅ Istra region
  'istra': { region: 5207 },
  'croatian coast': { region: 5207 }, // Default to Istra region
  'croatia coast': { region: 5207 },
  'croatia sea': { region: 5207 },
  'croatia beach': { region: 5207 },
  'croatia': { region: 5207 }, // Default to Istra region

  // Slovenian non-ski destinations - VERIFIED RESORT IDs from API
  'bled': { resort: 9436 }, // ✅ Bled
  'lake bled': { resort: 9436 },
  'bohinj lake': { resort: 76 }, // ✅ Bohinj
  'portoroz': { resort: 9469 }, // ✅ Portorož
  'portorož': { resort: 9469 },
  'piran': { resort: 9467 }, // ✅ Piran (nearby resort)
  'slovenian coast': { resort: 9469 }, // Default to Portorož
  'slovenia coast': { resort: 9469 },
  'slovenia sea': { resort: 9469 },
  'maribor': { resort: 9215 }, // ✅ Maribor
  'slovenia': { resort: 87 }, // Default to Kranjska Gora

  // Italian non-ski destinations - VERIFIED RESORT IDs from API
  'lake garda': { resort: 4 }, // ✅ Lago di Garda Nord
  'garda': { resort: 4 },
  'lago di garda': { resort: 4 },
};

export class MountVacationClient {
  private baseUrl = 'https://api.mountvacation.com';
  private searchEndpoint = '/accommodations/search';
  private timeout: number;
  private logger: Logger;
  private apiKey: string;
  private idMappingManager: IdMappingManager;

  constructor(env: Env, logger: Logger, userApiKey: string) {
    this.timeout = parseInt(env.API_TIMEOUT_SECONDS) * 1000;
    this.logger = logger;
    this.apiKey = userApiKey; // Use user-provided API key, not environment variable
    this.idMappingManager = new IdMappingManager(userApiKey);
  }

  /**
   * Search for accommodations using location mapping and multiple strategies with pagination support
   */
  async searchAccommodations(
    params: SearchParams,
    env: Env,
    enable_pagination: boolean = false,
    max_pages: number = 3
  ): Promise<SearchResult> {
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
      this.logger.info(`[MountVacationClient] Starting location-based search for: "${location}"`);

      // Try dynamic ID mapping first
      try {
        this.logger.info(`[MountVacationClient] Attempting dynamic ID mapping for: "${location}"`);
        const locationMatches = await this.idMappingManager.resolveLocation(location, env);
        this.logger.info(`[MountVacationClient] Dynamic ID mapping returned ${locationMatches.length} matches`);

        if (locationMatches.length > 0) {
          this.logger.info(`[MountVacationClient] Processing ${Math.min(locationMatches.length, 3)} location matches`);
          // Try each location match in order of confidence
          for (const match of locationMatches.slice(0, 3)) { // Try top 3 matches
            this.logger.info(`[MountVacationClient] Trying match: ${match.name} (${match.type}, confidence: ${match.confidence})`);
            const searchStrategies = this.buildDynamicSearchStrategies(baseParams, match, location);

            for (const strategy of searchStrategies) {
              try {
                this.logger.debug('Trying dynamic ID mapping strategy', {
                  strategy: strategy.name,
                  location: location,
                  match: match,
                  params: strategy.params
                });

                const result = await this.makeApiRequest(strategy.params, env);

                if (result && !(result as any).error && result.accommodations && result.accommodations.length > 0) {
                  const formatted = this.formatResults(result, max_results);

                  // Validate that results match the requested location
                  if (this.validateLocationMatch(formatted, location)) {
                    this.logger.info('Search successful with dynamic ID mapping', {
                      strategy: strategy.name,
                      location: location,
                      match: match,
                      results_count: formatted.accommodations?.length || 0,
                    });
                    return formatted;
                  } else {
                    this.logger.warn('Dynamic mapping results failed location validation', {
                      strategy: strategy.name,
                      location: location,
                      match: match,
                      results_count: formatted.accommodations?.length || 0,
                    });
                    // Continue to next strategy instead of returning invalid results
                  }
                }
              } catch (error) {
                this.logger.warn('Dynamic ID mapping strategy failed', {
                  strategy: strategy.name,
                  location: location,
                  match: match,
                  error: error instanceof Error ? error.message : String(error),
                });
                continue;
              }
            }
          }
        }
      } catch (error) {
        this.logger.warn('Dynamic ID mapping failed, falling back to static mapping', {
          location: location,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      // Fallback to static location mapping if dynamic mapping fails
      const locationMapping = this.findLocationMapping(location);

      if (locationMapping) {
        // Use mapped location data with enhanced strategy handling
        const searchStrategies = this.buildSearchStrategies(baseParams, locationMapping, location);
        const normalizedLocation = location.toLowerCase();

        // For Alpbachtal, try to combine results from multiple strategies
        if (normalizedLocation.includes('alpbach')) {
          const allResults: FormattedAccommodation[] = [];
          const seenAccommodationIds = new Set<number>();

          for (const strategy of searchStrategies) {
            try {
              this.logger.debug('Trying Alpbachtal search strategy', {
                strategy: strategy.name,
                location: location,
                params: strategy.params
              });

              const result = await this.makeApiRequest(strategy.params, env);

              if (result && !(result as any).error && result.accommodations && result.accommodations.length > 0) {
                const formatted = this.formatResults(result, 50); // Increased limit for combining

                if (formatted.accommodations) {
                  // Add unique accommodations to combined results
                  for (const accommodation of formatted.accommodations) {
                    const accommodationId = Number(accommodation.property_details.accommodation_id);
                    if (!seenAccommodationIds.has(accommodationId)) {
                      allResults.push(accommodation);
                      seenAccommodationIds.add(accommodationId);
                    }
                  }

                  this.logger.info('Alpbachtal search strategy contributed results', {
                    strategy: strategy.name,
                    location: location,
                    results_count: formatted.accommodations.length
                  });
                }
              }
            } catch (error) {
              this.logger.warn('Alpbachtal search strategy failed', {
                strategy: strategy.name,
                location: location,
                error: error instanceof Error ? error.message : String(error),
              });
              continue;
            }
          }

          // Return combined results if we found any
          if (allResults.length > 0) {
            this.logger.info('Combined Alpbachtal search successful', {
              location: location,
              results_count: allResults.length
            });

            return {
              search_summary: {
                arrival_date: baseParams.arrival || '',
                departure_date: baseParams.departure || '',
                nights: 0,
                persons_count: 0,
                total_found: allResults.length,
                currency: baseParams.currency || 'EUR'
              },
              accommodations: allResults.slice(0, max_results), // Respect max_results limit
              timestamp: new Date().toISOString()
            };
          }
        } else {
          // Standard single-strategy approach for other locations
          for (const strategy of searchStrategies) {
            try {
              this.logger.debug('Trying static mapped search strategy', {
                strategy: strategy.name,
                location: location,
                params: strategy.params
              });

              const result = await this.makeApiRequest(strategy.params, env);

              if (result && !(result as any).error && result.accommodations && result.accommodations.length > 0) {
                const formatted = this.formatResults(result, max_results);

                // Validate that results match the requested location
                if (this.validateLocationMatch(formatted, location)) {
                  this.logger.info('Search successful with static mapping', {
                    strategy: strategy.name,
                    location: location,
                    mapping: locationMapping,
                    results_count: formatted.accommodations?.length || 0,
                  });
                  return formatted;
                } else {
                  this.logger.warn('Static mapping results failed location validation', {
                    strategy: strategy.name,
                    location: location,
                    results_count: formatted.accommodations?.length || 0,
                  });
                  // Continue to next strategy instead of returning invalid results
                }
              }
            } catch (error) {
              this.logger.warn('Static mapped search strategy failed', {
                strategy: strategy.name,
                location: location,
                error: error instanceof Error ? error.message : String(error),
              });
              continue;
            }
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

            // Validate that fallback results match the requested location
            if (this.validateLocationMatch(formatted, location)) {
              this.logger.info('Search successful with fallback', {
                strategy: strategy.name,
                location: location,
                results_count: formatted.accommodations?.length || 0,
              });
              return formatted;
            } else {
              this.logger.warn('Fallback results failed location validation', {
                strategy: strategy.name,
                location: location,
                results_count: formatted.accommodations?.length || 0,
              });
              // Continue to next strategy instead of returning invalid results
            }
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
          'Try a specific resort or city name (e.g., "Umag", "Madonna di Campiglio", "Bled")',
          'Use broader search terms (e.g., "Croatian Coast", "Italian Dolomites", "Alps")',
          'Check the spelling of the location name',
          'Try nearby resort or city names',
          'Add the country for better results (e.g., "Umag, Croatia" or "Chamonix, France")',
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
   * Search accommodations with complete pagination support
   * Collects all available results by following pagination links
   */
  async searchAccommodationsComplete(
    params: SearchParams,
    env: Env,
    max_total_results: number = 50,
    max_pages: number = 10
  ): Promise<SearchResult> {
    this.logger.info('Starting complete search with pagination', {
      location: params.location || 'unknown',
      max_total_results,
      max_pages
    });

    // Get first batch using regular search
    const firstBatch = await this.searchAccommodations(params, env, false, 1);

    if (firstBatch.error || !firstBatch.accommodations || firstBatch.accommodations.length === 0) {
      return firstBatch;
    }

    let allAccommodations = [...firstBatch.accommodations];
    let currentPage = 1;
    let nextPageUrl = firstBatch.pagination?.next_page_url;

    // Continue fetching additional pages if available
    while (nextPageUrl && currentPage < max_pages && allAccommodations.length < max_total_results) {
      try {
        this.logger.debug('Fetching additional page', {
          page: currentPage + 1,
          url: nextPageUrl,
          current_results: allAccommodations.length
        });

        const nextBatch = await this.fetchNextPage(nextPageUrl, env);

        if (nextBatch.accommodations && nextBatch.accommodations.length > 0) {
          allAccommodations.push(...nextBatch.accommodations);
          nextPageUrl = nextBatch.pagination?.next_page_url;
          currentPage++;

          // Small delay to be respectful to the API
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          break;
        }
      } catch (error) {
        this.logger.warn('Error fetching additional page, stopping pagination', {
          page: currentPage + 1,
          error: error instanceof Error ? error.message : String(error)
        });
        break;
      }
    }

    // Limit results to max_total_results
    if (allAccommodations.length > max_total_results) {
      allAccommodations = allAccommodations.slice(0, max_total_results);
    }

    return {
      search_summary: {
        arrival_date: firstBatch.search_summary?.arrival_date || '',
        departure_date: firstBatch.search_summary?.departure_date || '',
        nights: firstBatch.search_summary?.nights || 0,
        persons_count: firstBatch.search_summary?.persons_count || 0,
        currency: firstBatch.search_summary?.currency || 'EUR',
        total_found: allAccommodations.length,
        pages_fetched: currentPage,
        collection_method: 'complete_pagination',
        truncated: allAccommodations.length >= max_total_results
      },
      accommodations: allAccommodations,
      pagination: {
        total_pages_fetched: currentPage,
        has_more_pages: !!nextPageUrl && allAccommodations.length < max_total_results,
        collection_complete: !nextPageUrl || allAccommodations.length >= max_total_results
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Fetch next page of results using pagination URL
   */
  async fetchNextPage(nextPageUrl: string, env: Env): Promise<SearchResult> {
    try {
      this.logger.debug('Fetching next page', { url: nextPageUrl });

      // Parse the URL to add authentication if needed
      const url = new URL(nextPageUrl);

      // Add authentication parameter if not already present
      if (!url.searchParams.has('apiKey')) {
        url.searchParams.set('apiKey', this.apiKey);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'User-Agent': 'MountVacation-MCP-Worker/2.0',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      this.logger.info('Next page fetched successfully', {
        url: nextPageUrl,
        results_count: data.accommodations?.length || 0,
        has_more: !!data.links?.next
      });

      return this.formatResults(data, 100); // Allow more results per page for pagination

    } catch (error) {
      this.logger.error('Failed to fetch next page', {
        url: nextPageUrl,
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        error: `Failed to fetch next page: ${error instanceof Error ? error.message : String(error)}`,
        accommodations: [],
        timestamp: new Date().toISOString()
      };
    }
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
   * Validate that search results match the requested location
   * This prevents returning results from completely different locations
   */
  private validateLocationMatch(results: any, requestedLocation: string): boolean {
    if (!results?.accommodations || results.accommodations.length === 0) {
      return false;
    }

    const normalizedRequested = requestedLocation.toLowerCase().trim();

    // Extract validation keywords dynamically from the requested location
    // This works for ALL locations, not just hardcoded ski resorts
    const validationKeywords: string[] = [];

    // Parse comma-separated input: "Umag, Croatia" → ["umag", "croatia"]
    if (normalizedRequested.includes(',')) {
      const parts = normalizedRequested.split(',').map(p => p.trim()).filter(p => p.length > 0);
      validationKeywords.push(...parts);
    } else {
      validationKeywords.push(normalizedRequested);
    }

    // Also add well-known location validation rules for specific destinations
    const specificValidation: Record<string, string[]> = {
      'zermatt': ['zermatt', 'switzerland', 'swiss', 'valais'],
      'verbier': ['verbier', 'switzerland', 'swiss', 'valais'],
      'chamonix': ['chamonix', 'france', 'french', 'mont blanc'],
      'innsbruck': ['innsbruck', 'austria', 'austrian', 'tirol', 'tyrol'],
      'st anton': ['st anton', 'st. anton', 'austria', 'austrian', 'arlberg'],
      'kitzbühel': ['kitzbühel', 'kitzbuhel', 'austria', 'austrian'],
      'kitzbuhel': ['kitzbühel', 'kitzbuhel', 'austria', 'austrian'],
      'livigno': ['livigno', 'italy', 'italian', 'lombardy'],
      'cortina': ['cortina', 'italy', 'italian', 'dolomites', 'ampezzo'],
      'cortina d\'ampezzo': ['cortina', 'italy', 'italian', 'dolomites', 'ampezzo'],
      'val d\'isère': ['val d\'isère', 'val d\'isere', 'france', 'french', 'savoie'],
      'val d\'isere': ['val d\'isère', 'val d\'isere', 'france', 'french', 'savoie'],
      'alta badia': ['alta badia', 'badia', 'italy', 'italian', 'dolomites', 'san cassiano', 'corvara']
    };

    // Merge specific validation keywords if available
    const specificKeywords = specificValidation[normalizedRequested];
    if (specificKeywords) {
      for (const kw of specificKeywords) {
        if (!validationKeywords.includes(kw)) {
          validationKeywords.push(kw);
        }
      }
    }

    // Check if any accommodation matches at least one validation keyword
    for (const accommodation of results.accommodations) {
      const locationText = [
        accommodation.location?.city,
        accommodation.location?.country,
        accommodation.location?.resort,
        accommodation.location?.region,
        accommodation.location?.full_address,
        accommodation.name
      ].filter(Boolean).join(' ').toLowerCase();

      // Check if any validation keyword is found in the accommodation location
      const hasMatch = validationKeywords.some(keyword =>
        locationText.includes(keyword.toLowerCase())
      );

      if (hasMatch) {
        return true; // At least one accommodation matches
      }
    }

    // No accommodations match the requested location
    this.logger.warn(`Location validation failed for '${requestedLocation}' - results do not match requested location`, {
      location: requestedLocation,
      results_count: results.accommodations.length,
      validation_keywords: validationKeywords,
      first_result_location: results.accommodations[0]?.location || 'unknown',
      error: 'Location validation failed'
    });

    return false;
  }

  /**
   * Build search strategies based on location mapping (prioritized for best accommodation coverage)
   */
  private buildSearchStrategies(baseParams: Record<string, string>, mapping: LocationMapping, location: string) {
    const strategies = [];
    const normalizedLocation = location.toLowerCase();

    // Special handling for Alpbachtal - use multiple strategies for comprehensive coverage
    if (normalizedLocation.includes('alpbach')) {
      // Primary strategy: Use ski area for broadest coverage
      if (mapping.skiarea) {
        strategies.push({
          name: 'alpbachtal_skiarea_primary',
          params: { ...baseParams, skiArea: mapping.skiarea.toString() }
        });
      }

      // Secondary strategy: Use resort ID for additional results
      if (mapping.resort) {
        strategies.push({
          name: 'alpbachtal_resort_secondary',
          params: { ...baseParams, resort: mapping.resort.toString() }
        });
      }

      // Tertiary strategy: Geographic search around Alpbachtal center
      strategies.push({
        name: 'alpbachtal_geographic_tertiary',
        params: {
          ...baseParams,
          latitude: '47.4000',  // Alpbachtal center coordinates
          longitude: '11.9000',
          radius: '15000'       // 15km radius to cover all villages
        }
      });

      return strategies;
    }

    // Standard search strategies for other locations

    // Skiarea search (HIGHEST PRIORITY - best accommodation coverage)
    if (mapping.skiarea) {
      strategies.push({
        name: 'skiarea_mapped',
        params: { ...baseParams, skiArea: mapping.skiarea.toString() }
      });
    }

    // Resort search (second priority)
    if (mapping.resort) {
      strategies.push({
        name: 'resort_mapped',
        params: { ...baseParams, resort: mapping.resort.toString() }
      });
    }

    // City search (third priority)
    if (mapping.city) {
      strategies.push({
        name: 'city_mapped',
        params: { ...baseParams, city: mapping.city.toString() }
      });
    }

    // Region search (fourth priority)
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
   * Build search strategies based on dynamic ID mapping
   */
  private buildDynamicSearchStrategies(baseParams: Record<string, string>, match: LocationMatch, location: string) {
    const strategies = [];

    // Use the appropriate search parameter based on match type
    switch (match.type) {
      case 'resort':
        strategies.push({
          name: 'resort_dynamic',
          params: { ...baseParams, resort: match.id.toString() }
        });
        break;

      case 'city':
        strategies.push({
          name: 'city_dynamic',
          params: { ...baseParams, city: match.id.toString() }
        });
        break;

      case 'region':
        strategies.push({
          name: 'region_dynamic',
          params: { ...baseParams, region: match.id.toString() }
        });
        break;

      case 'skiarea':
        strategies.push({
          name: 'skiarea_dynamic',
          params: { ...baseParams, skiArea: match.id.toString() }
        });
        break;

      case 'country':
        // For country matches, search by country code
        strategies.push({
          name: 'country_dynamic',
          params: { ...baseParams, country: match.countryCode || match.id.toString() }
        });
        break;
    }

    // If coordinates are available, add geolocation search as fallback
    if (match.coordinates) {
      strategies.push({
        name: 'geolocation_dynamic',
        params: {
          ...baseParams,
          latitude: match.coordinates.lat.toString(),
          longitude: match.coordinates.lng.toString(),
          radius: '10000' // 10km radius
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

    // Handle multi-country searches like "France or Italy", "French Alps or Italian Dolomites"
    const containsFrance = normalizedLocation.includes('france') || normalizedLocation.includes('french');
    const containsItaly = normalizedLocation.includes('italy') || normalizedLocation.includes('italian');
    const containsAustria = normalizedLocation.includes('austria') || normalizedLocation.includes('austrian');
    const containsSwitzerland = normalizedLocation.includes('switzerland') || normalizedLocation.includes('swiss');

    // Multi-country searches - prioritize multiple destinations
    if ((containsFrance && containsItaly) || (containsFrance && containsAustria) || (containsItaly && containsAustria)) {
      this.logger.info('Multi-country search detected', { location, params: { france: containsFrance, italy: containsItaly, austria: containsAustria } });

      // French ski destinations (verified working resort IDs)
      if (containsFrance) {
        strategies.push({
          name: 'chamonix_multi_fallback',
          params: { ...baseParams, resort: '9233' } // Chamonix (verified working)
        });
        strategies.push({
          name: 'avoriaz_multi_fallback',
          params: { ...baseParams, resort: '9236' } // Avoriaz (verified working)
        });
        // Use geolocation for other French resorts
        strategies.push({
          name: 'val_disere_multi_fallback',
          params: {
            ...baseParams,
            latitude: '45.4486',
            longitude: '6.9786',
            radius: '8000'
          }
        });
      }

      // Italian ski destinations (verified working region IDs)
      if (containsItaly) {
        strategies.push({
          name: 'trentino_multi_fallback',
          params: { ...baseParams, region: '911' } // Trentino-Alto Adige (verified working)
        });
        strategies.push({
          name: 'veneto_multi_fallback',
          params: { ...baseParams, region: '914' } // Veneto (Cortina area)
        });
        strategies.push({
          name: 'valle_aosta_multi_fallback',
          params: { ...baseParams, region: '913' } // Valle d'Aosta
        });
      }

      // Austrian ski destinations
      if (containsAustria) {
        strategies.push({
          name: 'austria_innsbruck_multi_fallback',
          params: {
            ...baseParams,
            latitude: '47.2692',
            longitude: '11.4041',
            radius: '15000'
          }
        });
        strategies.push({
          name: 'austria_kitzbuhel_multi_fallback',
          params: {
            ...baseParams,
            latitude: '47.4467',
            longitude: '12.3914',
            radius: '10000'
          }
        });
      }

      return strategies; // Return early for multi-country searches
    }

    // Single country searches with enhanced logic

    // Italy-specific searches
    if (normalizedLocation.includes('italy') || normalizedLocation.includes('italian')) {
      strategies.push({
        name: 'trentino_alto_adige_fallback',
        params: { ...baseParams, region: '911' } // Primary Italian ski region
      });
      strategies.push({
        name: 'veneto_fallback',
        params: { ...baseParams, region: '914' } // Cortina area
      });
      strategies.push({
        name: 'valle_aosta_fallback',
        params: { ...baseParams, region: '913' } // Cervinia, Courmayeur
      });
      strategies.push({
        name: 'lombardy_fallback',
        params: { ...baseParams, region: '904' } // Livigno, Bormio
      });
    }

    // France-specific searches
    if (normalizedLocation.includes('france') || normalizedLocation.includes('french')) {
      // Use verified working resort IDs first
      strategies.push({
        name: 'chamonix_fallback',
        params: { ...baseParams, resort: '9233' } // Chamonix (verified)
      });
      strategies.push({
        name: 'avoriaz_fallback',
        params: { ...baseParams, resort: '9236' } // Avoriaz (verified)
      });

      // Use geolocation for other major French resorts
      strategies.push({
        name: 'val_disere_fallback',
        params: {
          ...baseParams,
          latitude: '45.4486',
          longitude: '6.9786',
          radius: '8000'
        }
      });
      strategies.push({
        name: 'courchevel_fallback',
        params: {
          ...baseParams,
          latitude: '45.4167',
          longitude: '6.6333',
          radius: '8000'
        }
      });
    }

    // Austria-specific searches
    if (normalizedLocation.includes('austria') || normalizedLocation.includes('austrian')) {
      strategies.push({
        name: 'austria_innsbruck_fallback',
        params: {
          ...baseParams,
          latitude: '47.2692',
          longitude: '11.4041',
          radius: '15000'
        }
      });
      strategies.push({
        name: 'austria_kitzbuhel_fallback',
        params: {
          ...baseParams,
          latitude: '47.4467',
          longitude: '12.3914',
          radius: '10000'
        }
      });
      strategies.push({
        name: 'austria_st_anton_fallback',
        params: {
          ...baseParams,
          latitude: '47.1275',
          longitude: '10.2606',
          radius: '10000'
        }
      });
    }

    // Alpbachtal-specific fallback searches
    if (normalizedLocation.includes('alpbach')) {
      strategies.push({
        name: 'alpbachtal_skiarea_fallback',
        params: { ...baseParams, skiArea: '52' } // Alpbachtal ski area
      });
      strategies.push({
        name: 'alpbachtal_resort_fallback',
        params: { ...baseParams, resort: '9340' } // Alpbachtal resort
      });
      strategies.push({
        name: 'alpbachtal_geographic_fallback',
        params: {
          ...baseParams,
          latitude: '47.4000',
          longitude: '11.9000',
          radius: '15000'
        }
      });
    }

    // Switzerland-specific searches
    if (containsSwitzerland) {
      strategies.push({
        name: 'switzerland_zermatt_fallback',
        params: {
          ...baseParams,
          latitude: '46.0207',
          longitude: '7.7491',
          radius: '10000'
        }
      });
      strategies.push({
        name: 'switzerland_st_moritz_fallback',
        params: {
          ...baseParams,
          latitude: '46.4908',
          longitude: '9.8355',
          radius: '10000'
        }
      });
      strategies.push({
        name: 'switzerland_verbier_fallback',
        params: {
          ...baseParams,
          latitude: '46.0964',
          longitude: '7.2281',
          radius: '10000'
        }
      });
    }

    // Regional searches
    if (normalizedLocation.includes('dolomit')) {
      strategies.push({
        name: 'dolomites_trentino_fallback',
        params: { ...baseParams, region: '911' }
      });
      strategies.push({
        name: 'dolomites_veneto_fallback',
        params: { ...baseParams, region: '914' }
      });
    }

    // Alps searches
    if (normalizedLocation.includes('alps')) {
      if (normalizedLocation.includes('french')) {
        strategies.push({
          name: 'french_alps_chamonix_fallback',
          params: { ...baseParams, resort: '9233' }
        });
        strategies.push({
          name: 'french_alps_geolocation_fallback',
          params: {
            ...baseParams,
            latitude: '45.9237',
            longitude: '6.8694',
            radius: '50000'
          }
        });
      } else if (normalizedLocation.includes('italian')) {
        strategies.push({
          name: 'italian_alps_fallback',
          params: { ...baseParams, region: '911' }
        });
      } else {
        // Generic Alps search - try Italian Alps first (more reliable)
        strategies.push({
          name: 'alps_italian_fallback',
          params: { ...baseParams, region: '911' }
        });
        strategies.push({
          name: 'alps_french_fallback',
          params: { ...baseParams, resort: '9233' }
        });
      }
    }

    // Ski-specific searches
    if (normalizedLocation.includes('ski') || normalizedLocation.includes('skiing')) {
      if (normalizedLocation.includes('europe')) {
        // European ski search - try multiple regions
        strategies.push({
          name: 'europe_ski_italy_fallback',
          params: { ...baseParams, region: '911' }
        });
        strategies.push({
          name: 'europe_ski_france_fallback',
          params: { ...baseParams, resort: '9233' }
        });
        strategies.push({
          name: 'europe_ski_geolocation_fallback',
          params: {
            ...baseParams,
            latitude: '46.4102',
            longitude: '11.8440',
            radius: '80000'
          }
        });
      }
    }

    // Croatia-specific searches (sea/coastal resorts)
    const containsCroatia = normalizedLocation.includes('croatia') || normalizedLocation.includes('croat') || normalizedLocation.includes('hrvat');
    if (containsCroatia) {
      // Istria region (Umag, Poreč, Rovinj area)
      strategies.push({
        name: 'croatia_istria_fallback',
        params: {
          ...baseParams,
          latitude: '45.2637',
          longitude: '13.5183',
          radius: '50000'
        }
      });
      // Dalmatia region (Split, Dubrovnik area)
      strategies.push({
        name: 'croatia_dalmatia_fallback',
        params: {
          ...baseParams,
          latitude: '43.5081',
          longitude: '16.4402',
          radius: '50000'
        }
      });
    }

    // Slovenia-specific searches (lake, sea, and ski resorts)
    const containsSlovenia = normalizedLocation.includes('slovenia') || normalizedLocation.includes('sloven');
    if (containsSlovenia) {
      // Bled / Bohinj lake area
      strategies.push({
        name: 'slovenia_bled_fallback',
        params: {
          ...baseParams,
          latitude: '46.3683',
          longitude: '14.1146',
          radius: '20000'
        }
      });
      // Portorož / Slovenian coast
      strategies.push({
        name: 'slovenia_coast_fallback',
        params: {
          ...baseParams,
          latitude: '45.5100',
          longitude: '13.5912',
          radius: '15000'
        }
      });
      // Kranjska Gora ski area
      strategies.push({
        name: 'slovenia_kranjska_gora_fallback',
        params: {
          ...baseParams,
          latitude: '46.4839',
          longitude: '13.7858',
          radius: '15000'
        }
      });
    }

    // Sea/beach/coast-specific searches
    if (normalizedLocation.includes('sea') || normalizedLocation.includes('beach') || normalizedLocation.includes('coast')) {
      strategies.push({
        name: 'coast_istria_fallback',
        params: {
          ...baseParams,
          latitude: '45.2637',
          longitude: '13.5183',
          radius: '50000'
        }
      });
      strategies.push({
        name: 'coast_slovenia_fallback',
        params: {
          ...baseParams,
          latitude: '45.5100',
          longitude: '13.5912',
          radius: '15000'
        }
      });
    }

    // Lake-specific searches
    if (normalizedLocation.includes('lake')) {
      strategies.push({
        name: 'lake_bled_fallback',
        params: {
          ...baseParams,
          latitude: '46.3683',
          longitude: '14.1146',
          radius: '20000'
        }
      });
    }

    return strategies;
  }

  /**
   * Advanced research method that mimics human vacation booking behavior
   */
  async researchAccommodations(params: {
    regions: string[];
    preferred_dates: {
      arrival: string;
      departure: string;
      flexible_days?: number;
    };
    persons_ages: string;
    budget?: {
      max_total: number;
      currency?: string;
    };
    requirements?: {
      accommodation_type?: string;
      board_type?: string;
      amenities?: string[];
      proximity?: {
        ski_slopes?: number;
        center?: number;
      };
    };
    results_per_region?: number;
  }, env: Env): Promise<any> {
    const results = {
      search_summary: {
        regions_searched: params.regions,
        preferred_dates: params.preferred_dates,
        budget: params.budget,
        requirements: params.requirements,
        total_regions: params.regions.length,
        results_per_region: params.results_per_region || 3
      },
      regional_results: [] as any[],
      best_overall: [] as any[],
      alternative_dates: [] as any[]
    };

    // Search each region
    for (const region of params.regions) {
      try {
        this.logger.info('Researching region', { location: region } as any);

        // Try preferred dates first
        const regionResult = await this.searchRegionWithFilters(
          region,
          params.preferred_dates.arrival,
          params.preferred_dates.departure,
          params.persons_ages,
          env,
          params.budget,
          params.requirements,
          params.results_per_region || 3
        );

        results.regional_results.push({
          region: region,
          preferred_dates_results: regionResult,
          alternative_dates_results: []
        });

        // If flexible dates and few results, try alternative dates
        if (regionResult.accommodations.length < (params.results_per_region || 3) &&
            params.preferred_dates.flexible_days && params.preferred_dates.flexible_days > 0) {

          const alternativeDates = this.generateAlternativeDates(
            params.preferred_dates.arrival,
            params.preferred_dates.departure,
            params.preferred_dates.flexible_days
          );

          for (const altDate of alternativeDates.slice(0, 2)) { // Try 2 alternative date ranges
            const altResult = await this.searchRegionWithFilters(
              region,
              altDate.arrival,
              altDate.departure,
              params.persons_ages,
              env,
              params.budget,
              params.requirements,
              params.results_per_region || 3
            );

            if (altResult.accommodations.length > 0) {
              results.regional_results[results.regional_results.length - 1].alternative_dates_results.push({
                dates: altDate,
                results: altResult
              });
            }
          }
        }

      } catch (error) {
        this.logger.error('Region research failed', { location: region, error: error instanceof Error ? error.message : String(error) } as any);
        results.regional_results.push({
          region: region,
          error: 'Search failed for this region',
          preferred_dates_results: { accommodations: [] },
          alternative_dates_results: []
        });
      }
    }

    // Compile best overall results across all regions
    results.best_overall = this.compileBestOverallResults(results.regional_results, params.budget);

    return results;
  }

  /**
   * Search a region with advanced filtering
   */
  private async searchRegionWithFilters(
    region: string,
    arrival: string,
    departure: string,
    persons_ages: string,
    env: Env,
    budget?: { max_total: number; currency?: string },
    requirements?: {
      accommodation_type?: string;
      board_type?: string;
      amenities?: string[];
      proximity?: { ski_slopes?: number; center?: number };
    },
    maxResults: number = 3
  ): Promise<any> {
    // First do basic search
    const searchResult = await this.searchAccommodations({
      location: region,
      arrival_date: arrival,
      departure_date: departure,
      persons_ages: persons_ages,
      currency: budget?.currency || 'EUR',
      max_results: maxResults * 3 // Get more to filter from
    }, env);

    if (!searchResult.accommodations || searchResult.accommodations.length === 0) {
      return { accommodations: [], search_summary: searchResult.search_summary };
    }

    // Apply filters
    let filteredAccommodations = searchResult.accommodations;

    // Budget filter - work with processed format
    if (budget?.max_total) {
      filteredAccommodations = filteredAccommodations.filter((acc: any) => {
        const totalPrice = acc.pricing?.total_price || Infinity;
        return totalPrice <= budget.max_total;
      });
    }

    // Amenities filter - work with processed format
    if (requirements?.amenities && requirements.amenities.length > 0) {
      filteredAccommodations = filteredAccommodations.filter((acc: any) => {
        return requirements.amenities!.every(amenity => {
          switch (amenity.toLowerCase()) {
            case 'pool': return acc.amenities?.pool === true;
            case 'wellness': return acc.amenities?.wellness === true;
            case 'fitness': return acc.amenities?.fitness === true;
            case 'parking': return acc.amenities?.parking === true;
            case 'wifi': return acc.amenities?.wifi === true;
            case 'pets': return acc.amenities?.pets === true;
            default: return true;
          }
        });
      });
    }

    // Proximity filter - work with processed format
    if (requirements?.proximity) {
      filteredAccommodations = filteredAccommodations.filter((acc: any) => {
        let passesProximity = true;
        if (requirements.proximity!.ski_slopes && acc.distances?.ski_slopes) {
          passesProximity = passesProximity && acc.distances.ski_slopes <= requirements.proximity!.ski_slopes;
        }
        if (requirements.proximity!.center && acc.distances?.center) {
          passesProximity = passesProximity && acc.distances.center <= requirements.proximity!.center;
        }
        return passesProximity;
      });
    }

    // Board type filter - work with processed format
    if (requirements?.board_type) {
      filteredAccommodations = filteredAccommodations.filter((acc: any) => {
        if (!acc.booking_offers) return false;
        return acc.booking_offers.some((offer: any) =>
          offer.board_type === requirements.board_type
        );
      });
    }

    // Sort by best value (price vs amenities) - work with processed format
    filteredAccommodations.sort((a: any, b: any) => {
      const aPrice = a.pricing?.total_price || Infinity;
      const bPrice = b.pricing?.total_price || Infinity;

      // Factor in amenities score
      const aAmenities = (a.amenities?.pool ? 1 : 0) + (a.amenities?.wellness ? 1 : 0) + (a.amenities?.fitness ? 1 : 0) + (a.amenities?.parking ? 1 : 0);
      const bAmenities = (b.amenities?.pool ? 1 : 0) + (b.amenities?.wellness ? 1 : 0) + (b.amenities?.fitness ? 1 : 0) + (b.amenities?.parking ? 1 : 0);

      // Best value = lower price + more amenities
      const aScore = aPrice - (aAmenities * 50); // Each amenity worth 50 EUR discount
      const bScore = bPrice - (bAmenities * 50);

      return aScore - bScore;
    });

    return {
      accommodations: filteredAccommodations.slice(0, maxResults),
      search_summary: {
        ...searchResult.search_summary,
        filters_applied: {
          budget: budget,
          requirements: requirements,
          original_count: searchResult.accommodations.length,
          filtered_count: filteredAccommodations.length
        }
      }
    };
  }

  /**
   * Generate alternative date ranges
   */
  private generateAlternativeDates(arrival: string, departure: string, flexibleDays: number): Array<{arrival: string, departure: string}> {
    const arrivalDate = new Date(arrival);
    const departureDate = new Date(departure);
    const stayDuration = Math.ceil((departureDate.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24));

    const alternatives = [];

    // Earlier dates
    for (let i = 1; i <= flexibleDays; i++) {
      const newArrival = new Date(arrivalDate);
      newArrival.setDate(newArrival.getDate() - i);
      const newDeparture = new Date(newArrival);
      newDeparture.setDate(newDeparture.getDate() + stayDuration);

      alternatives.push({
        arrival: newArrival.toISOString().split('T')[0] as string,
        departure: newDeparture.toISOString().split('T')[0] as string
      });
    }

    // Later dates
    for (let i = 1; i <= flexibleDays; i++) {
      const newArrival = new Date(arrivalDate);
      newArrival.setDate(newArrival.getDate() + i);
      const newDeparture = new Date(newArrival);
      newDeparture.setDate(newDeparture.getDate() + stayDuration);

      alternatives.push({
        arrival: newArrival.toISOString().split('T')[0] as string,
        departure: newDeparture.toISOString().split('T')[0] as string
      });
    }

    return alternatives;
  }

  /**
   * Compile best overall results across regions
   */
  private compileBestOverallResults(regionalResults: any[], budget?: { max_total: number; currency?: string }): any[] {
    const allAccommodations = [];

    for (const regionResult of regionalResults) {
      if (regionResult.preferred_dates_results?.accommodations) {
        for (const acc of regionResult.preferred_dates_results.accommodations) {
          allAccommodations.push({
            ...acc,
            search_region: regionResult.region,
            date_type: 'preferred'
          });
        }
      }

      if (regionResult.alternative_dates_results) {
        for (const altResult of regionResult.alternative_dates_results) {
          for (const acc of altResult.results.accommodations) {
            allAccommodations.push({
              ...acc,
              search_region: regionResult.region,
              date_type: 'alternative',
              alternative_dates: altResult.dates
            });
          }
        }
      }
    }

    // Sort by best overall value - work with processed format
    allAccommodations.sort((a: any, b: any) => {
      const aPrice = a.pricing?.total_price || Infinity;
      const bPrice = b.pricing?.total_price || Infinity;

      return aPrice - bPrice;
    });

    return allAccommodations.slice(0, 6); // Top 6 overall
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
    }
    // Croatian destinations
    else if (normalizedLocation.includes('croatia') || normalizedLocation.includes('croat') || normalizedLocation.includes('istri')) {
      suggestions.push(
        'Umag, Croatia',
        'Poreč, Croatia',
        'Rovinj, Croatia',
        'Dubrovnik, Croatia',
        'Split, Croatia'
      );
    }
    // Slovenian destinations
    else if (normalizedLocation.includes('slovenia') || normalizedLocation.includes('sloven')) {
      suggestions.push(
        'Bled, Slovenia',
        'Portorož, Slovenia',
        'Kranjska Gora, Slovenia',
        'Bohinj, Slovenia',
        'Maribor, Slovenia'
      );
    }
    // Austrian destinations
    else if (normalizedLocation.includes('austria') || normalizedLocation.includes('austrian')) {
      suggestions.push(
        'St. Anton, Austria',
        'Kitzbühel, Austria',
        'Innsbruck, Austria',
        'Alpbachtal, Austria',
        'Sölden, Austria'
      );
    }
    // French destinations
    else if (normalizedLocation.includes('france') || normalizedLocation.includes('french')) {
      suggestions.push(
        'Chamonix, France',
        'Val d\'Isère, France',
        'Courchevel, France',
        'Avoriaz, France',
        'Méribel, France'
      );
    }
    // Sea/beach/coast destinations
    else if (normalizedLocation.includes('sea') || normalizedLocation.includes('beach') || normalizedLocation.includes('coast')) {
      suggestions.push(
        'Umag, Croatia',
        'Poreč, Croatia',
        'Rovinj, Croatia',
        'Portorož, Slovenia',
        'Dubrovnik, Croatia'
      );
    }
    // Lake destinations
    else if (normalizedLocation.includes('lake')) {
      suggestions.push(
        'Bled, Slovenia',
        'Bohinj, Slovenia',
        'Lake Garda, Italy'
      );
    }
    else {
      // General popular destinations - mix of ski and non-ski
      suggestions.push(
        'Madonna di Campiglio',
        'Chamonix',
        'Zermatt',
        'Umag, Croatia',
        'Bled, Slovenia'
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
      this.logger.info('Making API request', {
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
        this.logger.info('MountVacation API Response', {
          accommodations_count: data.accommodations?.length || 0,
          has_accommodations: !!data.accommodations,
          has_extended_search: !!data.links?.extendedAreaSearch,
          response_keys: Object.keys(data),
          first_accommodation: data.accommodations?.[0] ? {
            id: data.accommodations[0].id,
            title: data.accommodations[0].title,
            city: data.accommodations[0].city,
            country: data.accommodations[0].country,
            resort: data.accommodations[0].resort
          } : null
        });

        // Extended area search disabled — it returns results from unrelated locations
        // (e.g., Montgenèvre, France for an Umag, Croatia query).
        // The location validation layer handles fallback logic instead.
        if ((!data.accommodations || data.accommodations.length === 0) && data.links?.extendedAreaSearch) {
          this.logger.info('No accommodations found. Extended area search available but skipped to prevent wrong-location results', {
            extended_search_url: data.links.extendedAreaSearch
          });
        }

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

    // Extract pagination information from API response
    const links = data.links || {};
    const paginationInfo = {
      has_more_pages: Boolean(links.next || links.nextRel || links.nextPage),
      next_page_url: links.next || null,
      next_page_relative: links.nextRel || null,
      next_page_number: links.nextPage || null,
      extended_area_search_url: links.extendedAreaSearch || null,
      current_batch_size: formattedAccommodations.length,
      total_in_current_batch: data.accommodations?.length || 0
    };

    const result: SearchResult = {
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

    // Add pagination info if available
    if (paginationInfo.has_more_pages) {
      result.pagination = paginationInfo;
    }

    return result;
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
