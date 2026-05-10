import Redis from "ioredis";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

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

function checkRateLimitMemory(key: string): {
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

async function checkRateLimitRedis(
  redis: Redis,
  key: string
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const redisKey = `ratelimit:v1:${key}`;
  const count = await redis.incr(redisKey);
  if (count === 1) {
    await redis.pexpire(redisKey, WINDOW_MS);
  }
  const ttlMs = await redis.pttl(redisKey);
  const resetAt = Date.now() + (ttlMs > 0 ? ttlMs : WINDOW_MS);
  const allowed = count <= MAX_ATTEMPTS;
  const remaining = Math.max(0, MAX_ATTEMPTS - count);
  return { allowed, remaining, resetAt };
}

/**
 * Rate limit by arbitrary key (e.g. client IP).
 * Uses Redis when REDIS_URL is set (shared across instances); otherwise in-memory.
 */
export async function checkRateLimitAsync(key: string): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: number;
}> {
  const redis = getRedis();
  if (!redis) {
    return checkRateLimitMemory(key);
  }
  try {
    return await checkRateLimitRedis(redis, key);
  } catch {
    return checkRateLimitMemory(key);
  }
}
