"use server";

import { revenueActionIdSchema } from "@hotel-pricing/shared";
import type { RevenueActionInsightResult } from "@hotel-pricing/shared";
import { getRevenueActionInsight } from "@/services/revenue-action-insight-service";

export async function fetchRevenueActionInsight(
  actionId: string
): Promise<RevenueActionInsightResult> {
  const { actionId: id } = revenueActionIdSchema.parse({ actionId });
  return getRevenueActionInsight(id);
}
