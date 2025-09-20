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
     * Count tokens in text using the specified model (async version)
     */
    countTokens(text: string, model?: string): Promise<number>;
    /**
     * Count tokens in text using the specified model (sync version for backward compatibility)
     */
    countTokensSync(text: string, model?: string): number;
    /**
     * Count tokens for a complete conversation (async version)
     */
    countConversationTokens(messages: Array<{
        role: string;
        content: string;
    }>, model?: string): Promise<number>;
    /**
     * Count tokens for a complete conversation (sync version for backward compatibility)
     */
    countConversationTokensSync(messages: Array<{
        role: string;
        content: string;
    }>, model?: string): number;
    /**
     * Count tokens for system and user prompts separately (async version)
     */
    countPromptTokens(systemPrompt: string, userPrompt: string, model?: string): Promise<TokenCountResult>;
    /**
     * Count tokens for system and user prompts separately (sync version for backward compatibility)
     */
    countPromptTokensSync(systemPrompt: string, userPrompt: string, model?: string): TokenCountResult;
    /**
     * Count tokens for completion response
     */
    countCompletionTokens(response: string, model?: string): number;
    /**
     * Update token count result with completion tokens
     */
    updateWithCompletion(result: TokenCountResult, completion: string, model?: string): TokenCountResult;
    /**
     * Validate token limits before making API call (async version)
     */
    validateTokenLimits(systemPrompt: string, userPrompt: string, maxPromptTokens?: number, _maxCompletionTokens?: number, model?: string): Promise<{
        valid: boolean;
        promptTokens: number;
        error?: string;
    }>;
    /**
     * Validate token limits before making API call (sync version for backward compatibility)
     */
    validateTokenLimitsSync(systemPrompt: string, userPrompt: string, maxPromptTokens?: number, _maxCompletionTokens?: number, model?: string): {
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