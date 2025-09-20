import { NextRequest } from 'next/server';

// Mock the @hedgi/ai module before importing the route
const mockCreateHedgiOpenAI = jest.fn();
const mockRateLimiter = {
    isAllowed: jest.fn(),
    getRemainingRequests: jest.fn(),
    getResetTime: jest.fn(),
};
const mockLogger = {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
};
const mockPerformanceMonitor = {
    logRequest: jest.fn(),
    getHealthStatus: jest.fn(),
};
const mockInputSchema = {
    parse: jest.fn(),
};
const mockResponseSchema = {
    parse: jest.fn(),
};

// Use jest.doMock to ensure the mock is applied before the module is imported
jest.doMock('@hedgi/ai', () => ({
    createHedgiOpenAI: mockCreateHedgiOpenAI,
    defaultRateLimiter: mockRateLimiter,
    logger: mockLogger,
    performanceMonitor: mockPerformanceMonitor,
    SMBExplainerInputSchema: mockInputSchema,
    SMBExplainerResponseSchema: mockResponseSchema,
}));

// Mock environment variables
const originalEnv = process.env;

describe('/api/ai/smb-explainer', () => {
    let mockOpenAI: any;
    let POST: any;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();

        // Reset environment
        process.env = { ...originalEnv, OPENAI_API_KEY: 'test-api-key' };

        // Re-apply the mock after resetting modules
        jest.doMock('@hedgi/ai', () => ({
            createHedgiOpenAI: mockCreateHedgiOpenAI,
            defaultRateLimiter: mockRateLimiter,
            logger: mockLogger,
            performanceMonitor: mockPerformanceMonitor,
            SMBExplainerInputSchema: mockInputSchema,
            SMBExplainerResponseSchema: mockResponseSchema,
        }));

        // Re-import the route after mocking
        const routeModule = require('../ai/smb-explainer/route');
        POST = routeModule.POST;

        // Setup mocks
        mockOpenAI = {
            prunePayload: jest.fn(),
            callWithJSONMode: jest.fn(),
        };

        // Setup module mocks
        mockCreateHedgiOpenAI.mockReturnValue(mockOpenAI);
        mockRateLimiter.isAllowed.mockReturnValue(true);
        mockRateLimiter.getRemainingRequests.mockReturnValue(9);
        mockRateLimiter.getResetTime.mockReturnValue(Date.now() + 60000);

        // Default mock for successful OpenAI response
        const mockResponseData = {
            summary: 'Test summary',
            key_insights: ['Insight 1'],
            recommendations: ['Recommendation 1'],
            financial_health_score: 85,
        };
        const mockMetadata = {
            agent: 'smb-explainer',
            timestamp: new Date().toISOString(),
            processing_time_ms: 100,
            token_usage: {
                prompt_tokens: 100,
                completion_tokens: 50,
                total_tokens: 150,
            },
        };
        const mockResponse = {
            success: true,
            data: mockResponseData,
            metadata: mockMetadata,
        };

        mockOpenAI.callWithJSONMode.mockResolvedValue(mockResponse);
        mockResponseSchema.parse.mockReturnValue(mockResponse);

        // Default mock for input schema parsing
        mockInputSchema.parse.mockImplementation((input) => input);
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('POST /api/ai/smb-explainer', () => {
        const validInput = {
            business_name: 'Test Business',
            month: 'January',
            year: 2024,
            rollups: {
                total_income: 10000,
                total_expenses: 8000,
                net_income: 2000,
                top_categories: [
                    {
                        category: 'Revenue',
                        amount: 10000,
                        percentage: 100,
                    },
                ],
            },
            exemplar_transactions: [
                {
                    id: 'tx-1',
                    date: '2024-01-15',
                    description: 'Test transaction',
                    amount: 1000,
                    category: 'Revenue',
                    account: 'Checking',
                    type: 'income',
                    materiality_score: 0.9,
                },
            ],
            previous_month_comparison: {
                income_change: 10,
                expense_change: 5,
                net_change: 15,
            },
        };

        const mockResponse = {
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
        };

        it('should process valid request successfully', async () => {
            // Setup mocks
            mockInputSchema.parse.mockReturnValue(validInput);
            mockRateLimiter.isAllowed.mockReturnValue(true);
            mockOpenAI.prunePayload.mockReturnValue(validInput);
            mockOpenAI.callWithJSONMode.mockResolvedValue(mockResponse);

            // Create request
            const request = new NextRequest('http://localhost:3000/api/ai/smb-explainer', {
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
            expect(mockRateLimiter.isAllowed).toHaveBeenCalled();
            expect(mockInputSchema.parse).toHaveBeenCalledWith(validInput);
            expect(mockOpenAI.prunePayload).toHaveBeenCalledWith(validInput);
            expect(mockOpenAI.callWithJSONMode).toHaveBeenCalled();
        });

        it('should handle rate limiting', async () => {
            mockRateLimiter.isAllowed.mockReturnValue(false);
            mockRateLimiter.getRemainingRequests.mockReturnValue(0);
            mockRateLimiter.getResetTime.mockReturnValue(Date.now() + 60000);

            const request = new NextRequest('http://localhost:3000/api/ai/smb-explainer', {
                method: 'POST',
                body: JSON.stringify(validInput),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const response = await POST(request);
            const responseData = await response.json();

            expect(response.status).toBe(429);
            expect(responseData.success).toBe(false);
            expect(responseData.error).toBe('Rate limit exceeded. Please try again later.');
            expect(mockRateLimiter.isAllowed).toHaveBeenCalled();
        });

        it('should handle invalid input schema', async () => {
            const invalidInput = { invalid: 'data' };
            const schemaError = new Error('Invalid input schema');
            mockInputSchema.parse.mockImplementation(() => {
                throw schemaError;
            });
            mockRateLimiter.isAllowed.mockReturnValue(true);

            const request = new NextRequest('http://localhost:3000/api/ai/smb-explainer', {
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
            expect(mockLogger.error).toHaveBeenCalledWith('SMB Explainer API Error:', schemaError);
        });

        it('should handle OpenAI API errors', async () => {
            mockInputSchema.parse.mockReturnValue(validInput);
            mockRateLimiter.isAllowed.mockReturnValue(true);
            mockOpenAI.prunePayload.mockReturnValue(validInput);
            mockOpenAI.callWithJSONMode.mockRejectedValue(new Error('OpenAI API Error'));

            const request = new NextRequest('http://localhost:3000/api/ai/smb-explainer', {
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
            expect(mockLogger.error).toHaveBeenCalledWith('SMB Explainer API Error:', expect.any(Error));
        });

        it('should handle unknown errors', async () => {
            mockInputSchema.parse.mockReturnValue(validInput);
            mockRateLimiter.isAllowed.mockReturnValue(true);
            mockOpenAI.prunePayload.mockReturnValue(validInput);
            mockOpenAI.callWithJSONMode.mockRejectedValue('Unknown error');

            const request = new NextRequest('http://localhost:3000/api/ai/smb-explainer', {
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

        it('should log performance metrics on success', async () => {
            mockInputSchema.parse.mockReturnValue(validInput);
            mockRateLimiter.isAllowed.mockReturnValue(true);
            mockOpenAI.prunePayload.mockReturnValue(validInput);
            mockOpenAI.callWithJSONMode.mockResolvedValue(mockResponse);

            const request = new NextRequest('http://localhost:3000/api/ai/smb-explainer', {
                method: 'POST',
                body: JSON.stringify(validInput),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            await POST(request);

            expect(mockPerformanceMonitor.logRequest).toHaveBeenCalledWith(
                'smb-explainer',
                expect.any(Number),
                true,
                undefined
            );
        });

        it('should log performance metrics on error', async () => {
            const schemaError = new Error('Schema validation error');
            mockInputSchema.parse.mockImplementation(() => {
                throw schemaError;
            });
            mockRateLimiter.isAllowed.mockReturnValue(true);

            const request = new NextRequest('http://localhost:3000/api/ai/smb-explainer', {
                method: 'POST',
                body: JSON.stringify({ invalid: 'data' }),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            await POST(request);

            expect(mockPerformanceMonitor.logRequest).toHaveBeenCalledWith(
                'smb-explainer',
                expect.any(Number),
                false,
                'Schema validation error'
            );
        });

        it('should handle client IP from x-forwarded-for header', async () => {
            mockInputSchema.parse.mockReturnValue(validInput);
            mockRateLimiter.isAllowed.mockReturnValue(true);
            mockOpenAI.prunePayload.mockReturnValue(validInput);
            mockOpenAI.callWithJSONMode.mockResolvedValue(mockResponse);

            const request = new NextRequest('http://localhost:3000/api/ai/smb-explainer', {
                method: 'POST',
                body: JSON.stringify(validInput),
                headers: {
                    'Content-Type': 'application/json',
                    'x-forwarded-for': '192.168.1.1',
                },
            });

            await POST(request);

            expect(mockRateLimiter.isAllowed).toHaveBeenCalledWith('192.168.1.1');
        });

        it('should handle unknown client IP', async () => {
            mockInputSchema.parse.mockReturnValue(validInput);
            mockRateLimiter.isAllowed.mockReturnValue(true);
            mockOpenAI.prunePayload.mockReturnValue(validInput);
            mockOpenAI.callWithJSONMode.mockResolvedValue(mockResponse);

            const request = new NextRequest('http://localhost:3000/api/ai/smb-explainer', {
                method: 'POST',
                body: JSON.stringify(validInput),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            await POST(request);

            expect(mockRateLimiter.isAllowed).toHaveBeenCalledWith('unknown');
        });

        it('should create proper user prompt with formatted data', async () => {
            mockInputSchema.parse.mockReturnValue(validInput);
            mockRateLimiter.isAllowed.mockReturnValue(true);
            mockOpenAI.prunePayload.mockReturnValue(validInput);
            mockOpenAI.callWithJSONMode.mockResolvedValue(mockResponse);

            const request = new NextRequest('http://localhost:3000/api/ai/smb-explainer', {
                method: 'POST',
                body: JSON.stringify(validInput),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            await POST(request);

            expect(mockOpenAI.callWithJSONMode).toHaveBeenCalledWith(
                'smb-explainer',
                expect.stringContaining('You are an expert financial analyst'),
                expect.stringContaining('Test Business'),
                expect.any(Object),
                validInput
            );
        });

        it('should handle empty exemplar transactions', async () => {
            const inputWithEmptyTransactions = {
                ...validInput,
                exemplar_transactions: [],
            };

            mockInputSchema.parse.mockReturnValue(inputWithEmptyTransactions);
            mockRateLimiter.isAllowed.mockReturnValue(true);
            mockOpenAI.prunePayload.mockReturnValue(inputWithEmptyTransactions);
            mockOpenAI.callWithJSONMode.mockResolvedValue(mockResponse);

            const request = new NextRequest('http://localhost:3000/api/ai/smb-explainer', {
                method: 'POST',
                body: JSON.stringify(inputWithEmptyTransactions),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            await POST(request);

            expect(mockOpenAI.callWithJSONMode).toHaveBeenCalled();
        });

        it('should handle empty top categories', async () => {
            const inputWithEmptyCategories = {
                ...validInput,
                rollups: {
                    ...validInput.rollups,
                    top_categories: [],
                },
            };

            mockInputSchema.parse.mockReturnValue(inputWithEmptyCategories);
            mockRateLimiter.isAllowed.mockReturnValue(true);
            mockOpenAI.prunePayload.mockReturnValue(inputWithEmptyCategories);
            mockOpenAI.callWithJSONMode.mockResolvedValue(mockResponse);

            const request = new NextRequest('http://localhost:3000/api/ai/smb-explainer', {
                method: 'POST',
                body: JSON.stringify(inputWithEmptyCategories),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            await POST(request);

            expect(mockOpenAI.callWithJSONMode).toHaveBeenCalled();
        });
    });
});