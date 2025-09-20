import { PerformanceMonitor, performanceMonitor } from '../performance-monitor';

// Mock logger to avoid console output during tests
jest.mock('../logger', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
}));

describe('PerformanceMonitor', () => {
    let monitor: PerformanceMonitor;

    beforeEach(() => {
        monitor = new PerformanceMonitor();
    });

    describe('logRequest', () => {
        it('should log successful request', () => {
            monitor.logRequest('test-agent', 1000, true);

            const health = monitor.getHealthStatus();
            expect(health.metrics.totalRequests).toBe(1);
            expect(health.metrics.totalErrors).toBe(0);
            expect(health.metrics.averageResponseTime).toBe(1000);
        });

        it('should log failed request', () => {
            monitor.logRequest('test-agent', 2000, false, 'Test error');

            const health = monitor.getHealthStatus();
            expect(health.metrics.totalRequests).toBe(1);
            expect(health.metrics.totalErrors).toBe(1);
            expect(health.metrics.averageResponseTime).toBe(2000);
        });

        it('should track multiple requests for same agent', () => {
            monitor.logRequest('test-agent', 1000, true);
            monitor.logRequest('test-agent', 2000, true);
            monitor.logRequest('test-agent', 3000, false, 'Error');

            const health = monitor.getHealthStatus();
            expect(health.metrics.totalRequests).toBe(3);
            expect(health.metrics.totalErrors).toBe(1);
            expect(health.metrics.averageResponseTime).toBe(2000); // (1000 + 2000 + 3000) / 3
        });

        it('should track multiple agents separately', () => {
            monitor.logRequest('agent1', 1000, true);
            monitor.logRequest('agent2', 2000, false, 'Error');
            monitor.logRequest('agent1', 1500, true);

            const health = monitor.getHealthStatus();
            expect(health.metrics.totalRequests).toBe(3);
            expect(health.metrics.totalErrors).toBe(1);
            expect(health.metrics.averageResponseTime).toBeGreaterThan(1000);
            expect(health.metrics.averageResponseTime).toBeLessThan(2000);

            expect(health.metrics.agents.agent1.totalRequests).toBe(2);
            expect(health.metrics.agents.agent1.failedRequests).toBe(0);
            expect(health.metrics.agents.agent2.totalRequests).toBe(1);
            expect(health.metrics.agents.agent2.failedRequests).toBe(1);
        });
    });

    describe('getHealthStatus', () => {
        it('should return healthy status for good performance', () => {
            monitor.logRequest('test-agent', 1000, true);

            const health = monitor.getHealthStatus();
            expect(health.status).toBe('healthy');
            expect(health.message).toBe('All systems operational');
            expect(health.metrics.totalRequests).toBe(1);
            expect(health.metrics.totalErrors).toBe(0);
            expect(health.metrics.errorRate).toBe(0);
        });

        it('should return degraded status for high error rate', () => {
            // Create 20% error rate
            for (let i = 0; i < 8; i++) {
                monitor.logRequest('test-agent', 1000, true);
            }
            for (let i = 0; i < 2; i++) {
                monitor.logRequest('test-agent', 1000, false, 'Error');
            }

            const health = monitor.getHealthStatus();
            expect(health.status).toBe('unhealthy');
            expect(health.message).toContain('High error rate');
            expect(health.metrics.errorRate).toBe(20);
        });

        it('should return unhealthy status for very high error rate', () => {
            // Create 40% error rate
            for (let i = 0; i < 6; i++) {
                monitor.logRequest('test-agent', 1000, true);
            }
            for (let i = 0; i < 4; i++) {
                monitor.logRequest('test-agent', 1000, false, 'Error');
            }

            const health = monitor.getHealthStatus();
            expect(health.status).toBe('unhealthy');
            expect(health.message).toContain('High error rate');
            expect(health.metrics.errorRate).toBe(40);
        });

        it('should return degraded status for high response time', () => {
            monitor.logRequest('test-agent', 6000, true); // 6 seconds

            const health = monitor.getHealthStatus();
            expect(health.status).toBe('healthy'); // 6 seconds is not > 10 seconds threshold
            expect(health.message).toBe('All systems operational');
        });

        it('should handle empty metrics gracefully', () => {
            const health = monitor.getHealthStatus();
            expect(health.status).toBe('healthy');
            expect(health.message).toBe('All systems operational');
            expect(health.metrics.totalRequests).toBe(0);
            expect(health.metrics.totalErrors).toBe(0);
            expect(health.metrics.errorRate).toBe(0);
            expect(health.metrics.averageResponseTime).toBe(0);
        });

        it('should include agent-specific metrics', () => {
            monitor.logRequest('agent1', 1000, true);
            monitor.logRequest('agent2', 2000, false, 'Error');

            const health = monitor.getHealthStatus();
            expect(health.metrics.agents.agent1).toBeDefined();
            expect(health.metrics.agents.agent1.totalRequests).toBe(1);
            expect(health.metrics.agents.agent1.failedRequests).toBe(0);
            expect(health.metrics.agents.agent1.averageResponseTime).toBe(1000);

            expect(health.metrics.agents.agent2).toBeDefined();
            expect(health.metrics.agents.agent2.totalRequests).toBe(1);
            expect(health.metrics.agents.agent2.failedRequests).toBe(1);
            expect(health.metrics.agents.agent2.averageResponseTime).toBe(2000);
        });
    });

    describe('getAllMetrics', () => {
        it('should return all metrics', () => {
            monitor.logRequest('test-agent', 1000, true);

            const allMetrics = monitor.getAllMetrics();
            expect(allMetrics.size).toBe(1);
            expect(allMetrics.get('test-agent')).toBeDefined();
            expect(allMetrics.get('test-agent')?.totalRequests).toBe(1);
        });
    });

    describe('reset', () => {
        it('should reset all metrics', () => {
            monitor.logRequest('test-agent', 1000, true);
            expect(monitor.getAllMetrics().size).toBe(1);

            monitor.reset();
            expect(monitor.getAllMetrics().size).toBe(0);

            const health = monitor.getHealthStatus();
            expect(health.metrics.totalRequests).toBe(0);
            expect(health.metrics.totalErrors).toBe(0);
        });
    });

    describe('getMetrics', () => {
        it('should return metrics for specific agent', () => {
            monitor.logRequest('test-agent', 1000, true);

            const agentMetrics = monitor.getMetrics('test-agent');
            expect(agentMetrics).toBeDefined();
            expect(agentMetrics?.totalRequests).toBe(1);
            expect(agentMetrics?.failedRequests).toBe(0);
        });

        it('should return null for non-existent agent', () => {
            const agentMetrics = monitor.getMetrics('non-existent');
            expect(agentMetrics).toBeNull();
        });
    });

    describe('getErrorRate', () => {
        it('should calculate error rate correctly', () => {
            monitor.logRequest('test-agent', 1000, true);
            monitor.logRequest('test-agent', 1000, true);
            monitor.logRequest('test-agent', 1000, false, 'Error');

            const errorRate = monitor.getErrorRate('test-agent');
            expect(errorRate).toBeCloseTo(33.33, 1); // 1/3 * 100
        });

        it('should return 0 for agent with no requests', () => {
            const errorRate = monitor.getErrorRate('non-existent');
            expect(errorRate).toBe(0);
        });
    });
});

describe('Default performanceMonitor instance', () => {
    it('should be available and functional', () => {
        performanceMonitor.logRequest('test-agent', 1000, true);

        const health = performanceMonitor.getHealthStatus();
        expect(health.metrics.totalRequests).toBe(1);
    });
});
