export class RateLimiter {
  private memory = new Map<string, { count: number; timestamp: number }>();
  private windowMs: number;
  private maxPoints: number;

  constructor(windowMs = 60000, maxPoints = 5) {
    this.windowMs = windowMs;
    this.maxPoints = maxPoints;

    // Periodic cleanup to prevent memory leaks in persistent VM processes
    if (typeof setInterval !== 'undefined') {
      const timer = setInterval(() => this.cleanup(), 5 * 60 * 1000);
      if (timer && typeof timer === 'object' && 'unref' in timer) {
        (timer as any).unref();
      }
    }
  }

  check(ip: string): boolean {
    const now = Date.now();
    const record = this.memory.get(ip);

    if (!record) {
      this.memory.set(ip, { count: 1, timestamp: now });
      return true;
    }

    if (now - record.timestamp > this.windowMs) {
      // Reset window
      this.memory.set(ip, { count: 1, timestamp: now });
      return true;
    }

    if (record.count >= this.maxPoints) {
      return false; // Rate limit exceeded
    }

    record.count++;
    return true;
  }

  private cleanup() {
    const now = Date.now();
    for (const [ip, record] of this.memory.entries()) {
      if (now - record.timestamp > this.windowMs) {
        this.memory.delete(ip);
      }
    }
  }
}

const globalForRateLimit = globalThis as unknown as {
  authRateLimiter: RateLimiter | undefined;
  apiRateLimiter: RateLimiter | undefined;
};

export const authRateLimiter =
  globalForRateLimit.authRateLimiter ?? new RateLimiter(15 * 60 * 1000, 10); // 10 requests per 15 minutes

export const apiRateLimiter =
  globalForRateLimit.apiRateLimiter ?? new RateLimiter(60 * 1000, 60); // 60 requests per minute

if (process.env.NODE_ENV !== 'production') {
  globalForRateLimit.authRateLimiter = authRateLimiter;
  globalForRateLimit.apiRateLimiter = apiRateLimiter;
}
