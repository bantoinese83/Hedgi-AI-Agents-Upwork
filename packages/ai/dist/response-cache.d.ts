/**
 * Response cache implementation with TTL
 * Handles caching of API responses to reduce redundant calls
 */
import { type AgentType, type HedgiResponse } from './schemas';
export interface CacheConfig {
    ttlMs: number;
    maxSize?: number;
}
export declare class ResponseCache {
    private cache;
    private config;
    constructor(config: CacheConfig);
    /**
     * Generate cache key for request using SHA-256
     */
    private generateCacheKey;
    /**
     * Get cached response if still valid
     */
    get(agent: AgentType, systemPrompt: string, userPrompt: string): HedgiResponse | null;
    /**
     * Store response in cache
     */
    set(agent: AgentType, systemPrompt: string, userPrompt: string, response: HedgiResponse): void;
    /**
     * Clear cache
     */
    clear(): void;
    /**
     * Get cache statistics
     */
    getStats(): {
        size: number;
        maxSize?: number;
    };
    /**
     * Clean up expired entries
     */
    cleanup(): void;
}
//# sourceMappingURL=response-cache.d.ts.map