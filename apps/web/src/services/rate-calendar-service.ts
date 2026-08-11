import { prisma } from "@hotel-pricing/db";
import type { RevenueAction } from "@hotel-pricing/db";
import {
  toDateString,
  type ActionUrgency,
  type RateCalendarDayStatus,
  type RateCalendarDayView,
  type RateCalendarView,
} from "@hotel-pricing/shared";
import { requireAuth } from "@/lib/rbac";
import { isActiveRevenueActionRecord } from "@/lib/revenue-action-display";
import {
  activeRevenueActionWhere,
  filterActionsForDemoMode,
  hotelAccessWhere,
} from "./revenue-action-query-utils";

const DEFAULT_DAYS = 30;
/** Upper bound on the calendar window so one request can't scan a year of rows. */
const MAX_DAYS = 120;

const URGENCY_RANK: Record<ActionUrgency, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

/**
 * Identity is never accepted from the caller: `userId` and `role` are read from
 * the verified session inside the function. Only the view parameters below are
 * caller-supplied, and `hotelId` is still checked against the access filter.
 */
export type GetRateCalendarInput = {
  hotelId?: string;
  startDate?: Date;
  days?: number;
};

function readEvidenceNumber(
  evidence: Record<string, unknown> | null,
  key: string
): number | null {
  if (!evidence) return null;
  const v = evidence[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return null;
}

function compReferenceFromEvidence(
  evidence: Record<string, unknown> | null
): number | null {
  if (!evidence) return null;
  return (
    readEvidenceNumber(evidence, "compReferenceCents") ??
    readEvidenceNumber(evidence, "compMedianCents")
  );
}

function parseEvidence(action: RevenueAction): Record<string, unknown> | null {
  if (
    action.evidenceJson &&
    typeof action.evidenceJson === "object" &&
    !Array.isArray(action.evidenceJson)
  ) {
    return action.evidenceJson as Record<string, unknown>;
  }
  return null;
}

function formatDayLabel(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function pickTopAction(actions: RevenueAction[]): RevenueAction | null {
  if (actions.length === 0) return null;
  return [...actions].sort(
    (a, b) =>
      (URGENCY_RANK[a.urgency] ?? 99) - (URGENCY_RANK[b.urgency] ?? 99)
  )[0];
}

function isOpportunityAction(action: RevenueAction): boolean {
  if (action.type !== "PRICE_CHANGE") return false;
  const current = action.currentValueCents;
  const recommended = action.recommendedValueCents;
  if (current == null || recommended == null) return false;
  // Upside: the engine sees room to raise the rate above where it sits today.
  // Recommended cuts surface through urgency (URGENT/WATCH), not as opportunity.
  return recommended > current;
}

function deriveDayStatus(
  actions: RevenueAction[],
  yourRateCents: number | null
): RateCalendarDayStatus {
  const hasData = yourRateCents != null || actions.length > 0;
  if (!hasData) return "NO_DATA";

  const hasUrgent = actions.some(
    (a) => a.urgency === "HIGH" || a.urgency === "CRITICAL"
  );
  if (hasUrgent) return "URGENT";

  const hasWatch = actions.some((a) => a.urgency === "MEDIUM");
  if (hasWatch) return "WATCH";

  if (actions.some(isOpportunityAction)) return "OPPORTUNITY";

  if (yourRateCents != null && actions.length === 0) return "HEALTHY";

  if (actions.length > 0) return "WATCH";

  return "NO_DATA";
}

export async function getRateCalendarView(
  input: GetRateCalendarInput
): Promise<RateCalendarView> {
  const session = await requireAuth();
  const userId = session.sub;
  const role = session.role === "ANALYST" ? "ANALYST" : "CLIENT";

  const now = new Date();
  const requestedDays = input.days ?? DEFAULT_DAYS;
  // Bound the window so a caller can't ask for an unbounded date range.
  const dayCount = Math.min(Math.max(Math.trunc(requestedDays) || DEFAULT_DAYS, 1), MAX_DAYS);
  const start = input.startDate ? new Date(input.startDate) : new Date(now);
  if (Number.isNaN(start.getTime())) {
    throw new Error("INVALID_DATE");
  }
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + dayCount - 1);

  const filter = hotelAccessWhere(userId, role);

  let hotel: { id: string; name: string } | null = null;

  if (role === "CLIENT") {
    const accessible = await prisma.hotel.findMany({
      where: filter,
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    if (accessible.length === 0) {
      return emptyCalendarView(start, end);
    }
    hotel = input.hotelId
      ? accessible.find((h) => h.id === input.hotelId) ?? accessible[0]
      : accessible[0];
  } else {
    if (input.hotelId) {
      hotel = await prisma.hotel.findFirst({
        where: { id: input.hotelId, ...filter },
        select: { id: true, name: true },
      });
    }
    if (!hotel) {
      hotel = await prisma.hotel.findFirst({
        where: filter,
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      });
    }
  }

  if (!hotel) {
    return emptyCalendarView(start, end);
  }

  const [dailyRates, overrides, rawActions] = await Promise.all([
    prisma.dailyRate.findMany({
      where: {
        hotelId: hotel.id,
        listingType: "HOTEL",
        date: { gte: start, lte: end },
      },
      orderBy: { date: "asc" },
    }),
    prisma.priceOverride.findMany({
      where: { hotelId: hotel.id, date: { gte: start, lte: end } },
    }),
    prisma.revenueAction.findMany({
      where: {
        hotelId: hotel.id,
        ...activeRevenueActionWhere(now),
        stayDate: { gte: start, lte: end },
      },
      orderBy: [{ urgency: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  const rateByDate = new Map<string, number>();
  for (const rate of dailyRates) {
    rateByDate.set(toDateString(rate.date), rate.priceCents);
  }
  for (const override of overrides) {
    rateByDate.set(toDateString(override.date), override.overridePriceCents);
  }

  const activeActions = filterActionsForDemoMode(
    rawActions.filter((action) => isActiveRevenueActionRecord(action, now))
  );

  const actionsByDate = new Map<string, RevenueAction[]>();
  for (const action of activeActions) {
    if (!action.stayDate) continue;
    const key = toDateString(action.stayDate);
    const list = actionsByDate.get(key) ?? [];
    list.push(action);
    actionsByDate.set(key, list);
  }

  const todayStr = toDateString(now);
  const days: RateCalendarDayView[] = [];

  for (let i = 0; i < dayCount; i++) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    const dateStr = toDateString(d);
    const dayActions = actionsByDate.get(dateStr) ?? [];
    const top = pickTopAction(dayActions);

    let yourRateCents = rateByDate.get(dateStr) ?? null;
    if (yourRateCents == null && top?.currentValueCents != null) {
      yourRateCents = top.currentValueCents;
    }

    const topEvidence = top ? parseEvidence(top) : null;
    let compReferenceCents = compReferenceFromEvidence(topEvidence);
    if (compReferenceCents == null) {
      for (const action of dayActions) {
        const ref = compReferenceFromEvidence(parseEvidence(action));
        if (ref != null) {
          compReferenceCents = ref;
          break;
        }
      }
    }

    const rateGapCents =
      yourRateCents != null && compReferenceCents != null
        ? yourRateCents - compReferenceCents
        : topEvidence
          ? readEvidenceNumber(topEvidence, "rateGapCents")
          : null;

    const status = deriveDayStatus(dayActions, yourRateCents);

    days.push({
      date: dateStr,
      dayLabel: formatDayLabel(d),
      isToday: dateStr === todayStr,
      yourRateCents,
      compReferenceCents,
      rateGapCents,
      status,
      actionCount: dayActions.length,
      topActionId: top?.id ?? null,
      topActionTitle: top?.title ?? null,
      urgency: top?.urgency ?? null,
      confidence: top?.confidence ?? null,
    });
  }

  const summary = {
    urgentCount: days.filter((d) => d.status === "URGENT").length,
    watchCount: days.filter((d) => d.status === "WATCH").length,
    healthyCount: days.filter((d) => d.status === "HEALTHY").length,
    opportunityCount: days.filter((d) => d.status === "OPPORTUNITY").length,
    actionCount: days.reduce((n, d) => n + d.actionCount, 0),
  };

  return {
    scope: {
      mode: "HOTEL",
      hotelId: hotel.id,
      hotelName: hotel.name,
    },
    startDate: toDateString(start),
    endDate: toDateString(end),
    days,
    summary,
  };
}

function emptyCalendarView(start: Date, end: Date): RateCalendarView {
  return {
    scope: { mode: "HOTEL", hotelId: null, hotelName: null },
    startDate: toDateString(start),
    endDate: toDateString(end),
    days: [],
    summary: {
      urgentCount: 0,
      watchCount: 0,
      healthyCount: 0,
      opportunityCount: 0,
      actionCount: 0,
    },
  };
}
