import Redis from "ioredis";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export interface RateLimitOptions {
  /** Max requests per window (default 5). */
  max?: number;
  /** Window length in ms (default 15 minutes). */
  windowMs?: number;
}

const attempts = new Map<string, { count: number; resetAt: number }>();

setInterval(() => {
  const now = Date.now();
  attempts.forEach((value, key) => {
    if (value.resetAt < now) {
      attempts.delete(key);
    }
  });
}, 60_000);

let redisClient: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redisClient !== undefined) {
    return redisClient;
  }
  const url = process.env.REDIS_URL;
  if (!url) {
    redisClient = null;
    return null;
  }
  try {
    redisClient = new Redis(url, {
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
    });
    redisClient.on("error", () => {
      /* fallback to in-memory on failures */
    });
  } catch {
    redisClient = null;
  }
  return redisClient;
}

function checkRateLimitMemory(
  key: string,
  max: number,
  windowMs: number
): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1, resetAt: now + windowMs };
  }

  if (entry.count >= max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: max - entry.count,
    resetAt: entry.resetAt,
  };
}

async function checkRateLimitRedis(
  redis: Redis,
  key: string,
  max: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const redisKey = `ratelimit:v1:${key}`;
  const count = await redis.incr(redisKey);
  if (count === 1) {
    await redis.pexpire(redisKey, windowMs);
  }
  const ttlMs = await redis.pttl(redisKey);
  const resetAt = Date.now() + (ttlMs > 0 ? ttlMs : windowMs);
  const allowed = count <= max;
  const remaining = Math.max(0, max - count);
  return { allowed, remaining, resetAt };
}

/**
 * Rate limit by arbitrary key (e.g. client IP).
 * Uses Redis when REDIS_URL is set (shared across instances); otherwise in-memory.
 */
export async function checkRateLimitAsync(
  key: string,
  options: RateLimitOptions = {}
): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: number;
}> {
  const max = options.max ?? MAX_ATTEMPTS;
  const windowMs = options.windowMs ?? WINDOW_MS;
  const redis = getRedis();
  if (!redis) {
    return checkRateLimitMemory(key, max, windowMs);
  }
  try {
    return await checkRateLimitRedis(redis, key, max, windowMs);
  } catch {
    return checkRateLimitMemory(key, max, windowMs);
  }
}
