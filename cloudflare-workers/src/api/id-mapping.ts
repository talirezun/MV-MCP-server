/**
 * Dynamic ID Mapping System for MountVacation API
 * 
 * This module provides dynamic location resolution by fetching and caching
 * ID mappings from the MountVacation API endpoints.
 */

export interface Country {
  id: number;
  code: string;
  title: Record<string, string>; // Multi-language names (API uses 'title', not 'name')
}

export interface Region {
  id: number;
  title: Record<string, string>; // API uses 'title', not 'name'
  countryID: number; // API uses 'countryID', not 'countryId'
  countryCode: string;
}

export interface City {
  id: number;
  title: string;
  resortID?: number; // API uses 'resortID', not 'resortId'
  resort?: string;
  regionID?: number; // API uses 'regionID', not 'regionId'
  region?: Record<string, string>;
  countryID: number; // API uses 'countryID', not 'countryId'
  countryCode: string;
  latitude?: number;
  longitude?: number;
}

export interface Resort {
  id: number;
  title: string;
  skiareaID?: number; // API uses 'skiareaID', not 'skiareaId'
  skiarea?: string;
  regionID?: number; // API uses 'regionID', not 'regionId'
  region?: Record<string, string>;
  countryID: number; // API uses 'countryID', not 'countryId'
  countryCode: string;
  isSkiResort: boolean;
  isLakeResort: boolean;
  isSeaResort: boolean;
  isThermalResort: boolean;
}

export interface SkiArea {
  id: number;
  title: string; // API uses 'title', not 'name'
  resorts?: Resort[];
}

export interface IdMappings {
  countries: Country[];
  regions: Region[];
  cities: City[];
  resorts: Resort[];
  skiareas: SkiArea[];
  lastUpdated: number;
}

export interface LocationMatch {
  type: 'country' | 'region' | 'city' | 'resort' | 'skiarea';
  id: number;
  name: string;
  confidence: number;
  countryCode?: string;
  coordinates?: { lat: number; lng: number };
}

/**
 * ID Mapping Manager - handles fetching, caching, and resolving location IDs
 */
export class IdMappingManager {
  private mappings: IdMappings | null = null;
  private readonly cacheKey = 'mountvacation_id_mappings';
  private readonly cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Initialize or refresh ID mappings from the API
   */
  async initializeMappings(env: any, forceRefresh = false): Promise<void> {
    // Check in-memory cache first
    if (!forceRefresh && this.mappings) {
      const age = Date.now() - this.mappings.lastUpdated;
      if (age < this.cacheExpiry) {
        console.log('Using cached ID mappings');
        return; // Use cached data
      }
    }

    console.log('Fetching fresh ID mappings from API');
    // Fetch fresh data from API
    await this.fetchMappingsFromApi(env);
  }

