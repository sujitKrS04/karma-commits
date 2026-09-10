// ─── Rate Limiter — Token Bucket (in-memory) ──────────────────────────────────
// Keyed by an arbitrary string (e.g. username or IP).
// SERVER ONLY — never import this on the client.

// ─── Config ───────────────────────────────────────────────────────────────────

/** Maximum requests allowed per window before the bucket is empty. */
export const MAX_TOKENS = 5;

/** Time window in milliseconds after which the bucket fully refills. */
export const REFILL_INTERVAL_MS = 60 * 1000; // 1 minute

// ─── Internal state ───────────────────────────────────────────────────────────

interface Bucket {
  tokens: number;
  lastRefill: number; // epoch ms
}

const buckets = new Map<string, Bucket>();

// ─── Core ─────────────────────────────────────────────────────────────────────

/**
 * Returns `true` if the request is allowed (consumes one token),
 * or `false` if the bucket for `key` is empty (rate-limited).
 */
export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket) {
    // First request from this key — create a full bucket
    bucket = { tokens: MAX_TOKENS, lastRefill: now };
    buckets.set(key, bucket);
  } else if (now - bucket.lastRefill >= REFILL_INTERVAL_MS) {
    // Interval elapsed — fully refill the bucket
    bucket.tokens = MAX_TOKENS;
    bucket.lastRefill = now;
  }

  if (bucket.tokens <= 0) {
    return false; // rate-limited
  }

  bucket.tokens -= 1;
  return true;
}

/**
 * Resets the bucket for `key`. Useful for tests.
 */
export function resetRateLimit(key: string): void {
  buckets.delete(key);
}
