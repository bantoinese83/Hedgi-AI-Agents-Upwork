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

export class RequestQueue {
  private queue: Array<RequestQueueItem<any>> = [];
  private activeRequests = 0;
  private config: RequestQueueConfig;
  private semaphore: number;

  constructor(config: RequestQueueConfig) {
    this.config = config;
    this.semaphore = config.maxConcurrentRequests;
  }

  /**
   * Execute request with semaphore-based concurrency control
   */
  async executeWithConcurrencyControl<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ resolve, reject, request: requestFn });
      this.processQueue();
    });
  }

  /**
   * Process the request queue using semaphore pattern
   */
  private async processQueue(): Promise<void> {
    if (this.semaphore <= 0 || this.queue.length === 0) {
      return;
    }

    // Acquire semaphore
    this.semaphore--;
    this.activeRequests++;

    const { resolve, reject, request } = this.queue.shift()!;

    try {
      const result = await request();
      resolve(result);
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    } finally {
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
  getStats(): { queueLength: number; activeRequests: number; maxConcurrentRequests: number; availableSlots: number } {
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