  /**
   * Fetch all ID mappings from MountVacation API
   */
  private async fetchMappingsFromApi(env: any): Promise<void> {
    try {
      const baseUrl = 'https://api.mountvacation.com';
      const apiKeyParam = `apiKey=${this.apiKey}`;

      console.log('Fetching ID mappings from MountVacation API...');

      // Fetch all mapping data in parallel
      const [countriesRes, regionsRes, citiesRes, resortsRes, skiareasRes] = await Promise.all([
        fetch(`${baseUrl}/countries?${apiKeyParam}`),
        fetch(`${baseUrl}/regions?${apiKeyParam}`),
        fetch(`${baseUrl}/cities?${apiKeyParam}`),
        fetch(`${baseUrl}/resorts?${apiKeyParam}`),
        fetch(`${baseUrl}/skiareas?${apiKeyParam}`)
      ]);

      // Check for API errors
      if (!countriesRes.ok) {
        throw new Error(`Countries API failed: ${countriesRes.status} ${countriesRes.statusText}`);
      }
      if (!regionsRes.ok) {
        throw new Error(`Regions API failed: ${regionsRes.status} ${regionsRes.statusText}`);
      }
      if (!citiesRes.ok) {
        throw new Error(`Cities API failed: ${citiesRes.status} ${citiesRes.statusText}`);
      }
      if (!resortsRes.ok) {
        throw new Error(`Resorts API failed: ${resortsRes.status} ${resortsRes.statusText}`);
      }
      if (!skiareasRes.ok) {
        throw new Error(`Skiareas API failed: ${skiareasRes.status} ${skiareasRes.statusText}`);
      }

      // Parse responses
      const [countries, regions, cities, resorts, skiareas] = await Promise.all([
        countriesRes.json(),
        regionsRes.json(),
        citiesRes.json(),
        resortsRes.json(),
        skiareasRes.json()
      ]);

      // Create mappings object
      this.mappings = {
        countries: countries.countries || [],
        regions: regions.regions || [],
        cities: cities.cities || [],
        resorts: resorts.resorts || [],
        skiareas: skiareas.skiareas || [],
        lastUpdated: Date.now()
      };

      console.log(`Successfully loaded ID mappings: ${this.mappings.countries.length} countries, ${this.mappings.regions.length} regions, ${this.mappings.cities.length} cities, ${this.mappings.resorts.length} resorts, ${this.mappings.skiareas.length} skiareas`);

    } catch (error) {
      console.error('Failed to fetch ID mappings:', error);
      throw new Error(`Failed to initialize ID mappings: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Resolve a location string to specific IDs
   */
  async resolveLocation(location: string, env: any): Promise<LocationMatch[]> {
    try {
      console.log(`[ID Mapping] Resolving location: "${location}"`);
      await this.initializeMappings(env);

      if (!this.mappings) {
        throw new Error('ID mappings not initialized');
      }

      console.log(`[ID Mapping] Mappings available: ${this.mappings.countries.length} countries, ${this.mappings.regions.length} regions, ${this.mappings.cities.length} cities, ${this.mappings.resorts.length} resorts`);

      const normalizedLocation = location.toLowerCase().trim();
      const matches: LocationMatch[] = [];
      console.log(`[ID Mapping] Searching for: "${normalizedLocation}"`);

    // Search countries
    for (const country of this.mappings.countries) {
      const confidence = this.calculateMatchConfidence(normalizedLocation, country.title, country.code);
      if (confidence > 0.3) {
        matches.push({
          type: 'country',
          id: country.id,
          name: country.title.en || Object.values(country.title)[0] || 'Unknown',
          confidence,
          countryCode: country.code
        });
      }
    }

    // Search regions
    for (const region of this.mappings.regions) {
      const confidence = this.calculateMatchConfidence(normalizedLocation, region.title);
      if (confidence > 0.3) {
        matches.push({
          type: 'region',
          id: region.id,
          name: region.title.en || Object.values(region.title)[0] || 'Unknown',
          confidence,
          countryCode: region.countryCode
        });
      }
    }

    // Search cities
    for (const city of this.mappings.cities) {
      const confidence = this.calculateStringMatch(normalizedLocation, city.title.toLowerCase());
      if (confidence > 0.3) {
        const cityMatch: LocationMatch = {
          type: 'city',
          id: city.id,
          name: city.title,
          confidence,
          countryCode: city.countryCode
        };

        if (city.latitude && city.longitude) {
          cityMatch.coordinates = { lat: city.latitude, lng: city.longitude };
        }

        matches.push(cityMatch);
      }
    }

    // Search resorts
    for (const resort of this.mappings.resorts) {
      const confidence = this.calculateStringMatch(normalizedLocation, resort.title.toLowerCase());
      if (confidence > 0.3) {
        matches.push({
          type: 'resort',
          id: resort.id,
          name: resort.title,
          confidence,
          countryCode: resort.countryCode
        });
      }
    }

    // Search ski areas (CRITICAL - was missing!)
    for (const skiarea of this.mappings.skiareas) {
      const confidence = this.calculateStringMatch(normalizedLocation, skiarea.title.toLowerCase());
      if (confidence > 0.3) {
        matches.push({
          type: 'skiarea',
          id: skiarea.id,
          name: skiarea.title,
          confidence
        });
      }
    }

    // Sort by confidence and type priority (ski areas and resorts first)
    matches.sort((a, b) => {
      // Prioritize ski areas and resorts as they typically have better accommodation coverage
      const typePriority = { 'skiarea': 5, 'resort': 4, 'city': 3, 'region': 2, 'country': 1 };
      const aPriority = typePriority[a.type] || 0;
      const bPriority = typePriority[b.type] || 0;

      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }

      return b.confidence - a.confidence;
    });

    console.log(`[ID Mapping] Found ${matches.length} matches for "${location}"`);
    if (matches.length > 0 && matches[0]) {
      console.log(`[ID Mapping] Top match: ${matches[0].name} (${matches[0].type}, confidence: ${matches[0].confidence})`);
    }

    return matches;
    } catch (error) {
      console.error(`[ID Mapping] Error resolving location "${location}":`, error);
      throw error;
    }
  }

  /**
   * Calculate match confidence for multi-language names
   */
  private calculateMatchConfidence(query: string, names: Record<string, string>, code?: string): number {
    let maxConfidence = 0;

    // Check all language variants
    for (const [lang, name] of Object.entries(names)) {
      const confidence = this.calculateStringMatch(query, name.toLowerCase());
      maxConfidence = Math.max(maxConfidence, confidence);
    }

    // Check country code if provided
    if (code) {
      const codeConfidence = this.calculateStringMatch(query, code.toLowerCase());
      maxConfidence = Math.max(maxConfidence, codeConfidence);
    }

    return maxConfidence;
  }

  /**
   * Calculate string match confidence using fuzzy matching
   */
  private calculateStringMatch(query: string, target: string): number {
    // Exact match
    if (query === target) return 1.0;

    // Contains match
    if (target.includes(query) || query.includes(target)) {
      const longer = query.length > target.length ? query : target;
      const shorter = query.length > target.length ? target : query;
      return shorter.length / longer.length;
    }

    // Levenshtein distance based matching
    const distance = this.levenshteinDistance(query, target);
    const maxLength = Math.max(query.length, target.length);
    return Math.max(0, 1 - distance / maxLength);
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(0));

    for (let i = 0; i <= str1.length; i++) matrix[0]![i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j]![0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j]![i] = Math.min(
          matrix[j]![i - 1]! + 1,     // deletion
          matrix[j - 1]![i]! + 1,     // insertion
          matrix[j - 1]![i - 1]! + indicator // substitution
        );
      }
    }

    return matrix[str2.length]![str1.length]!;
  }

  /**
   * Get all mappings (for debugging/inspection)
   */
  async getMappings(env: any): Promise<IdMappings | null> {
    await this.initializeMappings(env);
    return this.mappings;
  }
}
