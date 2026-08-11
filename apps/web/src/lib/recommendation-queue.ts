import { getRecommendationQueue } from "@/lib/job-queue";

/** Price-change RevenueActions are upserted in the worker after recompute (see revenue-action-builder). */

export async function queueRecommendationRecompute(
  hotelId: string,
  trigger: string
): Promise<void> {
  const queue = getRecommendationQueue();
  if (!queue) return;

  try {
    await queue.add(
      "recompute-recommendations",
      { hotelId, trigger },
      { removeOnComplete: 100, removeOnFail: 50 }
    );
  } catch (err) {
    // Recompute is a best-effort side effect; never fail the user's mutation.
    console.warn("Failed to queue recommendation recompute", {
      hotelId,
      trigger,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
