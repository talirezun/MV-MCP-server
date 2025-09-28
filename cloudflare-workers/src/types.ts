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
  // Search method parameters (at least one required)
  location?: string;                    // Location name search
  accommodation_id?: number;            // Single accommodation search
  accommodation_ids?: number[];         // Multiple accommodations search
  resort_id?: number;                   // Resort-based search
  city_id?: number;                     // City-based search
  latitude?: number;                    // Geolocation search (requires longitude & radius)
  longitude?: number;                   // Geolocation search (requires latitude & radius)
  radius?: number;                      // Geolocation search radius in meters

  // Date parameters (required)
  arrival_date: string;                 // YYYY-MM-DD format
  departure_date?: string;              // YYYY-MM-DD format (alternative: use nights)
  nights?: number;                      // Number of nights (alternative to departure_date)

  // Person parameters (at least one required)
  persons_ages?: string;                // Comma-separated ages (e.g., "30,28,8")
  persons?: number;                     // Number of persons (all adults)

  // Optional parameters
  currency?: string;                    // Currency code (default: EUR)
  language?: string;                    // Language code (default: en)
  include_additional_fees?: boolean;    // Include additional fees (default: false)
  max_results?: number;                 // Max results per page (default: 10)
  page?: number;                        // Page number for pagination (default: 1)
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
  accommodationUrl?: string; // Main property page URL
  pictures?: {
    url: string;
    pictures: string[];
  };
  images?: string[];
  offers?: AccommodationOffer[];
  // Additional fields from API
  id?: number;
  accommodationID?: number;
  latitude?: number;
  longitude?: number;
  region?: string;
  regionID?: number;
  skiarea?: string;
  pool?: boolean;
  wellness?: boolean;
  skiInOut?: boolean;
  priority?: number;
}

export interface FormattedAccommodation {
  name: string;
  location: {
    city: string;
    country: string;
    resort: string;
    region: string;
    full_address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    } | undefined;
  };
  property_details: {
    category: string;
    type: string;
    beds: number | string;
    bedrooms: number | string;
    size_sqm: number | string;
    max_occupancy: number | string;
    accommodation_id: number | string;
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
    pool: boolean;
    wellness: boolean;
    ski_in_out: boolean;
  };
  distances: {
    to_resort_center: string;
    to_ski_runs: string;
    to_city_center: string;
  };
  booking: {
    primary_booking_url: string;
    free_cancellation_until: string;
    booking_conditions: string;
  };
  // NEW: Multiple booking offers with direct links
  booking_offers: Array<{
    facility_title: string;
    price: number | string;
    currency: string;
    beds: number | string;
    service_type: string;
    booking_url: string;
    free_cancellation_until: string;
    breakfast_included: boolean;
    promotion: string | null;
  }>;
  // NEW: Quick booking link (most prominent)
  book_now_url: string;
  property_url: string;
  property_page_url: string; // Main MountVacation property page
  images: string[];
  image_gallery: {
    thumbnail_urls: string[];
    full_size_urls: string[];
  };
}

export interface SearchResult {
  search_summary?: {
    arrival_date: string;
    departure_date: string;
    nights: number;
    persons_count: number;
    total_found: number;
    currency: string;
    pages_fetched?: number;
    collection_method?: string;
    truncated?: boolean;
  };
  accommodations?: FormattedAccommodation[];
  pagination?: {
    has_more_pages?: boolean;
    next_page_url?: string | null;
    next_page_relative?: string | null;
    next_page_number?: number | null;
    extended_area_search_url?: string | null;
    current_batch_size?: number;
    total_in_current_batch?: number;
    total_pages_fetched?: number;
    collection_complete?: boolean;
  };
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
  links?: {
    next?: string;
    nextRel?: string;
    nextPage?: number;
    extendedAreaSearch?: string;
    [key: string]: any;
  };
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
  // Pagination fields
  max_total_results?: number;
  max_pages?: number;
  page?: number;
  current_results?: number;
  removed_entries?: number;
  match?: any; // For dynamic ID mapping matches
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
  searchType?: string; // For search type logging
  // Debug fields
  api_key_length?: number;
  api_key_prefix?: string;
  accommodations_count?: number;
  has_accommodations?: boolean;
  response_keys?: string[];
  first_accommodation?: any;
  has_extended_search?: boolean;
  extended_search_url?: string;
  extended_search_used?: boolean;
}

export interface RateLimitInfo {
  requests: number;
  windowStart: number;
  blocked: boolean;
}

// New interfaces for accommodation properties API
export interface AccommodationProperties {
  accommodation: number;
  properties: {
    main: {
      id: number;
      giataID?: number;
      category: number;
      type: string;
      title: string;
      description: string;
      city: string;
      resort: string;
      country: string;
      region?: string;
      cityID?: number;
      resortID?: number;
      regionID?: number;
      countryID?: number;
      languages?: string;
      picturesWinter?: {
        url: string;
        pictures: string[];
      };
      picturesSummer?: {
        url: string;
        pictures: string[];
      };
      cancellationPolicy?: Array<{
        from: number;
        to: number;
        fee: string;
      }>;
      active: boolean;
    };
    geolocation?: {
      latitude: number;
      longitude: number;
    };
    accommodationContactInfo?: {
      accommodationUrl?: string;
      accommodationEmail?: string;
      accommodationPhone?: string;
      accommodationStreet?: string;
      accommodationPostal?: string;
    };
    wellness?: Record<string, boolean>;
    freetime?: Record<string, boolean>;
    general?: Record<string, boolean>;
    food?: Record<string, boolean>;
    distance?: Record<string, number>;
    [key: string]: any;
  };
  facilitiesProperties?: Record<string, FacilityProperties>;
}

export interface FacilityProperties {
  main: {
    id: number;
    accommodationID: number;
    beds: number;
    bedsExtra?: number;
    bedrooms: number;
    bathrooms: number;
    sizeSqM?: number;
    title: string;
    description: string;
    type: string;
    subtype?: string;
    pictures?: {
      url: string;
      pictures: string[];
    };
    minOccupancy?: number;
    maxAdults?: number;
    minAdults?: number;
    maxChildren?: number;
    minChildren?: number;
    maxAgeForChildren?: number;
    inPrice?: string;
    active: boolean;
  };
  amenities?: Record<string, boolean>;
  bathroom?: Record<string, boolean>;
  kitchen?: Record<string, boolean>;
  view?: Record<string, boolean>;
}

// Booking API interfaces
export interface BookingRequest {
  offer: {
    accommodation: number;
    offer: number;
    from: string;
    to: string;
  };
  reservationHolder: {
    title: string;
    firstname: string;
    lastname: string;
    address: string;
    postal: string;
    city: string;
    country: string;
    phone: string;
    company?: string;
    vatID?: string;
  };
  passengers: Array<{
    firstname: string;
    lastname: string;
    birthday: string;
    offer: number;
  }>;
  payment: {
    method: string;
    numOfInstallments: number;
  };
  lang: string;
}

export interface BookingResponse {
  ID: number;
  totalPrice: number;
  reservationHolder: any;
  passengers: any[];
  offer: any;
  payment: any;
  session: string;
  installments: Record<string, any>;
  services: any[];
  discount: number;
  isClosed: boolean;
  isSubmitted: boolean;
  canBeUpdated: boolean;
  allowedPaymentMethods: string[];
}
