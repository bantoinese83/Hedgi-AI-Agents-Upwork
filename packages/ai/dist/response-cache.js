"use strict";
/**
 * Response cache implementation with TTL
 * Handles caching of API responses to reduce redundant calls
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseCache = void 0;
const crypto_1 = require("crypto");
const logger_1 = require("./logger");
class ResponseCache {
    constructor(config) {
        this.cache = new Map();
        this.config = config;
    }
    /**
     * Generate cache key for request using SHA-256
     */
    generateCacheKey(agent, systemPrompt, userPrompt) {
        const content = `${agent}:${systemPrompt}:${userPrompt}`;
        return (0, crypto_1.createHash)('sha256').update(content).digest('hex').substring(0, 32);
    }
    /**
     * Get cached response if still valid
     */
    get(agent, systemPrompt, userPrompt) {
        const cacheKey = this.generateCacheKey(agent, systemPrompt, userPrompt);
        const cached = this.cache.get(cacheKey);
        if (!cached)
            return null;
        const isExpired = Date.now() - cached.timestamp > this.config.ttlMs;
        if (isExpired) {
            this.cache.delete(cacheKey);
            logger_1.loggerInstance.debug(`Cache expired for ${agent}`);
            return null;
        }
        logger_1.loggerInstance.debug(`Cache hit for ${agent}`);
        return cached.response;
    }
    /**
     * Store response in cache
     */
    set(agent, systemPrompt, userPrompt, response) {
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
        logger_1.loggerInstance.debug(`Cached response for ${agent}`, { cacheSize: this.cache.size });
    }
    /**
     * Clear cache
     */
    clear() {
        try {
            const cacheSize = this.cache.size;
            this.cache.clear();
            logger_1.loggerInstance.info('Response cache cleared successfully', {
                entriesRemoved: cacheSize,
                currentSize: this.cache.size,
            });
        }
        catch (error) {
            logger_1.loggerInstance.error('Critical error during cache clear:', error instanceof Error ? error.message : String(error));
        }
    }
    /**
     * Get cache statistics
     */
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.config.maxSize,
        };
    }
    /**
     * Clean up expired entries
     */
    cleanup() {
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
                }
                catch (error) {
                    logger_1.loggerInstance.error(`Failed to cleanup cache entry ${key}:`, error instanceof Error ? error.message : String(error));
                    errorsOccurred++;
                }
            }
            if (cleaned > 0) {
                logger_1.loggerInstance.info('Cache cleanup completed', {
                    entriesCleaned: cleaned,
                    errorsOccurred,
                    remainingEntries: this.cache.size,
                    maxSize: this.config.maxSize,
                });
            }
        }
        catch (error) {
            logger_1.loggerInstance.error('Critical error during cache cleanup:', error instanceof Error ? error.message : String(error));
        }
    }
}
exports.ResponseCache = ResponseCache;
//# sourceMappingURL=response-cache.js.map