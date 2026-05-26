import type { Prisma } from "@hotel-pricing/db";
import { isActionDemo } from "@/lib/revenue-action-display";
import { shouldShowDemoActions } from "@/lib/demo-mode";

export type RevenueActionLike = {
  source: string | null | undefined;
  evidenceJson?: Record<string, unknown> | null | unknown;
};

/** Filter demo/seed actions based on TROSKY_DEMO_MODE / environment. */
export function filterActionsForDemoMode<T extends RevenueActionLike>(
  actions: T[],
  options?: { includeDemo?: boolean }
): T[] {
  const includeDemo = options?.includeDemo ?? shouldShowDemoActions();
  if (includeDemo) return actions;
  return actions.filter((action) => !isActionDemo(action));
}

/** Count demo actions that would be hidden when demo mode is off. */
export function countHiddenDemoActions<T extends RevenueActionLike>(
  actions: T[]
): number {
  if (shouldShowDemoActions()) return 0;
  return actions.filter(isActionDemo).length;
}

/** Active = PENDING, or SNOOZED with snoozedUntil null or in the past */
export function activeRevenueActionWhere(
  now = new Date()
): Prisma.RevenueActionWhereInput {
  return {
    OR: [
      { status: "PENDING" },
      {
        status: "SNOOZED",
        OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: now } }],
      },
    ],
  };
}

export function hotelAccessWhere(
  userId: string,
  role: "ANALYST" | "CLIENT"
): Prisma.HotelWhereInput {
  if (role === "ANALYST") {
    return { status: "ACTIVE" };
  }
  return {
    status: "ACTIVE",
    access: { some: { userId } },
  };
}
