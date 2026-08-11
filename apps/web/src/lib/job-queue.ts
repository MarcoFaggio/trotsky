import Redis from "ioredis";
import { Queue } from "bullmq";

/**
 * Shared BullMQ producer for the web app.
 *
 * Routes used to construct a fresh `Redis` + `Queue` per request and only ever
 * closed the raw connection, leaking the queue's own resources and churning a
 * TCP+auth handshake on every enqueue. One lazily-created connection per server
 * instance is reused instead; a serverless instance that never enqueues never
 * connects at all.
 */

const SCRAPE_QUEUE = "scrape-queue";
const RECOMMENDATION_QUEUE = "recommendation-queue";

const globalForQueue = globalThis as unknown as {
  troskyRedis?: Redis | null;
  troskyQueues?: Map<string, Queue>;
};

const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: "exponential", delay: 30_000 },
  removeOnComplete: 100,
  removeOnFail: 500,
} as const;

export function isQueueConfigured(): boolean {
  return Boolean(process.env.REDIS_URL);
}

function getConnection(): Redis | null {
  if (globalForQueue.troskyRedis !== undefined) {
    return globalForQueue.troskyRedis;
  }

  const url = process.env.REDIS_URL;
  if (!url) {
    globalForQueue.troskyRedis = null;
    return null;
  }

  const connection = new Redis(url, {
    maxRetriesPerRequest: null,
    // Fail fast instead of buffering enqueues while Redis is unreachable —
    // the caller surfaces a 503 rather than hanging the request.
    enableOfflineQueue: false,
    lazyConnect: true,
  });
  // Without a listener, ioredis emits an unhandled 'error' and can crash the
  // process. Individual enqueues still reject and are handled at the call site.
  connection.on("error", (err) => {
    console.error("[job-queue] redis error:", err.message);
  });

  globalForQueue.troskyRedis = connection;
  return connection;
}

/** A named queue, or null when REDIS_URL is unset (queues disabled). */
function getQueue(name: string): Queue | null {
  const cache = (globalForQueue.troskyQueues ??= new Map<string, Queue>());
  const existing = cache.get(name);
  if (existing) return existing;

  const connection = getConnection();
  if (!connection) return null;

  const queue = new Queue(name, {
    connection,
    defaultJobOptions: { ...DEFAULT_JOB_OPTIONS },
  });
  cache.set(name, queue);
  return queue;
}

export function getScrapeQueue(): Queue | null {
  return getQueue(SCRAPE_QUEUE);
}

export function getRecommendationQueue(): Queue | null {
  return getQueue(RECOMMENDATION_QUEUE);
}

export const QUEUE_UNAVAILABLE_MESSAGE =
  "Scrape jobs are not configured. Set REDIS_URL and run apps/worker on a long-lived host (e.g. Railway, Render).";
