import { Queue } from "bullmq";
import Redis from "ioredis";

export async function queueRecommendationRecompute(
  hotelId: string,
  trigger: string
): Promise<void> {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    return;
  }

  try {
    const connection = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
    });
    const queue = new Queue("recommendation-queue", { connection });
    try {
      await queue.add(
        "recompute-recommendations",
        { hotelId, trigger },
        { removeOnComplete: 100, removeOnFail: 50 }
      );
      await queue.close();
    } finally {
      await connection.quit();
    }
  } catch (err) {
    console.warn("Failed to queue recommendation recompute", {
      hotelId,
      trigger,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
