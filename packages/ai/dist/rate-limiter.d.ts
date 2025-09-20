/**
 * Persistent rate limiter for API endpoints with file-based storage
 * Prevents abuse and ensures fair usage across application restarts
 */
interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    storagePath?: string;
}
export declare class RateLimiter {
    private requests;
    private config;
    private persistenceTimer;
    constructor(config: RateLimitConfig);
    /**
     * Check if request is allowed
     * @param identifier - Unique identifier (IP, user ID, etc.)
     * @returns true if allowed, false if rate limited
     */
    isAllowed(identifier: string): boolean;
    /**
     * Get remaining requests for identifier
     */
    getRemainingRequests(identifier: string): number;
    /**
     * Get reset time for identifier
     */
    getResetTime(identifier: string): number;
    /**
     * Load rate limit data from persistent storage
     */
    private loadFromStorage;
    /**
     * Save rate limit data to persistent storage
     */
    private saveToStorage;
    /**
     * Start periodic persistence
     */
    private startPersistence;
    /**
     * Stop persistence and cleanup
     */
    destroy(): void;
    /**
     * Clean up expired entries
     */
    cleanup(): void;
}
export declare const defaultRateLimiter: RateLimiter;
export {};
//# sourceMappingURL=rate-limiter.d.ts.map