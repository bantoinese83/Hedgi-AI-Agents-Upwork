/**
 * Semaphore-based request queue implementation
 * Handles concurrency control using a semaphore pattern
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
    private semaphore;
    constructor(config: RequestQueueConfig);
    /**
     * Execute request with semaphore-based concurrency control
     */
    executeWithConcurrencyControl<T>(requestFn: () => Promise<T>): Promise<T>;
    /**
     * Process the request queue using semaphore pattern
     */
    private processQueue;
    /**
     * Get queue statistics
     */
    getStats(): {
        queueLength: number;
        activeRequests: number;
        maxConcurrentRequests: number;
        availableSlots: number;
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