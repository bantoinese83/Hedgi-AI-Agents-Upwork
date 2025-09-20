/**
 * Persistent rate limiter for API endpoints with file-based storage
 * Prevents abuse and ensures fair usage across application restarts
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { loggerInstance as logger } from './logger';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  storagePath?: string; // Path for persistent storage
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastUpdated: number; // For persistence tracking
}

export class RateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map();
  private config: Required<RateLimitConfig>;
  private persistenceTimer: NodeJS.Timeout | null = null;

  constructor(config: RateLimitConfig) {
    this.config = {
      storagePath: join(process.cwd(), 'data', 'rate-limits.json'),
      ...config,
    };

    this.loadFromStorage();
    this.startPersistence();
  }

  /**
   * Check if request is allowed
   * @param identifier - Unique identifier (IP, user ID, etc.)
   * @returns true if allowed, false if rate limited
   */
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    let entry = this.requests.get(identifier);

    if (!entry || now > entry.resetTime) {
      // First request or window expired - reset
      entry = {
        count: 1,
        resetTime: now + this.config.windowMs,
        lastUpdated: now,
      };
      this.requests.set(identifier, entry);
      this.saveToStorage();
      return true;
    }

    if (entry.count >= this.config.maxRequests) {
      return false;
    }

    // Increment count
    entry.count++;
    entry.lastUpdated = now;
    this.requests.set(identifier, entry);
    this.saveToStorage();
    return true;
  }

  /**
   * Get remaining requests for identifier
   */
  getRemainingRequests(identifier: string): number {
    const entry = this.requests.get(identifier);
    if (!entry || Date.now() > entry.resetTime) {
      return this.config.maxRequests;
    }
    return Math.max(0, this.config.maxRequests - entry.count);
  }

  /**
   * Get reset time for identifier
   */
  getResetTime(identifier: string): number {
    const entry = this.requests.get(identifier);
    return entry?.resetTime || Date.now() + this.config.windowMs;
  }

  /**
   * Load rate limit data from persistent storage
   */
  private async loadFromStorage(): Promise<void> {
    try {
      const data = await fs.readFile(this.config.storagePath, 'utf8');
      const stored = JSON.parse(data);

      // Clean up expired entries on load
      const now = Date.now();
      for (const [identifier, entry] of Object.entries(stored)) {
        if (now <= (entry as RateLimitEntry).resetTime) {
          this.requests.set(identifier, entry as RateLimitEntry);
        }
      }

      logger.info('Rate limiter data loaded from storage', {
        entries_loaded: this.requests.size,
      });
    } catch (error) {
      // File doesn't exist or is invalid - start fresh
      logger.info('Rate limiter storage not found or invalid, starting fresh');
    }
  }

  /**
   * Save rate limit data to persistent storage
   */
  private async saveToStorage(): Promise<void> {
    try {
      await fs.mkdir(join(this.config.storagePath, '..'), { recursive: true });
      const data = Object.fromEntries(this.requests);
      await fs.writeFile(this.config.storagePath, JSON.stringify(data, null, 2));

      logger.debug('Rate limiter data saved to storage', {
        entries_saved: this.requests.size,
      });
    } catch (error) {
      logger.error('Failed to save rate limiter data:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Start periodic persistence
   */
  private startPersistence(): void {
    // Save every 30 seconds
    this.persistenceTimer = setInterval(() => {
      this.saveToStorage();
    }, 30 * 1000);

    // Save on process exit
    process.on('SIGINT', () => this.saveToStorage());
    process.on('SIGTERM', () => this.saveToStorage());
  }

  /**
   * Stop persistence and cleanup
   */
  destroy(): void {
    if (this.persistenceTimer) {
      clearInterval(this.persistenceTimer);
      this.persistenceTimer = null;
    }
    this.saveToStorage();
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug('Rate limiter cleanup', {
        entries_cleaned: cleaned,
        remaining_entries: this.requests.size,
      });
      this.saveToStorage();
    }
  }
}

// Default rate limiter: 10 requests per minute per IP with persistence
export const defaultRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
  storagePath: join(process.cwd(), 'data', 'rate-limits.json'),
});

// Cleanup expired entries every 5 minutes
setInterval(
  () => {
    defaultRateLimiter.cleanup();
  },
  5 * 60 * 1000
);
