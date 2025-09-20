"use strict";
/**
 * Accurate token counting using OpenAI's tiktoken library
 * Provides precise token counts that align with OpenAI's models
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenCounter = exports.TokenCounter = void 0;
const tiktoken_1 = require("tiktoken");
const logger_1 = require("./logger");
class TokenCounter {
    constructor() {
        this.encodings = new Map();
        this.DEFAULT_MODEL = 'gpt-4o';
    }
    /**
     * Get encoding for a specific model
     */
    getEncoding(model) {
        if (!this.encodings.has(model)) {
            try {
                const encoding = (0, tiktoken_1.encoding_for_model)(model);
                this.encodings.set(model, encoding);
            }
            catch {
                logger_1.loggerInstance.warn(`Failed to get encoding for model ${model}, falling back to ${this.DEFAULT_MODEL}`);
                const encoding = (0, tiktoken_1.encoding_for_model)(this.DEFAULT_MODEL);
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
    countTokens(text, model = this.DEFAULT_MODEL) {
        try {
            // Handle null/undefined text
            if (!text || typeof text !== 'string') {
                return 0;
            }
            const encoding = this.getEncoding(model);
            return encoding.encode(text).length;
        }
        catch (error) {
            logger_1.loggerInstance.error(`Error counting tokens for model ${model}:`, error instanceof Error ? error.message : String(error));
            // Fallback to rough estimation (1 token ≈ 4 characters)
            return Math.ceil((text || '').length / 4);
        }
    }
    /**
     * Count tokens for a complete conversation
     */
    countConversationTokens(messages, model = this.DEFAULT_MODEL) {
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
        }
        catch (error) {
            logger_1.loggerInstance.error(`Error counting conversation tokens for model ${model}:`, error instanceof Error ? error.message : String(error));
            // Fallback to rough estimation
            const totalText = messages.map((m) => m.content).join(' ');
            return Math.ceil(totalText.length / 4);
        }
    }
    /**
     * Count tokens for system and user prompts separately
     */
    countPromptTokens(systemPrompt, userPrompt, model = this.DEFAULT_MODEL) {
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
    countCompletionTokens(response, model = this.DEFAULT_MODEL) {
        return this.countTokens(response, model);
    }
    /**
     * Update token count result with completion tokens
     */
    updateWithCompletion(result, completion, model = this.DEFAULT_MODEL) {
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
    validateTokenLimits(systemPrompt, userPrompt, maxPromptTokens = 12000, _maxCompletionTokens = 2000, model = this.DEFAULT_MODEL) {
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
    getTokenBreakdown(systemPrompt, userPrompt, completion, model = this.DEFAULT_MODEL) {
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
    cleanup() {
        this.encodings.clear();
    }
}
exports.TokenCounter = TokenCounter;
// Export a default instance
exports.tokenCounter = new TokenCounter();
//# sourceMappingURL=token-counter.js.map