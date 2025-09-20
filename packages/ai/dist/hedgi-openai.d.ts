import { z } from 'zod';
import { type AgentType } from './schemas';
export declare class HedgiOpenAIError extends Error {
    readonly code: string;
    readonly details?: Record<string, unknown> | undefined;
    constructor(message: string, code: string, details?: Record<string, unknown> | undefined);
}
export declare class CircuitBreakerError extends HedgiOpenAIError {
    constructor(message?: string);
}
export declare class PayloadSizeError extends HedgiOpenAIError {
    readonly sizeMB: number;
    readonly maxSizeMB: number;
    constructor(message: string, sizeMB: number, maxSizeMB: number);
}
export declare class TokenLimitError extends HedgiOpenAIError {
    readonly tokenCount: number;
    readonly limit: number;
    constructor(message: string, tokenCount: number, limit: number);
}
export declare class RateLimitError extends HedgiOpenAIError {
    readonly identifier: string;
    readonly resetTime: number;
    constructor(message: string, identifier: string, resetTime: number);
}
export interface HedgiOpenAIConfig {
    apiKey: string;
    model?: string;
    maxRetries?: number;
    enableCostLogging?: boolean;
}
export interface TokenUsage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}
export interface CostInfo {
    prompt_cost: number;
    completion_cost: number;
    total_cost: number;
    token_usage: TokenUsage;
}
declare enum CircuitState {
    CLOSED = "closed",// Normal operation
    OPEN = "open",// Failing, reject requests
    HALF_OPEN = "half-open"
}
export declare class HedgiOpenAI {
    private client;
    private config;
    private costTracker;
    private responseCache;
    private circuitBreaker;
    private requestQueue;
    private maxConcurrentRequests;
    private activeRequests;
    constructor(config: HedgiOpenAIConfig);
    /**
     * Check circuit breaker state atomically
     */
    private isCircuitBreakerOpen;
    /**
     * Record success/failure for circuit breaker atomically
     */
    private recordCircuitBreakerEvent;
    /**
     * Calculate exponential backoff delay
     */
    private getExponentialBackoffDelay;
    /**
     * Execute request with concurrency control
     */
    private executeWithConcurrencyControl;
    /**
  
    /**
     * Process the request queue
     */
    private processQueue;
    /**
     * Validate payload size limits
     */
    private validatePayloadSize;
    /**
     * Validate token limits before making API call using tiktoken
     */
    private validateTokenLimits;
    /**
     * Calculate cost for token usage
     */
    private calculateCost;
    /**
     * Log cost information for tracking
     */
    private logCost;
    /**
     * Get sanitized row count from payload for logging (no PII)
     */
    private getRowCount;
    /**
     * Get sanitized data types from payload for logging (no PII)
     */
    private getDataTypes;
    /**
     * Get cost summary for an agent
     */
    getCostSummary(agent: AgentType): CostInfo | null;
    /**
     * Generate cache key for request using SHA-256
     */
    private generateCacheKey;
    /**
     * Check if cached response is still valid
     */
    private getCachedResponse;
    /**
     * Main method to call OpenAI with JSON mode, validation, and retry logic
     */
    callWithJSONMode<T extends z.ZodTypeAny>(agent: AgentType, systemPrompt: string, userPrompt: string, responseSchema: T, payload: Record<string, unknown>, maxRetries?: number): Promise<z.infer<T>>;
    /**
     * Get circuit breaker status for monitoring
     */
    getCircuitBreakerStatus(): {
        state: CircuitState;
        failureCount: number;
        lastFailureTime: number;
        nextAttemptTime: number;
    };
    /**
     * Get memory usage statistics
     */
    getMemoryStats(): {
        activeRequests: number;
        queueLength: number;
        cacheSize: number;
        costTrackerSize: number;
    };
    /**
     * Check memory usage and trigger cleanup if needed
     */
    private checkMemoryPressure;
    /**
     * Clean up memory by clearing old cache entries and monitoring pressure
     */
    cleanupMemory(): void;
    prunePayload(payload: Record<string, unknown>): Record<string, unknown>;
    /**
     * Reset cost tracking
     */
    resetCostTracking(): void;
}
export declare function createHedgiOpenAI(config: HedgiOpenAIConfig): HedgiOpenAI;
export {};
//# sourceMappingURL=hedgi-openai.d.ts.map