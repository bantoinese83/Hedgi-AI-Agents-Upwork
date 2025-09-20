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
    SavingsFinderInputSchema: {
        parse: jest.fn(),
    },
    SavingsFinderResponseSchema: {
        parse: jest.fn(),
    },
}));

// Mock environment variables
const originalEnv = process.env;

// Import the route after mocking
const { POST } = require('../ai/savings-finder/route');

describe('/api/savings-finder', () => {
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
        const { createHedgiOpenAI, logger, SavingsFinderInputSchema } = require('@hedgi/ai');
        createHedgiOpenAI.mockReturnValue(mockOpenAI);
        Object.assign(logger, mockLogger);
        Object.assign(SavingsFinderInputSchema, mockInputSchema);
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('POST /api/savings-finder', () => {
        const validInput = {
            subscriptions: [
                {
                    id: 'sub-1',
                    name: 'Adobe Creative Cloud',
                    cost: 52.99,
                    billing_cycle: 'monthly',
                    category: 'Software',
                    status: 'active',
                    start_date: '2024-01-01',
                    renewal_date: '2024-02-01',
                },
                {
                    id: 'sub-2',
                    name: 'Adobe Creative Cloud',
                    cost: 52.99,
                    billing_cycle: 'monthly',
                    category: 'Software',
                    status: 'active',
                    start_date: '2024-01-15',
                    renewal_date: '2024-02-15',
                },
                {
                    id: 'sub-3',
                    name: 'Netflix',
                    cost: 15.99,
                    billing_cycle: 'monthly',
                    category: 'Entertainment',
                    status: 'active',
                    start_date: '2023-12-01',
                    renewal_date: '2024-01-01',
                },
            ],
            historical_pricing: [
                {
                    subscription_id: 'sub-1',
                    date: '2024-01-01',
                    price: 52.99,
                    change_percentage: 0,
                },
                {
                    subscription_id: 'sub-2',
                    date: '2024-01-15',
                    price: 52.99,
                    change_percentage: 0,
                },
            ],
            usage_data: [
                {
                    subscription_id: 'sub-1',
                    usage_percentage: 80,
                    last_used: '2024-01-20',
                    features_used: ['Photoshop', 'Illustrator'],
                },
                {
                    subscription_id: 'sub-2',
                    usage_percentage: 20,
                    last_used: '2024-01-10',
                    features_used: ['Photoshop'],
                },
                {
                    subscription_id: 'sub-3',
                    usage_percentage: 95,
                    last_used: '2024-01-20',
                    features_used: ['Streaming'],
                },
            ],
        };

        const mockResponse = {
            success: true,
            data: {
                flagged_subscriptions: [
                    {
                        subscription_id: 'sub-2',
                        issue_type: 'duplicate',
                        current_cost: 52.99,
                        potential_savings: 52.99,
                        recommendation: 'Cancel duplicate Adobe Creative Cloud subscription',
                        confidence: 0.95,
                    },
                    {
                        subscription_id: 'sub-1',
                        issue_type: 'underutilized',
                        current_cost: 52.99,
                        potential_savings: 26.50,
                        recommendation: 'Consider downgrading to single-user plan',
                        confidence: 0.8,
                    },
                ],
                total_potential_savings: 79.49,
                monthly_savings: 79.49,
                annual_savings: 953.88,
                action_items: [
                    'Cancel duplicate Adobe Creative Cloud subscription',
                    'Review Adobe Creative Cloud usage and consider downgrading',
                    'Monitor Netflix usage for potential optimization',
                ],
            },
            metadata: {
                agent: 'savings-finder',
                timestamp: '2024-01-20T00:00:00.000Z',
                processing_time_ms: 250,
                token_usage: {
                    prompt_tokens: 200,
                    completion_tokens: 150,
                    total_tokens: 350,
                },
            },
        };

        it('should process valid request successfully', async () => {
            // Setup mocks
            mockInputSchema.parse.mockReturnValue(validInput);
            mockOpenAI.prunePayload.mockReturnValue(validInput);
            mockOpenAI.callWithJSONMode.mockResolvedValue(mockResponse);

            // Create request
            const request = new NextRequest('http://localhost:3000/api/savings-finder', {
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

            const request = new NextRequest('http://localhost:3000/api/savings-finder', {
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
            expect(mockLogger.error).toHaveBeenCalledWith('Savings Finder API Error:', schemaError);
        });

        it('should handle OpenAI API errors', async () => {
            mockInputSchema.parse.mockReturnValue(validInput);
            mockOpenAI.prunePayload.mockReturnValue(validInput);
            mockOpenAI.callWithJSONMode.mockRejectedValue(new Error('OpenAI API Error'));

            const request = new NextRequest('http://localhost:3000/api/savings-finder', {
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
            expect(mockLogger.error).toHaveBeenCalledWith('Savings Finder API Error:', expect.any(Error));
        });

        it('should handle unknown errors', async () => {
            mockInputSchema.parse.mockReturnValue(validInput);
            mockOpenAI.prunePayload.mockReturnValue(validInput);
            mockOpenAI.callWithJSONMode.mockRejectedValue('Unknown error');

            const request = new NextRequest('http://localhost:3000/api/savings-finder', {
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
                require('../savings-finder/route');
            }).toThrow('OPENAI_API_KEY environment variable is not set');
        });

        it('should create proper user prompt with subscription data', async () => {
            mockInputSchema.parse.mockReturnValue(validInput);
            mockOpenAI.prunePayload.mockReturnValue(validInput);
            mockOpenAI.callWithJSONMode.mockResolvedValue(mockResponse);

            const request = new NextRequest('http://localhost:3000/api/savings-finder', {
                method: 'POST',
                body: JSON.stringify(validInput),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            await POST(request);

            expect(mockOpenAI.callWithJSONMode).toHaveBeenCalledWith(
                'savings-finder',
                expect.stringContaining('You are an expert financial analyst'),
                expect.stringContaining('Adobe Creative Cloud'),
                expect.any(Object),
                validInput
            );
        });

        it('should handle empty subscriptions array', async () => {
            const inputWithEmptySubscriptions = {
                ...validInput,
                subscriptions: [],
            };

            mockInputSchema.parse.mockReturnValue(inputWithEmptySubscriptions);
            mockOpenAI.prunePayload.mockReturnValue(inputWithEmptySubscriptions);
            mockOpenAI.callWithJSONMode.mockResolvedValue(mockResponse);

            const request = new NextRequest('http://localhost:3000/api/savings-finder', {
                method: 'POST',
                body: JSON.stringify(inputWithEmptySubscriptions),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            await POST(request);

            expect(mockOpenAI.callWithJSONMode).toHaveBeenCalled();
        });

        it('should handle empty historical pricing', async () => {
            const inputWithEmptyPricing = {
                ...validInput,
                historical_pricing: [],
            };

            mockInputSchema.parse.mockReturnValue(inputWithEmptyPricing);
            mockOpenAI.prunePayload.mockReturnValue(inputWithEmptyPricing);
            mockOpenAI.callWithJSONMode.mockResolvedValue(mockResponse);

            const request = new NextRequest('http://localhost:3000/api/savings-finder', {
                method: 'POST',
                body: JSON.stringify(inputWithEmptyPricing),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            await POST(request);

            expect(mockOpenAI.callWithJSONMode).toHaveBeenCalled();
        });

        it('should handle empty usage data', async () => {
            const inputWithEmptyUsage = {
                ...validInput,
                usage_data: [],
            };

            mockInputSchema.parse.mockReturnValue(inputWithEmptyUsage);
            mockOpenAI.prunePayload.mockReturnValue(inputWithEmptyUsage);
            mockOpenAI.callWithJSONMode.mockResolvedValue(mockResponse);

            const request = new NextRequest('http://localhost:3000/api/savings-finder', {
                method: 'POST',
                body: JSON.stringify(inputWithEmptyUsage),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            await POST(request);

            expect(mockOpenAI.callWithJSONMode).toHaveBeenCalled();
        });

        it('should handle large subscription datasets', async () => {
            const largeInput = {
                ...validInput,
                subscriptions: Array.from({ length: 100 }, (_, i) => ({
                    id: `sub-${i}`,
                    name: `Service ${i}`,
                    cost: 10 + (i % 50),
                    billing_cycle: i % 2 === 0 ? 'monthly' : 'yearly',
                    category: ['Software', 'Entertainment', 'Productivity'][i % 3],
                    status: 'active',
                    start_date: '2024-01-01',
                    renewal_date: '2024-02-01',
                })),
            };

            mockInputSchema.parse.mockReturnValue(largeInput);
            mockOpenAI.prunePayload.mockReturnValue(largeInput);
            mockOpenAI.callWithJSONMode.mockResolvedValue(mockResponse);

            const request = new NextRequest('http://localhost:3000/api/savings-finder', {
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
            const request = new NextRequest('http://localhost:3000/api/savings-finder', {
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
            const request = new NextRequest('http://localhost:3000/api/savings-finder', {
                method: 'POST',
                body: JSON.stringify(validInput),
            });

            const response = await POST(request);
            const responseData = await response.json();

            // Should still work as NextRequest handles JSON parsing
            expect(response.status).toBe(200);
        });

        it('should handle subscriptions with different billing cycles', async () => {
            const inputWithMixedBilling = {
                ...validInput,
                subscriptions: [
                    {
                        id: 'sub-monthly',
                        name: 'Monthly Service',
                        cost: 10,
                        billing_cycle: 'monthly',
                        category: 'Software',
                        status: 'active',
                        start_date: '2024-01-01',
                        renewal_date: '2024-02-01',
                    },
                    {
                        id: 'sub-yearly',
                        name: 'Yearly Service',
                        cost: 100,
                        billing_cycle: 'yearly',
                        category: 'Software',
                        status: 'active',
                        start_date: '2024-01-01',
                        renewal_date: '2025-01-01',
                    },
                    {
                        id: 'sub-weekly',
                        name: 'Weekly Service',
                        cost: 5,
                        billing_cycle: 'weekly',
                        category: 'Software',
                        status: 'active',
                        start_date: '2024-01-01',
                        renewal_date: '2024-01-08',
                    },
                ],
            };

            mockInputSchema.parse.mockReturnValue(inputWithMixedBilling);
            mockOpenAI.prunePayload.mockReturnValue(inputWithMixedBilling);
            mockOpenAI.callWithJSONMode.mockResolvedValue(mockResponse);

            const request = new NextRequest('http://localhost:3000/api/savings-finder', {
                method: 'POST',
                body: JSON.stringify(inputWithMixedBilling),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            await POST(request);

            expect(mockOpenAI.callWithJSONMode).toHaveBeenCalled();
        });

        it('should handle subscriptions with different statuses', async () => {
            const inputWithMixedStatuses = {
                ...validInput,
                subscriptions: [
                    {
                        id: 'sub-active',
                        name: 'Active Service',
                        cost: 10,
                        billing_cycle: 'monthly',
                        category: 'Software',
                        status: 'active',
                        start_date: '2024-01-01',
                        renewal_date: '2024-02-01',
                    },
                    {
                        id: 'sub-cancelled',
                        name: 'Cancelled Service',
                        cost: 20,
                        billing_cycle: 'monthly',
                        category: 'Software',
                        status: 'cancelled',
                        start_date: '2024-01-01',
                        renewal_date: '2024-02-01',
                    },
                    {
                        id: 'sub-paused',
                        name: 'Paused Service',
                        cost: 15,
                        billing_cycle: 'monthly',
                        category: 'Software',
                        status: 'paused',
                        start_date: '2024-01-01',
                        renewal_date: '2024-02-01',
                    },
                ],
            };

            mockInputSchema.parse.mockReturnValue(inputWithMixedStatuses);
            mockOpenAI.prunePayload.mockReturnValue(inputWithMixedStatuses);
            mockOpenAI.callWithJSONMode.mockResolvedValue(mockResponse);

            const request = new NextRequest('http://localhost:3000/api/savings-finder', {
                method: 'POST',
                body: JSON.stringify(inputWithMixedStatuses),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            await POST(request);

            expect(mockOpenAI.callWithJSONMode).toHaveBeenCalled();
        });
    });
});