-- Durable, cross-instance rate-limit counters.
--
-- The previous limiter kept counts in a per-process Map. On Vercel each
-- concurrent lambda has its own memory, so the login limiter capped attempts
-- per instance rather than per client — effectively no protection. Redis is
-- still preferred when REDIS_URL is set; this table is the always-available
-- fallback.

CREATE TABLE "RateLimitBucket" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
);

-- Supports sweeping expired windows.
CREATE INDEX "RateLimitBucket_resetAt_idx" ON "RateLimitBucket"("resetAt");
