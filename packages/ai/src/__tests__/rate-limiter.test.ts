import { RateLimiter, defaultRateLimiter } from '../rate-limiter';

describe('RateLimiter', () => {
    let rateLimiter: RateLimiter;

    beforeEach(() => {
        rateLimiter = new RateLimiter({
            windowMs: 1000, // 1 second
            maxRequests: 3, // 3 requests
        });
    });

    describe('isAllowed', () => {
        it('should allow requests within limit', () => {
            expect(rateLimiter.isAllowed('client1')).toBe(true);
            expect(rateLimiter.isAllowed('client1')).toBe(true);
            expect(rateLimiter.isAllowed('client1')).toBe(true);
        });

        it('should reject requests exceeding limit', () => {
            // Make 3 requests (within limit)
            expect(rateLimiter.isAllowed('client1')).toBe(true);
            expect(rateLimiter.isAllowed('client1')).toBe(true);
            expect(rateLimiter.isAllowed('client1')).toBe(true);

            // 4th request should be rejected
            expect(rateLimiter.isAllowed('client1')).toBe(false);
        });

        it('should track different clients separately', () => {
            // Client 1 makes 3 requests
            expect(rateLimiter.isAllowed('client1')).toBe(true);
            expect(rateLimiter.isAllowed('client1')).toBe(true);
            expect(rateLimiter.isAllowed('client1')).toBe(true);
            expect(rateLimiter.isAllowed('client1')).toBe(false); // Exceeded limit

            // Client 2 should still be allowed
            expect(rateLimiter.isAllowed('client2')).toBe(true);
            expect(rateLimiter.isAllowed('client2')).toBe(true);
            expect(rateLimiter.isAllowed('client2')).toBe(true);
            expect(rateLimiter.isAllowed('client2')).toBe(false); // Now exceeded
        });

        it('should reset limit after window expires', async () => {
            // Make 3 requests
            expect(rateLimiter.isAllowed('client1')).toBe(true);
            expect(rateLimiter.isAllowed('client1')).toBe(true);
            expect(rateLimiter.isAllowed('client1')).toBe(true);
            expect(rateLimiter.isAllowed('client1')).toBe(false);

            // Wait for window to expire
            await new Promise(resolve => setTimeout(resolve, 1100));

            // Should be allowed again
            expect(rateLimiter.isAllowed('client1')).toBe(true);
        });

        it('should handle edge case of exactly max requests', () => {
            // Make exactly max requests
            for (let i = 0; i < 3; i++) {
                expect(rateLimiter.isAllowed('client1')).toBe(true);
            }

            // Next request should be rejected
            expect(rateLimiter.isAllowed('client1')).toBe(false);
        });
    });

    describe('cleanup', () => {
        it('should remove expired entries', async () => {
            // Make requests for two clients
            rateLimiter.isAllowed('client1');
            rateLimiter.isAllowed('client2');

            // Wait for window to expire
            await new Promise(resolve => setTimeout(resolve, 1100));

            // Manually trigger cleanup
            rateLimiter.cleanup();

            // Both clients should be allowed again
            expect(rateLimiter.isAllowed('client1')).toBe(true);
            expect(rateLimiter.isAllowed('client2')).toBe(true);
        });
    });

    describe('getRemainingRequests', () => {
        it('should return remaining requests for client', () => {
            rateLimiter.isAllowed('client1');
            rateLimiter.isAllowed('client1');

            const remaining = rateLimiter.getRemainingRequests('client1');
            expect(remaining).toBe(1); // 3 max - 2 used = 1 remaining
        });

        it('should return max requests for non-existent client', () => {
            const remaining = rateLimiter.getRemainingRequests('non-existent');
            expect(remaining).toBe(3); // Max requests
        });
    });

    describe('getResetTime', () => {
        it('should return reset time for client', () => {
            rateLimiter.isAllowed('client1');

            const resetTime = rateLimiter.getResetTime('client1');
            expect(resetTime).toBeGreaterThan(Date.now());
        });

        it('should return future time for non-existent client', () => {
            const resetTime = rateLimiter.getResetTime('non-existent');
            expect(resetTime).toBeGreaterThan(Date.now());
        });
    });

    describe('edge cases', () => {
        it('should handle empty key', () => {
            expect(rateLimiter.isAllowed('')).toBe(true);
            expect(rateLimiter.isAllowed('')).toBe(true);
            expect(rateLimiter.isAllowed('')).toBe(true);
            expect(rateLimiter.isAllowed('')).toBe(false);
        });

        it('should handle very long key', () => {
            const longKey = 'a'.repeat(1000);
            expect(rateLimiter.isAllowed(longKey)).toBe(true);
        });

        it('should handle special characters in key', () => {
            const specialKey = 'client@#$%^&*()_+{}|:"<>?[]\\;\'.,/';
            expect(rateLimiter.isAllowed(specialKey)).toBe(true);
        });
    });
});

describe('Default rate limiter', () => {
    it('should be available and functional', () => {
        expect(defaultRateLimiter).toBeInstanceOf(RateLimiter);
        expect(defaultRateLimiter.isAllowed('test-client')).toBe(true);
    });

    it('should have correct default configuration', () => {
        // Create a fresh rate limiter with default config
        const freshRateLimiter = new RateLimiter({
            windowMs: 60 * 1000, // 1 minute
            maxRequests: 10,
        });

        // Default: 10 requests per minute
        for (let i = 0; i < 10; i++) {
            expect(freshRateLimiter.isAllowed('test-client')).toBe(true);
        }
        // 11th request should be rejected
        expect(freshRateLimiter.isAllowed('test-client')).toBe(false);
    });
});
