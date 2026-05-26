import { prisma } from "@hotel-pricing/db";
import type { RevenueAction } from "@hotel-pricing/db";
import type {
  RevenueActionInsightEvidence,
  RevenueActionInsightResult,
  RevenueActionInsightView,
} from "@hotel-pricing/shared";
import { getSession } from "@/lib/auth";
import { isAnalyst } from "@/lib/rbac";
import { isActionDemo } from "@/lib/revenue-action-display";
import { shouldShowDemoActions } from "@/lib/demo-mode";
import { buildRevenueActionInsightExplanation } from "./revenue-action-insight-explanation";

function toDateString(date: Date | null | undefined): string | null {
  return date ? date.toISOString().split("T")[0] : null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function readString(value: unknown): string | null {
  if (typeof value === "string" && value.trim() !== "") return value;
  return null;
}

export function parseRevenueActionEvidence(
  evidenceJson: RevenueAction["evidenceJson"],
  action: Pick<
    RevenueAction,
    | "currentValueCents"
    | "recommendedValueCents"
    | "confidence"
    | "urgency"
    | "source"
    | "sourceEntityId"
  >
): RevenueActionInsightEvidence {
  const raw =
    evidenceJson &&
    typeof evidenceJson === "object" &&
    !Array.isArray(evidenceJson)
      ? evidenceJson
      : null;

  const record = (raw ?? {}) as Record<string, unknown>;

  const currentRateCents =
    readNumber(record.currentRateCents) ?? action.currentValueCents;
  const recommendedRateCents =
    readNumber(record.recommendedRateCents) ?? action.recommendedValueCents;
  const rateDeltaCents =
    readNumber(record.rateDeltaCents) ??
    (currentRateCents != null && recommendedRateCents != null
      ? recommendedRateCents - currentRateCents
      : null);

  const compMedianCents = readNumber(record.compMedianCents);

  return {
    currentRateCents,
    recommendedRateCents,
    rateDeltaCents,
    compMedianCents,
    compReferenceCents: compMedianCents,
    rateGapCents: readNumber(record.rateGapCents),
    confidence: readString(record.confidence) ?? action.confidence,
    urgency: readString(record.urgency) ?? action.urgency,
    recommendationId:
      readString(record.recommendationId) ?? action.sourceEntityId,
    generatedAt: readString(record.generatedAt),
    competitorsSoldOut: readNumber(record.competitorsSoldOut),
    competitorCount: readNumber(record.competitorCount),
    eventName: readString(record.eventName),
    eventDaysAway: readNumber(record.eventDaysAway),
    demandLevel: readString(record.demandLevel),
    watchReason: readString(record.watchReason),
    eventId: readString(record.eventId),
    eventType: readString(record.eventType),
    eventDate: readString(record.eventDate),
    source: readString(record.source) ?? action.source,
    raw: raw ?? null,
  };
}

export function actionHasLimitedEvidence(
  evidence: RevenueActionInsightEvidence,
  action: Pick<
    RevenueAction,
    "currentValueCents" | "recommendedValueCents" | "type"
  >
): boolean {
  const hasRates =
    (evidence.currentRateCents ?? action.currentValueCents) != null &&
    (evidence.recommendedRateCents ?? action.recommendedValueCents) != null;

  if (action.type === "PRICE_CHANGE") {
    const hasContext =
      evidence.compReferenceCents != null ||
      evidence.rateGapCents != null ||
      evidence.recommendationId != null ||
      evidence.generatedAt != null;
    return !hasRates || !hasContext;
  }

  if (action.type === "EVENT_PRICING") {
    return !evidence.eventName && evidence.eventDaysAway == null;
  }

  if (action.type === "WATCH_DEMAND") {
    return !evidence.watchReason && !evidence.eventName;
  }

  return false;
}

function canManageAction(
  role: string,
  status: RevenueAction["status"]
): boolean {
  if (role !== "ANALYST") return false;
  return status === "PENDING" || status === "ACCEPTED";
}

export async function getRevenueActionInsight(
  actionId: string
): Promise<RevenueActionInsightResult> {
  const session = await getSession();
  if (!session) {
    return { status: "forbidden" };
  }

  const action = await prisma.revenueAction.findUnique({
    where: { id: actionId },
    include: {
      hotel: { select: { id: true, name: true } },
    },
  });

  if (!action) {
    return { status: "not_found" };
  }

  if (session.role !== "ANALYST") {
    const access = await prisma.hotelAccess.findFirst({
      where: { userId: session.sub, hotelId: action.hotelId },
    });
    if (!access) {
      return { status: "forbidden" };
    }
  }

  const evidenceJson =
    action.evidenceJson &&
    typeof action.evidenceJson === "object" &&
    !Array.isArray(action.evidenceJson)
      ? (action.evidenceJson as Record<string, unknown>)
      : null;

  if (
    isActionDemo({ source: action.source, evidenceJson }) &&
    !shouldShowDemoActions()
  ) {
    return { status: "not_found" };
  }

  const evidence = parseRevenueActionEvidence(action.evidenceJson, action);
  const deltaCents: number | null =
    action.currentValueCents != null && action.recommendedValueCents != null
      ? action.recommendedValueCents - action.currentValueCents
      : evidence.rateDeltaCents ?? null;

  const limited = actionHasLimitedEvidence(evidence, action);
  const analyst = isAnalyst(session);

  const insight: RevenueActionInsightView = {
    id: action.id,
    hotelId: action.hotelId,
    hotelName: action.hotel.name,
    type: action.type,
    status: action.status,
    title: action.title,
    summary: action.summary,
    reason: action.reason,
    urgency: action.urgency,
    confidence: action.confidence,
    stayDate: toDateString(action.stayDate),
    currentValueCents: action.currentValueCents,
    recommendedValueCents: action.recommendedValueCents,
    deltaCents,
    estimatedUpsideLowCents: action.estimatedUpsideLowCents,
    estimatedUpsideHighCents: action.estimatedUpsideHighCents,
    source: action.source,
    sourceEntityId: action.sourceEntityId,
    actionKey: action.actionKey,
    lastEvaluatedAt: action.lastEvaluatedAt?.toISOString() ?? null,
    expiresAt: action.expiresAt?.toISOString() ?? null,
    evidence,
    explanation: buildRevenueActionInsightExplanation({
      type: action.type,
      summary: action.summary,
      reason: action.reason,
      confidence: action.confidence,
      currentValueCents: action.currentValueCents,
      recommendedValueCents: action.recommendedValueCents,
      deltaCents,
      source: action.source,
      lastEvaluatedAt: action.lastEvaluatedAt?.toISOString() ?? null,
      evidence,
      hasLimitedEvidence: limited,
    }),
    canManage: canManageAction(session.role, action.status),
    canViewRawEvidence: analyst,
    hasLimitedEvidence: limited,
  };

  return { status: "ok", insight };
}
