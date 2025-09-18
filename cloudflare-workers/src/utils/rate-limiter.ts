/**
 * Rate limiting utilities for Cloudflare Workers
 */

import { RateLimitInfo } from '../types';
import { Logger } from './logger';

export class RateLimiter {
  private requests: Map<string, RateLimitInfo> = new Map();
  private maxRequests: number;
  private windowMs: number;
  private logger: Logger;

  constructor(
    maxRequests: number = 60,
    windowMinutes: number = 1,
    logger: Logger
  ) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMinutes * 60 * 1000;
    this.logger = logger;
  }

  /**
   * Check if request should be rate limited
   */
  isRateLimited(clientId: string): boolean {
    const now = Date.now();
    const clientInfo = this.requests.get(clientId);

    if (!clientInfo) {
      // First request from this client
      this.requests.set(clientId, {
        requests: 1,
        windowStart: now,
        blocked: false,
      });
      return false;
    }

    // Check if we're in a new window
    if (now - clientInfo.windowStart >= this.windowMs) {
      // Reset window
      clientInfo.requests = 1;
      clientInfo.windowStart = now;
      clientInfo.blocked = false;
      return false;
    }

    // Increment request count
    clientInfo.requests++;

    // Check if limit exceeded
    if (clientInfo.requests > this.maxRequests) {
      clientInfo.blocked = true;
      this.logger.warn('Rate limit exceeded', {
        client_id: clientId,
        requests: clientInfo.requests,
        max_requests: this.maxRequests,
        window_start: new Date(clientInfo.windowStart).toISOString(),
      });
      return true;
    }

    return false;
  }

  /**
   * Get rate limit info for client
   */
  getRateLimitInfo(clientId: string): {
    requests: number;
    maxRequests: number;
    windowStart: Date;
    resetTime: Date;
    blocked: boolean;
  } | null {
    const clientInfo = this.requests.get(clientId);
    if (!clientInfo) {
      return null;
    }

    return {
      requests: clientInfo.requests,
      maxRequests: this.maxRequests,
      windowStart: new Date(clientInfo.windowStart),
      resetTime: new Date(clientInfo.windowStart + this.windowMs),
      blocked: clientInfo.blocked,
    };
  }

  /**
   * Clean up old entries
   */
  cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [clientId, info] of this.requests.entries()) {
      if (now - info.windowStart >= this.windowMs * 2) {
        toDelete.push(clientId);
      }
    }

    for (const clientId of toDelete) {
      this.requests.delete(clientId);
    }

    if (toDelete.length > 0) {
      this.logger.debug('Rate limiter cleanup', {
        cleaned_entries: toDelete.length,
        remaining_entries: this.requests.size,
      });
    }
  }

  /**
   * Get client ID from request
   */
  getClientId(request: Request): string {
    // Try to get client IP
    const clientIP = request.headers.get('CF-Connecting-IP') || 
                    request.headers.get('X-Forwarded-For') || 
                    'unknown';
    
    // You could also use other identifiers like API keys
    const apiKey = request.headers.get('Authorization');
    
    return apiKey ? `api:${apiKey}` : `ip:${clientIP}`;
  }
}
