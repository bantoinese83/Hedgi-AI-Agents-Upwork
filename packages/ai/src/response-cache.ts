/**
 * Response cache implementation with TTL
 * Handles caching of API responses to reduce redundant calls
 */

import { createHash } from 'crypto';
import { loggerInstance as logger } from './logger';
import { type AgentType, type HedgiResponse } from './schemas';

export interface CacheConfig {
  ttlMs: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size (optional)
}

export class ResponseCache {
  private cache: Map<string, { response: HedgiResponse; timestamp: number }> = new Map();
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
  }

  /**
   * Generate cache key for request using SHA-256
   */
  private generateCacheKey(
    agent: AgentType,
    systemPrompt: string,
    userPrompt: string
  ): string {
    const content = `${agent}:${systemPrompt}:${userPrompt}`;
    return createHash('sha256').update(content).digest('hex').substring(0, 32);
  }

  /**
   * Get cached response if still valid
   */
  get(agent: AgentType, systemPrompt: string, userPrompt: string): HedgiResponse | null {
    const cacheKey = this.generateCacheKey(agent, systemPrompt, userPrompt);
    const cached = this.cache.get(cacheKey);

    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.config.ttlMs;
    if (isExpired) {
      this.cache.delete(cacheKey);
      logger.debug(`Cache expired for ${agent}`);
      return null;
    }

    logger.debug(`Cache hit for ${agent}`);
    return cached.response;
  }

  /**
   * Store response in cache
   */
  set(agent: AgentType, systemPrompt: string, userPrompt: string, response: HedgiResponse): void {
    const cacheKey = this.generateCacheKey(agent, systemPrompt, userPrompt);

    // Check cache size limit
    if (this.config.maxSize && this.cache.size >= this.config.maxSize) {
      // Remove oldest entry (simple LRU approximation)
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(cacheKey, {
      response,
      timestamp: Date.now(),
    });

    logger.debug(`Cached response for ${agent}`, { cacheSize: this.cache.size });
  }

  /**
   * Clear cache
   */
  clear(): void {
    try {
      const cacheSize = this.cache.size;
      this.cache.clear();
      logger.info('Response cache cleared successfully', {
        entriesRemoved: cacheSize,
        currentSize: this.cache.size,
      });
    } catch (error) {
      logger.error('Critical error during cache clear:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize?: number } {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    let errorsOccurred = 0;

    try {
      for (const [key, value] of this.cache.entries()) {
        try {
          if (now - value.timestamp > this.config.ttlMs) {
            this.cache.delete(key);
            cleaned++;
          }
        } catch (error) {
          logger.error(`Failed to cleanup cache entry ${key}:`, error instanceof Error ? error.message : String(error));
          errorsOccurred++;
        }
      }

      if (cleaned > 0) {
        logger.info('Cache cleanup completed', {
          entriesCleaned: cleaned,
          errorsOccurred,
          remainingEntries: this.cache.size,
          maxSize: this.config.maxSize,
        });
      }
    } catch (error) {
      logger.error('Critical error during cache cleanup:', error instanceof Error ? error.message : String(error));
    }
  }
}
