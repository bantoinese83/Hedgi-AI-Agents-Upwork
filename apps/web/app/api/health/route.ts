import { NextRequest, NextResponse } from 'next/server';
import { performanceMonitor, defaultRateLimiter } from '@hedgi/ai';

export async function GET(request: NextRequest) {
  try {
    const health = performanceMonitor.getHealthStatus();
    const clientIP =
      request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const remainingRequests = defaultRateLimiter.getRemainingRequests(clientIP);

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      performance: health,
      rateLimit: {
        remaining: remainingRequests,
        resetTime: defaultRateLimiter.getResetTime(clientIP),
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
