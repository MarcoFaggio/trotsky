"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@hotel-pricing/db";
import type { Prisma, RevenueAction } from "@hotel-pricing/db";
import {
  rejectRevenueActionSchema,
  revenueActionFiltersSchema,
  revenueActionIdSchema,
  snoozeRevenueActionSchema,
} from "@hotel-pricing/shared";
import type {
  RevenueActionFiltersInput,
  RevenueActionView,
} from "@hotel-pricing/shared";
import { requireAuth, requireHotelAccess, requireRole } from "@/lib/rbac";
import { isActionDemo } from "@/lib/revenue-action-display";
import { shouldShowDemoActions } from "@/lib/demo-mode";
import { filterActionsForDemoMode } from "@/services/revenue-action-query-utils";

function toDateString(date: Date | null | undefined): string | null {
  return date ? date.toISOString().split("T")[0] : null;
}

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
    stayDate: toDateString(action.stayDate),
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

async function requireRevenueActionAccess(actionId: string) {
  const action = await prisma.revenueAction.findUnique({
    where: { id: actionId },
    select: {
      id: true,
      hotelId: true,
      status: true,
      source: true,
      evidenceJson: true,
    },
  });
  if (!action) {
    throw new Error("NOT_FOUND");
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
    throw new Error("NOT_FOUND");
  }

  const session = await requireHotelAccess(action.hotelId);
  return { action, session };
}

/** Analyst-only workflow mutations (accept/reject/snooze/complete/expire). */
async function requireAnalystForMutation() {
  return requireRole("ANALYST");
}

const urgencyOrder: Record<string, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export async function getRevenueActions(
  hotelId: string,
  filters?: RevenueActionFiltersInput
): Promise<RevenueActionView[]> {
  await requireHotelAccess(hotelId);

  const parsedFilters = filters
    ? revenueActionFiltersSchema.parse(filters)
    : {};

  const where: Prisma.RevenueActionWhereInput = {
    hotelId,
    ...(parsedFilters.status ? { status: parsedFilters.status } : {}),
    ...(parsedFilters.type ? { type: parsedFilters.type } : {}),
  };

  const actions = await prisma.revenueAction.findMany({
    where,
    orderBy: [{ stayDate: "asc" }, { createdAt: "desc" }],
  });

  return filterActionsForDemoMode(
    actions
      .map(mapRevenueAction)
      .sort(
        (a, b) =>
          (urgencyOrder[a.urgency] ?? 99) - (urgencyOrder[b.urgency] ?? 99)
      )
  );
}

export async function acceptRevenueAction(actionId: string) {
  const { actionId: id } = revenueActionIdSchema.parse({ actionId });
  const { action, session } = await requireRevenueActionAccess(id);
  await requireAnalystForMutation();

  if (action.status === "COMPLETED" || action.status === "EXPIRED") {
    throw new Error("INVALID_STATUS");
  }

  await prisma.revenueAction.update({
    where: { id },
    data: {
      status: "ACCEPTED",
      decidedById: session.sub,
      decidedAt: new Date(),
      snoozedUntil: null,
    },
  });

  revalidateRevenueActionPaths(action.hotelId);
}

export async function rejectRevenueAction(actionId: string, reason?: string) {
  const parsed = rejectRevenueActionSchema.parse({ actionId, reason });
  const { action, session } = await requireRevenueActionAccess(parsed.actionId);
  await requireAnalystForMutation();

  await prisma.revenueAction.update({
    where: { id: parsed.actionId },
    data: {
      status: "REJECTED",
      decisionNote: parsed.reason ?? null,
      decidedById: session.sub,
      decidedAt: new Date(),
      snoozedUntil: null,
    },
  });

  revalidateRevenueActionPaths(action.hotelId);
}

export async function snoozeRevenueAction(
  actionId: string,
  until: Date | string
) {
  const parsed = snoozeRevenueActionSchema.parse({ actionId, until });
  const snoozeUntil =
    parsed.until instanceof Date ? parsed.until : new Date(parsed.until);

  if (Number.isNaN(snoozeUntil.getTime())) {
    throw new Error("INVALID_DATE");
  }
  if (snoozeUntil.getTime() <= Date.now()) {
    throw new Error("SNOOZE_MUST_BE_FUTURE");
  }

  const { action, session } = await requireRevenueActionAccess(parsed.actionId);
  // Clients: read-only for workflow — snooze reserved for analysts until product defines client ops.
  await requireAnalystForMutation();

  await prisma.revenueAction.update({
    where: { id: parsed.actionId },
    data: {
      status: "SNOOZED",
      snoozedUntil: snoozeUntil,
      decidedById: session.sub,
      decidedAt: new Date(),
    },
  });

  revalidateRevenueActionPaths(action.hotelId);
}

export async function completeRevenueAction(actionId: string) {
  const { actionId: id } = revenueActionIdSchema.parse({ actionId });
  const { action, session } = await requireRevenueActionAccess(id);
  await requireAnalystForMutation();

  await prisma.revenueAction.update({
    where: { id },
    data: {
      status: "COMPLETED",
      decidedById: session.sub,
      decidedAt: new Date(),
    },
  });

  revalidateRevenueActionPaths(action.hotelId);
}

export async function expireRevenueAction(actionId: string) {
  const { actionId: id } = revenueActionIdSchema.parse({ actionId });
  const { action, session } = await requireRevenueActionAccess(id);
  await requireAnalystForMutation();

  await prisma.revenueAction.update({
    where: { id },
    data: {
      status: "EXPIRED",
      decidedById: session.sub,
      decidedAt: new Date(),
    },
  });

  revalidateRevenueActionPaths(action.hotelId);
}

function revalidateRevenueActionPaths(hotelId: string) {
  revalidatePath("/actions");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard", "page");
}
