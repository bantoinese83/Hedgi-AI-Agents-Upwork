"use strict";
/**
 * Cost tracking implementation
 * Handles cost calculation, logging, and tracking for API calls
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CostTracker = void 0;
const logger_1 = require("./logger");
class CostTracker {
    constructor(config) {
        this.costs = new Map();
        this.config = config;
    }
    /**
     * Calculate cost based on token usage
     */
    calculateCost(tokenUsage) {
        const promptCost = (tokenUsage.prompt_tokens / 1000) * this.config.costPer1KPromptTokens;
        const completionCost = (tokenUsage.completion_tokens / 1000) * this.config.costPer1KCompletionTokens;
        const totalCost = promptCost + completionCost;
        return {
            prompt_cost: promptCost,
            completion_cost: completionCost,
            total_cost: totalCost,
            token_usage: tokenUsage,
        };
    }
    /**
     * Log cost information and payload preview
     */
    logCost(agent, costInfo, payloadPreview) {
        if (!this.config.enableCostLogging)
            return;
        // Track costs per agent
        if (!this.costs.has(agent)) {
            this.costs.set(agent, []);
        }
        const agentCosts = this.costs.get(agent);
        if (agentCosts) {
            agentCosts.push(costInfo);
        }
        // Log usage metrics and payload preview (no raw data/PII)
        const safeKeys = Object.keys(payloadPreview)
            .filter(key => !['ssn', 'tax_id', 'ein', 'bank_account', 'routing', 'email', 'phone', 'address'].includes(key.toLowerCase()))
            .slice(0, 5);
        const counts = {};
        const sensitiveKeys = ['ssn', 'tax_id', 'ein', 'bank_account', 'routing', 'email', 'phone', 'address'];
        for (const [key, value] of Object.entries(payloadPreview)) {
            // Skip sensitive fields
            if (sensitiveKeys.includes(key.toLowerCase())) {
                continue;
            }
            if (Array.isArray(value)) {
                counts[key] = value.length;
            }
            else if (typeof value === 'object' && value !== null) {
                counts[key] = Object.keys(value).length;
            }
        }
        const types = {};
        for (const [key, value] of Object.entries(payloadPreview)) {
            // Skip sensitive fields
            if (sensitiveKeys.includes(key.toLowerCase())) {
                continue;
            }
            if (Array.isArray(value)) {
                types[key] = `array[${value.length}]`;
            }
            else {
                types[key] = typeof value;
            }
        }
        logger_1.loggerInstance.info('Cost tracking', {
            agent,
            timestamp: new Date().toISOString(),
            cost: costInfo.total_cost,
            tokens: costInfo.token_usage,
            payload_preview: {
                row_count: counts,
                first_keys: safeKeys,
                data_types: types,
            },
        });
    }
    /**
     * Get cost summary for an agent
     */
    getCostSummary(agent) {
        const costs = this.costs.get(agent);
        if (!costs || costs.length === 0)
            return null;
        const totalCost = costs.reduce((sum, cost) => sum + cost.total_cost, 0);
        const totalTokens = costs.reduce((sum, cost) => sum + cost.token_usage.total_tokens, 0);
        return {
            prompt_cost: costs.reduce((sum, cost) => sum + cost.prompt_cost, 0),
            completion_cost: costs.reduce((sum, cost) => sum + cost.completion_cost, 0),
            total_cost: totalCost,
            token_usage: {
                prompt_tokens: costs.reduce((sum, cost) => sum + cost.token_usage.prompt_tokens, 0),
                completion_tokens: costs.reduce((sum, cost) => sum + cost.token_usage.completion_tokens, 0),
                total_tokens: totalTokens,
            },
        };
    }
    /**
     * Get all cost summaries
     */
    getAllCostSummaries() {
        const summaries = new Map();
        for (const [agent, costs] of this.costs.entries()) {
            const summary = this.getCostSummary(agent);
            if (summary) {
                summaries.set(agent, summary);
            }
        }
        return summaries;
    }
    /**
     * Clean up old cost tracking data
     */
    cleanup(maxEntriesPerAgent = 1000) {
        let totalCleaned = 0;
        for (const [agent, costs] of this.costs.entries()) {
            if (costs.length > maxEntriesPerAgent) {
                const cleaned = costs.length - maxEntriesPerAgent;
                this.costs.set(agent, costs.slice(-maxEntriesPerAgent));
                totalCleaned += cleaned;
            }
        }
        if (totalCleaned > 0) {
            logger_1.loggerInstance.info('Cost tracking data cleaned', { entriesCleaned: totalCleaned });
        }
    }
    /**
     * Reset cost tracking
     */
    reset() {
        this.costs.clear();
        logger_1.loggerInstance.info('Cost tracking data reset');
    }
    /**
     * Get cost tracker statistics
     */
    getStats() {
        let totalEntries = 0;
        for (const costs of this.costs.values()) {
            totalEntries += costs.length;
        }
        return {
            totalAgents: this.costs.size,
            totalEntries,
        };
    }
}
exports.CostTracker = CostTracker;
//# sourceMappingURL=cost-tracker.js.map