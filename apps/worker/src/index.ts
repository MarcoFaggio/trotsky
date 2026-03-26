import { Worker, Queue } from "bullmq";
import Redis from "ioredis";
import { dailyScrapeProcessor } from "./jobs/daily-scrape";
import { recomputeRecommendationsProcessor } from "./jobs/recompute-recommendations";
import { fetchNormalizeSignalsProcessor } from "./jobs/fetch-normalize-signals";
import { matchSignalsToHotelsProcessor } from "./jobs/match-signals-to-hotels";
import { geocodeHotelsProcessor } from "./jobs/geocode-hotels";
import pino from "pino";

const logger = pino({ name: "worker" });
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const connection = new Redis(REDIS_URL, { maxRetriesPerRequest: null });

const scrapeQueue = new Queue("scrape-queue", { connection });
const recQueue = new Queue("recommendation-queue", { connection });
const signalIngestionQueue = new Queue("signal-ingestion-queue", { connection });
const signalMatchingQueue = new Queue("signal-matching-queue", { connection });
const hotelGeoQueue = new Queue("hotel-geo-queue", { connection });

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

const signalIngestionWorker = new Worker(
  "signal-ingestion-queue",
  async () => {
    logger.info("Processing signal ingestion job");
    await fetchNormalizeSignalsProcessor();
    await signalMatchingQueue.add(
      "match-signals-to-hotels",
      {},
      { removeOnComplete: 100, removeOnFail: 50 }
    );
  },
  { connection, concurrency: 1 }
);

const signalMatchingWorker = new Worker(
  "signal-matching-queue",
  async () => {
    logger.info("Processing signal matching job");
    const result = await matchSignalsToHotelsProcessor();
    for (const hotelId of result.affectedHotelIds) {
      await recQueue.add(
        "recompute-recommendations",
        { hotelId, trigger: "external-signal" },
        { removeOnComplete: 100, removeOnFail: 50 }
      );
    }
  },
  { connection, concurrency: 1 }
);

const hotelGeoWorker = new Worker(
  "hotel-geo-queue",
  async (job) => {
    logger.info({ jobId: job.id, data: job.data }, "Processing hotel geo job");
    await geocodeHotelsProcessor(job.data);
  },
  { connection, concurrency: 1 }
);

scrapeWorker.on("completed", (job) => logger.info({ jobId: job.id }, "Scrape job completed"));
scrapeWorker.on("failed", (job, err) => logger.error({ jobId: job?.id, error: err.message }, "Scrape job failed"));
recWorker.on("completed", (job) => logger.info({ jobId: job.id }, "Recommendation job completed"));
recWorker.on("failed", (job, err) => logger.error({ jobId: job?.id, error: err.message }, "Recommendation job failed"));
signalIngestionWorker.on("completed", (job) =>
  logger.info({ jobId: job.id }, "Signal ingestion job completed")
);
signalIngestionWorker.on("failed", (job, err) =>
  logger.error({ jobId: job?.id, error: err.message }, "Signal ingestion job failed")
);
signalMatchingWorker.on("completed", (job) =>
  logger.info({ jobId: job.id }, "Signal matching job completed")
);
signalMatchingWorker.on("failed", (job, err) =>
  logger.error({ jobId: job?.id, error: err.message }, "Signal matching job failed")
);
hotelGeoWorker.on("completed", (job) =>
  logger.info({ jobId: job.id }, "Hotel geocode job completed")
);
hotelGeoWorker.on("failed", (job, err) =>
  logger.error({ jobId: job?.id, error: err.message }, "Hotel geocode job failed")
);

const SCRAPE_CRON = process.env.SCRAPE_CRON || "0 */2 * * *";
const SIGNAL_CRON = process.env.SIGNAL_CRON || "15 */6 * * *";
const GEO_CRON = process.env.HOTEL_GEO_CRON || "45 2 * * *";

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

signalIngestionQueue.add(
  "fetch-normalize-signals",
  { trigger: "scheduled" },
  {
    repeat: { pattern: SIGNAL_CRON },
    removeOnComplete: 100,
    removeOnFail: 50,
  }
);

hotelGeoQueue.add(
  "geocode-hotels",
  { trigger: "scheduled" },
  {
    repeat: { pattern: GEO_CRON },
    removeOnComplete: 100,
    removeOnFail: 50,
  }
);

logger.info({ cron: SIGNAL_CRON }, "Signal ingestion schedule configured");
logger.info({ cron: GEO_CRON }, "Hotel geocode schedule configured");

logger.info("Worker started. Listening for jobs...");

process.on("SIGTERM", async () => {
  logger.info("Shutting down worker...");
  await scrapeWorker.close();
  await recWorker.close();
  await signalIngestionWorker.close();
  await signalMatchingWorker.close();
  await hotelGeoWorker.close();
  await connection.quit();
  process.exit(0);
});
