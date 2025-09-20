import OpenAI from 'openai';
import { z } from 'zod';
import { createHash } from 'crypto';
import { loggerInstance as logger } from './logger';
import { type AgentType, type HedgiResponse } from './schemas';
import { tokenCounter } from './token-counter';
import { CircuitBreaker, CircuitState } from './circuit-breaker';
import { RequestQueue } from './request-queue';
import { ResponseCache } from './response-cache';
import { CostTracker, type CostInfo, type TokenUsage } from './cost-tracker';

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
export class HedgiOpenAIError extends Error {
  constructor(message: string, public readonly code: string, public readonly details?: Record<string, unknown>) {
    super(message);
    this.name = 'HedgiOpenAIError';
  }
}

export class CircuitBreakerError extends HedgiOpenAIError {
  constructor(message: string = 'Circuit breaker is open - service temporarily unavailable') {
    super(message, 'CIRCUIT_BREAKER_OPEN');
  }
}

export class PayloadSizeError extends HedgiOpenAIError {
  constructor(message: string, public readonly sizeMB: number, public readonly maxSizeMB: number) {
    super(message, 'PAYLOAD_TOO_LARGE', { sizeMB, maxSizeMB });
  }
}

export class TokenLimitError extends HedgiOpenAIError {
  constructor(message: string, public readonly tokenCount: number, public readonly limit: number) {
    super(message, 'TOKEN_LIMIT_EXCEEDED', { tokenCount, limit });
  }
}

export class RateLimitError extends HedgiOpenAIError {
  constructor(message: string, public readonly identifier: string, public readonly resetTime: number) {
    super(message, 'RATE_LIMIT_EXCEEDED', { identifier, resetTime });
  }
}

export interface HedgiOpenAIConfig {
  apiKey: string;
  model?: string;
  maxRetries?: number;
  enableCostLogging?: boolean;
}

// Re-export types from modules for backward compatibility
export { type TokenUsage, type CostInfo } from './cost-tracker';
export { CircuitState } from './circuit-breaker';

export class HedgiOpenAI {
  private client: OpenAI;
  private config: Required<HedgiOpenAIConfig>;

  // Modules for separation of concerns
  private circuitBreaker: CircuitBreaker;
  private requestQueue: RequestQueue;
  private responseCache: ResponseCache;
  private costTracker: CostTracker;

