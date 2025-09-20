/**
 * Response cache implementation with TTL
 * Handles caching of API responses to reduce redundant calls
 */

import { createHash } from 'crypto';
import { type AgentType, type HedgiResponse } from './schemas';
import { loggerInstance as logger } from './logger';

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
    const cacheSize = this.cache.size;
    this.cache.clear();
    logger.info('Response cache cleared', { entriesRemoved: cacheSize });
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

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.config.ttlMs) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug('Cache cleanup completed', {
        entriesCleaned: cleaned,
        remainingEntries: this.cache.size,
      });
    }
  }
}
