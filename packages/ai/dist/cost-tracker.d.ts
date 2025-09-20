/**
 * Cost tracking implementation
 * Handles cost calculation, logging, and tracking for API calls
 */
import { type AgentType } from './schemas';
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
export interface CostTrackerConfig {
    enableCostLogging: boolean;
    costPer1KPromptTokens: number;
    costPer1KCompletionTokens: number;
    maxEntriesPerAgent?: number;
}
export declare class CostTracker {
    private costs;
    private config;
    constructor(config: CostTrackerConfig);
    /**
     * Calculate cost based on token usage
     */
    calculateCost(tokenUsage: TokenUsage): CostInfo;
    /**
     * Log cost information and payload preview
     */
    logCost(agent: AgentType, costInfo: CostInfo, payloadPreview: Record<string, unknown>): void;
    /**
     * Get cost summary for an agent
     */
    getCostSummary(agent: AgentType): CostInfo | null;
    /**
     * Get all cost summaries
     */
    getAllCostSummaries(): Map<AgentType, CostInfo>;
    /**
     * Clean up old cost tracking data
     */
    cleanup(maxEntriesPerAgent?: number): void;
    /**
     * Reset cost tracking
     */
    reset(): void;
    /**
     * Get cost tracker statistics
     */
    getStats(): {
        totalAgents: number;
        totalEntries: number;
    };
}
//# sourceMappingURL=cost-tracker.d.ts.map