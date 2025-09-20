/**
 * Simple in-memory rate limiter for API endpoints
 * Prevents abuse and ensures fair usage
 */
interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
}
export declare class RateLimiter {
    private requests;
    private config;
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
     * Clean up expired entries
     */
    cleanup(): void;
}
export declare const defaultRateLimiter: RateLimiter;
export {};
//# sourceMappingURL=rate-limiter.d.ts.map