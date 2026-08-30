import { prisma } from "@hotel-pricing/db";
import type {
  ActionConfidence,
  ActionUrgency,
  Event,
  Recommendation,
  RevenueAction,
} from "@hotel-pricing/db";
import { computeWeightedAvg, toDateString } from "@hotel-pricing/shared";
import pino from "pino";
import {
  MIN_RATE_DELTA_CENTS,
  mapConfidenceScore,
  decidePersistAction,
  persistRevenueActionDraft,
  type PersistableActionDraft,
} from "./revenue-action-builder";

const logger = pino({ name: "demand-action-builder" });

const SOURCE = "EVENT_DEMAND";
const EVIDENCE_SOURCE = "event-demand-worker";
const EVENT_PRICING_MAX_DAYS = 14;
const WATCH_EVENT_MIN_DAYS = 8;
const WATCH_EVENT_MAX_DAYS = 14;

export type UpsertDemandAndEventActionsInput = {
  hotelId: string;
  recomputeWindowStart: Date;
  recomputeWindowEnd: Date;
};

export type UpsertDemandAndEventActionsResult = {
  hotelId: string;
  eventsInspected: number;
  recommendationsInspected: number;
  eventPricingCreated: number;
  eventPricingUpdated: number;
  watchDemandCreated: number;
  watchDemandUpdated: number;
  skipped: number;
};

type DateContext = {
  currentCents: number | null;
  recommendedCents: number | null;
  compReferenceCents: number | null;
  rateGapCents: number | null;
};

function daysUntil(stayDate: Date, today: Date): number {
  const msPerDay = 86400000;
  return Math.floor((stayDate.getTime() - today.getTime()) / msPerDay);
}

export function eventUrgency(daysAway: number): ActionUrgency | null {
  if (daysAway < 0) return null;
  if (daysAway <= 3) return "CRITICAL";
  if (daysAway <= 7) return "HIGH";
  if (daysAway <= 14) return "MEDIUM";
  return null;
}

function demandLevelFromUrgency(urgency: ActionUrgency): string {
  if (urgency === "CRITICAL" || urgency === "HIGH") return "HIGH";
  return "MEDIUM";
}

export function buildEventPricingActionKey(
  eventId: string,
  dateStr: string
): string {
  return `event-pricing:${eventId}:${dateStr}`;
}

export function buildWatchDemandEventActionKey(
  eventId: string,
  dateStr: string
): string {
  return `watch-demand:${dateStr}:event:${eventId}`;
}

export function buildWatchDemandRecommendationActionKey(
  recommendationId: string,
  dateStr: string
): string {
  return `watch-demand:${dateStr}:recommendation:${recommendationId}`;
}

function isHighUrgency(urgency: ActionUrgency): boolean {
  return urgency === "HIGH" || urgency === "CRITICAL";
}

function activeActionsForDate(
  actionsByDate: Map<string, RevenueAction[]>,
  dateStr: string
): RevenueAction[] {
  return actionsByDate.get(dateStr) ?? [];
}

function hasBlockingHighUrgencyAction(
  actions: RevenueAction[],
  types?: RevenueAction["type"][]
): boolean {
  return actions.some(
    (a) =>
      (!types || types.includes(a.type)) && isHighUrgency(a.urgency)
  );
}

function hasActiveActionType(
  actions: RevenueAction[],
  type: RevenueAction["type"]
): boolean {
  return actions.some((a) => a.type === type);
}

function rateEvidence(ctx: DateContext): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (ctx.currentCents != null) out.currentRateCents = ctx.currentCents;
  if (ctx.recommendedCents != null) out.recommendedRateCents = ctx.recommendedCents;
  if (ctx.compReferenceCents != null) {
    out.compReferenceCents = ctx.compReferenceCents;
    out.compMedianCents = ctx.compReferenceCents;
  }
  if (ctx.rateGapCents != null) out.rateGapCents = ctx.rateGapCents;
  return out;
}

