import { z } from 'zod';
import { type AgentType } from './schemas';
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
export declare class HedgiOpenAI {
    private client;
    private config;
    private costTracker;
    private responseCache;
    private readonly CACHE_TTL_MS;
    constructor(config: HedgiOpenAIConfig);
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
     * Get row count from payload for logging
     */
    private getRowCount;
    /**
     * Get data types from payload for logging
     */
    private getDataTypes;
    /**
     * Get cost summary for an agent
     */
    getCostSummary(agent: AgentType): CostInfo | null;
    /**
     * Generate cache key for request
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
     * Prune payload to reduce token usage
     * Sorts transactions by materiality and limits to 1500
     */
    prunePayload(payload: Record<string, unknown>): Record<string, unknown>;
    /**
     * Reset cost tracking
     */
    resetCostTracking(): void;
}
export declare function createHedgiOpenAI(config: HedgiOpenAIConfig): HedgiOpenAI;
//# sourceMappingURL=hedgi-openai.d.ts.map