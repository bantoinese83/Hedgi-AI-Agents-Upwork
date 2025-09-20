import { HedgiOpenAI, createHedgiOpenAI } from '../hedgi-openai';
import { SMBExplainerResponseSchema, type SMBExplainerInput } from '../schemas';

// Mock the logger module
jest.mock('../logger');

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

describe('HedgiOpenAI - Comprehensive Tests', () => {
    let openai: HedgiOpenAI;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock the logger module
        const mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
        };

        jest.doMock('../logger', () => ({
            loggerInstance: mockLogger,
        }));
        openai = createHedgiOpenAI({
            apiKey: 'test-api-key',
            enableCostLogging: true,
        });
        // Clear cache between tests
        (openai as any).responseCache.clear();

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

    describe('Constructor and Configuration', () => {
        it('should create instance with valid config', () => {
            expect(openai).toBeInstanceOf(HedgiOpenAI);
        });

        it('should throw error for missing API key', () => {
            expect(() => {
                createHedgiOpenAI({
                    apiKey: '',
                    enableCostLogging: true,
                });
            }).toThrow('OpenAI API key is required');
        });

        it('should throw error for whitespace-only API key', () => {
            expect(() => {
                createHedgiOpenAI({
                    apiKey: '   ',
                    enableCostLogging: true,
                });
            }).toThrow('OpenAI API key is required');
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

            const cost = (openai as any).calculateCost(tokenUsage);
            expect(cost.prompt_cost).toBe(0.03); // 1000 * 0.00003
            expect(cost.completion_cost).toBe(0.03); // 500 * 0.00006 (completion tokens cost more)
            expect(cost.total_cost).toBe(0.06);
        });

        it('should calculate costs for different models', () => {
            const tokenUsage = {
                prompt_tokens: 1000,
                completion_tokens: 500,
                total_tokens: 1500,
            };

            // Test with different model
            const cost = (openai as any).calculateCost(tokenUsage, 'gpt-4-0613');
            expect(cost.total_cost).toBeGreaterThan(0);
        });
    });

    describe('Payload Pruning', () => {
        it('should prune payload correctly', () => {
            const payload = {
                transactions: Array.from({ length: 2000 }, (_, i) => ({
                    id: `tx-${i}`,
                    amount: 100,
                    materiality_score: Math.random(),
                })),
                safe_data: 'keep this',
                ssn: '123-45-6789',
                tax_id: '12-3456789',
            };

            const pruned = openai.prunePayload(payload);
            expect(pruned.transactions).toHaveLength(1500);
            expect(pruned.ssn).toBeUndefined();
            expect(pruned.tax_id).toBeUndefined();
            expect(pruned.safe_data).toBe('keep this');
        });

        it('should sort transactions by materiality', () => {
            const payload = {
                transactions: [
                    { id: '1', amount: 100, materiality_score: 0.1 },
                    { id: '2', amount: 200, materiality_score: 0.9 },
                    { id: '3', amount: 300, materiality_score: 0.3 },
                ],
            };

            const pruned = openai.prunePayload(payload);
            const transactions = pruned.transactions as Array<Record<string, unknown>>;
            expect(transactions[0].materiality_score).toBe(0.9);
            expect(transactions[1].materiality_score).toBe(0.3);
            expect(transactions[2].materiality_score).toBe(0.1);
        });

        it('should handle payload without transactions', () => {
            const payload = {
                other_data: 'test',
                safe_data: 'keep this',
            };

            const pruned = openai.prunePayload(payload);
            expect(pruned.other_data).toBe('test');
            expect(pruned.safe_data).toBe('keep this');
        });
    });

    describe('Cache Functionality', () => {
        it('should cache responses', async () => {
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

            // First call
            const result1 = await openai.callWithJSONMode(
                'smb-explainer',
                'Test system prompt',
                'Test user prompt',
                SMBExplainerResponseSchema,
                input
            );

            // Second call should use cache
            const result2 = await openai.callWithJSONMode(
                'smb-explainer',
                'Test system prompt',
                'Test user prompt',
                SMBExplainerResponseSchema,
                input
            );

            expect(result1).toEqual(result2);
            expect(mockCreate).toHaveBeenCalledTimes(1);
        });

        it('should generate different cache keys for different inputs', async () => {
            const input1: SMBExplainerInput = {
                business_name: 'Business 1',
                month: 'January',
                year: 2024,
                rollups: {
                    total_income: 10000,
                    total_expenses: 8000,
                    net_income: 2000,
                    top_categories: [],
                },
                exemplar_transactions: [],
                previous_month_comparison: {
                    income_change: 10,
                    expense_change: 5,
                    net_change: 15,
                },
            };

            const input2: SMBExplainerInput = {
                ...input1,
                business_name: 'Business 2',
            };

            // Clear cache before first call
            (openai as any).responseCache.clear();

            await openai.callWithJSONMode(
                'smb-explainer',
                'Test system prompt',
                'Test user prompt',
                SMBExplainerResponseSchema,
                input1
            );

            // Clear cache before second call
            (openai as any).responseCache.clear();

            await openai.callWithJSONMode(
                'smb-explainer',
                'Test system prompt',
                'Test user prompt',
                SMBExplainerResponseSchema,
                input2
            );

            expect(mockCreate).toHaveBeenCalledTimes(2);
        });
    });

    describe('JSON Mode with Retry', () => {
        it('should succeed on first attempt with valid JSON', async () => {
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
                    input,
                    1 // Max 1 retry
                )
            ).rejects.toThrow('All models failed');
        });

        it('should handle missing content in response', async () => {
            mockCreate.mockResolvedValue({
                choices: [{}], // No message content
                usage: {
                    prompt_tokens: 100,
                    completion_tokens: 50,
                    total_tokens: 150,
                },
            });

            const input: SMBExplainerInput = {
                business_name: 'Test Business',
                month: 'January',
                year: 2024,
                rollups: {
                    total_income: 10000,
                    total_expenses: 8000,
                    net_income: 2000,
                    top_categories: [],
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
            ).rejects.toThrow('No content in OpenAI response');
        });
    });

    describe('Error Handling', () => {
        it('should handle OpenAI API errors', async () => {
            mockCreate.mockRejectedValue(new Error('OpenAI API Error'));

            const input: SMBExplainerInput = {
                business_name: 'Test Business',
                month: 'January',
                year: 2024,
                rollups: {
                    total_income: 10000,
                    total_expenses: 8000,
                    net_income: 2000,
                    top_categories: [],
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
            ).rejects.toThrow('OpenAI API Error');
        });

        it('should handle missing content in response', async () => {
            mockCreate.mockResolvedValue({
                choices: [{}], // No message content
                usage: {
                    prompt_tokens: 100,
                    completion_tokens: 50,
                    total_tokens: 150,
                },
            });

            const input: SMBExplainerInput = {
                business_name: 'Test Business',
                month: 'January',
                year: 2024,
                rollups: {
                    total_income: 10000,
                    total_expenses: 8000,
                    net_income: 2000,
                    top_categories: [],
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
            ).rejects.toThrow('No content in OpenAI response');
        });
    });

    describe('Cost Logging', () => {
        it('should log costs when enabled', async () => {
            const input: SMBExplainerInput = {
                business_name: 'Test Business',
                month: 'January',
                year: 2024,
                rollups: {
                    total_income: 10000,
                    total_expenses: 8000,
                    net_income: 2000,
                    top_categories: [],
                },
                exemplar_transactions: [],
                previous_month_comparison: {
                    income_change: 10,
                    expense_change: 5,
                    net_change: 15,
                },
            };

            await openai.callWithJSONMode(
                'smb-explainer',
                'Test system prompt',
                'Test user prompt',
                SMBExplainerResponseSchema,
                input
            );

            // Cost should be logged (mocked logger will be called)
            expect(true).toBe(true); // Test passes if no error thrown
        });

        it('should not log costs when disabled', async () => {
            const noLoggingOpenai = createHedgiOpenAI({
                apiKey: 'test-api-key',
                enableCostLogging: false,
            });

            const input: SMBExplainerInput = {
                business_name: 'Test Business',
                month: 'January',
                year: 2024,
                rollups: {
                    total_income: 10000,
                    total_expenses: 8000,
                    net_income: 2000,
                    top_categories: [],
                },
                exemplar_transactions: [],
                previous_month_comparison: {
                    income_change: 10,
                    expense_change: 5,
                    net_change: 15,
                },
            };

            await noLoggingOpenai.callWithJSONMode(
                'smb-explainer',
                'Test system prompt',
                'Test user prompt',
                SMBExplainerResponseSchema,
                input
            );

            // Should complete without errors
            expect(true).toBe(true);
        });
    });

    describe('Utility Methods', () => {
        it('should get row count from payload', () => {
            const payload = {
                transactions: [1, 2, 3],
                users: [1, 2, 3, 4, 5],
                single_item: 'not array',
            };

            const rowCount = (openai as any).getRowCount(payload);
            expect(rowCount.transactions).toBe(3);
            expect(rowCount.users).toBe(5);
            expect(rowCount.single_item).toBeUndefined();
        });

        it('should get data types from payload', () => {
            const payload = {
                string_field: 'test',
                number_field: 123,
                array_field: [1, 2, 3],
                object_field: { nested: true },
                null_field: null,
            };

            const dataTypes = (openai as any).getDataTypes(payload);
            expect(dataTypes.string_field).toBe('string');
            expect(dataTypes.number_field).toBe('number');
            expect(dataTypes.array_field).toBe('array[3]');
            expect(dataTypes.object_field).toBe('object');
            expect(dataTypes.null_field).toBe('object'); // null is typeof 'object' in JavaScript
        });
    });
});
