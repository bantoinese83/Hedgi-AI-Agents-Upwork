import OpenAI from 'openai';
import { z } from 'zod';
import { loggerInstance as logger } from './logger';
import { type AgentType, type HedgiResponse } from './schemas';
import { tokenCounter } from './token-counter';

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

// Circuit breaker states
enum CircuitState {
  CLOSED = 'closed',      // Normal operation
  OPEN = 'open',          // Failing, reject requests
  HALF_OPEN = 'half-open' // Testing if service recovered
}

interface CircuitBreakerState {
  state: CircuitState;
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
}

export class HedgiOpenAI {
  private client: OpenAI;
  private config: Required<HedgiOpenAIConfig>;
  private costTracker: Map<string, CostInfo[]> = new Map();
  private responseCache: Map<
    string,
    { response: HedgiResponse; timestamp: number }
  > = new Map();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

  // Circuit breaker state
  private circuitBreaker: CircuitBreakerState = {
    state: CircuitState.CLOSED,
    failureCount: 0,
    lastFailureTime: 0,
    nextAttemptTime: 0,
  };

  // Memory management
  private requestQueue: Array<{ resolve: Function; reject: Function; request: any }> = [];
  private maxConcurrentRequests = 10;
  private activeRequests = 0;

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

    // Schedule memory cleanup every 10 minutes
    setInterval(() => {
      this.cleanupMemory();
    }, 10 * 60 * 1000);
  }

  /**
   * Check circuit breaker state
   */
  private isCircuitBreakerOpen(): boolean {
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
  private recordCircuitBreakerEvent(success: boolean): void {
    if (success) {
      this.circuitBreaker.failureCount = 0;
      if (this.circuitBreaker.state === CircuitState.HALF_OPEN) {
        this.circuitBreaker.state = CircuitState.CLOSED;
      }
    } else {
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
  private getExponentialBackoffDelay(attempt: number): number {
    return EXPONENTIAL_BACKOFF_BASE_MS * Math.pow(2, attempt);
  }

  /**
   * Execute request with concurrency control
   */
  private async executeWithConcurrencyControl<T>(requestFn: () => Promise<T>): Promise<T> {
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
  private async processQueue(): Promise<void> {
    if (this.activeRequests >= this.maxConcurrentRequests || this.requestQueue.length === 0) {
      return;
    }

    this.activeRequests++;
    const { resolve, reject, request } = this.requestQueue.shift()!;

    try {
      const result = await request();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.activeRequests--;
      this.processQueue(); // Process next item in queue
    }
  }

  /**
   * Validate token limits before making API call using tiktoken
   */
  private validateTokenLimits(
    systemPrompt: string,
    userPrompt: string
  ): { valid: boolean; promptTokens: number; error?: string } {
    return tokenCounter.validateTokenLimits(
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
    const promptCost =
      (tokenUsage.prompt_tokens / 1000) * COST_PER_1K_PROMPT_TOKENS;
    const completionCost =
      (tokenUsage.completion_tokens / 1000) * COST_PER_1K_COMPLETION_TOKENS;

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
  private logCost(
    agent: AgentType,
    costInfo: CostInfo,
    payloadPreview: Record<string, unknown>
  ): void {
    if (!this.config.enableCostLogging) return;

    // Track costs per agent
    if (!this.costTracker.has(agent)) {
      this.costTracker.set(agent, []);
    }
    const agentCosts = this.costTracker.get(agent);
    if (agentCosts) {
      agentCosts.push(costInfo);
    }

    // Log usage metrics and payload preview (no raw data/PII)
    logger.info('Cost tracking', {
      agent,
      timestamp: new Date().toISOString(),
      cost: costInfo.total_cost,
      tokens: costInfo.token_usage,
      payload_preview: {
        row_count: this.getRowCount(payloadPreview),
        first_keys: Object.keys(payloadPreview).slice(0, 5),
        data_types: this.getDataTypes(payloadPreview),
      },
    } as any);
  }

  /**
   * Get row count from payload for logging
   */
  private getRowCount(
    payload: Record<string, unknown>
  ): Record<string, number> {
    const counts: Record<string, number> = {};

    for (const [key, value] of Object.entries(payload)) {
      if (Array.isArray(value)) {
        counts[key] = value.length;
      } else if (typeof value === 'object' && value !== null) {
        counts[key] = Object.keys(value).length;
      }
    }

    return counts;
  }

  /**
   * Get data types from payload for logging
   */
  private getDataTypes(
    payload: Record<string, unknown>
  ): Record<string, string> {
    const types: Record<string, string> = {};

    for (const [key, value] of Object.entries(payload)) {
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
    const costs = this.costTracker.get(agent);
    if (!costs || costs.length === 0) return null;

    const totalCost = costs.reduce((sum, cost) => sum + cost.total_cost, 0);
    const totalTokens = costs.reduce(
      (sum, cost) => sum + cost.token_usage.total_tokens,
      0
    );
    // const avgCostPerCall = totalCost / costs.length; // Unused for now

    return {
      prompt_cost: costs.reduce((sum, cost) => sum + cost.prompt_cost, 0),
      completion_cost: costs.reduce(
        (sum, cost) => sum + cost.completion_cost,
        0
      ),
      total_cost: totalCost,
      token_usage: {
        prompt_tokens: costs.reduce(
          (sum, cost) => sum + cost.token_usage.prompt_tokens,
          0
        ),
        completion_tokens: costs.reduce(
          (sum, cost) => sum + cost.token_usage.completion_tokens,
          0
        ),
        total_tokens: totalTokens,
      },
    };
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(
    agent: AgentType,
    systemPrompt: string,
    userPrompt: string
  ): string {
    const content = `${agent}:${systemPrompt}:${userPrompt}`;
    return Buffer.from(content).toString('base64').slice(0, 32);
  }

  /**
   * Check if cached response is still valid
   */
  private getCachedResponse(cacheKey: string): HedgiResponse | null {
    const cached = this.responseCache.get(cacheKey);
    if (!cached) return null;

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
      throw new Error('Circuit breaker is open - OpenAI service is currently unavailable');
    }

    // Check cache first
    const cacheKey = this.generateCacheKey(agent, systemPrompt, userPrompt);
    const cachedResponse = this.getCachedResponse(cacheKey);
    if (cachedResponse) {
      logger.debug(`Cache hit for ${agent} - returning cached response`);
      return cachedResponse;
    }

    // Validate token limits using tiktoken
    const tokenValidation = this.validateTokenLimits(systemPrompt, userPrompt);

    if (!tokenValidation.valid) {
      throw new Error(`Token validation failed: ${tokenValidation.error}`);
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
          this.responseCache.set(cacheKey, {
            response: hedgiResponse,
            timestamp: Date.now(),
          });

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
    return { ...this.circuitBreaker };
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
  public cleanupMemory(): void {
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

    logger.info('Memory cleanup completed', {
      cache_cleaned: cacheSize - this.responseCache.size,
      cost_data_retained: costTrackerSize - this.costTracker.size,
    });
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
  public resetCostTracking(): void {
    this.costTracker.clear();
  }
}

// Export a default instance factory
export function createHedgiOpenAI(config: HedgiOpenAIConfig): HedgiOpenAI {
  return new HedgiOpenAI(config);
}
