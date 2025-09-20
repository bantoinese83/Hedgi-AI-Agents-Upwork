"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HedgiOpenAI = void 0;
exports.createHedgiOpenAI = createHedgiOpenAI;
const openai_1 = __importDefault(require("openai"));
const logger_1 = require("./logger");
const token_counter_1 = require("./token-counter");
// Token limits as per requirements
const MAX_PROMPT_TOKENS = 12000;
const MAX_COMPLETION_TOKENS = 2000;
const MAX_RETRIES = 1;
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds timeout
// Circuit breaker configuration
const CIRCUIT_BREAKER_THRESHOLD = 5; // Number of failures before opening circuit
const CIRCUIT_BREAKER_TIMEOUT_MS = 60000; // 1 minute timeout before half-open
const EXPONENTIAL_BACKOFF_BASE_MS = 1000; // Base delay for exponential backoff
// Cost tracking (approximate costs as of 2024)
const COST_PER_1K_PROMPT_TOKENS = 0.03; // GPT-4 pricing
const COST_PER_1K_COMPLETION_TOKENS = 0.06;
// Circuit breaker states
var CircuitState;
(function (CircuitState) {
    CircuitState["CLOSED"] = "closed";
    CircuitState["OPEN"] = "open";
    CircuitState["HALF_OPEN"] = "half-open"; // Testing if service recovered
})(CircuitState || (CircuitState = {}));
class HedgiOpenAI {
    constructor(config) {
        this.costTracker = new Map();
        this.responseCache = new Map();
        this.CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache
        // Circuit breaker state
        this.circuitBreaker = {
            state: CircuitState.CLOSED,
            failureCount: 0,
            lastFailureTime: 0,
            nextAttemptTime: 0,
        };
        // Memory management
        this.requestQueue = [];
        this.maxConcurrentRequests = 10;
        this.activeRequests = 0;
        // Validate API key
        if (!config.apiKey || config.apiKey.trim() === '') {
            throw new Error('OpenAI API key is required. Please set OPENAI_API_KEY environment variable.');
        }
        this.config = {
            model: 'gpt-4o',
            maxRetries: MAX_RETRIES,
            enableCostLogging: true,
            ...config,
        };
        this.client = new openai_1.default({
            apiKey: this.config.apiKey,
        });
        // Schedule memory cleanup every 10 minutes
        setInterval(() => {
            this.cleanupMemory();
        }, 10 * 60 * 1000);
    }
    /**
     * Check circuit breaker state
     */
    isCircuitBreakerOpen() {
        const now = Date.now();
        switch (this.circuitBreaker.state) {
            case CircuitState.CLOSED:
                return false;
            case CircuitState.OPEN:
                if (now >= this.circuitBreaker.nextAttemptTime) {
                    this.circuitBreaker.state = CircuitState.HALF_OPEN;
                    return false;
                }
                return true;
            case CircuitState.HALF_OPEN:
                return false;
            default:
                return false;
        }
    }
    /**
     * Record success/failure for circuit breaker
     */
    recordCircuitBreakerEvent(success) {
        if (success) {
            this.circuitBreaker.failureCount = 0;
            if (this.circuitBreaker.state === CircuitState.HALF_OPEN) {
                this.circuitBreaker.state = CircuitState.CLOSED;
            }
        }
        else {
            this.circuitBreaker.failureCount++;
            this.circuitBreaker.lastFailureTime = Date.now();
            if (this.circuitBreaker.failureCount >= CIRCUIT_BREAKER_THRESHOLD) {
                this.circuitBreaker.state = CircuitState.OPEN;
                this.circuitBreaker.nextAttemptTime = Date.now() + CIRCUIT_BREAKER_TIMEOUT_MS;
            }
        }
    }
    /**
     * Calculate exponential backoff delay
     */
    getExponentialBackoffDelay(attempt) {
        return EXPONENTIAL_BACKOFF_BASE_MS * Math.pow(2, attempt);
    }
    /**
     * Execute request with concurrency control
     */
    async executeWithConcurrencyControl(requestFn) {
        return new Promise((resolve, reject) => {
            this.requestQueue.push({ resolve, reject, request: requestFn });
            if (this.activeRequests < this.maxConcurrentRequests) {
                this.processQueue();
            }
        });
    }
    /**
  
    /**
     * Process the request queue
     */
    async processQueue() {
        if (this.activeRequests >= this.maxConcurrentRequests || this.requestQueue.length === 0) {
            return;
        }
        this.activeRequests++;
        const { resolve, reject, request } = this.requestQueue.shift();
        try {
            const result = await request();
            resolve(result);
        }
        catch (error) {
            reject(error);
        }
        finally {
            this.activeRequests--;
            this.processQueue(); // Process next item in queue
        }
    }
    /**
     * Validate token limits before making API call using tiktoken
     */
    validateTokenLimits(systemPrompt, userPrompt) {
        return token_counter_1.tokenCounter.validateTokenLimits(systemPrompt, userPrompt, MAX_PROMPT_TOKENS, MAX_COMPLETION_TOKENS, this.config.model);
    }
    /**
     * Calculate cost for token usage
     */
    calculateCost(tokenUsage) {
        const promptCost = (tokenUsage.prompt_tokens / 1000) * COST_PER_1K_PROMPT_TOKENS;
        const completionCost = (tokenUsage.completion_tokens / 1000) * COST_PER_1K_COMPLETION_TOKENS;
        return {
            prompt_cost: promptCost,
            completion_cost: completionCost,
            total_cost: promptCost + completionCost,
            token_usage: tokenUsage,
        };
    }
    /**
     * Log cost information for tracking
     */
    logCost(agent, costInfo, payloadPreview) {
        if (!this.config.enableCostLogging)
            return;
        // Track costs per agent
        if (!this.costTracker.has(agent)) {
            this.costTracker.set(agent, []);
        }
        const agentCosts = this.costTracker.get(agent);
        if (agentCosts) {
            agentCosts.push(costInfo);
        }
        // Log usage metrics and payload preview (no raw data/PII)
        logger_1.loggerInstance.info('Cost tracking', {
            agent,
            timestamp: new Date().toISOString(),
            cost: costInfo.total_cost,
            tokens: costInfo.token_usage,
            payload_preview: {
                row_count: this.getRowCount(payloadPreview),
                first_keys: Object.keys(payloadPreview).slice(0, 5),
                data_types: this.getDataTypes(payloadPreview),
            },
        });
    }
    /**
     * Get row count from payload for logging
     */
    getRowCount(payload) {
        const counts = {};
        for (const [key, value] of Object.entries(payload)) {
            if (Array.isArray(value)) {
                counts[key] = value.length;
            }
            else if (typeof value === 'object' && value !== null) {
                counts[key] = Object.keys(value).length;
            }
        }
        return counts;
    }
    /**
     * Get data types from payload for logging
     */
    getDataTypes(payload) {
        const types = {};
        for (const [key, value] of Object.entries(payload)) {
            if (Array.isArray(value)) {
                types[key] = `array[${value.length}]`;
            }
            else {
                types[key] = typeof value;
            }
        }
        return types;
    }
    /**
     * Get cost summary for an agent
     */
    getCostSummary(agent) {
        const costs = this.costTracker.get(agent);
        if (!costs || costs.length === 0)
            return null;
        const totalCost = costs.reduce((sum, cost) => sum + cost.total_cost, 0);
        const totalTokens = costs.reduce((sum, cost) => sum + cost.token_usage.total_tokens, 0);
        // const avgCostPerCall = totalCost / costs.length; // Unused for now
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
     * Generate cache key for request
     */
    generateCacheKey(agent, systemPrompt, userPrompt) {
        const content = `${agent}:${systemPrompt}:${userPrompt}`;
        return Buffer.from(content).toString('base64').slice(0, 32);
    }
    /**
     * Check if cached response is still valid
     */
    getCachedResponse(cacheKey) {
        const cached = this.responseCache.get(cacheKey);
        if (!cached)
            return null;
        const isExpired = Date.now() - cached.timestamp > this.CACHE_TTL_MS;
        if (isExpired) {
            this.responseCache.delete(cacheKey);
            return null;
        }
        return cached.response;
    }
    /**
     * Main method to call OpenAI with JSON mode, validation, and retry logic
     */
    async callWithJSONMode(agent, systemPrompt, userPrompt, responseSchema, payload, maxRetries = this.config.maxRetries) {
        const startTime = Date.now();
        // Check circuit breaker first
        if (this.isCircuitBreakerOpen()) {
            throw new Error('Circuit breaker is open - OpenAI service is currently unavailable');
        }
        // Check cache first
        const cacheKey = this.generateCacheKey(agent, systemPrompt, userPrompt);
        const cachedResponse = this.getCachedResponse(cacheKey);
        if (cachedResponse) {
            logger_1.loggerInstance.debug(`Cache hit for ${agent} - returning cached response`);
            return cachedResponse;
        }
        // Validate token limits using tiktoken
        const tokenValidation = this.validateTokenLimits(systemPrompt, userPrompt);
        if (!tokenValidation.valid) {
            throw new Error(`Token validation failed: ${tokenValidation.error}`);
        }
        let lastError = null;
        // Execute with concurrency control
        return this.executeWithConcurrencyControl(async () => {
            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                try {
                    // Create timeout promise
                    const timeoutPromise = new Promise((_, reject) => {
                        setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT_MS);
                    });
                    // Race between OpenAI call and timeout
                    const response = (await Promise.race([
                        this.client.chat.completions.create({
                            model: this.config.model,
                            messages: [
                                { role: 'system', content: systemPrompt },
                                { role: 'user', content: userPrompt },
                            ],
                            response_format: { type: 'json_object' },
                            max_tokens: MAX_COMPLETION_TOKENS,
                            temperature: 0.1, // Low temperature for consistent JSON output
                        }),
                        timeoutPromise,
                    ]));
                    const content = response.choices[0]?.message?.content;
                    if (!content) {
                        throw new Error('No content in OpenAI response');
                    }
                    // Parse JSON response
                    let parsedResponse;
                    try {
                        parsedResponse = JSON.parse(content);
                    }
                    catch (parseError) {
                        throw new Error(`Failed to parse JSON response: ${parseError}`);
                    }
                    // Validate against schema
                    const validatedResponse = responseSchema.parse(parsedResponse);
                    // Record success for circuit breaker
                    this.recordCircuitBreakerEvent(true);
                    // Calculate accurate token usage using tiktoken
                    const actualPromptTokens = response.usage?.prompt_tokens || tokenValidation.promptTokens;
                    const actualCompletionTokens = response.usage?.completion_tokens || 0;
                    const actualTotalTokens = response.usage?.total_tokens ||
                        actualPromptTokens + actualCompletionTokens;
                    // If OpenAI doesn't provide usage, calculate using tiktoken
                    const tokenUsage = {
                        prompt_tokens: actualPromptTokens,
                        completion_tokens: actualCompletionTokens,
                        total_tokens: actualTotalTokens,
                    };
                    // Log token breakdown for debugging
                    if (this.config.enableCostLogging) {
                        const breakdown = token_counter_1.tokenCounter.getTokenBreakdown(systemPrompt, userPrompt, content, this.config.model);
                        logger_1.loggerInstance.debug(`Token breakdown for ${agent}:`, breakdown);
                    }
                    const costInfo = this.calculateCost(tokenUsage);
                    this.logCost(agent, costInfo, payload);
                    // Return validated response with metadata
                    const processingTime = Date.now() - startTime;
                    const hedgiResponse = {
                        success: true,
                        data: validatedResponse,
                        metadata: {
                            agent,
                            timestamp: new Date().toISOString(),
                            processing_time_ms: processingTime,
                            token_usage: tokenUsage,
                        },
                    };
                    // Cache the response
                    this.responseCache.set(cacheKey, {
                        response: hedgiResponse,
                        timestamp: Date.now(),
                    });
                    return hedgiResponse;
                }
                catch (error) {
                    lastError = error;
                    // Record failure for circuit breaker
                    this.recordCircuitBreakerEvent(false);
                    // If this is the last attempt or circuit breaker is triggered, throw the error
                    if (attempt === maxRetries || this.isCircuitBreakerOpen()) {
                        break;
                    }
                    // Log retry attempt
                    logger_1.loggerInstance.warn(`OpenAI call failed (attempt ${attempt + 1}/${maxRetries + 1}):`, error instanceof Error ? error.message : String(error));
                    // Wait before retry (exponential backoff)
                    const delay = this.getExponentialBackoffDelay(attempt);
                    logger_1.loggerInstance.info(`Retrying in ${delay}ms...`);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
            }
            // If we get here, all retries failed
            throw new Error(`Failed to get valid response after ${maxRetries + 1} attempts: ${lastError?.message}`);
        });
    }
    /**
     * Get circuit breaker status for monitoring
     */
    getCircuitBreakerStatus() {
        return { ...this.circuitBreaker };
    }
    /**
     * Get memory usage statistics
     */
    getMemoryStats() {
        return {
            activeRequests: this.activeRequests,
            queueLength: this.requestQueue.length,
            cacheSize: this.responseCache.size,
            costTrackerSize: this.costTracker.size,
        };
    }
    /**
     * Clean up memory by clearing old cache entries
     */
    cleanupMemory() {
        const now = Date.now();
        const cacheSize = this.responseCache.size;
        const costTrackerSize = this.costTracker.size;
        // Clean cache entries older than 30 minutes
        for (const [key, value] of this.responseCache.entries()) {
            if (now - value.timestamp > 30 * 60 * 1000) {
                this.responseCache.delete(key);
            }
        }
        // Clean old cost tracking data (keep last 1000 entries per agent)
        for (const [agent, costs] of this.costTracker.entries()) {
            if (costs.length > 1000) {
                this.costTracker.set(agent, costs.slice(-1000));
            }
        }
        logger_1.loggerInstance.info('Memory cleanup completed', {
            cache_cleaned: cacheSize - this.responseCache.size,
            cost_data_retained: costTrackerSize - this.costTracker.size,
        });
    }
    prunePayload(payload) {
        const pruned = { ...payload };
        // If payload has transactions, sort by materiality and limit to 1500
        if (pruned.transactions && Array.isArray(pruned.transactions)) {
            pruned.transactions = pruned.transactions
                .sort((a, b) => {
                const aScore = a?.materiality_score || 0;
                const bScore = b?.materiality_score || 0;
                return bScore - aScore;
            })
                .slice(0, 1500);
        }
        // Remove any PII or sensitive data that might have been included
        const sensitiveKeys = ['ssn', 'tax_id', 'ein', 'bank_account', 'routing'];
        for (const key of sensitiveKeys) {
            if (pruned[key]) {
                delete pruned[key];
            }
        }
        return pruned;
    }
    /**
     * Reset cost tracking
     */
    resetCostTracking() {
        this.costTracker.clear();
    }
}
exports.HedgiOpenAI = HedgiOpenAI;
// Export a default instance factory
function createHedgiOpenAI(config) {
    return new HedgiOpenAI(config);
}
//# sourceMappingURL=hedgi-openai.js.map