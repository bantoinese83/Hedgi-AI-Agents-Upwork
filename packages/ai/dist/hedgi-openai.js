"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HedgiOpenAI = exports.RateLimitError = exports.TokenLimitError = exports.PayloadSizeError = exports.CircuitBreakerError = exports.HedgiOpenAIError = void 0;
exports.createHedgiOpenAI = createHedgiOpenAI;
const crypto_1 = require("crypto");
const openai_1 = __importDefault(require("openai"));
const logger_1 = require("./logger");
const token_counter_1 = require("./token-counter");
// Constants
const MAX_PROMPT_TOKENS = 12000;
const MAX_COMPLETION_TOKENS = 2000;
const MAX_RETRIES = 1;
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds timeout
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache
// Circuit breaker configuration
const CIRCUIT_BREAKER_THRESHOLD = 5; // Number of failures before opening circuit
const CIRCUIT_BREAKER_TIMEOUT_MS = 60000; // 1 minute timeout before half-open
const EXPONENTIAL_BACKOFF_BASE_MS = 1000; // Base delay for exponential backoff
// Cost tracking (approximate costs as of 2024)
const COST_PER_1K_PROMPT_TOKENS = 0.03; // GPT-4 pricing
const COST_PER_1K_COMPLETION_TOKENS = 0.06;
// Payload size limits
const MAX_PAYLOAD_SIZE_MB = 10;
const MAX_TRANSACTIONS = 1500;
// Concurrency limits
const MAX_CONCURRENT_REQUESTS = 10;
// Memory management
const MEMORY_CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_MEMORY_USAGE_PERCENT = 80; // Trigger cleanup at 80% memory usage
// Custom error classes for better error handling
class HedgiOpenAIError extends Error {
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'HedgiOpenAIError';
    }
}
exports.HedgiOpenAIError = HedgiOpenAIError;
class CircuitBreakerError extends HedgiOpenAIError {
    constructor(message = 'Circuit breaker is open - service temporarily unavailable') {
        super(message, 'CIRCUIT_BREAKER_OPEN');
    }
}
exports.CircuitBreakerError = CircuitBreakerError;
class PayloadSizeError extends HedgiOpenAIError {
    constructor(message, sizeMB, maxSizeMB) {
        super(message, 'PAYLOAD_TOO_LARGE', { sizeMB, maxSizeMB });
        this.sizeMB = sizeMB;
        this.maxSizeMB = maxSizeMB;
    }
}
exports.PayloadSizeError = PayloadSizeError;
class TokenLimitError extends HedgiOpenAIError {
    constructor(message, tokenCount, limit) {
        super(message, 'TOKEN_LIMIT_EXCEEDED', { tokenCount, limit });
        this.tokenCount = tokenCount;
        this.limit = limit;
    }
}
exports.TokenLimitError = TokenLimitError;
class RateLimitError extends HedgiOpenAIError {
    constructor(message, identifier, resetTime) {
        super(message, 'RATE_LIMIT_EXCEEDED', { identifier, resetTime });
        this.identifier = identifier;
        this.resetTime = resetTime;
    }
}
exports.RateLimitError = RateLimitError;
// Circuit breaker states with atomic transitions
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
        // Circuit breaker state with atomic transitions and caching
        this.circuitBreaker = {
            state: CircuitState.CLOSED,
            failureCount: 0,
            lastFailureTime: 0,
            nextAttemptTime: 0,
            lastStateChange: Date.now(),
        };
        // Circuit breaker state caching
        this.circuitBreakerCache = {
            state: CircuitState.CLOSED,
            isOpen: false,
            lastCheckTime: 0,
            cacheTimeout: 1000, // Cache for 1 second
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
     * Check circuit breaker state with conditional caching
     */
    isCircuitBreakerOpen() {
        const now = Date.now();
        // Check cache first if still valid
        if (now - this.circuitBreakerCache.lastCheckTime < this.circuitBreakerCache.cacheTimeout) {
            return this.circuitBreakerCache.isOpen;
        }
        const currentState = this.circuitBreaker.state;
        switch (currentState) {
            case CircuitState.CLOSED:
                // Update cache
                this.circuitBreakerCache.state = CircuitState.CLOSED;
                this.circuitBreakerCache.isOpen = false;
                this.circuitBreakerCache.lastCheckTime = now;
                return false;
            case CircuitState.OPEN:
                if (now >= this.circuitBreaker.nextAttemptTime) {
                    // Atomically transition to HALF_OPEN
                    if (this.circuitBreaker.state === CircuitState.OPEN) {
                        this.circuitBreaker.state = CircuitState.HALF_OPEN;
                        this.circuitBreaker.lastStateChange = now;
                    }
                    // Update cache
                    this.circuitBreakerCache.state = CircuitState.HALF_OPEN;
                    this.circuitBreakerCache.isOpen = false;
                    this.circuitBreakerCache.lastCheckTime = now;
                    return false;
                }
                // Update cache
                this.circuitBreakerCache.state = CircuitState.OPEN;
                this.circuitBreakerCache.isOpen = true;
                this.circuitBreakerCache.lastCheckTime = now;
                return true;
            case CircuitState.HALF_OPEN:
                // Update cache
                this.circuitBreakerCache.state = CircuitState.HALF_OPEN;
                this.circuitBreakerCache.isOpen = false;
                this.circuitBreakerCache.lastCheckTime = now;
                return false;
            default:
                // Update cache
                this.circuitBreakerCache.state = CircuitState.CLOSED;
                this.circuitBreakerCache.isOpen = false;
                this.circuitBreakerCache.lastCheckTime = now;
                return false;
        }
    }
    /**
     * Record success/failure for circuit breaker atomically and update cache
     */
    recordCircuitBreakerEvent(success) {
        const now = Date.now();
        if (success) {
            // Atomically reset failure count and transition from HALF_OPEN to CLOSED
            this.circuitBreaker.failureCount = 0;
            if (this.circuitBreaker.state === CircuitState.HALF_OPEN) {
                this.circuitBreaker.state = CircuitState.CLOSED;
                this.circuitBreaker.lastStateChange = now;
                // Update cache
                this.circuitBreakerCache.state = CircuitState.CLOSED;
                this.circuitBreakerCache.isOpen = false;
                this.circuitBreakerCache.lastCheckTime = now;
            }
        }
        else {
            this.circuitBreaker.failureCount++;
            this.circuitBreaker.lastFailureTime = now;
            // Atomically transition to OPEN if threshold reached
            if (this.circuitBreaker.failureCount >= CIRCUIT_BREAKER_THRESHOLD &&
                this.circuitBreaker.state !== CircuitState.OPEN) {
                this.circuitBreaker.state = CircuitState.OPEN;
                this.circuitBreaker.nextAttemptTime = now + CIRCUIT_BREAKER_TIMEOUT_MS;
                this.circuitBreaker.lastStateChange = now;
                // Update cache
                this.circuitBreakerCache.state = CircuitState.OPEN;
                this.circuitBreakerCache.isOpen = true;
                this.circuitBreakerCache.lastCheckTime = now;
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
        // Iterative processing to prevent recursion
        while (this.activeRequests < this.maxConcurrentRequests && this.requestQueue.length > 0) {
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
            }
        }
    }
    /**
     * Validate payload size limits
     */
    validatePayloadSize(payload) {
        const payloadString = JSON.stringify(payload);
        const sizeInMB = payloadString.length / (1024 * 1024);
        if (sizeInMB > MAX_PAYLOAD_SIZE_MB) {
            return { valid: false, error: `Payload size ${sizeInMB.toFixed(2)}MB exceeds maximum limit of ${MAX_PAYLOAD_SIZE_MB}MB` };
        }
        return { valid: true };
    }
    /**
     * Validate token limits before making API call using tiktoken
     */
    validateTokenLimits(systemPrompt, userPrompt) {
        return token_counter_1.tokenCounter.validateTokenLimitsSync(systemPrompt, userPrompt, MAX_PROMPT_TOKENS, MAX_COMPLETION_TOKENS, this.config.model);
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
        const safeKeys = Object.keys(payloadPreview)
            .filter(key => !['ssn', 'tax_id', 'ein', 'bank_account', 'routing', 'email', 'phone', 'address'].includes(key.toLowerCase()))
            .slice(0, 5);
        logger_1.loggerInstance.info('Cost tracking', {
            agent,
            timestamp: new Date().toISOString(),
            cost: costInfo.total_cost,
            tokens: costInfo.token_usage,
            payload_preview: {
                row_count: this.getRowCount(payloadPreview),
                first_keys: safeKeys,
                data_types: this.getDataTypes(payloadPreview),
            },
        });
    }
    /**
     * Get sanitized row count from payload for logging (no PII)
     */
    getRowCount(payload) {
        const counts = {};
        const sensitiveKeys = ['ssn', 'tax_id', 'ein', 'bank_account', 'routing', 'email', 'phone', 'address'];
        for (const [key, value] of Object.entries(payload)) {
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
        return counts;
    }
    /**
     * Get sanitized data types from payload for logging (no PII)
     */
    getDataTypes(payload) {
        const types = {};
        const sensitiveKeys = ['ssn', 'tax_id', 'ein', 'bank_account', 'routing', 'email', 'phone', 'address'];
        for (const [key, value] of Object.entries(payload)) {
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
     * Generate cache key for request using SHA-256
     */
    generateCacheKey(agent, systemPrompt, userPrompt) {
        const content = `${agent}:${systemPrompt}:${userPrompt}`;
        return (0, crypto_1.createHash)('sha256').update(content).digest('hex').substring(0, 32);
    }
    /**
     * Check if cached response is still valid
     */
    getCachedResponse(cacheKey) {
        const cached = this.responseCache.get(cacheKey);
        if (!cached)
            return null;
        const isExpired = Date.now() - cached.timestamp > CACHE_TTL_MS;
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
            throw new CircuitBreakerError();
        }
        // Validate payload size limits
        const payloadSizeValidation = this.validatePayloadSize(payload);
        if (!payloadSizeValidation.valid) {
            const payloadString = JSON.stringify(payload);
            const sizeInMB = payloadString.length / (1024 * 1024);
            throw new PayloadSizeError(payloadSizeValidation.error, sizeInMB, MAX_PAYLOAD_SIZE_MB);
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
            throw new TokenLimitError(tokenValidation.error, tokenValidation.promptTokens, MAX_PROMPT_TOKENS);
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
     * Check memory usage and trigger cleanup if needed
     */
    checkMemoryPressure() {
        try {
            const usage = process.memoryUsage();
            const usagePercent = (usage.heapUsed / usage.heapTotal) * 100;
            return usagePercent > MAX_MEMORY_USAGE_PERCENT;
        }
        catch (error) {
            logger_1.loggerInstance.error('Failed to check memory usage:', error instanceof Error ? error.message : String(error));
            return false;
        }
    }
    /**
     * Clean up memory by clearing old cache entries and monitoring pressure
     */
    cleanupMemory() {
        const now = Date.now();
        const cacheSize = this.responseCache.size;
        const costTrackerSize = this.costTracker.size;
        let cacheCleaned = 0;
        let costDataRetained = 0;
        try {
            // Clean cache entries older than 30 minutes
            for (const [key, value] of this.responseCache.entries()) {
                if (now - value.timestamp > CACHE_TTL_MS) {
                    this.responseCache.delete(key);
                    cacheCleaned++;
                }
            }
            // Clean old cost tracking data (keep last 1000 entries per agent)
            for (const [agent, costs] of this.costTracker.entries()) {
                if (costs.length > 1000) {
                    this.costTracker.set(agent, costs.slice(-1000));
                    costDataRetained += costs.length - 1000;
                }
            }
            logger_1.loggerInstance.info('Memory cleanup completed', {
                cache_cleaned: cacheCleaned,
                cost_data_retained: costDataRetained,
                memory_pressure: this.checkMemoryPressure(),
            });
        }
        catch (error) {
            logger_1.loggerInstance.error('Memory cleanup failed:', error instanceof Error ? error.message : String(error));
        }
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
                .slice(0, MAX_TRANSACTIONS);
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