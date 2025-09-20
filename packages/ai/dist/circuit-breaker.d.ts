/**
 * Atomic circuit breaker implementation
 * Handles service failure detection and recovery
 */
export declare enum CircuitState {
    CLOSED = "closed",// Normal operation
    OPEN = "open",// Failing, reject requests
    HALF_OPEN = "half-open"
}
export interface CircuitBreakerState {
    state: CircuitState;
    failureCount: number;
    lastFailureTime: number;
    nextAttemptTime: number;
    lastStateChange: number;
}
export interface CircuitBreakerConfig {
    failureThreshold: number;
    timeoutMs: number;
    cacheTimeout: number;
}
export declare class CircuitBreaker {
    private state;
    private config;
    private cache;
    constructor(config: CircuitBreakerConfig);
    /**
     * Check circuit breaker state with conditional caching
     */
    isOpen(): boolean;
    /**
     * Record success/failure for circuit breaker atomically and update cache
     */
    recordEvent(success: boolean): void;
    /**
     * Get current circuit breaker state
     */
    getState(): CircuitBreakerState;
    /**
     * Get cached state for monitoring
     */
    getCachedState(): {
        state: CircuitState;
        isOpen: boolean;
        lastCheckTime: number;
    };
    /**
     * Reset circuit breaker to closed state
     */
    reset(): void;
}
//# sourceMappingURL=circuit-breaker.d.ts.map