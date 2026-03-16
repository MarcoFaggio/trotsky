import { Worker, Queue } from "bullmq";
import Redis from "ioredis";
import { dailyScrapeProcessor } from "./jobs/daily-scrape";
import { recomputeRecommendationsProcessor } from "./jobs/recompute-recommendations";
import pino from "pino";

const logger = pino({ name: "worker" });
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const connection = new Redis(REDIS_URL, { maxRetriesPerRequest: null });

const scrapeQueue = new Queue("scrape-queue", { connection });
const recQueue = new Queue("recommendation-queue", { connection });

const scrapeWorker = new Worker(
  "scrape-queue",
  async (job) => {
    logger.info({ jobId: job.id, data: job.data }, "Processing scrape job");
    await dailyScrapeProcessor(job.data);
  },
  { connection, concurrency: 1 }
);

const recWorker = new Worker(
  "recommendation-queue",
  async (job) => {
    logger.info({ jobId: job.id, data: job.data }, "Processing recommendation job");
    await recomputeRecommendationsProcessor(job.data);
  },
  { connection, concurrency: 2 }
);

scrapeWorker.on("completed", (job) => logger.info({ jobId: job.id }, "Scrape job completed"));
scrapeWorker.on("failed", (job, err) => logger.error({ jobId: job?.id, error: err.message }, "Scrape job failed"));
recWorker.on("completed", (job) => logger.info({ jobId: job.id }, "Recommendation job completed"));
recWorker.on("failed", (job, err) => logger.error({ jobId: job?.id, error: err.message }, "Recommendation job failed"));

const SCRAPE_CRON = process.env.SCRAPE_CRON || "0 */2 * * *";

scrapeQueue.add(
  "daily-scrape",
  { trigger: "scheduled" },
  {
    repeat: { pattern: SCRAPE_CRON },
    removeOnComplete: 100,
    removeOnFail: 50,
  }
);

logger.info({ cron: SCRAPE_CRON }, "Scrape schedule configured");

logger.info("Worker started. Listening for jobs...");

process.on("SIGTERM", async () => {
  logger.info("Shutting down worker...");
  await scrapeWorker.close();
  await recWorker.close();
  await connection.quit();
  process.exit(0);
});
