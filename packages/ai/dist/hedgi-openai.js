"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HedgiOpenAI = exports.CircuitState = exports.RateLimitError = exports.TokenLimitError = exports.PayloadSizeError = exports.CircuitBreakerError = exports.HedgiOpenAIError = void 0;
exports.createHedgiOpenAI = createHedgiOpenAI;
const crypto_1 = require("crypto");
const openai_1 = __importDefault(require("openai"));
const circuit_breaker_1 = require("./circuit-breaker");
const cost_tracker_1 = require("./cost-tracker");
const logger_1 = require("./logger");
const request_queue_1 = require("./request-queue");
const response_cache_1 = require("./response-cache");
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
// Re-export types from modules for backward compatibility
var circuit_breaker_2 = require("./circuit-breaker");
Object.defineProperty(exports, "CircuitState", { enumerable: true, get: function () { return circuit_breaker_2.CircuitState; } });
class HedgiOpenAI {
    constructor(config) {
        // Validate API key
        if (!config.apiKey || config.apiKey.trim() === '') {
            throw new Error('OpenAI API key is required. Please set the OPENAI_API_KEY environment variable or pass it as a configuration parameter. You can get your API key from https://platform.openai.com/api-keys');
        }
        this.config = {
            model: 'gpt-4o',
            maxRetries: MAX_RETRIES,
            enableCostLogging: true,
            fallbackModels: ['gpt-4', 'gpt-3.5-turbo'],
            enableFallback: true,
            fallbackTimeoutMs: 5000,
            ...config,
        };
        this.client = new openai_1.default({
            apiKey: this.config.apiKey,
        });
        // Initialize modules
        this.circuitBreaker = new circuit_breaker_1.CircuitBreaker({
            failureThreshold: CIRCUIT_BREAKER_THRESHOLD,
            timeoutMs: CIRCUIT_BREAKER_TIMEOUT_MS,
            cacheTimeout: 1000,
        });
        this.requestQueue = new request_queue_1.RequestQueue({
            maxConcurrentRequests: MAX_CONCURRENT_REQUESTS,
        });
        this.responseCache = new response_cache_1.ResponseCache({
            ttlMs: CACHE_TTL_MS,
            maxSize: 100, // Maximum 100 cached responses
        });
        this.costTracker = new cost_tracker_1.CostTracker({
            enableCostLogging: this.config.enableCostLogging,
            costPer1KPromptTokens: COST_PER_1K_PROMPT_TOKENS,
            costPer1KCompletionTokens: COST_PER_1K_COMPLETION_TOKENS,
            maxEntriesPerAgent: 1000,
        });
        // Schedule memory cleanup every 10 minutes
        setInterval(() => {
            this.cleanupMemory();
        }, MEMORY_CLEANUP_INTERVAL_MS);
    }
    /**
     * Check circuit breaker state
     */
    isCircuitBreakerOpen() {
        return this.circuitBreaker.isOpen();
    }
    /**
     * Record success/failure for circuit breaker
     */
    recordCircuitBreakerEvent(success) {
        this.circuitBreaker.recordEvent(success);
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
        return this.requestQueue.executeWithConcurrencyControl(requestFn);
    }
    /**
  
    /**
     * Process the request queue
     */
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
        return this.costTracker.calculateCost(tokenUsage);
    }
    /**
     * Log cost information for tracking
     */
    logCost(agent, costInfo, payloadPreview) {
        this.costTracker.logCost(agent, costInfo, payloadPreview);
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
        return this.costTracker.getCostSummary(agent);
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
    getCachedResponse(agent, systemPrompt, userPrompt) {
        return this.responseCache.get(agent, systemPrompt, userPrompt);
    }
    /**
     * Main method to call OpenAI with JSON mode, validation, and retry logic
     */
    async callWithJSONMode(agent, systemPrompt, userPrompt, responseSchema, payload, maxRetries = this.config.maxRetries) {
        const startTime = Date.now();
        // Check circuit breaker first
        if (this.isCircuitBreakerOpen()) {
            const errorMessage = this.circuitBreaker.getErrorMessage();
            throw new CircuitBreakerError(errorMessage);
        }
        // Validate payload size limits
        const payloadSizeValidation = this.validatePayloadSize(payload);
        if (!payloadSizeValidation.valid) {
            const payloadString = JSON.stringify(payload);
            const sizeInMB = payloadString.length / (1024 * 1024);
            const errorMessage = `Payload size limit exceeded: ${sizeInMB.toFixed(2)}MB out of ${MAX_PAYLOAD_SIZE_MB}MB maximum. ` +
                `Please reduce the amount of data being sent. Consider: ` +
                `1) Limiting transactions to the most material ones (1500 max), 2) Removing unnecessary fields, ` +
                `3) Compressing data before sending, or 4) Breaking large requests into smaller batches.`;
            throw new PayloadSizeError(errorMessage, sizeInMB, MAX_PAYLOAD_SIZE_MB);
        }
        // Check cache first
        const cachedResponse = this.getCachedResponse(agent, systemPrompt, userPrompt);
        if (cachedResponse) {
            logger_1.loggerInstance.debug(`Cache hit for ${agent} - returning cached response`);
            return cachedResponse;
        }
        // Validate token limits using tiktoken
        const tokenValidation = this.validateTokenLimits(systemPrompt, userPrompt);
        if (!tokenValidation.valid) {
            const errorMessage = `Token limit exceeded: ${tokenValidation.promptTokens} tokens used out of ${MAX_PROMPT_TOKENS} maximum. ` +
                `Please reduce the length of your prompts or transaction data. Consider: ` +
                `1) Summarizing transaction descriptions, 2) Filtering transactions by materiality, ` +
                `3) Breaking large requests into smaller batches, or 4) Using a model with higher token limits.`;
            throw new TokenLimitError(errorMessage, tokenValidation.promptTokens, MAX_PROMPT_TOKENS);
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
                    this.responseCache.set(agent, systemPrompt, userPrompt, hedgiResponse);
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
            // If we get here, all retries failed - try fallback models
            if (this.config.enableFallback && this.config.fallbackModels && this.config.fallbackModels.length > 0) {
                logger_1.loggerInstance.info('Primary model failed, attempting fallback models');
                try {
                    return await this.tryWithFallbackModels(agent, systemPrompt, userPrompt, responseSchema, payload, maxRetries);
                }
                catch (fallbackError) {
                    logger_1.loggerInstance.error('All fallback models failed:', fallbackError instanceof Error ? fallbackError.message : String(fallbackError));
                    throw new Error(`All models failed - Primary: ${lastError?.message}, Fallbacks: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
                }
            }
            // If we get here, all retries and fallbacks failed
            throw new Error(`Failed to get valid response after ${maxRetries + 1} attempts: ${lastError?.message}`);
        });
    }
    /**
     * Get circuit breaker status for monitoring
     */
    getCircuitBreakerStatus() {
        return this.circuitBreaker.getState();
    }
    /**
     * Try fallback models when primary model fails
     */
    async tryWithFallbackModels(agent, systemPrompt, userPrompt, responseSchema, payload, maxRetries) {
        if (!this.config.enableFallback || !this.config.fallbackModels) {
            throw new Error('Fallback models not enabled or not configured');
        }
        const modelsToTry = [this.config.model, ...this.config.fallbackModels];
        for (const model of modelsToTry) {
            try {
                logger_1.loggerInstance.info(`Trying model: ${model}`);
                // Create timeout promise
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error(`Request timeout for model ${model}`)), this.config.fallbackTimeoutMs);
                });
                // Race between OpenAI call and timeout
                const response = (await Promise.race([
                    this.client.chat.completions.create({
                        model: model,
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: userPrompt },
                        ],
                        response_format: { type: 'json_object' },
                        max_tokens: MAX_COMPLETION_TOKENS,
                        temperature: 0.1,
                    }),
                    timeoutPromise,
                ]));
                const content = response.choices[0]?.message?.content;
                if (!content) {
                    throw new Error(`No content in response from model ${model}`);
                }
                // Parse JSON response
                let parsedResponse;
                try {
                    parsedResponse = JSON.parse(content);
                }
                catch (parseError) {
                    throw new Error(`Failed to parse JSON from model ${model}: ${parseError}`);
                }
                // Validate against schema
                const validatedResponse = responseSchema.parse(parsedResponse);
                // Record success for circuit breaker
                this.recordCircuitBreakerEvent(true);
                // Calculate token usage
                const actualPromptTokens = response.usage?.prompt_tokens || 0;
                const actualCompletionTokens = response.usage?.completion_tokens || 0;
                const actualTotalTokens = response.usage?.total_tokens || actualPromptTokens + actualCompletionTokens;
                const tokenUsage = {
                    prompt_tokens: actualPromptTokens,
                    completion_tokens: actualCompletionTokens,
                    total_tokens: actualTotalTokens,
                };
                const costInfo = this.calculateCost(tokenUsage);
                this.logCost(agent, costInfo, payload);
                // Return validated response with metadata
                const processingTime = Date.now() - Date.now(); // Simplified for fallback
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
                logger_1.loggerInstance.info(`Successfully used fallback model: ${model}`);
                return hedgiResponse;
            }
            catch (error) {
                logger_1.loggerInstance.warn(`Model ${model} failed:`, error instanceof Error ? error.message : String(error));
                // Record failure for circuit breaker
                this.recordCircuitBreakerEvent(false);
                // If this is the last model, throw the error
                if (model === modelsToTry[modelsToTry.length - 1]) {
                    throw error;
                }
                // Continue to next model
                continue;
            }
        }
        throw new Error('All fallback models failed');
    }
    /**
     * Get comprehensive system statistics
     */
    getStats() {
        const queueStats = this.requestQueue.getStats();
        const cacheStats = this.responseCache.getStats();
        const costStats = this.costTracker.getStats();
        return {
            circuitBreaker: this.circuitBreaker.getState(),
            memory: {
                activeRequests: queueStats.activeRequests,
                queueLength: queueStats.queueLength,
                cacheSize: cacheStats.size,
                costTrackerSize: costStats.totalEntries,
            },
            cache: cacheStats,
            costTracker: costStats,
        };
    }
    /**
     * Get memory usage statistics
     */
    getMemoryStats() {
        const stats = this.getStats();
        return stats.memory;
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
        try {
            const startTime = Date.now();
            let cacheCleaned = 0;
            let costCleaned = 0;
            // Clean cache entries
            const initialCacheSize = this.responseCache.getStats().size;
            this.responseCache.cleanup();
            const finalCacheSize = this.responseCache.getStats().size;
            cacheCleaned = initialCacheSize - finalCacheSize;
            // Clean old cost tracking data
            const initialCostSize = this.costTracker.getStats().totalEntries;
            this.costTracker.cleanup(1000);
            const finalCostSize = this.costTracker.getStats().totalEntries;
            costCleaned = initialCostSize - finalCostSize;
            const processingTime = Date.now() - startTime;
            const memoryPressure = this.checkMemoryPressure();
            logger_1.loggerInstance.info('Memory cleanup completed successfully', {
                processingTimeMs: processingTime,
                cacheEntriesCleaned: cacheCleaned,
                costEntriesCleaned: costCleaned,
                memoryPressure: memoryPressure,
                finalCacheSize: finalCacheSize,
                finalCostSize: finalCostSize,
            });
        }
        catch (error) {
            logger_1.loggerInstance.error('Critical error during memory cleanup:', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                timestamp: new Date().toISOString(),
            });
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
        this.costTracker.reset();
    }
    /**
     * Get fallback configuration status
     */
    getFallbackStatus() {
        return {
            enabled: this.config.enableFallback,
            models: this.config.fallbackModels || [],
            timeoutMs: this.config.fallbackTimeoutMs || 5000,
        };
    }
}
exports.HedgiOpenAI = HedgiOpenAI;
// Export a default instance factory
function createHedgiOpenAI(config) {
    return new HedgiOpenAI(config);
}
//# sourceMappingURL=hedgi-openai.js.map