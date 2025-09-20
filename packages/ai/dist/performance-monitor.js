"use strict";
/**
 * Simple performance monitoring for API endpoints
 * Tracks response times, error rates, and usage patterns
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceMonitor = exports.PerformanceMonitor = void 0;
const logger_1 = require("./logger");
class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.requestLogs = [];
        this.MAX_LOGS = 1000; // Keep last 1000 requests
    }
    /**
     * Log a request
     */
    logRequest(agent, responseTime, success, error, rateLimited) {
        const timestamp = Date.now();
        // Add to request logs
        this.requestLogs.push({
            timestamp,
            agent,
            responseTime,
            success,
            error,
            rateLimited: rateLimited || false,
        });
        // Keep only recent logs
        if (this.requestLogs.length > this.MAX_LOGS) {
            this.requestLogs = this.requestLogs.slice(-this.MAX_LOGS);
        }
        // Update metrics
        this.updateMetrics(agent, responseTime, success);
    }
    /**
     * Update metrics for an agent
     */
    updateMetrics(agent, responseTime, success) {
        let metrics = this.metrics.get(agent);
        if (!metrics) {
            metrics = {
                totalRequests: 0,
                successfulRequests: 0,
                failedRequests: 0,
                averageResponseTime: 0,
                minResponseTime: responseTime,
                maxResponseTime: responseTime,
                lastRequestTime: Date.now(),
            };
        }
        metrics.totalRequests++;
        if (success) {
            metrics.successfulRequests++;
        }
        else {
            metrics.failedRequests++;
        }
        // Update response time metrics
        metrics.averageResponseTime =
            (metrics.averageResponseTime * (metrics.totalRequests - 1) +
                responseTime) /
                metrics.totalRequests;
        metrics.minResponseTime = Math.min(metrics.minResponseTime, responseTime);
        metrics.maxResponseTime = Math.max(metrics.maxResponseTime, responseTime);
        metrics.lastRequestTime = Date.now();
        this.metrics.set(agent, metrics);
    }
    /**
     * Get metrics for an agent
     */
    getMetrics(agent) {
        return this.metrics.get(agent) || null;
    }
    /**
     * Get all metrics
     */
    getAllMetrics() {
        return new Map(this.metrics);
    }
    /**
     * Get recent request logs
     */
    getRecentLogs(limit = 100) {
        return this.requestLogs.slice(-limit);
    }
    /**
     * Get error rate for an agent
     */
    getErrorRate(agent) {
        const metrics = this.metrics.get(agent);
        if (!metrics || metrics.totalRequests === 0)
            return 0;
        return (metrics.failedRequests / metrics.totalRequests) * 100;
    }
    /**
     * Get health status
     */
    getHealthStatus() {
        const allMetrics = this.getAllMetrics();
        // const now = Date.now(); // Unused for now
        let totalRequests = 0;
        let totalErrors = 0;
        let avgResponseTime = 0;
        let agentCount = 0;
        allMetrics.forEach((metrics, _agent) => {
            totalRequests += metrics.totalRequests;
            totalErrors += metrics.failedRequests;
            avgResponseTime += metrics.averageResponseTime;
            agentCount++;
        });
        const overallErrorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
        const overallAvgResponseTime = agentCount > 0 ? avgResponseTime / agentCount : 0;
        let status = 'healthy';
        let message = 'All systems operational';
        if (overallErrorRate > 10) {
            status = 'unhealthy';
            message = `High error rate: ${overallErrorRate.toFixed(1)}%`;
        }
        else if (overallAvgResponseTime > 10000) {
            status = 'degraded';
            message = `Slow response times: ${overallAvgResponseTime.toFixed(0)}ms average`;
        }
        else if (overallErrorRate > 5) {
            status = 'degraded';
            message = `Elevated error rate: ${overallErrorRate.toFixed(1)}%`;
        }
        return {
            status,
            message,
            metrics: {
                totalRequests,
                totalErrors,
                errorRate: overallErrorRate,
                averageResponseTime: overallAvgResponseTime,
                agents: Object.fromEntries(allMetrics),
            },
        };
    }
    /**
     * Reset all metrics
     */
    /**
     * Get rate limiting impact analysis
     */
    getRateLimitImpact() {
        const rateLimitedRequests = this.requestLogs.filter(log => log.rateLimited);
        const nonRateLimitedRequests = this.requestLogs.filter(log => !log.rateLimited);
        const rateLimitedResponseTimes = rateLimitedRequests
            .map(log => log.responseTime)
            .filter(time => time !== undefined);
        const nonRateLimitedErrors = nonRateLimitedRequests.filter(log => !log.success).length;
        return {
            rateLimitHits: rateLimitedRequests.length,
            rateLimitHitRate: this.requestLogs.length > 0
                ? (rateLimitedRequests.length / this.requestLogs.length) * 100
                : 0,
            averageRateLimitedResponseTime: rateLimitedResponseTimes.length > 0
                ? rateLimitedResponseTimes.reduce((sum, time) => sum + time, 0) / rateLimitedResponseTimes.length
                : 0,
            nonRateLimitedErrorRate: nonRateLimitedRequests.length > 0
                ? (nonRateLimitedErrors / nonRateLimitedRequests.length) * 100
                : 0,
        };
    }
    /**
     * Get combined performance and rate limiting metrics
     */
    getCombinedMetrics() {
        const performance = this.getAllMetrics();
        const rateLimitImpact = this.getRateLimitImpact();
        // Determine health status based on combined metrics
        let healthStatus = 'healthy';
        const totalErrorRate = this.getErrorRate('all');
        if (totalErrorRate > 50 || rateLimitImpact.rateLimitHitRate > 50) {
            healthStatus = 'critical';
        }
        else if (totalErrorRate > 20 || rateLimitImpact.rateLimitHitRate > 20) {
            healthStatus = 'warning';
        }
        return {
            performance,
            rateLimitImpact,
            healthStatus,
        };
    }
    reset() {
        this.metrics.clear();
        this.requestLogs = [];
    }
}
exports.PerformanceMonitor = PerformanceMonitor;
// Global performance monitor instance
exports.performanceMonitor = new PerformanceMonitor();
// Log performance metrics every 5 minutes
setInterval(() => {
    const health = exports.performanceMonitor.getHealthStatus();
    logger_1.loggerInstance.info('Performance Health Check:', {
        status: health.status,
        message: health.message,
        timestamp: new Date().toISOString(),
    });
}, 5 * 60 * 1000);
//# sourceMappingURL=performance-monitor.js.map