function buildEventPricingDraft(input: {
  event: Event;
  today: Date;
  daysAway: number;
  urgency: ActionUrgency;
  ctx: DateContext;
  linkedPriceActionExists: boolean;
}): PersistableActionDraft {
  const dateStr = toDateString(input.event.date);
  const confidence: ActionConfidence = input.event.title?.trim()
    ? "HIGH"
    : "MEDIUM";
  const demandLevel = demandLevelFromUrgency(input.urgency);
  const title = `Review event pricing for ${input.event.title}`;
  const summary = `${input.event.title} is ${input.daysAway} day${input.daysAway === 1 ? "" : "s"} away. Review pricing and competitor movement for this stay date.`;
  const reason =
    "Trosky found an upcoming event inside the pricing window. Event-driven demand can move rates quickly, so this date should be reviewed alongside competitor rates and current recommendations.";

  return {
    actionKey: buildEventPricingActionKey(input.event.id, dateStr),
    stayDate: input.event.date,
    title,
    summary,
    reason,
    urgency: input.urgency,
    confidence,
    currentValueCents: input.ctx.currentCents,
    recommendedValueCents: input.ctx.recommendedCents,
    estimatedUpsideLowCents: null,
    estimatedUpsideHighCents: null,
    sourceEntityId: input.event.id,
    evidenceJson: {
      eventId: input.event.id,
      eventName: input.event.title,
      eventType: "HOTEL_EVENT",
      eventDate: dateStr,
      eventDaysAway: input.daysAway,
      demandLevel,
      linkedPriceActionExists: input.linkedPriceActionExists,
      source: EVIDENCE_SOURCE,
      generatedAt: new Date().toISOString(),
      ...rateEvidence(input.ctx),
    },
  };
}

function buildWatchDemandFromEventDraft(input: {
  event: Event;
  today: Date;
  daysAway: number;
  ctx: DateContext;
}): PersistableActionDraft {
  const dateStr = toDateString(input.event.date);
  const label = input.event.date.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

  return {
    actionKey: buildWatchDemandEventActionKey(input.event.id, dateStr),
    stayDate: input.event.date,
    title: `Monitor event demand for ${input.event.title}`,
    summary:
      "Demand may be building ahead of this event, but Trosky does not yet recommend a rate change.",
    reason:
      "This action is a watch item. It is intended to keep the date visible without recommending a price change yet.",
    urgency: "MEDIUM",
    confidence: "MEDIUM",
    currentValueCents: input.ctx.currentCents,
    recommendedValueCents: input.ctx.recommendedCents,
    estimatedUpsideLowCents: null,
    estimatedUpsideHighCents: null,
    sourceEntityId: input.event.id,
    evidenceJson: {
      watchReason: "event-window",
      eventId: input.event.id,
      eventName: input.event.title,
      eventDate: dateStr,
      eventDaysAway: input.daysAway,
      demandLevel: "MEDIUM",
      source: EVIDENCE_SOURCE,
      generatedAt: new Date().toISOString(),
      ...rateEvidence(input.ctx),
    },
  };
}

function buildWatchDemandFromRecommendationDraft(input: {
  recommendation: Recommendation;
  today: Date;
  daysAway: number;
  ctx: DateContext;
  deltaCents: number;
}): PersistableActionDraft {
  const dateStr = toDateString(input.recommendation.date);
  const label = input.recommendation.date.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

  return {
    actionKey: buildWatchDemandRecommendationActionKey(
      input.recommendation.id,
      dateStr
    ),
    stayDate: input.recommendation.date,
    title: `Watch demand for ${label}`,
    summary:
      "Demand may be building, but Trosky does not yet recommend a rate change.",
    reason:
      "This action is a watch item. A recommendation exists with moderate confidence, but the rate delta is below the price-change threshold.",
    urgency: "MEDIUM",
    confidence: mapConfidenceScore(input.recommendation.confidence) ?? "MEDIUM",
    currentValueCents: input.ctx.currentCents,
    recommendedValueCents: input.ctx.recommendedCents,
    estimatedUpsideLowCents: null,
    estimatedUpsideHighCents: null,
    sourceEntityId: input.recommendation.id,
    evidenceJson: {
      watchReason: "recommendation-below-threshold",
      recommendationId: input.recommendation.id,
      eventDate: dateStr,
      eventDaysAway: input.daysAway,
      rateDeltaCents: input.deltaCents,
      source: EVIDENCE_SOURCE,
      generatedAt: new Date().toISOString(),
      ...rateEvidence(input.ctx),
    },
  };
}