  constructor(config: HedgiOpenAIConfig) {
    // Validate API key
    if (!config.apiKey || config.apiKey.trim() === '') {
      throw new Error(
        'OpenAI API key is required. Please set OPENAI_API_KEY environment variable.'
      );
    }

    this.config = {
      model: 'gpt-4o',
      maxRetries: MAX_RETRIES,
      enableCostLogging: true,
      ...config,
    };

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
    });

    // Initialize modules
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: CIRCUIT_BREAKER_THRESHOLD,
      timeoutMs: CIRCUIT_BREAKER_TIMEOUT_MS,
      cacheTimeout: 1000,
    });

    this.requestQueue = new RequestQueue({
      maxConcurrentRequests: MAX_CONCURRENT_REQUESTS,
    });

    this.responseCache = new ResponseCache({
      ttlMs: CACHE_TTL_MS,
      maxSize: 100, // Maximum 100 cached responses
    });

    this.costTracker = new CostTracker({
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
  private isCircuitBreakerOpen(): boolean {
    return this.circuitBreaker.isOpen();
  }

  /**
   * Record success/failure for circuit breaker
   */
  private recordCircuitBreakerEvent(success: boolean): void {
    this.circuitBreaker.recordEvent(success);
  }

  /**
   * Calculate exponential backoff delay
   */
  private getExponentialBackoffDelay(attempt: number): number {
    return EXPONENTIAL_BACKOFF_BASE_MS * Math.pow(2, attempt);
  }

  /**
   * Execute request with concurrency control
   */
  private async executeWithConcurrencyControl<T>(requestFn: () => Promise<T>): Promise<T> {
    return this.requestQueue.executeWithConcurrencyControl(requestFn);
  }

  /**

  /**
   * Process the request queue
   */

  /**
   * Validate payload size limits
   */
  private validatePayloadSize(payload: Record<string, unknown>): { valid: boolean; error?: string } {
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
  private validateTokenLimits(
    systemPrompt: string,
    userPrompt: string
  ): { valid: boolean; promptTokens: number; error?: string } {
    return tokenCounter.validateTokenLimitsSync(
      systemPrompt,
      userPrompt,
      MAX_PROMPT_TOKENS,
      MAX_COMPLETION_TOKENS,
      this.config.model
    );
  }

  /**
   * Calculate cost for token usage
   */
  private calculateCost(tokenUsage: TokenUsage): CostInfo {
    return this.costTracker.calculateCost(tokenUsage);
  }

  /**
   * Log cost information for tracking
   */
  private logCost(
    agent: AgentType,
    costInfo: CostInfo,
    payloadPreview: Record<string, unknown>
  ): void {
    this.costTracker.logCost(agent, costInfo, payloadPreview);
  }

  /**
   * Get sanitized row count from payload for logging (no PII)
   */
  private getRowCount(
    payload: Record<string, unknown>
  ): Record<string, number> {
    const counts: Record<string, number> = {};
    const sensitiveKeys = ['ssn', 'tax_id', 'ein', 'bank_account', 'routing', 'email', 'phone', 'address'];

    for (const [key, value] of Object.entries(payload)) {
      // Skip sensitive fields
      if (sensitiveKeys.includes(key.toLowerCase())) {
        continue;
      }

      if (Array.isArray(value)) {
        counts[key] = value.length;
      } else if (typeof value === 'object' && value !== null) {
        counts[key] = Object.keys(value).length;
      }
    }

    return counts;
  }

  /**
   * Get sanitized data types from payload for logging (no PII)
   */
  private getDataTypes(
    payload: Record<string, unknown>
  ): Record<string, string> {
    const types: Record<string, string> = {};
    const sensitiveKeys = ['ssn', 'tax_id', 'ein', 'bank_account', 'routing', 'email', 'phone', 'address'];

    for (const [key, value] of Object.entries(payload)) {
      // Skip sensitive fields
      if (sensitiveKeys.includes(key.toLowerCase())) {
        continue;
      }

      if (Array.isArray(value)) {
        types[key] = `array[${value.length}]`;
      } else {
        types[key] = typeof value;
      }
    }

    return types;
  }

  /**
   * Get cost summary for an agent
   */
  public getCostSummary(agent: AgentType): CostInfo | null {
    return this.costTracker.getCostSummary(agent);
  }

  /**
   * Generate cache key for request using SHA-256
   */
  private generateCacheKey(
    agent: AgentType,
    systemPrompt: string,
    userPrompt: string
  ): string {
    const content = `${agent}:${systemPrompt}:${userPrompt}`;
    return createHash('sha256').update(content).digest('hex').substring(0, 32);
  }

  /**
   * Check if cached response is still valid
   */
  private getCachedResponse(agent: AgentType, systemPrompt: string, userPrompt: string): HedgiResponse | null {
    return this.responseCache.get(agent, systemPrompt, userPrompt);
  }

  /**
   * Main method to call OpenAI with JSON mode, validation, and retry logic
   */
  async callWithJSONMode<T extends z.ZodTypeAny>(
    agent: AgentType,
    systemPrompt: string,
    userPrompt: string,
    responseSchema: T,
    payload: Record<string, unknown>,
    maxRetries: number = this.config.maxRetries
  ): Promise<z.infer<T>> {
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
      throw new PayloadSizeError(payloadSizeValidation.error!, sizeInMB, MAX_PAYLOAD_SIZE_MB);
    }

    // Check cache first
    const cachedResponse = this.getCachedResponse(agent, systemPrompt, userPrompt);
    if (cachedResponse) {
      logger.debug(`Cache hit for ${agent} - returning cached response`);
      return cachedResponse;
    }

    // Validate token limits using tiktoken
    const tokenValidation = this.validateTokenLimits(systemPrompt, userPrompt);

    if (!tokenValidation.valid) {
      throw new TokenLimitError(tokenValidation.error!, tokenValidation.promptTokens, MAX_PROMPT_TOKENS);
    }

    let lastError: Error | null = null;

    // Execute with concurrency control
    return this.executeWithConcurrencyControl(async () => {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          // Create timeout promise
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(
              () => reject(new Error('Request timeout')),
              REQUEST_TIMEOUT_MS
            );
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
          ])) as OpenAI.Chat.Completions.ChatCompletion;

          const content = response.choices[0]?.message?.content;
          if (!content) {
            throw new Error('No content in OpenAI response');
          }

          // Parse JSON response
          let parsedResponse: unknown;
          try {
            parsedResponse = JSON.parse(content);
          } catch (parseError) {
            throw new Error(`Failed to parse JSON response: ${parseError}`);
          }

          // Validate against schema
          const validatedResponse = responseSchema.parse(parsedResponse);

          // Record success for circuit breaker
          this.recordCircuitBreakerEvent(true);

          // Calculate accurate token usage using tiktoken
          const actualPromptTokens =
            response.usage?.prompt_tokens || tokenValidation.promptTokens;
          const actualCompletionTokens = response.usage?.completion_tokens || 0;
          const actualTotalTokens =
            response.usage?.total_tokens ||
            actualPromptTokens + actualCompletionTokens;

          // If OpenAI doesn't provide usage, calculate using tiktoken
          const tokenUsage: TokenUsage = {
            prompt_tokens: actualPromptTokens,
            completion_tokens: actualCompletionTokens,
            total_tokens: actualTotalTokens,
          };

          // Log token breakdown for debugging
          if (this.config.enableCostLogging) {
            const breakdown = tokenCounter.getTokenBreakdown(
              systemPrompt,
              userPrompt,
              content,
              this.config.model
            );
            logger.debug(`Token breakdown for ${agent}:`, breakdown as any);
          }

          const costInfo = this.calculateCost(tokenUsage);
          this.logCost(agent, costInfo, payload);

          // Return validated response with metadata
          const processingTime = Date.now() - startTime;
          const hedgiResponse: HedgiResponse = {
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

          return hedgiResponse as z.infer<T>;
        } catch (error) {
          lastError = error as Error;

          // Record failure for circuit breaker
          this.recordCircuitBreakerEvent(false);

          // If this is the last attempt or circuit breaker is triggered, throw the error
          if (attempt === maxRetries || this.isCircuitBreakerOpen()) {
            break;
          }

          // Log retry attempt
          logger.warn(
            `OpenAI call failed (attempt ${attempt + 1}/${maxRetries + 1}):`,
            error instanceof Error ? error.message : String(error)
          );

          // Wait before retry (exponential backoff)
          const delay = this.getExponentialBackoffDelay(attempt);
          logger.info(`Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      // If we get here, all retries failed
      throw new Error(
        `Failed to get valid response after ${maxRetries + 1} attempts: ${lastError?.message}`
      );
    });
  }

  /**
   * Get circuit breaker status for monitoring
   */
  public getCircuitBreakerStatus(): {
    state: CircuitState;
    failureCount: number;
    lastFailureTime: number;
    nextAttemptTime: number;
  } {
    return this.circuitBreaker.getState();
  }

  /**
   * Get memory usage statistics
   */
  public getMemoryStats(): {
    activeRequests: number;
    queueLength: number;
    cacheSize: number;
    costTrackerSize: number;
  } {
    const queueStats = this.requestQueue.getStats();
    const cacheStats = this.responseCache.getStats();
    const costStats = this.costTracker.getStats();

    return {
      activeRequests: queueStats.activeRequests,
      queueLength: queueStats.queueLength,
      cacheSize: cacheStats.size,
      costTrackerSize: costStats.totalEntries,
    };
  }

  /**
   * Check memory usage and trigger cleanup if needed
   */
  private checkMemoryPressure(): boolean {
    try {
      const usage = process.memoryUsage();
      const usagePercent = (usage.heapUsed / usage.heapTotal) * 100;
      return usagePercent > MAX_MEMORY_USAGE_PERCENT;
    } catch (error) {
      logger.error('Failed to check memory usage:', error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  /**
   * Clean up memory by clearing old cache entries and monitoring pressure
   */
  public cleanupMemory(): void {
    try {
      // Clean cache entries
      this.responseCache.cleanup();

      // Clean old cost tracking data
      this.costTracker.cleanup(1000);

      logger.info('Memory cleanup completed', {
        memory_pressure: this.checkMemoryPressure(),
      });
    } catch (error) {
      logger.error('Memory cleanup failed:', error instanceof Error ? error.message : String(error));
    }
  }

  public prunePayload(
    payload: Record<string, unknown>
  ): Record<string, unknown> {
    const pruned = { ...payload };

    // If payload has transactions, sort by materiality and limit to 1500
    if (pruned.transactions && Array.isArray(pruned.transactions)) {
      pruned.transactions = pruned.transactions
        .sort((a: unknown, b: unknown) => {
          const aScore =
            ((a as Record<string, unknown>)?.materiality_score as number) || 0;
          const bScore =
            ((b as Record<string, unknown>)?.materiality_score as number) || 0;
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
  public resetCostTracking(): void {
    this.costTracker.reset();
  }
}

// Export a default instance factory
export function createHedgiOpenAI(config: HedgiOpenAIConfig): HedgiOpenAI {
  return new HedgiOpenAI(config);
}
