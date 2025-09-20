import { NextRequest } from 'next/server';

// Mock the @hedgi/ai module before importing the route
jest.mock('@hedgi/ai', () => ({
    performanceMonitor: {
        getHealthStatus: jest.fn(),
    },
    defaultRateLimiter: {
        getRemainingRequests: jest.fn(),
        getResetTime: jest.fn(),
    },
}));

// Import the route after mocking
const { GET } = require('../health/route');

describe('/api/health', () => {
    let mockPerformanceMonitor: any;
    let mockRateLimiter: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup mocks
        mockPerformanceMonitor = {
            getHealthStatus: jest.fn(),
        };

        mockRateLimiter = {
            getRemainingRequests: jest.fn(),
            getResetTime: jest.fn(),
        };

        // Setup module mocks
        const { performanceMonitor, defaultRateLimiter } = require('@hedgi/ai');
        Object.assign(performanceMonitor, mockPerformanceMonitor);
        Object.assign(defaultRateLimiter, mockRateLimiter);

        // Mock process.uptime and process.memoryUsage for consistent test results
        jest.spyOn(process, 'uptime').mockReturnValue(12345);
        jest.spyOn(process, 'memoryUsage').mockReturnValue({
            rss: 100000000,
            heapTotal: 50000000,
            heapUsed: 25000000,
            external: 0,
            arrayBuffers: 0,
        });

        mockPerformanceMonitor.getHealthStatus.mockReturnValue({
            status: 'healthy',
            message: 'All systems operational',
            metrics: {
                totalRequests: 100,
                totalErrors: 0,
                errorRate: 0,
                averageResponseTime: 150,
                agents: {},
            },
        });

        mockRateLimiter.getRemainingRequests.mockReturnValue(9);
        mockRateLimiter.getResetTime.mockReturnValue(Date.now() + 60000); // 1 minute from now
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should return a successful health status', async () => {
        const request = new NextRequest('http://localhost/api/health');
        const response = await GET(request);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.status).toBe('ok');
        expect(body.performance.status).toBe('healthy');
        expect(body.rateLimit.remaining).toBe(9);
        expect(body.environment.nodeVersion).toBe(process.version);
        expect(body.environment.memory.used).toBe(24); // 25000000 bytes / 1024 / 1024
    });

    it('should handle errors gracefully', async () => {
        mockPerformanceMonitor.getHealthStatus.mockImplementation(() => {
            throw new Error('Performance monitor failed');
        });

        const request = new NextRequest('http://localhost/api/health');
        const response = await GET(request);
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body.status).toBe('error');
        expect(body.error).toBe('Performance monitor failed');
    });

    it('should correctly parse client IP from x-forwarded-for header', async () => {
        const request = new NextRequest('http://localhost/api/health', {
            headers: {
                'x-forwarded-for': '192.168.1.100',
            },
        });
        await GET(request);
        expect(mockRateLimiter.getRemainingRequests).toHaveBeenCalledWith('192.168.1.100');
    });

    it('should use "unknown" if no IP headers are present', async () => {
        const request = new NextRequest('http://localhost/api/health');
        await GET(request);
        expect(mockRateLimiter.getRemainingRequests).toHaveBeenCalledWith('unknown');
    });
});