async function upsertDraft(
  hotelId: string,
  type: RevenueAction["type"],
  draft: PersistableActionDraft,
  now: Date
): Promise<"created" | "updated" | "skipped"> {
  const existing = await prisma.revenueAction.findUnique({
    where: {
      hotelId_actionKey: { hotelId, actionKey: draft.actionKey },
    },
  });
  const decision = decidePersistAction(existing, draft, now, {
    allowReview: false,
  });
  return persistRevenueActionDraft(
    hotelId,
    type,
    SOURCE,
    draft,
    existing,
    decision,
    now
  );
}

export async function upsertDemandAndEventActionsForHotel(
  input: UpsertDemandAndEventActionsInput
): Promise<UpsertDemandAndEventActionsResult> {
  const now = new Date();
  const today = new Date(input.recomputeWindowStart);
  today.setUTCHours(0, 0, 0, 0);

  const [events, recommendations, hotelRates, overrides, competitors, activeActions] =
    await Promise.all([
      prisma.event.findMany({
        where: {
          hotelId: input.hotelId,
          date: {
            gte: input.recomputeWindowStart,
            lte: input.recomputeWindowEnd,
          },
        },
        orderBy: { date: "asc" },
      }),
      prisma.recommendation.findMany({
        where: {
          hotelId: input.hotelId,
          date: {
            gte: input.recomputeWindowStart,
            lte: input.recomputeWindowEnd,
          },
        },
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
      prisma.revenueAction.findMany({
        where: {
          hotelId: input.hotelId,
          stayDate: {
            gte: input.recomputeWindowStart,
            lte: input.recomputeWindowEnd,
          },
          OR: [
            { status: "PENDING" },
            {
              status: "SNOOZED",
              OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: now } }],
            },
          ],
        },
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

  const actionsByDate = new Map<string, RevenueAction[]>();
  for (const action of activeActions) {
    if (!action.stayDate) continue;
    const key = toDateString(action.stayDate);
    const list = actionsByDate.get(key) ?? [];
    list.push(action);
    actionsByDate.set(key, list);
  }

  const contextForDate = (dateStr: string): DateContext => {
    const currentCents =
      overrideByDate.get(dateStr) ?? hotelRateByDate.get(dateStr) ?? null;
    const rec = recommendations.find((r) => toDateString(r.date) === dateStr);
    const recommendedCents = rec?.recommendedPriceCents ?? null;
    const compItems = compRatesByDate.get(dateStr) ?? [];
    const compAvg = computeWeightedAvg(compItems);
    const compReferenceCents = compAvg > 0 ? Math.round(compAvg) : null;
    const rateGapCents =
      currentCents != null && compReferenceCents != null
        ? currentCents - compReferenceCents
        : null;
    return {
      currentCents: currentCents && currentCents > 0 ? currentCents : null,
      recommendedCents,
      compReferenceCents,
      rateGapCents,
    };
  };

  let eventPricingCreated = 0;
  let eventPricingUpdated = 0;
  let watchDemandCreated = 0;
  let watchDemandUpdated = 0;
  let skipped = 0;

  const eventDatesWithPricing = new Set<string>();

  for (const event of events) {
    const dateStr = toDateString(event.date);
    const daysAway = daysUntil(event.date, today);
    const todayStr = toDateString(today);
    const endStr = toDateString(input.recomputeWindowEnd);

    if (dateStr < todayStr || dateStr > endStr) {
      skipped += 1;
      continue;
    }

    const urgency = eventUrgency(daysAway);
    if (!urgency) {
      skipped += 1;
      continue;
    }

    const dayActions = activeActionsForDate(actionsByDate, dateStr);
    const linkedPriceActionExists = hasActiveActionType(
      dayActions,
      "PRICE_CHANGE"
    );

    if (
      linkedPriceActionExists &&
      hasBlockingHighUrgencyAction(dayActions, ["PRICE_CHANGE"])
    ) {
      skipped += 1;
    } else if (daysAway <= EVENT_PRICING_MAX_DAYS) {
      const draft = buildEventPricingDraft({
        event,
        today,
        daysAway,
        urgency,
        ctx: contextForDate(dateStr),
        linkedPriceActionExists,
      });
      const result = await upsertDraft(
        input.hotelId,
        "EVENT_PRICING",
        draft,
        now
      );
      if (result === "created") eventPricingCreated += 1;
      else if (result === "updated") eventPricingUpdated += 1;
      else skipped += 1;
      eventDatesWithPricing.add(dateStr);
    }

    if (
      daysAway >= WATCH_EVENT_MIN_DAYS &&
      daysAway <= WATCH_EVENT_MAX_DAYS &&
      !hasBlockingHighUrgencyAction(dayActions, [
        "PRICE_CHANGE",
        "EVENT_PRICING",
      ]) &&
      !hasActiveActionType(dayActions, "EVENT_PRICING") &&
      !eventDatesWithPricing.has(dateStr)
    ) {
      const watchDraft = buildWatchDemandFromEventDraft({
        event,
        today,
        daysAway,
        ctx: contextForDate(dateStr),
      });
      const watchResult = await upsertDraft(
        input.hotelId,
        "WATCH_DEMAND",
        watchDraft,
        now
      );
      if (watchResult === "created") watchDemandCreated += 1;
      else if (watchResult === "updated") watchDemandUpdated += 1;
      else skipped += 1;
    }
  }

  for (const recommendation of recommendations) {
    const dateStr = toDateString(recommendation.date);
    const daysAway = daysUntil(recommendation.date, today);
    const todayStr = toDateString(today);
    const endStr = toDateString(input.recomputeWindowEnd);

    if (dateStr < todayStr || dateStr > endStr) {
      skipped += 1;
      continue;
    }

    const confidence = mapConfidenceScore(recommendation.confidence);
    if (!confidence) {
      skipped += 1;
      continue;
    }

    const ctx = contextForDate(dateStr);
    if (ctx.currentCents == null || ctx.currentCents <= 0) {
      skipped += 1;
      continue;
    }
    if (ctx.recommendedCents == null || ctx.recommendedCents <= 0) {
      skipped += 1;
      continue;
    }

    const deltaCents = ctx.recommendedCents - ctx.currentCents;
    if (deltaCents === 0 || Math.abs(deltaCents) >= MIN_RATE_DELTA_CENTS) {
      skipped += 1;
      continue;
    }

    const dayActions = activeActionsForDate(actionsByDate, dateStr);
    if (
      hasBlockingHighUrgencyAction(dayActions, [
        "PRICE_CHANGE",
        "EVENT_PRICING",
      ])
    ) {
      skipped += 1;
      continue;
    }

    if (hasActiveActionType(dayActions, "WATCH_DEMAND")) {
      const alreadyWatch = dayActions.some(
        (a) =>
          a.type === "WATCH_DEMAND" &&
          a.actionKey ===
            buildWatchDemandRecommendationActionKey(
              recommendation.id,
              dateStr
            )
      );
      if (alreadyWatch) {
        skipped += 1;
        continue;
      }
    }

    const watchDraft = buildWatchDemandFromRecommendationDraft({
      recommendation,
      today,
      daysAway,
      ctx,
      deltaCents,
    });
    const watchResult = await upsertDraft(
      input.hotelId,
      "WATCH_DEMAND",
      watchDraft,
      now
    );
    if (watchResult === "created") watchDemandCreated += 1;
    else if (watchResult === "updated") watchDemandUpdated += 1;
    else skipped += 1;
  }

  const result: UpsertDemandAndEventActionsResult = {
    hotelId: input.hotelId,
    eventsInspected: events.length,
    recommendationsInspected: recommendations.length,
    eventPricingCreated,
    eventPricingUpdated,
    watchDemandCreated,
    watchDemandUpdated,
    skipped,
  };

  logger.info(
    {
      ...result,
      windowStart: toDateString(input.recomputeWindowStart),
      windowEnd: toDateString(input.recomputeWindowEnd),
    },
    "Event and demand actions upserted"
  );

  return result;
}
