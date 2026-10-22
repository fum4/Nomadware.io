// Per-IP sliding-window limiter, in the memory of one warm function instance. Best effort by
// design: a cold start or a second instance starts from zero, so it slows one client hammering
// one instance and nothing more. Turnstile and the honeypot are the real spam defence; a shared
// counter (Vercel WAF rule, KV) is the upgrade if abuse ever gets past them.

export interface RateLimiter {
  /** Records an attempt for `key`; false when `key` is over budget (the attempt isn't recorded). */
  allow(key: string): boolean;
}

interface RateLimitOptions {
  max: number;
  windowMs: number;
  maxTracked: number;
  now?: () => number;
}

export function createRateLimiter({
  max,
  windowMs,
  maxTracked,
  now = Date.now,
}: RateLimitOptions): RateLimiter {
  const attempts = new Map<string, number[]>();

  const prune = (at: number): void => {
    for (const [key, times] of attempts) {
      const live = times.filter((time) => at - time < windowMs);
      if (live.length > 0) attempts.set(key, live);
      else attempts.delete(key);
    }
    // Still full of live keys: forget the oldest-inserted ones rather than grow.
    for (const key of attempts.keys()) {
      if (attempts.size < maxTracked) break;
      attempts.delete(key);
    }
  };

  return {
    allow(key) {
      const at = now();
      if (!attempts.has(key) && attempts.size >= maxTracked) prune(at);
      const recent = (attempts.get(key) ?? []).filter((time) => at - time < windowMs);
      if (recent.length >= max) {
        attempts.set(key, recent);
        return false;
      }
      recent.push(at);
      attempts.set(key, recent);
      return true;
    },
  };
}
