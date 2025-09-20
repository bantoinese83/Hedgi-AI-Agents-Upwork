"use strict";
/**
 * Semaphore-based request queue implementation
 * Handles concurrency control using a semaphore pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestQueue = void 0;
class RequestQueue {
    constructor(config) {
        this.queue = [];
        this.activeRequests = 0;
        this.config = config;
        this.semaphore = config.maxConcurrentRequests;
    }
    /**
     * Execute request with semaphore-based concurrency control
     */
    async executeWithConcurrencyControl(requestFn) {
        return new Promise((resolve, reject) => {
            this.queue.push({ resolve, reject, request: requestFn });
            this.processQueue();
        });
    }
    /**
     * Process the request queue using semaphore pattern
     */
    async processQueue() {
        if (this.semaphore <= 0 || this.queue.length === 0) {
            return;
        }
        // Acquire semaphore
        this.semaphore--;
        this.activeRequests++;
        const { resolve, reject, request } = this.queue.shift();
        try {
            const result = await request();
            resolve(result);
        }
        catch (error) {
            reject(error instanceof Error ? error : new Error(String(error)));
        }
        finally {
            this.activeRequests--;
            // Release semaphore
            this.semaphore++;
            // Continue processing if there are more requests
            if (this.queue.length > 0) {
                setImmediate(() => this.processQueue());
            }
        }
    }
    /**
     * Get queue statistics
     */
    getStats() {
        return {
            queueLength: this.queue.length,
            activeRequests: this.activeRequests,
            maxConcurrentRequests: this.config.maxConcurrentRequests,
            availableSlots: this.semaphore,
        };
    }
    /**
     * Check if queue is empty
     */
    isEmpty() {
        return this.queue.length === 0 && this.activeRequests === 0;
    }
    /**
     * Clear the queue
     */
    clear() {
        this.queue = [];
        this.activeRequests = 0;
    }
}
exports.RequestQueue = RequestQueue;
//# sourceMappingURL=request-queue.js.map