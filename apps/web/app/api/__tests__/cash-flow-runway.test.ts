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
    CashFlowRunwayInputSchema: {
        parse: jest.fn(),
    },
    CashFlowRunwayResponseSchema: {
        parse: jest.fn(),
    },
}));

// Mock environment variables
const originalEnv = process.env;

// Import the route after mocking
const { POST } = require('../ai/cash-flow-runway/route');

describe('/api/ai/cash-flow-runway', () => {
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
        const { createHedgiOpenAI, logger, CashFlowRunwayInputSchema } = require('@hedgi/ai');
        createHedgiOpenAI.mockReturnValue(mockOpenAI);
        Object.assign(logger, mockLogger);
        Object.assign(CashFlowRunwayInputSchema, mockInputSchema);
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('POST /api/ai/cash-flow-runway', () => {
        const validInput = {
            time_period: {
                start_date: '2024-01-01',
                end_date: '2024-01-31',
                months: 1,
            },
            cash_flows: [
                {
                    date: '2024-01-01',
                    type: 'inflow',
                    amount: 10000,
                    description: 'Revenue',
                    category: 'Sales',
                },
                {
                    date: '2024-01-15',
                    type: 'outflow',
                    amount: 5000,
                    description: 'Payroll',
                    category: 'Operating Expenses',
                },
                {
                    date: '2024-01-30',
                    type: 'outflow',
                    amount: 2000,
                    description: 'Rent',
                    category: 'Operating Expenses',
                },
            ],
            recurring_patterns: [
                {
                    type: 'monthly',
                    amount: 5000,
                    description: 'Payroll',
                    category: 'Operating Expenses',
                    confidence: 0.9,
                },
                {
                    type: 'monthly',
                    amount: 2000,
                    description: 'Rent',
                    category: 'Operating Expenses',
                    confidence: 0.95,
                },
            ],
            current_balance: 50000,
            projection_months: 6,
        };

        const mockResponse = {
            success: true,
            data: {
                cash_bridge: [
                    {
                        date: '2024-01-31',
                        opening_balance: 50000,
                        inflows: 10000,
                        outflows: 7000,
                        net_change: 3000,
                        closing_balance: 53000,
                    },
                    {
                        date: '2024-02-29',
                        opening_balance: 53000,
                        inflows: 10000,
                        outflows: 7000,
                        net_change: 3000,
                        closing_balance: 56000,
                    },
                ],
                burn_rate: {
                    monthly: 7000,
                    daily: 233,
                },
                runway_months: 7.1,
                runway_date: '2024-08-31',
                top_outflows: [
                    {
                        category: 'Operating Expenses',
                        amount: 7000,
                        percentage: 100,
                    },
                ],
                risk_factors: [
                    'Revenue volatility',
                    'Seasonal fluctuations',
                ],
                recommendations: [
                    'Monitor cash flow weekly',
                    'Build emergency fund',
                ],
            },
            metadata: {
                agent: 'cash-flow-runway',
                timestamp: '2024-01-20T00:00:00.000Z',
                processing_time_ms: 300,
                token_usage: {
                    prompt_tokens: 250,
                    completion_tokens: 120,
                    total_tokens: 370,
                },
            },
        };

        it('should process valid request successfully', async () => {
            // Setup mocks
            mockInputSchema.parse.mockReturnValue(validInput);
            mockOpenAI.prunePayload.mockReturnValue(validInput);
            mockOpenAI.callWithJSONMode.mockResolvedValue(mockResponse);

            // Create request
            const request = new NextRequest('http://localhost:3000/api/ai/cash-flow-runway', {
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

            const request = new NextRequest('http://localhost:3000/api/ai/cash-flow-runway', {
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
            expect(mockLogger.error).toHaveBeenCalledWith('Cash Flow Runway API Error:', schemaError);
        });

        it('should handle OpenAI API errors', async () => {
            mockInputSchema.parse.mockReturnValue(validInput);
            mockOpenAI.prunePayload.mockReturnValue(validInput);
            mockOpenAI.callWithJSONMode.mockRejectedValue(new Error('OpenAI API Error'));

            const request = new NextRequest('http://localhost:3000/api/ai/cash-flow-runway', {
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
            expect(mockLogger.error).toHaveBeenCalledWith('Cash Flow Runway API Error:', expect.any(Error));
        });

        it('should handle unknown errors', async () => {
            mockInputSchema.parse.mockReturnValue(validInput);
            mockOpenAI.prunePayload.mockReturnValue(validInput);
            mockOpenAI.callWithJSONMode.mockRejectedValue('Unknown error');

            const request = new NextRequest('http://localhost:3000/api/ai/cash-flow-runway', {
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
                require('../ai/cash-flow-runway/route');
            }).toThrow('OPENAI_API_KEY environment variable is not set');
        });

        it('should create proper user prompt with cash flow data', async () => {
            mockInputSchema.parse.mockReturnValue(validInput);
            mockOpenAI.prunePayload.mockReturnValue(validInput);
            mockOpenAI.callWithJSONMode.mockResolvedValue(mockResponse);

            const request = new NextRequest('http://localhost:3000/api/ai/cash-flow-runway', {
                method: 'POST',
                body: JSON.stringify(validInput),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            await POST(request);

            expect(mockOpenAI.callWithJSONMode).toHaveBeenCalledWith(
                'cash-flow-runway',
                expect.stringContaining('You are an expert financial analyst'),
                expect.stringContaining('Revenue'),
                expect.any(Object),
                validInput
            );
        });

        it('should handle empty cash flows array', async () => {
            const inputWithEmptyCashFlows = {
                ...validInput,
                cash_flows: [],
            };

            mockInputSchema.parse.mockReturnValue(inputWithEmptyCashFlows);
            mockOpenAI.prunePayload.mockReturnValue(inputWithEmptyCashFlows);
            mockOpenAI.callWithJSONMode.mockResolvedValue(mockResponse);

            const request = new NextRequest('http://localhost:3000/api/ai/cash-flow-runway', {
                method: 'POST',
                body: JSON.stringify(inputWithEmptyCashFlows),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            await POST(request);

            expect(mockOpenAI.callWithJSONMode).toHaveBeenCalled();
        });

        it('should handle empty recurring patterns', async () => {
            const inputWithEmptyPatterns = {
                ...validInput,
                recurring_patterns: [],
            };

            mockInputSchema.parse.mockReturnValue(inputWithEmptyPatterns);
            mockOpenAI.prunePayload.mockReturnValue(inputWithEmptyPatterns);
            mockOpenAI.callWithJSONMode.mockResolvedValue(mockResponse);

            const request = new NextRequest('http://localhost:3000/api/ai/cash-flow-runway', {
                method: 'POST',
                body: JSON.stringify(inputWithEmptyPatterns),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            await POST(request);

            expect(mockOpenAI.callWithJSONMode).toHaveBeenCalled();
        });

        it('should handle zero current balance', async () => {
            const inputWithZeroBalance = {
                ...validInput,
                current_balance: 0,
            };

            mockInputSchema.parse.mockReturnValue(inputWithZeroBalance);
            mockOpenAI.prunePayload.mockReturnValue(inputWithZeroBalance);
            mockOpenAI.callWithJSONMode.mockResolvedValue(mockResponse);

            const request = new NextRequest('http://localhost:3000/api/ai/cash-flow-runway', {
                method: 'POST',
                body: JSON.stringify(inputWithZeroBalance),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            await POST(request);

            expect(mockOpenAI.callWithJSONMode).toHaveBeenCalled();
        });

        it('should handle negative current balance', async () => {
            const inputWithNegativeBalance = {
                ...validInput,
                current_balance: -5000,
            };

            mockInputSchema.parse.mockReturnValue(inputWithNegativeBalance);
            mockOpenAI.prunePayload.mockReturnValue(inputWithNegativeBalance);
            mockOpenAI.callWithJSONMode.mockResolvedValue(mockResponse);

            const request = new NextRequest('http://localhost:3000/api/ai/cash-flow-runway', {
                method: 'POST',
                body: JSON.stringify(inputWithNegativeBalance),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            await POST(request);

            expect(mockOpenAI.callWithJSONMode).toHaveBeenCalled();
        });

        it('should handle large projection months', async () => {
            const inputWithLargeProjection = {
                ...validInput,
                projection_months: 24,
            };

            mockInputSchema.parse.mockReturnValue(inputWithLargeProjection);
            mockOpenAI.prunePayload.mockReturnValue(inputWithLargeProjection);
            mockOpenAI.callWithJSONMode.mockResolvedValue(mockResponse);

            const request = new NextRequest('http://localhost:3000/api/ai/cash-flow-runway', {
                method: 'POST',
                body: JSON.stringify(inputWithLargeProjection),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            await POST(request);

            expect(mockOpenAI.callWithJSONMode).toHaveBeenCalled();
        });

        it('should handle malformed JSON in request body', async () => {
            const request = new NextRequest('http://localhost:3000/api/ai/cash-flow-runway', {
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
            const request = new NextRequest('http://localhost:3000/api/ai/cash-flow-runway', {
                method: 'POST',
                body: JSON.stringify(validInput),
            });

            const response = await POST(request);
            const responseData = await response.json();

            // Should still work as NextRequest handles JSON parsing
            expect(response.status).toBe(200);
        });

        it('should handle complex recurring patterns', async () => {
            const inputWithComplexPatterns = {
                ...validInput,
                recurring_patterns: [
                    {
                        type: 'weekly',
                        amount: 1000,
                        description: 'Weekly payroll',
                        category: 'Operating Expenses',
                        confidence: 0.8,
                    },
                    {
                        type: 'quarterly',
                        amount: 5000,
                        description: 'Quarterly taxes',
                        category: 'Taxes',
                        confidence: 0.95,
                    },
                    {
                        type: 'annually',
                        amount: 10000,
                        description: 'Annual insurance',
                        category: 'Insurance',
                        confidence: 0.9,
                    },
                ],
            };

            mockInputSchema.parse.mockReturnValue(inputWithComplexPatterns);
            mockOpenAI.prunePayload.mockReturnValue(inputWithComplexPatterns);
            mockOpenAI.callWithJSONMode.mockResolvedValue(mockResponse);

            const request = new NextRequest('http://localhost:3000/api/ai/cash-flow-runway', {
                method: 'POST',
                body: JSON.stringify(inputWithComplexPatterns),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            await POST(request);

            expect(mockOpenAI.callWithJSONMode).toHaveBeenCalled();
        });
    });
});