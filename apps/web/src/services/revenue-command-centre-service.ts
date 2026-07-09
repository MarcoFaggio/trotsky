import { prisma } from "@hotel-pricing/db";
import type { Prisma, RevenueAction } from "@hotel-pricing/db";
import {
  computeWeightedAvg,
  toDateString,
  startOfTodayUtc,
  addUtcDays,
  type RevenueActionView,
  type RevenueCommandCentreView,
} from "@hotel-pricing/shared";
import { requireAuth } from "@/lib/rbac";
import { buildRevenueCommandExplanation } from "./revenue-command-explanation";
import {
  filterActiveOperationalActions,
  isActionDemo,
  isActionLive,
} from "@/lib/revenue-action-display";
import {
  activeRevenueActionWhere,
  countHiddenDemoActions,
  filterActionsForDemoMode,
  hotelAccessWhere,
} from "./revenue-action-query-utils";
import { shouldShowDemoActions } from "@/lib/demo-mode";

export { activeRevenueActionWhere } from "./revenue-action-query-utils";

const CHART_DAYS = 14;

export type GetRevenueCommandCentreViewInput = {
  userId: string;
  role: "ANALYST" | "CLIENT";
  hotelId?: string;
};

function mapRevenueAction(action: RevenueAction): RevenueActionView {
  const evidence =
    action.evidenceJson &&
    typeof action.evidenceJson === "object" &&
    !Array.isArray(action.evidenceJson)
      ? (action.evidenceJson as Record<string, unknown>)
      : null;

  return {
    id: action.id,
    hotelId: action.hotelId,
    actionKey: action.actionKey,
    type: action.type,
    status: action.status,
    title: action.title,
    summary: action.summary,
    reason: action.reason,
    urgency: action.urgency,
    confidence: action.confidence,
    stayDate: action.stayDate
      ? action.stayDate.toISOString().split("T")[0]
      : null,
    currentValueCents: action.currentValueCents,
    recommendedValueCents: action.recommendedValueCents,
    estimatedUpsideLowCents: action.estimatedUpsideLowCents,
    estimatedUpsideHighCents: action.estimatedUpsideHighCents,
    evidenceJson: evidence,
    source: action.source,
    sourceEntityId: action.sourceEntityId,
    createdAt: action.createdAt.toISOString(),
    updatedAt: action.updatedAt.toISOString(),
    lastEvaluatedAt: action.lastEvaluatedAt?.toISOString() ?? null,
    expiresAt: action.expiresAt?.toISOString() ?? null,
    decidedById: action.decidedById,
    decidedAt: action.decidedAt?.toISOString() ?? null,
    decisionNote: action.decisionNote,
    snoozedUntil: action.snoozedUntil?.toISOString() ?? null,
  };
}

function computeMetrics(actions: RevenueActionView[]) {
  let estimatedUpsideLowCents = 0;
  let estimatedUpsideHighCents = 0;
  const urgentDates = new Set<string>();

  for (const action of actions) {
    let low = action.estimatedUpsideLowCents;
    let high = action.estimatedUpsideHighCents;
    if (low == null && high != null) low = high;
    if (high == null && low != null) high = low;
    if (low != null && high != null) {
      estimatedUpsideLowCents += low;
      estimatedUpsideHighCents += high;
    }
    if (action.urgency === "HIGH" || action.urgency === "CRITICAL") {
      if (action.stayDate) urgentDates.add(action.stayDate);
    }
  }

  const urgentActionCount = actions.filter(
    (a) => a.urgency === "HIGH" || a.urgency === "CRITICAL"
  ).length;

  const parityIssueCount = actions.filter((a) => a.type === "PARITY_FIX").length;
  const eventActionCount = actions.filter(
    (a) => a.type === "EVENT_PRICING" || a.type === "WATCH_DEMAND"
  ).length;

  return {
    estimatedUpsideLowCents,
    estimatedUpsideHighCents,
    urgentActionCount,
    urgentDateCount: urgentDates.size,
    pendingActionCount: actions.length,
    parityIssueCount,
    eventActionCount,
  };
}

async function buildRateChart(hotelId: string): Promise<
  RevenueCommandCentreView["rateChart"]
> {
  const today = startOfTodayUtc();
  const end = addUtcDays(today, CHART_DAYS - 1);

  const [hotelRates, competitorLinks, overrides] = await Promise.all([
    prisma.dailyRate.findMany({
      where: {
        hotelId,
        listingType: "HOTEL",
        date: { gte: today, lte: end },
      },
      orderBy: { date: "asc" },
    }),
    prisma.hotelCompetitor.findMany({
      where: { hotelId, active: true },
      include: {
        competitor: {
          include: {
            dailyRates: {
              where: { date: { gte: today, lte: end } },
              orderBy: { date: "asc" },
            },
          },
        },
      },
    }),
    prisma.priceOverride.findMany({
      where: { hotelId, date: { gte: today, lte: end } },
    }),
  ]);

  const points: RevenueCommandCentreView["rateChart"] = [];

  for (let i = 0; i < CHART_DAYS; i++) {
    const d = addUtcDays(today, i);
    const dateStr = toDateString(d);

    const override = overrides.find((o) => toDateString(o.date) === dateStr);
    const rate = hotelRates.find((r) => toDateString(r.date) === dateStr);
    const yourRateCents =
      override?.overridePriceCents ?? rate?.priceCents ?? null;

    const compRatesForAvg: { rate: number; weight: number }[] = [];
    for (const link of competitorLinks) {
      const compRate = link.competitor.dailyRates.find(
        (r) => toDateString(r.date) === dateStr
      );
      if (compRate?.priceCents != null) {
        compRatesForAvg.push({
          rate: compRate.priceCents,
          weight: link.weight,
        });
      }
    }
    const avg = computeWeightedAvg(compRatesForAvg);
    const compMedianCents = avg > 0 ? Math.round(avg) : null;

    points.push({ date: dateStr, yourRateCents, compMedianCents });
  }

  return points;
}

