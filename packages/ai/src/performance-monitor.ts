/**
 * Simple performance monitoring for API endpoints
 * Tracks response times, error rates, and usage patterns
 */

import { loggerInstance as logger } from './logger';

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
  rateLimited?: boolean;
}

export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private requestLogs: RequestLog[] = [];
  private readonly MAX_LOGS = 1000; // Keep last 1000 requests

  /**
   * Log a request
   */
  logRequest(
    agent: string,
    responseTime: number,
    success: boolean,
    error?: string,
    rateLimited?: boolean
  ): void {
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
  private updateMetrics(
    agent: string,
    responseTime: number,
    success: boolean
  ): void {
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
    } else {
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
  getMetrics(agent: string): PerformanceMetrics | null {
    return this.metrics.get(agent) || null;
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.metrics);
  }

  /**
   * Get recent request logs
   */
  getRecentLogs(limit: number = 100): RequestLog[] {
    return this.requestLogs.slice(-limit);
  }

  /**
   * Get error rate for an agent
   */
  getErrorRate(agent: string): number {
    const metrics = this.metrics.get(agent);
    if (!metrics || metrics.totalRequests === 0) return 0;

    return (metrics.failedRequests / metrics.totalRequests) * 100;
  }

  /**
   * Get health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    message: string;
    metrics: {
      totalRequests: number;
      totalErrors: number;
      errorRate: number;
      averageResponseTime: number;
      agents: Record<string, PerformanceMetrics>;
    };
  } {
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

    const overallErrorRate =
      totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
    const overallAvgResponseTime =
      agentCount > 0 ? avgResponseTime / agentCount : 0;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let message = 'All systems operational';

    if (overallErrorRate > 10) {
      status = 'unhealthy';
      message = `High error rate: ${overallErrorRate.toFixed(1)}%`;
    } else if (overallAvgResponseTime > 10000) {
      status = 'degraded';
      message = `Slow response times: ${overallAvgResponseTime.toFixed(0)}ms average`;
    } else if (overallErrorRate > 5) {
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
  getRateLimitImpact(): {
    rateLimitHits: number;
    rateLimitHitRate: number;
    averageRateLimitedResponseTime: number;
    nonRateLimitedErrorRate: number;
  } {
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
  getCombinedMetrics(): {
    performance: ReturnType<PerformanceMonitor['getAllMetrics']>;
    rateLimitImpact: ReturnType<PerformanceMonitor['getRateLimitImpact']>;
    healthStatus: 'healthy' | 'warning' | 'critical';
  } {
    const performance = this.getAllMetrics();
    const rateLimitImpact = this.getRateLimitImpact();

    // Determine health status based on combined metrics
    let healthStatus: 'healthy' | 'warning' | 'critical' = 'healthy';

    const totalErrorRate = this.getErrorRate('all');
    if (totalErrorRate > 50 || rateLimitImpact.rateLimitHitRate > 50) {
      healthStatus = 'critical';
    } else if (totalErrorRate > 20 || rateLimitImpact.rateLimitHitRate > 20) {
      healthStatus = 'warning';
    }

    return {
      performance,
      rateLimitImpact,
      healthStatus,
    };
  }

  reset(): void {
    this.metrics.clear();
    this.requestLogs = [];
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Log performance metrics every 5 minutes
setInterval(
  () => {
    const health = performanceMonitor.getHealthStatus();
    logger.info('Performance Health Check:', {
      status: health.status,
      message: health.message,
      timestamp: new Date().toISOString(),
    } as any);
  },
  5 * 60 * 1000
);
