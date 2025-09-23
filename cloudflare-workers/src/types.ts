/**
 * Type definitions for MountVacation MCP Server
 */

export interface Env {
  // Secrets (set via wrangler secret put)
  MOUNTVACATION_API_KEY: string;
  // Legacy fields (kept for backward compatibility)
  MOUNTVACATION_USERNAME?: string;
  MOUNTVACATION_PASSWORD?: string;

  // Environment variables
  NODE_ENV: string;
  LOG_LEVEL: string;
  CACHE_TTL_SECONDS: string;
  MAX_CACHE_SIZE: string;
  API_TIMEOUT_SECONDS: string;
  MAX_RESULTS_DEFAULT: string;
  MAX_RESULTS_LIMIT: string;
  RATE_LIMIT_REQUESTS_PER_MINUTE: string;

  // Bindings (using any for now to avoid Cloudflare Workers type dependencies)
  CACHE?: any; // KVNamespace
  ANALYTICS?: any; // AnalyticsEngineDataset
}

export interface SearchParams {
  location: string;
  arrival_date: string;
  departure_date: string;
  persons_ages: string;
  currency?: string;
  max_results?: number;
}

export interface AccommodationOffer {
  totalPrice?: number;
  beds?: number;
  bedrooms?: number;
  sizeSqM?: number;
  maxPersons?: number;
  reservationUrl?: string;
  freeCancellationBefore?: string;
  breakfastIncluded?: boolean;
  conditions?: string;
}

export interface RawAccommodation {
  title?: string;
  city?: string;
  country?: string;
  resort?: string;
  category?: string;
  type?: string;
  currency?: string;
  internetWifi?: boolean;
  parking?: boolean;
  pets?: boolean;
  balcony?: boolean;
  kitchen?: boolean;
  distResort?: number;
  distRuns?: number;
  distCentre?: number;
  url?: string;
  images?: string[];
  offers?: AccommodationOffer[];
}

export interface FormattedAccommodation {
  name: string;
  location: {
    city: string;
    country: string;
    resort: string;
    full_address: string;
  };
  property_details: {
    category: string;
    type: string;
    beds: number | string;
    bedrooms: number | string;
    size_sqm: number | string;
    max_occupancy: number | string;
  };
  pricing: {
    total_price: number | string;
    currency: string;
    nights: number | string;
    price_per_night: number | string;
  };
  amenities: {
    wifi: boolean;
    parking: boolean;
    pets_allowed: boolean;
    breakfast_included: boolean;
    balcony: boolean;
    kitchen: boolean;
  };
  distances: {
    to_resort_center: string;
    to_ski_runs: string;
    to_city_center: string;
  };
  booking: {
    reservation_url: string;
    free_cancellation_until: string;
    booking_conditions: string;
  };
  property_url: string;
  images: string[];
}

export interface SearchResult {
  search_summary?: {
    arrival_date: string;
    departure_date: string;
    nights: number;
    persons_count: number;
    total_found: number;
    currency: string;
  };
  accommodations?: FormattedAccommodation[];
  error?: string;
  message?: string;
  suggestions?: string[];
  available_locations?: string[];
  timestamp?: string;
}

export interface APIResponse {
  accommodations?: RawAccommodation[];
  arrival?: string;
  departure?: string;
  nights?: number;
  personsAges?: number[];
  currency?: string;
}

export interface CacheEntry {
  data: SearchResult;
  timestamp: number;
  ttl: number;
}

export interface LogContext {
  requestId?: string;
  location?: string;
  arrival_date?: string;
  departure_date?: string;
  persons_ages?: string;
  currency?: string;
  max_results?: number;
  strategy?: string;
  cache_hit?: boolean;
  api_status?: number;
  response_time?: number;
  error?: string;
  // Additional logging fields
  params?: any;
  results_count?: number;
  url?: string;
  status?: number;
  error_name?: string;
  cache_key?: string;
  client_id?: string;
  removed_entries?: number;
  cleaned_entries?: number;
  remaining_entries?: number;
  timeout_ms?: number;
  response_time_ms?: number;
  response_body?: string;
  method?: string;
  ttl_seconds?: number;
  requests?: number;
  content_type?: string | null;
  data_size?: number;
  max_requests?: number;
  window_start?: string;
  mapping?: any; // For location mapping information
}

export interface RateLimitInfo {
  requests: number;
  windowStart: number;
  blocked: boolean;
}