export async function getRevenueCommandCentreView(
  input: GetRevenueCommandCentreViewInput
): Promise<RevenueCommandCentreView> {
  const session = await requireAuth();
  if (session.sub !== input.userId) {
    throw new Error("FORBIDDEN");
  }

  const now = new Date();
  const hotelFilter = hotelAccessWhere(input.userId, input.role);

  let scopeMode: "PORTFOLIO" | "HOTEL" = "PORTFOLIO";
  let scopeHotelId: string | undefined;
  let scopeHotelName: string | undefined;
  let chartHotelId: string | undefined;
  let chartHotelName: string | undefined;

  if (input.role === "CLIENT") {
    const accessible = await prisma.hotel.findMany({
      where: hotelFilter,
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    if (accessible.length === 0) {
      return emptyCommandCentreView("HOTEL");
    }
    // TODO: multi-hotel client selector when product supports multiple assignments in UI
    const hotel = input.hotelId
      ? accessible.find((h) => h.id === input.hotelId) ?? accessible[0]
      : accessible[0];
    scopeMode = "HOTEL";
    scopeHotelId = hotel.id;
    scopeHotelName = hotel.name;
    chartHotelId = hotel.id;
    chartHotelName = hotel.name;
  } else if (input.hotelId) {
    const hotel = await prisma.hotel.findFirst({
      where: { id: input.hotelId, ...hotelFilter },
      select: { id: true, name: true },
    });
    if (!hotel) {
      throw new Error("FORBIDDEN");
    }
    scopeMode = "HOTEL";
    scopeHotelId = hotel.id;
    scopeHotelName = hotel.name;
    chartHotelId = hotel.id;
    chartHotelName = hotel.name;
  } else {
    const first = await prisma.hotel.findFirst({
      where: hotelFilter,
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    chartHotelId = first?.id;
    chartHotelName = first?.name;
  }

  const actionWhere: Prisma.RevenueActionWhereInput = {
    ...activeRevenueActionWhere(now),
    hotel:
      scopeMode === "HOTEL" && scopeHotelId
        ? { id: scopeHotelId, status: "ACTIVE" }
        : hotelFilter,
  };

  const rawActions = await prisma.revenueAction.findMany({
    where: actionWhere,
    include: { hotel: { select: { name: true } } },
    orderBy: [{ stayDate: "asc" }, { createdAt: "desc" }],
  });

  const actionHotelNames: Record<string, string> = {};
  const allMapped = rawActions.map((row) => {
    actionHotelNames[row.id] = row.hotel.name;
    return mapRevenueAction(row);
  });

  const actionsBeforeDemoFilter = filterActiveOperationalActions(allMapped, now);
  const hiddenDemoActionCount = countHiddenDemoActions(actionsBeforeDemoFilter);
  const actions = filterActionsForDemoMode(actionsBeforeDemoFilter);
  const demoModeEnabled = shouldShowDemoActions();
  const hasLiveActions = actions.some(isActionLive);
  const hasSeededActions = actions.some(isActionDemo);
  const metricsActions =
    hasLiveActions ? actions.filter(isActionLive) : actions;

  const metrics = computeMetrics(metricsActions);
  const explanation = buildRevenueCommandExplanation(actions);

  let rateChart: RevenueCommandCentreView["rateChart"] = [];
  if (chartHotelId) {
    try {
      rateChart = await buildRateChart(chartHotelId);
      const hasAnyRate = rateChart.some(
        (p) => p.yourRateCents != null || p.compMedianCents != null
      );
      if (!hasAnyRate) rateChart = [];
    } catch {
      rateChart = [];
    }
  }

  return {
    scope: {
      mode: scopeMode,
      hotelId: scopeHotelId,
      hotelName: scopeHotelName,
    },
    reviewedAt: now.toISOString(),
    metrics,
    actions,
    actionHotelNames,
    rateChart,
    chartHotelName,
    explanation,
    hasSeededActions,
    hasLiveActions,
    totalActiveCount: actions.length,
    demoModeEnabled,
    hiddenDemoActionCount,
  };
}

function emptyCommandCentreView(
  mode: "PORTFOLIO" | "HOTEL"
): RevenueCommandCentreView {
  return {
    scope: { mode },
    reviewedAt: new Date().toISOString(),
    metrics: {
      estimatedUpsideLowCents: 0,
      estimatedUpsideHighCents: 0,
      urgentActionCount: 0,
      urgentDateCount: 0,
      pendingActionCount: 0,
      parityIssueCount: 0,
      eventActionCount: 0,
    },
    actions: [],
    actionHotelNames: {},
    rateChart: [],
    explanation: buildRevenueCommandExplanation([]),
    hasSeededActions: false,
    hasLiveActions: false,
    totalActiveCount: 0,
    demoModeEnabled: shouldShowDemoActions(),
    hiddenDemoActionCount: 0,
  };
}
