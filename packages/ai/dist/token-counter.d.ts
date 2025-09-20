/**
 * Accurate token counting using OpenAI's tiktoken library
 * Provides precise token counts that align with OpenAI's models
 */
export interface TokenCountResult {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    model: string;
}
export declare class TokenCounter {
    private encodings;
    private readonly DEFAULT_MODEL;
    /**
     * Get encoding for a specific model
     */
    private getEncoding;
    /**
     * Count tokens in text using the specified model
     */
    countTokens(text: string, model?: string): number;
    /**
     * Count tokens for a complete conversation
     */
    countConversationTokens(messages: Array<{
        role: string;
        content: string;
    }>, model?: string): number;
    /**
     * Count tokens for system and user prompts separately
     */
    countPromptTokens(systemPrompt: string, userPrompt: string, model?: string): TokenCountResult;
    /**
     * Count tokens for completion response
     */
    countCompletionTokens(response: string, model?: string): number;
    /**
     * Update token count result with completion tokens
     */
    updateWithCompletion(result: TokenCountResult, completion: string, model?: string): TokenCountResult;
    /**
     * Validate token limits before making API call
     */
    validateTokenLimits(systemPrompt: string, userPrompt: string, maxPromptTokens?: number, _maxCompletionTokens?: number, model?: string): {
        valid: boolean;
        promptTokens: number;
        error?: string;
    };
    /**
     * Get token count breakdown for logging
     */
    getTokenBreakdown(systemPrompt: string, userPrompt: string, completion: string, model?: string): {
        systemTokens: number;
        userTokens: number;
        completionTokens: number;
        totalTokens: number;
        model: string;
    };
    /**
     * Clean up encodings to free memory
     */
    cleanup(): void;
}
export declare const tokenCounter: TokenCounter;
//# sourceMappingURL=token-counter.d.ts.map