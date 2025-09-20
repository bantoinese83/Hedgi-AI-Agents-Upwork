/**
 * Atomic circuit breaker implementation
 * Handles service failure detection and recovery
 */

import { loggerInstance as logger } from './logger';

// Circuit breaker states with atomic transitions
export enum CircuitState {
  CLOSED = 'closed',      // Normal operation
  OPEN = 'open',          // Failing, reject requests
  HALF_OPEN = 'half-open' // Testing if service recovered
}

export interface CircuitBreakerState {
  state: CircuitState;
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
  lastStateChange: number; // For atomic transitions
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  timeoutMs: number;
  cacheTimeout: number;
}

export class CircuitBreaker {
  private state: CircuitBreakerState;
  private config: CircuitBreakerConfig;

  // Circuit breaker state caching
  private cache: {
    state: CircuitState;
    isOpen: boolean;
    lastCheckTime: number;
    cacheTimeout: number;
  };

  constructor(config: CircuitBreakerConfig) {
    this.config = config;

    this.state = {
      state: CircuitState.CLOSED,
      failureCount: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0,
      lastStateChange: Date.now(),
    };

    this.cache = {
      state: CircuitState.CLOSED,
      isOpen: false,
      lastCheckTime: 0,
      cacheTimeout: config.cacheTimeout,
    };
  }

  /**
   * Check circuit breaker state with conditional caching
   */
  isOpen(): boolean {
    const now = Date.now();

    // Check cache first if still valid
    if (now - this.cache.lastCheckTime < this.cache.cacheTimeout) {
      return this.cache.isOpen;
    }

    const currentState = this.state.state;

    switch (currentState) {
      case CircuitState.CLOSED:
        // Update cache
        this.cache.state = CircuitState.CLOSED;
        this.cache.isOpen = false;
        this.cache.lastCheckTime = now;
        return false;

      case CircuitState.OPEN:
        if (now >= this.state.nextAttemptTime) {
          // Atomically transition to HALF_OPEN
          if (this.state.state === CircuitState.OPEN) {
            this.state.state = CircuitState.HALF_OPEN;
            this.state.lastStateChange = now;
          }
          // Update cache
          this.cache.state = CircuitState.HALF_OPEN;
          this.cache.isOpen = false;
          this.cache.lastCheckTime = now;
          return false;
        }
        // Update cache
        this.cache.state = CircuitState.OPEN;
        this.cache.isOpen = true;
        this.cache.lastCheckTime = now;
        return true;

      case CircuitState.HALF_OPEN:
        // Update cache
        this.cache.state = CircuitState.HALF_OPEN;
        this.cache.isOpen = false;
        this.cache.lastCheckTime = now;
        return false;

      default:
        // Update cache
        this.cache.state = CircuitState.CLOSED;
        this.cache.isOpen = false;
        this.cache.lastCheckTime = now;
        return false;
    }
  }

  /**
   * Record success/failure for circuit breaker atomically and update cache
   */
  recordEvent(success: boolean): void {
    const now = Date.now();

    if (success) {
      // Atomically reset failure count and transition from HALF_OPEN to CLOSED
      this.state.failureCount = 0;
      if (this.state.state === CircuitState.HALF_OPEN) {
        this.state.state = CircuitState.CLOSED;
        this.state.lastStateChange = now;
        // Update cache
        this.cache.state = CircuitState.CLOSED;
        this.cache.isOpen = false;
        this.cache.lastCheckTime = now;
      }
    } else {
      this.state.failureCount++;
      this.state.lastFailureTime = now;

      // Atomically transition to OPEN if threshold reached
      if (this.state.failureCount >= this.config.failureThreshold &&
          this.state.state !== CircuitState.OPEN) {
        this.state.state = CircuitState.OPEN;
        this.state.nextAttemptTime = now + this.config.timeoutMs;
        this.state.lastStateChange = now;
        // Update cache
        this.cache.state = CircuitState.OPEN;
        this.cache.isOpen = true;
        this.cache.lastCheckTime = now;
      }
    }
  }

  /**
   * Get current circuit breaker state
   */
  getState(): CircuitBreakerState {
    return { ...this.state };
  }

  /**
   * Get cached state for monitoring
   */
  getCachedState(): { state: CircuitState; isOpen: boolean; lastCheckTime: number } {
    return { ...this.cache };
  }

  /**
   * Reset circuit breaker to closed state
   */
  reset(): void {
    const now = Date.now();
    this.state = {
      state: CircuitState.CLOSED,
      failureCount: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0,
      lastStateChange: now,
    };

    this.cache = {
      state: CircuitState.CLOSED,
      isOpen: false,
      lastCheckTime: now,
      cacheTimeout: this.config.cacheTimeout,
    };

    logger.info('Circuit breaker manually reset to CLOSED state');
  }
}
