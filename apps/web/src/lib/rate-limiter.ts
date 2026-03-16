const attempts = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

setInterval(() => {
  const now = Date.now();
  attempts.forEach((value, key) => {
    if (value.resetAt < now) {
      attempts.delete(key);
    }
  });
}, 60_000);

export function checkRateLimit(key: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1, resetAt: now + WINDOW_MS };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: MAX_ATTEMPTS - entry.count,
    resetAt: entry.resetAt,
  };
}
