type Bucket = { tokens: number; updatedAt: number };
const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfter: number; // seconds
}

/**
 * Simple in-memory token bucket. Replace the Map with Upstash Redis for
 * multi-instance deployments — keep this signature.
 */
export function rateLimit(key: string, limit = 5, windowSec = 60): RateLimitResult {
  const now = Date.now();
  const refillRate = limit / (windowSec * 1000); // tokens per ms
  const b = buckets.get(key) ?? { tokens: limit, updatedAt: now };

  const elapsed = now - b.updatedAt;
  b.tokens = Math.min(limit, b.tokens + elapsed * refillRate);
  b.updatedAt = now;

  if (b.tokens >= 1) {
    b.tokens -= 1;
    buckets.set(key, b);
    return { ok: true, remaining: Math.floor(b.tokens), retryAfter: 0 };
  }

  buckets.set(key, b);
  const retryAfter = Math.ceil((1 - b.tokens) / refillRate / 1000);
  return { ok: false, remaining: 0, retryAfter };
}

export function clientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}

// test helper
export function __resetRateLimit() {
  buckets.clear();
}
