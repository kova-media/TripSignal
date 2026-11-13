// Minimal in-memory rate limiter (per serverless instance).
// Good enough for abuse throttling on a small site; not a hard guarantee
// across instances. Keys are strings like `magic:email@example.com` or
// `ip:1.2.3.4`. Returns true when the request is allowed.
const buckets = new Map<string, number[]>();

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const prior = buckets.get(key) ?? [];
  const fresh = prior.filter((t) => now - t < windowMs);
  if (fresh.length >= limit) {
    buckets.set(key, fresh);
    return false;
  }
  fresh.push(now);
  buckets.set(key, fresh);
  return true;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim();
  return ip || 'unknown';
}
