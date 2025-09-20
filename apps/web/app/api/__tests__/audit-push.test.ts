import { NextRequest } from 'next/server';

// Mock the @hedgi/ai module before importing the route
jest.mock('@hedgi/ai', () => ({
    createHedgiOpenAI: jest.fn(),
    logger: {
        error: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    },
    AuditPushInputSchema: {
        parse: jest.fn(),
    },
    AuditPushResponseSchema: {
        parse: jest.fn(),
    },
}));

// Mock environment variables
const originalEnv = process.env;

// Import the route after mocking
const { POST } = require('../ai/audit-push/route');

describe('/api/ai/audit-push', () => {
    let mockOpenAI: any;
    let mockLogger: any;
    let mockInputSchema: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Reset environment
        process.env = { ...originalEnv, OPENAI_API_KEY: 'test-api-key' };

        // Setup mocks
        mockOpenAI = {
            prunePayload: jest.fn(),
            callWithJSONMode: jest.fn(),
        };

        mockLogger = {
            error: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
        };

        mockInputSchema = {
            parse: jest.fn(),
        };

        // Setup module mocks
        const { createHedgiOpenAI, logger, AuditPushInputSchema } = require('@hedgi/ai');
        createHedgiOpenAI.mockReturnValue(mockOpenAI);
        Object.assign(logger, mockLogger);
        Object.assign(AuditPushInputSchema, mockInputSchema);
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('POST /api/ai/audit-push', () => {
        const validInput = {
            transactions: [
                {
                    id: 'tx-1',
                    date: '2024-01-15',
                    description: 'Office Supplies',
                    amount: 150.00,
                    category: 'Office Expenses',
                    account: 'Checking',
                    type: 'expense',
                    materiality_score: 0.8,
                },
                {
                    id: 'tx-2',
                    date: '2024-01-16',
                    description: 'Uncategorized Transaction',
                    amount: 75.00,
                    category: '',
                    account: 'Checking',
                    type: 'expense',
                    materiality_score: 0.6,
                },
            ],
            existing_rules: [
                {
                    id: 'rule-1',
                    pattern: 'Office Supplies',
                    category: 'Office Expenses',
                    confidence: 0.9,
                },
            ],
        };

        const mockResponse = {
            success: true,
            data: {
                issues: [
                    {
                        type: 'uncategorized',
                        transaction_ids: ['tx-2'],
                        confidence: 0.9,
                        description: 'Uncategorized Transaction',
                        suggested_fix: 'Categorize as Office Expenses',
                    },
                ],
                proposed_rules: [
                    {
                        pattern: 'Office Supplies',
                        category: 'Office Expenses',
                        confidence: 0.9,
                        impact_transactions: 2,
                    },
                ],
                journal_entries: [
                    {
                        date: '2024-01-16',
                        description: 'Reclassify uncategorized transaction',
                        debits: [
                            { account: 'Office Expenses', amount: 75.00 },
                        ],
                        credits: [
                            { account: 'Uncategorized', amount: 75.00 },
                        ],
                        impact: 75.00,
                    },
                ],
                total_impact: 75.00,
                confidence_score: 0.85,
            },
            metadata: {
                agent: 'audit-push',
                timestamp: '2024-01-20T00:00:00.000Z',
                processing_time_ms: 200,
                token_usage: {
                    prompt_tokens: 200,
                    completion_tokens: 100,
                    total_tokens: 300,
                },
            },
        };

        it('should process valid request successfully', async () => {
            // Setup mocks
            mockInputSchema.parse.mockReturnValue(validInput);
            mockOpenAI.prunePayload.mockReturnValue(validInput);
            mockOpenAI.callWithJSONMode.mockResolvedValue(mockResponse);

            // Create request
            const request = new NextRequest('http://localhost:3000/api/ai/audit-push', {
                method: 'POST',
                body: JSON.stringify(validInput),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            // Call the handler
            const response = await POST(request);
            const responseData = await response.json();

            // Assertions
            expect(response.status).toBe(200);
            expect(responseData).toEqual(mockResponse);
            expect(mockInputSchema.parse).toHaveBeenCalledWith(validInput);
            expect(mockOpenAI.prunePayload).toHaveBeenCalledWith(validInput);
            expect(mockOpenAI.callWithJSONMode).toHaveBeenCalled();
        });

        it('should handle invalid input schema', async () => {
            const invalidInput = { invalid: 'data' };
            const schemaError = new Error('Invalid input schema');
            mockInputSchema.parse.mockImplementation(() => {
                throw schemaError;
            });

            const request = new NextRequest('http://localhost:3000/api/ai/audit-push', {
                method: 'POST',
                body: JSON.stringify(invalidInput),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const response = await POST(request);
            const responseData = await response.json();

            expect(response.status).toBe(400);
            expect(responseData.success).toBe(false);
            expect(responseData.error).toBe('Invalid input schema');
            expect(mockLogger.error).toHaveBeenCalledWith('Audit & Push API Error:', schemaError);
        });

        it('should handle OpenAI API errors', async () => {
            mockInputSchema.parse.mockReturnValue(validInput);
            mockOpenAI.prunePayload.mockReturnValue(validInput);
            mockOpenAI.callWithJSONMode.mockRejectedValue(new Error('OpenAI API Error'));

            const request = new NextRequest('http://localhost:3000/api/ai/audit-push', {
                method: 'POST',
                body: JSON.stringify(validInput),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const response = await POST(request);
            const responseData = await response.json();

            expect(response.status).toBe(400);
            expect(responseData.success).toBe(false);
            expect(responseData.error).toBe('OpenAI API Error');
            expect(mockLogger.error).toHaveBeenCalledWith('Audit & Push API Error:', expect.any(Error));
        });

        it('should handle unknown errors', async () => {
            mockInputSchema.parse.mockReturnValue(validInput);
            mockOpenAI.prunePayload.mockReturnValue(validInput);
            mockOpenAI.callWithJSONMode.mockRejectedValue('Unknown error');

            const request = new NextRequest('http://localhost:3000/api/ai/audit-push', {
                method: 'POST',
                body: JSON.stringify(validInput),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const response = await POST(request);
            const responseData = await response.json();

            expect(response.status).toBe(500);
            expect(responseData.error).toBe('Internal server error');
        });

        it('should handle missing API key', async () => {
            // Remove API key
            delete process.env.OPENAI_API_KEY;

            // Re-import the module to trigger the error
            jest.resetModules();

            // This should throw an error during module loading
            expect(() => {
                require('../ai/audit-push/route');
            }).toThrow('OPENAI_API_KEY environment variable is not set');
        });

        it('should create proper user prompt with transaction data', async () => {
            mockInputSchema.parse.mockReturnValue(validInput);
            mockOpenAI.prunePayload.mockReturnValue(validInput);
            mockOpenAI.callWithJSONMode.mockResolvedValue(mockResponse);

            const request = new NextRequest('http://localhost:3000/api/ai/audit-push', {
                method: 'POST',
                body: JSON.stringify(validInput),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            await POST(request);

            expect(mockOpenAI.callWithJSONMode).toHaveBeenCalledWith(
                'audit-push',
                expect.stringContaining('You are an expert accounting auditor'),
                expect.stringContaining('Office Supplies'),
                expect.any(Object),
                validInput
            );
        });

        it('should handle empty transactions array', async () => {
            const inputWithEmptyTransactions = {
                ...validInput,
                transactions: [],
            };

            mockInputSchema.parse.mockReturnValue(inputWithEmptyTransactions);
            mockOpenAI.prunePayload.mockReturnValue(inputWithEmptyTransactions);
            mockOpenAI.callWithJSONMode.mockResolvedValue(mockResponse);

            const request = new NextRequest('http://localhost:3000/api/ai/audit-push', {
                method: 'POST',
                body: JSON.stringify(inputWithEmptyTransactions),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            await POST(request);

            expect(mockOpenAI.callWithJSONMode).toHaveBeenCalled();
        });

        it('should handle empty existing rules', async () => {
            const inputWithEmptyRules = {
                ...validInput,
                existing_rules: [],
            };

            mockInputSchema.parse.mockReturnValue(inputWithEmptyRules);
            mockOpenAI.prunePayload.mockReturnValue(inputWithEmptyRules);
            mockOpenAI.callWithJSONMode.mockResolvedValue(mockResponse);

            const request = new NextRequest('http://localhost:3000/api/ai/audit-push', {
                method: 'POST',
                body: JSON.stringify(inputWithEmptyRules),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            await POST(request);

            expect(mockOpenAI.callWithJSONMode).toHaveBeenCalled();
        });

        it('should handle large transaction datasets', async () => {
            const largeInput = {
                ...validInput,
                transactions: Array.from({ length: 1000 }, (_, i) => ({
                    id: `tx-${i}`,
                    date: '2024-01-15',
                    description: `Transaction ${i}`,
                    amount: 100.00,
                    category: i % 2 === 0 ? 'Revenue' : '',
                    account: 'Checking',
                    type: 'expense',
                    materiality_score: 0.5,
                })),
            };

            mockInputSchema.parse.mockReturnValue(largeInput);
            mockOpenAI.prunePayload.mockReturnValue(largeInput);
            mockOpenAI.callWithJSONMode.mockResolvedValue(mockResponse);

            const request = new NextRequest('http://localhost:3000/api/ai/audit-push', {
                method: 'POST',
                body: JSON.stringify(largeInput),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            await POST(request);

            expect(mockOpenAI.prunePayload).toHaveBeenCalledWith(largeInput);
            expect(mockOpenAI.callWithJSONMode).toHaveBeenCalled();
        });

        it('should handle malformed JSON in request body', async () => {
            const request = new NextRequest('http://localhost:3000/api/ai/audit-push', {
                method: 'POST',
                body: 'invalid json',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const response = await POST(request);
            const responseData = await response.json();

            expect(response.status).toBe(400);
            expect(responseData.success).toBe(false);
            expect(responseData.error).toContain('Unexpected token');
        });

        it('should handle missing Content-Type header', async () => {
            const request = new NextRequest('http://localhost:3000/api/ai/audit-push', {
                method: 'POST',
                body: JSON.stringify(validInput),
            });

            const response = await POST(request);
            const responseData = await response.json();

            // Should still work as NextRequest handles JSON parsing
            expect(response.status).toBe(200);
        });
    });
});