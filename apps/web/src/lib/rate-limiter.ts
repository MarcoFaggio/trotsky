import Redis from "ioredis";
import { prisma } from "@hotel-pricing/db";

/**
 * Fixed-window rate limiting with three backends, tried in order:
 *
 *  1. **Redis** when `REDIS_URL` is set — cheapest, shared across instances.
 *  2. **Postgres** otherwise — slower but still shared, and always available.
 *  3. **In-process memory** only if both fail, so a datastore blip degrades to
 *     a weak limit rather than an open door.
 *
 * Tier 2 exists because the deployed app has no Redis: with only the in-memory
 * tier, every Vercel lambda counted separately and the login limiter capped
 * attempts per instance instead of per client.
 */

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export interface RateLimitOptions {
  /** Max requests per window (default 5). */
  max?: number;
  /** Window length in ms (default 15 minutes). */
  windowMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

// ---------------------------------------------------------------- memory tier

const attempts = new Map<string, { count: number; resetAt: number }>();
/** Bound the map so a flood of distinct keys can't grow it without limit. */
const MAX_MEMORY_KEYS = 10_000;

function sweepMemory(now: number): void {
  for (const [key, value] of attempts) {
    if (value.resetAt < now) attempts.delete(key);
  }
}

function checkRateLimitMemory(
  key: string,
  max: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  // Swept on write rather than on a module-scope setInterval, which kept a
  // timer alive in every serverless instance for the life of the process.
  if (attempts.size > MAX_MEMORY_KEYS) sweepMemory(now);

  const entry = attempts.get(key);

  if (!entry || entry.resetAt < now) {
    const resetAt = now + windowMs;
    attempts.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: max - 1, resetAt };
  }

  if (entry.count >= max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: max - entry.count, resetAt: entry.resetAt };
}

// ----------------------------------------------------------------- redis tier

let redisClient: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient;

  const url = process.env.REDIS_URL;
  if (!url) {
    redisClient = null;
    return null;
  }
  try {
    const client = new Redis(url, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
    });
    client.on("error", () => {
      /* handled per-call; falls through to the next tier */
    });
    redisClient = client;
  } catch {
    redisClient = null;
  }
  return redisClient;
}

async function checkRateLimitRedis(
  redis: Redis,
  key: string,
  max: number,
  windowMs: number
): Promise<RateLimitResult> {
  const redisKey = `ratelimit:v1:${key}`;
  // One round trip, and the expiry is set atomically with the first increment
  // so a crash between INCR and EXPIRE can't strand a key without a TTL.
  const [count, ttlMs] = (await redis
    .multi()
    .incr(redisKey)
    .pexpire(redisKey, windowMs, "NX")
    .pttl(redisKey)
    .exec()
    .then((replies) => [
      Number(replies?.[0]?.[1] ?? 0),
      Number(replies?.[2]?.[1] ?? windowMs),
    ])) as [number, number];

  return {
    allowed: count <= max,
    remaining: Math.max(0, max - count),
    resetAt: Date.now() + (ttlMs > 0 ? ttlMs : windowMs),
  };
}

// -------------------------------------------------------------- postgres tier

/**
 * Atomic increment-or-reset in a single statement, so concurrent lambdas can't
 * interleave a read and a write and both conclude they were under the limit.
 */
async function checkRateLimitPostgres(
  key: string,
  max: number,
  windowMs: number
): Promise<RateLimitResult> {
  const resetAt = new Date(Date.now() + windowMs);

  const rows = await prisma.$queryRaw<{ count: number; resetAt: Date }[]>`
    INSERT INTO "RateLimitBucket" ("key", "count", "resetAt")
    VALUES (${key}, 1, ${resetAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimitBucket"."resetAt" <= NOW() THEN 1
        ELSE "RateLimitBucket"."count" + 1
      END,
      "resetAt" = CASE
        WHEN "RateLimitBucket"."resetAt" <= NOW() THEN ${resetAt}
        ELSE "RateLimitBucket"."resetAt"
      END
    RETURNING "count", "resetAt"
  `;

  const row = rows[0];
  if (!row) return { allowed: true, remaining: max - 1, resetAt: resetAt.getTime() };

  const count = Number(row.count);
  return {
    allowed: count <= max,
    remaining: Math.max(0, max - count),
    resetAt: new Date(row.resetAt).getTime(),
  };
}

/** Opportunistic cleanup of long-expired windows; safe to skip on failure. */
export async function sweepExpiredRateLimits(): Promise<number> {
  const { count } = await prisma.rateLimitBucket.deleteMany({
    where: { resetAt: { lt: new Date(Date.now() - WINDOW_MS) } },
  });
  return count;
}

// ------------------------------------------------------------------ public API

export async function checkRateLimitAsync(
  key: string,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const max = options.max ?? MAX_ATTEMPTS;
  const windowMs = options.windowMs ?? WINDOW_MS;

  const redis = getRedis();
  if (redis) {
    try {
      return await checkRateLimitRedis(redis, key, max, windowMs);
    } catch {
      // fall through
    }
  }

  try {
    return await checkRateLimitPostgres(key, max, windowMs);
  } catch (err) {
    console.error("[rate-limiter] persistent backends unavailable:", err);
    return checkRateLimitMemory(key, max, windowMs);
  }
}

/**
 * Apply several limits at once (e.g. per-IP and per-account) and return the
 * most restrictive outcome. Every limit is incremented, so a caller cannot dodge
 * one bucket by tripping another first.
 */
export async function checkRateLimits(
  limits: { key: string; options?: RateLimitOptions }[]
): Promise<RateLimitResult> {
  const results = await Promise.all(
    limits.map((limit) => checkRateLimitAsync(limit.key, limit.options))
  );
  const blocked = results.filter((r) => !r.allowed);
  if (blocked.length > 0) {
    return blocked.reduce((worst, r) => (r.resetAt > worst.resetAt ? r : worst));
  }
  return results.reduce(
    (worst, r) => (r.remaining < worst.remaining ? r : worst),
    results[0]
  );
}
