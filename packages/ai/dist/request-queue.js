"use strict";
/**
 * Iterative request queue implementation
 * Handles concurrency control and prevents recursion
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestQueue = void 0;
class RequestQueue {
    constructor(config) {
        this.queue = [];
        this.activeRequests = 0;
        this.config = config;
    }
    /**
     * Execute request with concurrency control
     */
    async executeWithConcurrencyControl(requestFn) {
        return new Promise((resolve, reject) => {
            this.queue.push({ resolve, reject, request: requestFn });
            if (this.activeRequests < this.config.maxConcurrentRequests) {
                this.processQueue();
            }
        });
    }
    /**
     * Process the request queue iteratively
     */
    async processQueue() {
        // Iterative processing to prevent recursion
        while (this.activeRequests < this.config.maxConcurrentRequests && this.queue.length > 0) {
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