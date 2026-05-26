import { prisma } from "@hotel-pricing/db";
import type {
  ActionConfidence,
  ActionUrgency,
  Prisma,
  Recommendation,
  RevenueAction,
} from "@hotel-pricing/db";
import { computeWeightedAvg, toDateString } from "@hotel-pricing/shared";
import pino from "pino";

const logger = pino({ name: "revenue-action-builder" });

export const MIN_RATE_DELTA_CENTS = 1000;
const MIN_CONFIDENCE_SCORE = 0.45;
const MATERIAL_VALUE_SHIFT_CENTS = 1000;

export type UpsertPriceChangeActionsInput = {
  hotelId: string;
  recomputeWindowStart: Date;
  recomputeWindowEnd: Date;
};

export type UpsertPriceChangeActionsResult = {
  hotelId: string;
  inspected: number;
  created: number;
  updated: number;
  skipped: number;
  reviewActionsCreated: number;
};

export function buildPriceChangeActionKey(dateStr: string): string {
  return `price-change:${dateStr}:default`;
}

export function buildPriceChangeReviewActionKey(dateStr: string): string {
  return `price-change-review:${dateStr}:default`;
}

export function mapConfidenceScore(score: number): ActionConfidence | null {
  if (score < MIN_CONFIDENCE_SCORE) return null;
  if (score >= 0.75) return "HIGH";
  return "MEDIUM";
}

export function deriveUrgency(
  deltaCents: number,
  stayDate: Date,
  today: Date
): ActionUrgency {
  const abs = Math.abs(deltaCents);
  const msPerDay = 86400000;
  const daysUntil = Math.floor(
    (stayDate.getTime() - today.getTime()) / msPerDay
  );

  if (daysUntil <= 3 && abs >= 2500) return "CRITICAL";
  if (abs >= 2000) return "HIGH";
  if (abs >= 1000) return "MEDIUM";
  return "LOW";
}

