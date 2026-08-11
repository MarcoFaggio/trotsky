import type { RevenueAction } from "@hotel-pricing/db";
import type { RevenueActionView } from "@hotel-pricing/shared";

/** Prisma `Json` is `any`-ish; narrow to a plain object or null. */
export function toEvidenceObject(
  value: unknown
): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function toDateString(date: Date | null | undefined): string | null {
  return date ? date.toISOString().split("T")[0] : null;
}

/**
 * Single source of truth for RevenueAction row → client view.
 *
 * Previously duplicated verbatim in the server action and the command-centre
 * service, so a new column had to be added in both or one surface silently
 * dropped it.
 */
export function mapRevenueAction(action: RevenueAction): RevenueActionView {
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
    stayDate: toDateString(action.stayDate),
    currentValueCents: action.currentValueCents,
    recommendedValueCents: action.recommendedValueCents,
    estimatedUpsideLowCents: action.estimatedUpsideLowCents,
    estimatedUpsideHighCents: action.estimatedUpsideHighCents,
    evidenceJson: toEvidenceObject(action.evidenceJson),
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
