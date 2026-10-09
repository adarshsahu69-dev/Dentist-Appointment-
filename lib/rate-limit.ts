/**
 * In-memory fixed-window rate limiter for sensitive endpoints
 * (login, signup, booking, password reset). On serverless deployments each
 * instance keeps its own window; for distributed limiting plug in Upstash or
 * similar and keep the same interface.
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit = 10, windowMs = 60_000): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }
  if (bucket.count >= limit) {
    return { success: false, remaining: 0, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { success: true, remaining: limit - bucket.count, retryAfterSeconds: 0 };
}

export function resetRateLimits(): void {
  buckets.clear();
}
