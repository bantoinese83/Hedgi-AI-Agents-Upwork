import { HedgiOpenAI, createHedgiOpenAI } from '../hedgi-openai';
import { SMBExplainerResponseSchema, type SMBExplainerInput } from '../schemas';

// Mock OpenAI
const mockCreate = jest.fn();
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    })),
  };
});

// Mock tiktoken
jest.mock('tiktoken', () => ({
  encoding_for_model: jest.fn().mockReturnValue({
    encode: jest.fn().mockImplementation((text: string) => {
      // Return different token counts based on text length
      if (text.length > 10000) {
        return new Array(15000); // Exceeds 12k limit
      }
      return new Array(10); // Within limit
    }),
  }),
}));

describe('HedgiOpenAI', () => {
  let openai: HedgiOpenAI;

  beforeEach(() => {
    jest.clearAllMocks();
    openai = createHedgiOpenAI({
      apiKey: 'test-api-key',
      enableCostLogging: true,
    });

    // Setup default mock response
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              success: true,
              data: {
                summary: 'Test summary',
                key_insights: ['Test insight'],
                recommendations: ['Test recommendation'],
                financial_health_score: 85,
              },
              metadata: {
                agent: 'smb-explainer',
                timestamp: '2024-01-20T00:00:00.000Z',
                processing_time_ms: 100,
                token_usage: {
                  prompt_tokens: 100,
                  completion_tokens: 50,
                  total_tokens: 150,
                },
              },
            }),
          },
        },
      ],
      usage: {
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150,
      },
    });
  });

  describe('Token Validation', () => {
    it('should validate token limits correctly', () => {
      const shortSystemPrompt = 'Short system prompt';
      const shortUserPrompt = 'Short user prompt';
      const longSystemPrompt = 'x'.repeat(50000); // Exceeds 12k token limit
      const longUserPrompt = 'x'.repeat(50000);

      const shortValidation = (openai as any).validateTokenLimits(shortSystemPrompt, shortUserPrompt);
      const longValidation = (openai as any).validateTokenLimits(longSystemPrompt, longUserPrompt);

      expect(shortValidation.valid).toBe(true);
      expect(longValidation.valid).toBe(false);
      expect(longValidation.error).toContain('exceeds token limit');
    });
  });

  describe('Cost Calculation', () => {
    it('should calculate costs correctly', () => {
      const tokenUsage = {
        prompt_tokens: 1000,
        completion_tokens: 500,
        total_tokens: 1500,
      };

      const costInfo = (openai as any).calculateCost(tokenUsage);

      expect(costInfo.prompt_cost).toBe(0.03); // 1000/1000 * 0.03
      expect(costInfo.completion_cost).toBe(0.03); // 500/1000 * 0.06
      expect(costInfo.total_cost).toBe(0.06);
    });
  });

  describe('Payload Pruning', () => {
    it('should prune transactions to 1500 limit', () => {
      const payload = {
        transactions: Array.from({ length: 2000 }, (_, i) => ({
          id: `txn-${i}`,
          materiality_score: Math.random(),
          amount: 100,
        })),
        other_data: 'test',
      };

      const pruned = openai.prunePayload(payload);

      expect(pruned.transactions).toHaveLength(1500);
      expect(pruned.other_data).toBe('test');
    });

    it('should sort transactions by materiality score', () => {
      const payload = {
        transactions: [
          { id: '1', materiality_score: 0.3, amount: 100 },
          { id: '2', materiality_score: 0.9, amount: 200 },
          { id: '3', materiality_score: 0.1, amount: 50 },
        ],
      };

      const pruned = openai.prunePayload(payload);

      const transactions = pruned.transactions as Array<
        Record<string, unknown>
      >;
      expect(transactions[0].materiality_score).toBe(0.9);
      expect(transactions[1].materiality_score).toBe(0.3);
      expect(transactions[2].materiality_score).toBe(0.1);
    });

    it('should remove sensitive data', () => {
      const payload = {
        transactions: [],
        ssn: '123-45-6789',
        tax_id: '12-3456789',
        bank_account: '1234567890',
        safe_data: 'keep this',
      };

      const pruned = openai.prunePayload(payload);

      expect(pruned.ssn).toBeUndefined();
      expect(pruned.tax_id).toBeUndefined();
      expect(pruned.bank_account).toBeUndefined();
      expect(pruned.safe_data).toBe('keep this');
    });
  });

  describe('JSON Mode with Retry', () => {
    it('should succeed on first attempt with valid JSON', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                success: true,
                data: {
                  summary: 'Test summary',
                  key_insights: ['Test insight'],
                  recommendations: ['Test recommendation'],
                  financial_health_score: 85,
                },
                metadata: {
                  agent: 'smb-explainer',
                  timestamp: '2024-01-20T00:00:00.000Z',
                  processing_time_ms: 100,
                  token_usage: {
                    prompt_tokens: 100,
                    completion_tokens: 50,
                    total_tokens: 150,
                  },
                },
              }),
            },
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      };

      mockCreate.mockResolvedValue(mockResponse);

      const input: SMBExplainerInput = {
        business_name: 'Test Business',
        month: 'January',
        year: 2024,
        rollups: {
          total_income: 10000,
          total_expenses: 8000,
          net_income: 2000,
          top_categories: [
            { category: 'Revenue', amount: 10000, percentage: 100 },
          ],
        },
        exemplar_transactions: [],
        previous_month_comparison: {
          income_change: 10,
          expense_change: 5,
          net_change: 15,
        },
      };

      const result = await openai.callWithJSONMode(
        'smb-explainer',
        'Test system prompt',
        'Test user prompt',
        SMBExplainerResponseSchema,
        input
      );

      expect(result.success).toBe(true);
      expect((result as any).data.data.summary).toBe('Test summary');
      expect((result as any).data.data.key_insights).toEqual(['Test insight']);
      expect((result as any).data.data.recommendations).toEqual(['Test recommendation']);
      expect((result as any).data.data.financial_health_score).toBe(85);
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should retry on JSON parse error', async () => {
      const invalidJsonResponse = {
        choices: [
          {
            message: {
              content: 'Invalid JS',
            },
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      };

      const validResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                success: true,
                data: {
                  summary: 'Test summary',
                  key_insights: ['Test insight'],
                  recommendations: ['Test recommendation'],
                  financial_health_score: 85,
                },
                metadata: {
                  agent: 'smb-explainer',
                  timestamp: '2024-01-01T00:00:00Z',
                  processing_time_ms: 1000,
                  token_usage: {
                    prompt_tokens: 100,
                    completion_tokens: 50,
                    total_tokens: 150,
                  },
                },
              }),
            },
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      };

      mockCreate
        .mockResolvedValueOnce(invalidJsonResponse)
        .mockResolvedValueOnce(validResponse);

      const input: SMBExplainerInput = {
        business_name: 'Test Business',
        month: 'January',
        year: 2024,
        rollups: {
          total_income: 10000,
          total_expenses: 8000,
          net_income: 2000,
          top_categories: [
            { category: 'Revenue', amount: 10000, percentage: 100 },
          ],
        },
        exemplar_transactions: [],
        previous_month_comparison: {
          income_change: 10,
          expense_change: 5,
          net_change: 15,
        },
      };

      const result = await openai.callWithJSONMode(
        'smb-explainer',
        'Test system prompt',
        'Test user prompt',
        SMBExplainerResponseSchema,
        input
      );

      expect(result.success).toBe(true);
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it('should retry on schema validation error', async () => {
      const invalidSchemaResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                success: true,
                data: {
                  // Missing required fields
                  summary: 'Test summary',
                },
              }),
            },
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      };

      const validResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                success: true,
                data: {
                  summary: 'Test summary',
                  key_insights: ['Test insight'],
                  recommendations: ['Test recommendation'],
                  financial_health_score: 85,
                },
                metadata: {
                  agent: 'smb-explainer',
                  timestamp: '2024-01-01T00:00:00Z',
                  processing_time_ms: 1000,
                  token_usage: {
                    prompt_tokens: 100,
                    completion_tokens: 50,
                    total_tokens: 150,
                  },
                },
              }),
            },
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      };

      mockCreate
        .mockResolvedValueOnce(invalidSchemaResponse)
        .mockResolvedValueOnce(validResponse);

      const input: SMBExplainerInput = {
        business_name: 'Test Business',
        month: 'January',
        year: 2024,
        rollups: {
          total_income: 10000,
          total_expenses: 8000,
          net_income: 2000,
          top_categories: [
            { category: 'Revenue', amount: 10000, percentage: 100 },
          ],
        },
        exemplar_transactions: [],
        previous_month_comparison: {
          income_change: 10,
          expense_change: 5,
          net_change: 15,
        },
      };

      const result = await openai.callWithJSONMode(
        'smb-explainer',
        'Test system prompt',
        'Test user prompt',
        SMBExplainerResponseSchema,
        input
      );

      expect(result.success).toBe(true);
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      const invalidResponse = {
        choices: [
          {
            message: {
              content: 'Invalid JS',
            },
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      };

      mockCreate.mockResolvedValue(invalidResponse);

      const input: SMBExplainerInput = {
        business_name: 'Test Business',
        month: 'January',
        year: 2024,
        rollups: {
          total_income: 10000,
          total_expenses: 8000,
          net_income: 2000,
          top_categories: [
            { category: 'Revenue', amount: 10000, percentage: 100 },
          ],
        },
        exemplar_transactions: [],
        previous_month_comparison: {
          income_change: 10,
          expense_change: 5,
          net_change: 15,
        },
      };

      await expect(
        openai.callWithJSONMode(
          'smb-explainer',
          'Test system prompt',
          'Test user prompt',
          SMBExplainerResponseSchema,
          input
        )
      ).rejects.toThrow('Failed to get valid response after 2 attempts');
    });
  });

  describe('Cost Tracking', () => {
    it('should track costs per agent', () => {
      const costInfo = {
        prompt_cost: 0.03,
        completion_cost: 0.06,
        total_cost: 0.09,
        token_usage: {
          prompt_tokens: 1000,
          completion_tokens: 500,
          total_tokens: 1500,
        },
      };

      (openai as any).logCost('smb-explainer', costInfo, { transactions: [] });
      (openai as any).logCost('smb-explainer', costInfo, { transactions: [] });

      const summary = openai.getCostSummary('smb-explainer');
      expect(summary?.total_cost).toBe(0.18);
      expect(summary?.token_usage.total_tokens).toBe(3000);
    });

    it('should return null for agent with no costs', () => {
      const summary = openai.getCostSummary('smb-explainer');
      expect(summary).toBeNull();
    });
  });
});
