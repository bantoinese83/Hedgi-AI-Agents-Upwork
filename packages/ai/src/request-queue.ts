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

export class RequestQueue {
  private queue: Array<RequestQueueItem<any>> = [];
  private activeRequests = 0;
  private config: RequestQueueConfig;

  constructor(config: RequestQueueConfig) {
    this.config = config;
  }

  /**
   * Execute request with concurrency control
   */
  async executeWithConcurrencyControl<T>(requestFn: () => Promise<T>): Promise<T> {
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
  private async processQueue(): Promise<void> {
    // Iterative processing to prevent recursion
    while (this.activeRequests < this.config.maxConcurrentRequests && this.queue.length > 0) {
      this.activeRequests++;
      const { resolve, reject, request } = this.queue.shift()!;

      try {
        const result = await request();
        resolve(result);
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      } finally {
        this.activeRequests--;
      }
    }
  }

  /**
   * Get queue statistics
   */
  getStats(): { queueLength: number; activeRequests: number; maxConcurrentRequests: number } {
    return {
      queueLength: this.queue.length,
      activeRequests: this.activeRequests,
      maxConcurrentRequests: this.config.maxConcurrentRequests,
    };
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.queue.length === 0 && this.activeRequests === 0;
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue = [];
    this.activeRequests = 0;
  }
}
