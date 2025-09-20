"use strict";
/**
 * Simple in-memory rate limiter for API endpoints
 * Prevents abuse and ensures fair usage
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultRateLimiter = exports.RateLimiter = void 0;
class RateLimiter {
    constructor(config) {
        this.requests = new Map();
        this.config = config;
    }
    /**
     * Check if request is allowed
     * @param identifier - Unique identifier (IP, user ID, etc.)
     * @returns true if allowed, false if rate limited
     */
    isAllowed(identifier) {
        const now = Date.now();
        const entry = this.requests.get(identifier);
        if (!entry || now > entry.resetTime) {
            // First request or window expired
            this.requests.set(identifier, {
                count: 1,
                resetTime: now + this.config.windowMs,
            });
            return true;
        }
        if (entry.count >= this.config.maxRequests) {
            return false;
        }
        // Increment count
        entry.count++;
        return true;
    }
    /**
     * Get remaining requests for identifier
     */
    getRemainingRequests(identifier) {
        const entry = this.requests.get(identifier);
        if (!entry || Date.now() > entry.resetTime) {
            return this.config.maxRequests;
        }
        return Math.max(0, this.config.maxRequests - entry.count);
    }
    /**
     * Get reset time for identifier
     */
    getResetTime(identifier) {
        const entry = this.requests.get(identifier);
        return entry?.resetTime || Date.now() + this.config.windowMs;
    }
    /**
     * Clean up expired entries
     */
    cleanup() {
        const now = Date.now();
        this.requests.forEach((entry, key) => {
            if (now > entry.resetTime) {
                this.requests.delete(key);
            }
        });
    }
}
exports.RateLimiter = RateLimiter;
// Default rate limiter: 10 requests per minute per IP
exports.defaultRateLimiter = new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
});
// Cleanup expired entries every 5 minutes
setInterval(() => {
    exports.defaultRateLimiter.cleanup();
}, 5 * 60 * 1000);
//# sourceMappingURL=rate-limiter.js.map