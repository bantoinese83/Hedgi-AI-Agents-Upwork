/**
 * Iterative request queue implementation
 * Handles concurrency control and prevents recursion
 */
export interface RequestQueueItem<T> {
    resolve: (value: T) => void;
    reject: (reason: Error) => void;
    request: () => Promise<T>;
}
export interface RequestQueueConfig {
    maxConcurrentRequests: number;
}
export declare class RequestQueue {
    private queue;
    private activeRequests;
    private config;
    constructor(config: RequestQueueConfig);
    /**
     * Execute request with concurrency control
     */
    executeWithConcurrencyControl<T>(requestFn: () => Promise<T>): Promise<T>;
    /**
     * Process the request queue iteratively
     */
    private processQueue;
    /**
     * Get queue statistics
     */
    getStats(): {
        queueLength: number;
        activeRequests: number;
        maxConcurrentRequests: number;
    };
    /**
     * Check if queue is empty
     */
    isEmpty(): boolean;
    /**
     * Clear the queue
     */
    clear(): void;
}
//# sourceMappingURL=request-queue.d.ts.map