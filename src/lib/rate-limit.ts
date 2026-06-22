/**
 * Simple in-memory rate limiter for API routes.
 *
 * Uses a sliding-window counter per IP. Not shared across serverless
 * invocations on Vercel — swap for Redis/Upstash if you need distributed
 * rate limiting in production.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  store.forEach((entry, key) => {
    if (now > entry.resetTime) store.delete(key);
  });
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Time window in seconds */
  windowSeconds: number;
}

/** Default config: 5 requests per 60 seconds (for auth routes) */
export const AUTH_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 5,
  windowSeconds: 60,
};

/** Slightly more permissive: 10 requests per 60 seconds */
export const API_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 10,
  windowSeconds: 60,
};

/**
 * Check if a request should be rate-limited.
 *
 * @param identifier - Unique identifier (typically IP + route)
 * @param config - Rate limit configuration
 * @returns `{ limited: false }` if allowed, `{ limited: true, retryAfter }` if blocked
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = AUTH_RATE_LIMIT
): { limited: boolean; retryAfter?: number; remaining: number } {
  cleanup();

  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || now > entry.resetTime) {
    // First request or window expired — start fresh
    store.set(identifier, {
      count: 1,
      resetTime: now + config.windowSeconds * 1000,
    });
    return { limited: false, remaining: config.maxRequests - 1 };
  }

  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return { limited: true, retryAfter, remaining: 0 };
  }

  entry.count++;
  return { limited: false, remaining: config.maxRequests - entry.count };
}

/**
 * Extract client IP from a Next.js request.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}
