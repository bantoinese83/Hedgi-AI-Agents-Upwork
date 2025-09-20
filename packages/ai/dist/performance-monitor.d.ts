/**
 * Simple performance monitoring for API endpoints
 * Tracks response times, error rates, and usage patterns
 */
interface PerformanceMetrics {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    lastRequestTime: number;
}
interface RequestLog {
    timestamp: number;
    agent: string;
    responseTime: number;
    success: boolean;
    error?: string;
}
export declare class PerformanceMonitor {
    private metrics;
    private requestLogs;
    private readonly MAX_LOGS;
    /**
     * Log a request
     */
    logRequest(agent: string, responseTime: number, success: boolean, error?: string): void;
    /**
     * Update metrics for an agent
     */
    private updateMetrics;
    /**
     * Get metrics for an agent
     */
    getMetrics(agent: string): PerformanceMetrics | null;
    /**
     * Get all metrics
     */
    getAllMetrics(): Map<string, PerformanceMetrics>;
    /**
     * Get recent request logs
     */
    getRecentLogs(limit?: number): RequestLog[];
    /**
     * Get error rate for an agent
     */
    getErrorRate(agent: string): number;
    /**
     * Get health status
     */
    getHealthStatus(): {
        status: 'healthy' | 'degraded' | 'unhealthy';
        message: string;
        metrics: Record<string, any>;
    };
    /**
     * Reset all metrics
     */
    reset(): void;
}
export declare const performanceMonitor: PerformanceMonitor;
export {};
//# sourceMappingURL=performance-monitor.d.ts.map