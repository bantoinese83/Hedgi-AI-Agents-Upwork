/**
 * Accurate token counting using OpenAI's tiktoken library
 * Provides precise token counts that align with OpenAI's models
 */

import { encoding_for_model, type Tiktoken } from 'tiktoken';
import { logger } from './logger';

export interface TokenCountResult {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
}

export class TokenCounter {
  private encodings: Map<string, Tiktoken> = new Map();
  private readonly DEFAULT_MODEL = 'gpt-4o';

  /**
   * Get encoding for a specific model
   */
  private getEncoding(model: string): Tiktoken {
    if (!this.encodings.has(model)) {
      try {
        const encoding = encoding_for_model(
          model as Parameters<typeof encoding_for_model>[0]
        );
        this.encodings.set(model, encoding);
      } catch {
        logger.warn(
          `Failed to get encoding for model ${model}, falling back to ${this.DEFAULT_MODEL}`
        );
        const encoding = encoding_for_model(
          this.DEFAULT_MODEL as Parameters<typeof encoding_for_model>[0]
        );
        this.encodings.set(model, encoding);
      }
    }
    const encoding = this.encodings.get(model);
    if (!encoding) {
      throw new Error(`Encoding not found for model: ${model}`);
    }
    return encoding;
  }

  /**
   * Count tokens in text using the specified model
   */
  countTokens(text: string, model: string = this.DEFAULT_MODEL): number {
    try {
      // Handle null/undefined text
      if (!text || typeof text !== 'string') {
        return 0;
      }

      const encoding = this.getEncoding(model);
      return encoding.encode(text).length;
    } catch (error) {
      logger.error(`Error counting tokens for model ${model}:`, error);
      // Fallback to rough estimation (1 token ≈ 4 characters)
      return Math.ceil((text || '').length / 4);
    }
  }

  /**
   * Count tokens for a complete conversation
   */
  countConversationTokens(
    messages: Array<{ role: string; content: string }>,
    model: string = this.DEFAULT_MODEL
  ): number {
    try {
      // const encoding = this.getEncoding(model); // Not used in current implementation
      let totalTokens = 0;

      for (const message of messages) {
        // Add message overhead (role + content)
        totalTokens += 4; // Every message has 4 tokens overhead
        totalTokens += this.countTokens(message.content, model);
      }

      // Add conversation overhead
      totalTokens += 2; // Every conversation has 2 tokens overhead

      return totalTokens;
    } catch (error) {
      logger.error(
        `Error counting conversation tokens for model ${model}:`,
        error
      );
      // Fallback to rough estimation
      const totalText = messages.map((m) => m.content).join(' ');
      return Math.ceil(totalText.length / 4);
    }
  }

  /**
   * Count tokens for system and user prompts separately
   */
  countPromptTokens(
    systemPrompt: string,
    userPrompt: string,
    model: string = this.DEFAULT_MODEL
  ): TokenCountResult {
    const systemTokens = this.countTokens(systemPrompt, model);
    const userTokens = this.countTokens(userPrompt, model);
    const totalTokens = systemTokens + userTokens;

    return {
      promptTokens: totalTokens,
      completionTokens: 0, // Will be updated after completion
      totalTokens,
      model,
    };
  }

  /**
   * Count tokens for completion response
   */
  countCompletionTokens(
    response: string,
    model: string = this.DEFAULT_MODEL
  ): number {
    return this.countTokens(response, model);
  }

  /**
   * Update token count result with completion tokens
   */
  updateWithCompletion(
    result: TokenCountResult,
    completion: string,
    model: string = this.DEFAULT_MODEL
  ): TokenCountResult {
    const completionTokens = this.countCompletionTokens(completion, model);
    return {
      ...result,
      completionTokens,
      totalTokens: result.promptTokens + completionTokens,
    };
  }

  /**
   * Validate token limits before making API call
   */
  validateTokenLimits(
    systemPrompt: string,
    userPrompt: string,
    maxPromptTokens: number = 12000,
    _maxCompletionTokens: number = 2000,
    model: string = this.DEFAULT_MODEL
  ): { valid: boolean; promptTokens: number; error?: string } {
    const result = this.countPromptTokens(systemPrompt, userPrompt, model);

    if (result.promptTokens > maxPromptTokens) {
      return {
        valid: false,
        promptTokens: result.promptTokens,
        error: `Prompt exceeds token limit: ${result.promptTokens} > ${maxPromptTokens}`,
      };
    }

    return {
      valid: true,
      promptTokens: result.promptTokens,
    };
  }

  /**
   * Get token count breakdown for logging
   */
  getTokenBreakdown(
    systemPrompt: string,
    userPrompt: string,
    completion: string,
    model: string = this.DEFAULT_MODEL
  ): {
    systemTokens: number;
    userTokens: number;
    completionTokens: number;
    totalTokens: number;
    model: string;
  } {
    const systemTokens = this.countTokens(systemPrompt, model);
    const userTokens = this.countTokens(userPrompt, model);
    const completionTokens = this.countTokens(completion, model);
    const totalTokens = systemTokens + userTokens + completionTokens;

    return {
      systemTokens,
      userTokens,
      completionTokens,
      totalTokens,
      model,
    };
  }

  /**
   * Clean up encodings to free memory
   */
  cleanup(): void {
    this.encodings.clear();
  }
}

// Export a default instance
export const tokenCounter = new TokenCounter();
