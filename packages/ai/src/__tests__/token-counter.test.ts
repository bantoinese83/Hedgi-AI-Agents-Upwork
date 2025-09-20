import { TokenCounter, tokenCounter } from '../token-counter';

describe('TokenCounter', () => {
  let counter: TokenCounter;

  beforeEach(() => {
    counter = new TokenCounter();
  });

  afterEach(() => {
    counter.cleanup();
  });

  describe('countTokens', () => {
    it('should count tokens for simple text', () => {
      const text = 'Hello, world!';
      const count = counter.countTokensSync(text);

      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThan(10); // Should be a small number for simple text
    });

    it('should count tokens for longer text', () => {
      const text =
        'This is a longer piece of text that should have more tokens than the previous example.';
      const count = counter.countTokens(text);

      expect(count).toBeGreaterThan(10);
      expect(count).toBeLessThan(50);
    });

    it('should handle empty text', () => {
      const count = counter.countTokens('');
      expect(count).toBe(0);
    });

    it('should handle different models', async () => {
      const text = 'Hello, world!';
      const gpt4Count = await counter.countTokens(text, 'gpt-4');
      const gpt4oCount = await counter.countTokens(text, 'gpt-4o');

      expect(gpt4Count).toBeGreaterThan(0);
      expect(gpt4oCount).toBeGreaterThan(0);
      // Different models might have slightly different token counts
      expect(Math.abs(gpt4Count - gpt4oCount)).toBeLessThan(5);
    });
  });

  describe('countConversationTokens', () => {
    it('should count tokens for a conversation', async () => {
      const messages = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello, how are you?' },
        { role: 'assistant', content: 'I am doing well, thank you!' },
      ];

      const count = await counter.countConversationTokens(messages);
      expect(count).toBeGreaterThan(0);
    });

    it('should handle empty conversation', () => {
      const count = counter.countConversationTokensSync([]);
      expect(count).toBe(2); // Just the conversation overhead
    });
  });

  describe('countPromptTokens', () => {
    it('should count system and user prompts separately', async () => {
      const systemPrompt = 'You are a helpful assistant.';
      const userPrompt = 'Hello, how are you?';

      const result = await counter.countPromptTokens(systemPrompt, userPrompt);

      expect(result.promptTokens).toBeGreaterThan(0);
      expect(result.completionTokens).toBe(0);
      expect(result.totalTokens).toBe(result.promptTokens);
      expect(result.model).toBe('gpt-4o');
    });
  });

  describe('validateTokenLimits', () => {
    it('should validate within limits', async () => {
      const systemPrompt = 'You are a helpful assistant.';
      const userPrompt = 'Hello, how are you?';

      const result = await counter.validateTokenLimits(
        systemPrompt,
        userPrompt,
        1000,
        100
      );

      expect(result.valid).toBe(true);
      expect(result.promptTokens).toBeGreaterThan(0);
      expect(result.error).toBeUndefined();
    });

    it('should reject when exceeding limits', async () => {
      const systemPrompt = 'You are a helpful assistant.';
      const userPrompt = 'Hello, how are you?';

      const result = await counter.validateTokenLimits(
        systemPrompt,
        userPrompt,
        1,
        1
      );

      expect(result.valid).toBe(false);
      expect(result.promptTokens).toBeGreaterThan(1);
      expect(result.error).toContain('exceeds token limit');
    });
  });

  describe('getTokenBreakdown', () => {
    it('should provide detailed token breakdown', () => {
      const systemPrompt = 'You are a helpful assistant.';
      const userPrompt = 'Hello, how are you?';
      const completion = 'I am doing well, thank you!';

      const breakdown = counter.getTokenBreakdown(
        systemPrompt,
        userPrompt,
        completion
      );

      expect(breakdown.systemTokens).toBeGreaterThan(0);
      expect(breakdown.userTokens).toBeGreaterThan(0);
      expect(breakdown.completionTokens).toBeGreaterThan(0);
      expect(breakdown.totalTokens).toBe(
        breakdown.systemTokens +
        breakdown.userTokens +
        breakdown.completionTokens
      );
      expect(breakdown.model).toBe('gpt-4o');
    });
  });

  describe('default instance', () => {
    it('should work with default tokenCounter instance', () => {
      const text = 'Hello, world!';
      const count = tokenCounter.countTokensSync(text);

      expect(count).toBeGreaterThan(0);
    });
  });
});
