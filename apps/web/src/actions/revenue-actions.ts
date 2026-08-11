"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@hotel-pricing/db";
import type { Prisma } from "@hotel-pricing/db";
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
import { requireHotelAccess, requireRole } from "@/lib/rbac";
import { isActionDemo } from "@/lib/revenue-action-display";
import { shouldShowDemoActions } from "@/lib/demo-mode";
import {
  countHiddenDemoActions,
  filterActionsForDemoMode,
} from "@/services/revenue-action-query-utils";
import {
  mapRevenueAction,
  toEvidenceObject,
} from "@/services/revenue-action-mapper";

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

  const evidenceJson = toEvidenceObject(action.evidenceJson);

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

async function loadRevenueActions(
  hotelId: string,
  filters?: RevenueActionFiltersInput
): Promise<{
  actions: RevenueActionView[];
  hiddenDemoActionCount: number;
}> {
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

  const mapped = actions
    .map(mapRevenueAction)
    .sort(
      (a, b) =>
        (urgencyOrder[a.urgency] ?? 99) - (urgencyOrder[b.urgency] ?? 99)
    );

  return {
    actions: filterActionsForDemoMode(mapped),
    hiddenDemoActionCount: countHiddenDemoActions(mapped),
  };
}

export async function getRevenueActions(
  hotelId: string,
  filters?: RevenueActionFiltersInput
): Promise<RevenueActionView[]> {
  const { actions } = await loadRevenueActions(hotelId, filters);
  return actions;
}

/** Same as getRevenueActions, plus how many demo rows were filtered out. */
export async function getRevenueActionsPageData(
  hotelId: string,
  filters?: RevenueActionFiltersInput
): Promise<{
  actions: RevenueActionView[];
  hiddenDemoActionCount: number;
}> {
  return loadRevenueActions(hotelId, filters);
}

/**
 * COMPLETED and EXPIRED are terminal: an action that has already been actioned
 * or aged out must not be re-decided, or the audit trail (`decidedBy`,
 * `decidedAt`) silently rewrites itself.
 */
const TERMINAL_STATUSES = new Set(["COMPLETED", "EXPIRED"]);

function assertDecidable(status: string) {
  if (TERMINAL_STATUSES.has(status)) {
    throw new Error("INVALID_STATUS");
  }
}

export async function acceptRevenueAction(actionId: string) {
  const { actionId: id } = revenueActionIdSchema.parse({ actionId });
  const { action, session } = await requireRevenueActionAccess(id);
  await requireAnalystForMutation();
  assertDecidable(action.status);

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
  assertDecidable(action.status);

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
  assertDecidable(action.status);

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
  assertDecidable(action.status);

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
  assertDecidable(action.status);

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
  // Per-day action badges and counts surface on the rate calendar too.
  revalidatePath("/rate-calendar");
}
