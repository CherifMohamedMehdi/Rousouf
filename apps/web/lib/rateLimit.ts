/**
 * Minimal IP-based token-bucket rate limiter for public write endpoints.
 *
 * In development (and on a single Vercel serverless instance) the bucket is
 * held in process memory. For production, set UPSTASH_REDIS_URL /
 * UPSTASH_REDIS_TOKEN and replace the in-memory `bucket` map below with a
 * Redis-backed store — the external interface does not change.
 *
 * Reads config from env:
 * - RATE_LIMIT_WINDOW_SEC (default 60)
 * - RATE_LIMIT_MAX (default 10)
 */

interface Bucket {
  tokens: number;
  resetAt: number;
}

const bucket = new Map<string, Bucket>();

function config() {
  return {
    windowSec: Number(process.env.RATE_LIMIT_WINDOW_SEC ?? 60),
    max: Number(process.env.RATE_LIMIT_MAX ?? 10),
  };
}

export function getClientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real;
  return 'unknown';
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(key: string): RateLimitResult {
  const { windowSec, max } = config();
  const now = Date.now();
  const existing = bucket.get(key);
  if (!existing || now >= existing.resetAt) {
    bucket.set(key, { tokens: max - 1, resetAt: now + windowSec * 1000 });
    return { ok: true, remaining: max - 1, resetAt: now + windowSec * 1000 };
  }
  if (existing.tokens <= 0) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }
  existing.tokens -= 1;
  return { ok: true, remaining: existing.tokens, resetAt: existing.resetAt };
}

export function rateLimitResponse(result: RateLimitResult): Response {
  const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
  return new Response(JSON.stringify({ error: 'rate_limited', retry_after: retryAfter }), {
    status: 429,
    headers: {
      'content-type': 'application/json',
      'retry-after': String(retryAfter),
    },
  });
}