function formatStayDateLabel(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function formatMoney(cents: number): string {
  return `$${Math.round(cents / 100)}`;
}

export function buildActionTitle(
  stayDate: Date,
  currentCents: number,
  recommendedCents: number
): string {
  const label = formatStayDateLabel(stayDate);
  if (recommendedCents > currentCents) {
    return `Raise ${label} to ${formatMoney(recommendedCents)}`;
  }
  if (recommendedCents < currentCents) {
    return `Lower ${label} to ${formatMoney(recommendedCents)}`;
  }
  return `Review rate for ${label}`;
}

export type PriceChangeDraft = {
  actionKey: string;
  stayDate: Date;
  title: string;
  summary: string;
  reason: string;
  urgency: ActionUrgency;
  confidence: ActionConfidence;
  currentValueCents: number;
  recommendedValueCents: number;
  estimatedUpsideLowCents: number | null;
  estimatedUpsideHighCents: number | null;
  evidenceJson: Prisma.InputJsonValue;
  sourceEntityId: string;
};

export function qualifiesForPriceChangeAction(input: {
  stayDate: Date;
  today: Date;
  windowEnd: Date;
  currentCents: number;
  recommendedCents: number;
  confidenceScore: number;
}): { ok: true } | { ok: false; reason: string } {
  const dateStr = toDateString(input.stayDate);
  const todayStr = toDateString(input.today);
  const endStr = toDateString(input.windowEnd);

  if (dateStr < todayStr) {
    return { ok: false, reason: "past_stay_date" };
  }
  if (dateStr > endStr) {
    return { ok: false, reason: "outside_window" };
  }
  if (input.currentCents <= 0) {
    return { ok: false, reason: "missing_current_rate" };
  }
  if (input.recommendedCents <= 0) {
    return { ok: false, reason: "missing_recommended_rate" };
  }
  if (input.recommendedCents === input.currentCents) {
    return { ok: false, reason: "no_delta" };
  }
  const delta = Math.abs(input.recommendedCents - input.currentCents);
  if (delta < MIN_RATE_DELTA_CENTS) {
    return { ok: false, reason: "delta_too_small" };
  }
  if (input.confidenceScore < MIN_CONFIDENCE_SCORE) {
    return { ok: false, reason: "low_confidence" };
  }
  return { ok: true };
}

export function buildPriceChangeDraft(input: {
  recommendation: Recommendation;
  stayDate: Date;
  today: Date;
  windowEnd: Date;
  currentCents: number;
  recommendedCents: number;
  compMedianCents: number | null;
}): PriceChangeDraft | null {
  const confidence = mapConfidenceScore(input.recommendation.confidence);
  if (!confidence) return null;

  const qualify = qualifiesForPriceChangeAction({
    stayDate: input.stayDate,
    today: input.today,
    windowEnd: input.windowEnd,
    currentCents: input.currentCents,
    recommendedCents: input.recommendedCents,
    confidenceScore: input.recommendation.confidence,
  });
  if (!qualify.ok) return null;

  const deltaCents = input.recommendedCents - input.currentCents;
  const dateStr = toDateString(input.stayDate);
  const rationale = Array.isArray(input.recommendation.rationaleJson)
    ? (input.recommendation.rationaleJson as string[])
    : [];

  const summary =
    rationale[0] ??
    `Trosky recommends ${formatMoney(input.recommendedCents)} vs current ${formatMoney(input.currentCents)}.`;

  const rateGapCents =
    input.compMedianCents != null
      ? input.currentCents - input.compMedianCents
      : null;

  const upsideBase = deltaCents > 0 ? deltaCents : 0;

  return {
    actionKey: buildPriceChangeActionKey(dateStr),
    stayDate: input.stayDate,
    title: buildActionTitle(
      input.stayDate,
      input.currentCents,
      input.recommendedCents
    ),
    summary,
    reason: rationale.join(" "),
    urgency: deriveUrgency(deltaCents, input.stayDate, input.today),
    confidence,
    currentValueCents: input.currentCents,
    recommendedValueCents: input.recommendedCents,
    estimatedUpsideLowCents: upsideBase > 0 ? upsideBase : null,
    estimatedUpsideHighCents:
      upsideBase > 0 ? Math.round(upsideBase * 1.5) : null,
    evidenceJson: {
      currentRateCents: input.currentCents,
      recommendedRateCents: input.recommendedCents,
      rateDeltaCents: deltaCents,
      compMedianCents: input.compMedianCents,
      rateGapCents,
      confidence,
      urgency: deriveUrgency(deltaCents, input.stayDate, input.today),
      source: "recommendation-worker",
      recommendationId: input.recommendation.id,
      generatedAt: new Date().toISOString(),
      rationale,
    },
    sourceEntityId: input.recommendation.id,
  };
}

type PersistDecision = "create" | "update" | "touch" | "skip" | "review";

export type PersistableActionDraft = {
  actionKey: string;
  stayDate: Date;
  title: string;
  summary: string;
  reason: string;
  urgency: ActionUrgency;
  confidence: ActionConfidence;
  currentValueCents: number | null;
  recommendedValueCents: number | null;
  estimatedUpsideLowCents: number | null;
  estimatedUpsideHighCents: number | null;
  evidenceJson: Prisma.InputJsonValue;
  sourceEntityId: string | null;
};

export function decidePersistAction(
  existing: RevenueAction | null,
  draft: PersistableActionDraft,
  now: Date,
  options?: { allowReview?: boolean }
): PersistDecision {
  if (!existing) return "create";

  if (existing.status === "PENDING") return "update";

  if (existing.status === "SNOOZED") {
    if (existing.snoozedUntil && existing.snoozedUntil > now) {
      return "touch";
    }
    return "update";
  }

  if (existing.status === "ACCEPTED") {
    const acceptedRec = existing.recommendedValueCents ?? 0;
    const nextRec = draft.recommendedValueCents ?? 0;
    if (
      options?.allowReview !== false &&
      draft.recommendedValueCents != null &&
      Math.abs(nextRec - acceptedRec) >= MATERIAL_VALUE_SHIFT_CENTS
    ) {
      return "review";
    }
    return "touch";
  }

  if (existing.status === "REJECTED" || existing.status === "COMPLETED") {
    return "touch";
  }

  if (existing.status === "EXPIRED") {
    const todayStr = toDateString(now);
    const stayStr = toDateString(draft.stayDate);
    if (stayStr >= todayStr) return "update";
    return "touch";
  }

  return "skip";
}

export function expiresAtForStayDate(stayDate: Date): Date {
  const d = new Date(stayDate);
  d.setUTCDate(d.getUTCDate() + 1);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

export async function persistRevenueActionDraft(
  hotelId: string,
  type: RevenueAction["type"],
  source: string,
  draft: PersistableActionDraft,
  existing: RevenueAction | null,
  decision: PersistDecision,
  now: Date
): Promise<"created" | "updated" | "skipped"> {
  const expiresAt = expiresAtForStayDate(draft.stayDate);

  if (decision === "create") {
    await prisma.revenueAction.create({
      data: {
        hotelId,
        actionKey: draft.actionKey,
        type,
        status: "PENDING",
        title: draft.title,
        summary: draft.summary,
        reason: draft.reason || null,
        urgency: draft.urgency,
        confidence: draft.confidence,
        stayDate: draft.stayDate,
        currentValueCents: draft.currentValueCents,
        recommendedValueCents: draft.recommendedValueCents,
        estimatedUpsideLowCents: draft.estimatedUpsideLowCents,
        estimatedUpsideHighCents: draft.estimatedUpsideHighCents,
        evidenceJson: draft.evidenceJson,
        source,
        sourceEntityId: draft.sourceEntityId,
        lastEvaluatedAt: now,
        expiresAt,
      },
    });
    return "created";
  }

  if (decision === "update" && existing) {
    await prisma.revenueAction.update({
      where: { id: existing.id },
      data: {
        title: draft.title,
        summary: draft.summary,
        reason: draft.reason || null,
        urgency: draft.urgency,
        confidence: draft.confidence,
        stayDate: draft.stayDate,
        currentValueCents: draft.currentValueCents,
        recommendedValueCents: draft.recommendedValueCents,
        estimatedUpsideLowCents: draft.estimatedUpsideLowCents,
        estimatedUpsideHighCents: draft.estimatedUpsideHighCents,
        evidenceJson: draft.evidenceJson,
        source,
        sourceEntityId: draft.sourceEntityId,
        status: existing.status === "SNOOZED" ? "PENDING" : existing.status,
        lastEvaluatedAt: now,
        expiresAt,
        ...(existing.status === "SNOOZED" ? { snoozedUntil: null } : {}),
      },
    });
    return "updated";
  }

  if (decision === "touch" && existing) {
    await prisma.revenueAction.update({
      where: { id: existing.id },
      data: { lastEvaluatedAt: now },
    });
    return "updated";
  }

  return "skipped";
}

async function persistDraft(
  hotelId: string,
  draft: PriceChangeDraft,
  existing: RevenueAction | null,
  decision: PersistDecision,
  now: Date
): Promise<"created" | "updated" | "skipped"> {
  return persistRevenueActionDraft(
    hotelId,
    "PRICE_CHANGE",
    "RECOMMENDATION",
    draft,
    existing,
    decision,
    now
  );
}

async function persistReviewAction(
  hotelId: string,
  draft: PriceChangeDraft,
  now: Date
): Promise<boolean> {
  const dateStr = toDateString(draft.stayDate);
  const reviewKey = buildPriceChangeReviewActionKey(dateStr);
  const existing = await prisma.revenueAction.findUnique({
    where: { hotelId_actionKey: { hotelId, actionKey: reviewKey } },
  });
  if (existing) return false;

  await prisma.revenueAction.create({
    data: {
      hotelId,
      actionKey: reviewKey,
      type: "PRICE_CHANGE",
      status: "PENDING",
      title: `Re-review ${formatStayDateLabel(draft.stayDate)} rate`,
      summary:
        "Accepted recommendation no longer matches the latest Trosky suggestion.",
      reason: draft.reason || null,
      urgency: draft.urgency,
      confidence: draft.confidence,
      stayDate: draft.stayDate,
      currentValueCents: draft.currentValueCents,
      recommendedValueCents: draft.recommendedValueCents,
      estimatedUpsideLowCents: draft.estimatedUpsideLowCents,
      estimatedUpsideHighCents: draft.estimatedUpsideHighCents,
      evidenceJson: {
        ...(draft.evidenceJson as object),
        reviewOfAccepted: true,
      },
      source: "RECOMMENDATION",
      sourceEntityId: draft.sourceEntityId,
      lastEvaluatedAt: now,
      expiresAt: expiresAtForStayDate(draft.stayDate),
    },
  });
  return true;
}

export async function upsertPriceChangeActionsForHotel(
  input: UpsertPriceChangeActionsInput
): Promise<UpsertPriceChangeActionsResult> {
  const now = new Date();
  const today = new Date(input.recomputeWindowStart);
  today.setHours(0, 0, 0, 0);

  const [recommendations, hotelRates, overrides, competitors] = await Promise.all([
    prisma.recommendation.findMany({
      where: {
        hotelId: input.hotelId,
        date: {
          gte: input.recomputeWindowStart,
          lte: input.recomputeWindowEnd,
        },
      },
      orderBy: { date: "asc" },
    }),
    prisma.dailyRate.findMany({
      where: {
        hotelId: input.hotelId,
        listingType: "HOTEL",
        date: {
          gte: input.recomputeWindowStart,
          lte: input.recomputeWindowEnd,
        },
      },
      orderBy: { scrapedAt: "desc" },
    }),
    prisma.priceOverride.findMany({
      where: {
        hotelId: input.hotelId,
        date: {
          gte: input.recomputeWindowStart,
          lte: input.recomputeWindowEnd,
        },
      },
    }),
    prisma.hotelCompetitor.findMany({
      where: { hotelId: input.hotelId, active: true },
    }),
  ]);

  const competitorIds = competitors.map((c) => c.competitorId);
  const competitorRates =
    competitorIds.length > 0
      ? await prisma.dailyRate.findMany({
          where: {
            competitorId: { in: competitorIds },
            listingType: "COMPETITOR",
            date: {
              gte: input.recomputeWindowStart,
              lte: input.recomputeWindowEnd,
            },
          },
          orderBy: { scrapedAt: "desc" },
        })
      : [];

  const hotelRateByDate = new Map<string, number>();
  for (const rate of hotelRates) {
    const key = toDateString(rate.date);
    if (!hotelRateByDate.has(key)) {
      hotelRateByDate.set(key, rate.priceCents);
    }
  }

  const overrideByDate = new Map(
    overrides.map((o) => [toDateString(o.date), o.overridePriceCents])
  );

  const compRatesByDate = new Map<string, { rate: number; weight: number }[]>();
  for (const link of competitors) {
    for (const rate of competitorRates) {
      if (rate.competitorId !== link.competitorId) continue;
      const key = toDateString(rate.date);
      const list = compRatesByDate.get(key) ?? [];
      list.push({ rate: rate.priceCents, weight: link.weight });
      compRatesByDate.set(key, list);
    }
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let reviewActionsCreated = 0;

  for (const recommendation of recommendations) {
    const dateStr = toDateString(recommendation.date);
    const currentCents =
      overrideByDate.get(dateStr) ?? hotelRateByDate.get(dateStr) ?? 0;
    const compItems = compRatesByDate.get(dateStr) ?? [];
    const compAvg = computeWeightedAvg(compItems);
    const compMedianCents = compAvg > 0 ? Math.round(compAvg) : null;

    const draft = buildPriceChangeDraft({
      recommendation,
      stayDate: recommendation.date,
      today,
      windowEnd: input.recomputeWindowEnd,
      currentCents,
      recommendedCents: recommendation.recommendedPriceCents,
      compMedianCents,
    });

    if (!draft) {
      skipped += 1;
      continue;
    }

    const existing = await prisma.revenueAction.findUnique({
      where: {
        hotelId_actionKey: { hotelId: input.hotelId, actionKey: draft.actionKey },
      },
    });

    const decision = decidePersistAction(existing, draft, now, {
      allowReview: true,
    });

    if (decision === "review") {
      const added = await persistReviewAction(input.hotelId, draft, now);
      if (added) reviewActionsCreated += 1;
      await persistDraft(input.hotelId, draft, existing, "touch", now);
      updated += 1;
      continue;
    }

    const result = await persistDraft(
      input.hotelId,
      draft,
      existing,
      decision,
      now
    );
    if (result === "created") created += 1;
    else if (result === "updated") updated += 1;
    else skipped += 1;
  }

  const result: UpsertPriceChangeActionsResult = {
    hotelId: input.hotelId,
    inspected: recommendations.length,
    created,
    updated,
    skipped,
    reviewActionsCreated,
  };

  logger.info(
    {
      ...result,
      windowStart: toDateString(input.recomputeWindowStart),
      windowEnd: toDateString(input.recomputeWindowEnd),
    },
    "Price change actions upserted from recommendations"
  );

  return result;
}
