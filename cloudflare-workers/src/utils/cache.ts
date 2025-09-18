/**
 * Caching utilities for Cloudflare Workers
 */

import { CacheEntry, SearchResult } from '../types';
import { Logger } from './logger';

export class CacheManager {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private maxSize: number;
  private defaultTTL: number;
  private logger: Logger;

  constructor(
    maxSize: number = 1000,
    defaultTTL: number = 300,
    logger: Logger
  ) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    this.logger = logger;
  }

  /**
   * Generate cache key from search parameters
   */
  generateKey(
    location: string,
    arrival_date: string,
    departure_date: string,
    persons_ages: string,
    currency: string,
    max_results: number
  ): string {
    const normalized = {
      location: location.toLowerCase().trim(),
      arrival_date,
      departure_date,
      persons_ages,
      currency: currency.toUpperCase(),
      max_results,
    };
    
    return `search:${JSON.stringify(normalized)}`;
  }

  /**
   * Get cached result
   */
  async get(key: string, kvStore?: any): Promise<SearchResult | null> {
    // Try memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && this.isValid(memoryEntry)) {
      this.logger.debug('Memory cache hit', { cache_key: key });
      return memoryEntry.data;
    }

    // Try KV store if available
    if (kvStore) {
      try {
        const kvValue = await kvStore.get(key);
        if (kvValue) {
          const kvEntry: CacheEntry = JSON.parse(kvValue);
          if (this.isValid(kvEntry)) {
            // Populate memory cache
            this.memoryCache.set(key, kvEntry);
            this.logger.debug('KV cache hit', { cache_key: key });
            return kvEntry.data;
          }
        }
      } catch (error) {
        this.logger.warn('KV cache read error', { 
          cache_key: key, 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }

    this.logger.debug('Cache miss', { cache_key: key });
    return null;
  }

  /**
   * Set cached result
   */
  async set(
    key: string,
    data: SearchResult,
    kvStore?: any,
    ttl: number = this.defaultTTL
  ): Promise<void> {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: ttl * 1000, // Convert to milliseconds
    };

    // Set in memory cache
    this.evictIfNeeded();
    this.memoryCache.set(key, entry);

    // Set in KV store if available
    if (kvStore) {
      try {
        await kvStore.put(key, JSON.stringify(entry), {
          expirationTtl: ttl,
        });
        this.logger.debug('Cached result', { 
          cache_key: key, 
          ttl_seconds: ttl,
          data_size: JSON.stringify(data).length 
        });
      } catch (error) {
        this.logger.warn('KV cache write error', { 
          cache_key: key, 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }
  }

  /**
   * Check if cache entry is still valid
   */
  private isValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Evict old entries if cache is full
   */
  private evictIfNeeded(): void {
    if (this.memoryCache.size >= this.maxSize) {
      // Remove oldest entries (simple LRU)
      const entries = Array.from(this.memoryCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = Math.floor(this.maxSize * 0.2); // Remove 20% of entries
      for (let i = 0; i < toRemove; i++) {
        this.memoryCache.delete(entries[i]![0]);
      }
      
      this.logger.debug('Cache eviction', { 
        removed_entries: toRemove, 
        remaining_entries: this.memoryCache.size 
      });
    }
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.memoryCache.clear();
    this.logger.info('Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.memoryCache.size,
      maxSize: this.maxSize,
    };
  }
}
