import type {
  RevenueActionStatus,
  RevenueActionType,
  RevenueActionView,
} from "@hotel-pricing/shared";
import { toDateString } from "@hotel-pricing/shared";

export type RevenueActionCategoryFilter =
  | "active"
  | "all"
  | "pricing"
  | "events"
  | "watch"
  | "demo"
  | "parity-demo"
  | "inquiries-demo"
  | "strategy"
  | "archived";

export const COMMAND_CENTRE_ACTION_LIMIT = 7;

const URGENCY_RANK: Record<RevenueActionView["urgency"], number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

const TYPE_PRIORITY_RANK: Record<RevenueActionType, number> = {
  PRICE_CHANGE: 0,
  EVENT_PRICING: 1,
  WATCH_DEMAND: 2,
  PARITY_FIX: 3,
  INQUIRY_REVIEW: 4,
  STRATEGY_REVIEW: 5,
};

export type RevenueActionSourceMeta = {
  label: string;
  description: string;
  variant: "live" | "demo" | "neutral";
};

export function isActionDemo(
  action: {
    source: string | null | undefined;
    evidenceJson?: Record<string, unknown> | null | unknown;
  }
): boolean {
  const source = action.source?.trim();
  if (source === "SEED" || source === "seed-demo") return true;

  const ev = action.evidenceJson;
  if (!ev || typeof ev !== "object" || Array.isArray(ev)) return false;

  const record = ev as Record<string, unknown>;
  if (record.source === "seed-demo") return true;
  if (record.demoBeta === true) return true;
  if (record.demo === true) return true;

  const evSource = typeof record.source === "string" ? record.source.toLowerCase() : "";
  if (evSource.includes("seed") || evSource.includes("demo")) return true;

  const normalizedSource = source?.toLowerCase() ?? "";
  if (normalizedSource.includes("seed") || normalizedSource.includes("demo")) {
    return normalizedSource !== "event_demand";
  }

  return false;
}

export function isActionLive(
  action: Pick<RevenueActionView, "source" | "evidenceJson">
): boolean {
  if (isActionDemo(action)) return false;
  return action.source === "RECOMMENDATION" || action.source === "EVENT_DEMAND";
}

export function isActionPastStayDate(
  action: Pick<RevenueActionView, "stayDate">,
  now = new Date()
): boolean {
  if (!action.stayDate) return false;
  const today = now.toISOString().split("T")[0];
  return action.stayDate < today;
}

export function isActionExpired(
  action: Pick<RevenueActionView, "status" | "expiresAt">,
  now = new Date()
): boolean {
  if (action.status === "EXPIRED") return true;
  if (action.expiresAt && new Date(action.expiresAt) < now) return true;
  return false;
}

/** Pending or snoozed (snooze period over), excluding past stay / expiry. */
export function isActionActiveWorkflow(
  action: RevenueActionView,
  now = new Date()
): boolean {
  if (isActionExpired(action, now) || isActionPastStayDate(action, now)) {
    return false;
  }
  if (action.status === "PENDING") return true;
  if (action.status === "SNOOZED") {
    if (!action.snoozedUntil) return true;
    return new Date(action.snoozedUntil) <= now;
  }
  return false;
}

export function isActionArchived(action: RevenueActionView, now = new Date()): boolean {
  if (action.status === "COMPLETED" || action.status === "REJECTED") return true;
  if (isActionExpired(action, now) || isActionPastStayDate(action, now)) return true;
  return false;
}

export function getRevenueActionSourceMeta(
  action: Pick<RevenueActionView, "source" | "evidenceJson" | "type">
): RevenueActionSourceMeta {
  if (isActionDemo(action)) {
    return {
      label: "Demo data",
      description: "Seeded demo action for product preview.",
      variant: "demo",
    };
  }
  if (action.source === "RECOMMENDATION") {
    return {
      label: "Recommendation worker",
      description:
        "Generated from Trosky’s deterministic pricing recommendation engine.",
      variant: "live",
    };
  }
  if (action.source === "EVENT_DEMAND") {
    return {
      label: "Event demand worker",
      description: "Generated from upcoming event and demand-window signals.",
      variant: "live",
    };
  }
  return {
    label: "Trosky action",
    description: "Generated from available Trosky revenue data.",
    variant: "neutral",
  };
}

export function formatRevenueActionTypeLabel(type: RevenueActionType): string {
  switch (type) {
    case "PRICE_CHANGE":
      return "Pricing";
    case "EVENT_PRICING":
      return "Event pricing";
    case "WATCH_DEMAND":
      return "Watch demand";
    case "PARITY_FIX":
      return "Parity";
    case "INQUIRY_REVIEW":
      return "Inquiry";
    case "STRATEGY_REVIEW":
      return "Strategy";
    default:
      return type;
  }
}

export function formatRevenueActionStatusLabel(
  action: RevenueActionView,
  now = new Date()
): string {
  if (isActionPastStayDate(action, now)) return "Past date";
  if (isActionExpired(action, now)) return "Expired";
  if (action.status === "SNOOZED" && action.snoozedUntil) {
    const until = new Date(action.snoozedUntil);
    if (until > now) {
      return `Snoozed until ${until.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })}`;
    }
  }
  const labels: Record<RevenueActionStatus, string> = {
    PENDING: "Pending review",
    ACCEPTED: "Accepted",
    REJECTED: "Rejected",
    SNOOZED: "Snoozed",
    COMPLETED: "Completed",
    EXPIRED: "Expired",
  };
  return labels[action.status] ?? action.status;
}

export function formatUrgencyLabel(urgency: RevenueActionView["urgency"]): string {
  const labels: Record<RevenueActionView["urgency"], string> = {
    CRITICAL: "Critical urgency",
    HIGH: "High urgency",
    MEDIUM: "Medium urgency",
    LOW: "Low urgency",
  };
  return labels[urgency] ?? urgency;
}

export function formatConfidenceLabel(
  confidence: RevenueActionView["confidence"]
): string {
  const labels: Record<RevenueActionView["confidence"], string> = {
    HIGH: "High confidence",
    MEDIUM: "Medium confidence",
    LOW: "Low confidence",
  };
  return labels[confidence] ?? confidence;
}

/** Relative time for trust/freshness labels; null if input missing or invalid. */
export function formatFreshnessRelative(
  iso: string | null | undefined,
  now = new Date()
): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const diffMs = now.getTime() - d.getTime();
  if (diffMs < 0) return "just now";
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 48) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function getLatestActionEvaluationAt(
  actions: Pick<RevenueActionView, "lastEvaluatedAt">[]
): string | null {
  let latest: Date | null = null;
  for (const action of actions) {
    if (!action.lastEvaluatedAt) continue;
    const d = new Date(action.lastEvaluatedAt);
    if (Number.isNaN(d.getTime())) continue;
    if (!latest || d > latest) latest = d;
  }
  return latest?.toISOString() ?? null;
}

export function formatEvaluationFreshnessLine(
  actions: Pick<RevenueActionView, "lastEvaluatedAt">[],
  now = new Date()
): string {
  const latest = getLatestActionEvaluationAt(actions);
  const relative = formatFreshnessRelative(latest, now);
  if (relative) {
    return `Latest action evaluation: ${relative}`;
  }
  return "Evaluation time unavailable";
}

export function getFilterEmptyMessage(
  filter: RevenueActionCategoryFilter,
  isAnalyst: boolean
): string {
  switch (filter) {
    case "archived":
      return "No archived actions yet. Completed, rejected, and expired actions appear here.";
    case "demo":
      return "No demo actions are currently visible for this hotel.";
    case "pricing":
      return "No pricing actions match this filter. Review rate changes will appear here when Trosky surfaces them.";
    case "events":
      return "No event pricing actions match this filter.";
    case "watch":
      return "No watch demand actions match this filter.";
    case "active":
      return isAnalyst
        ? "Trosky has not found active revenue actions for this hotel right now. New pricing, event, and demand actions will appear here after scrapes and recommendation runs."
        : "There are no active revenue actions for your hotel right now. Your analyst will see new items here when Trosky surfaces them.";
    case "all":
      return "No open revenue actions for this hotel.";
    default:
      return "No actions match this filter.";
  }
}

export function matchesCategoryFilter(
  action: RevenueActionView,
  filter: RevenueActionCategoryFilter,
  now = new Date()
): boolean {
  switch (filter) {
    case "active":
      return isActionActiveWorkflow(action, now);
    case "all":
      return !isActionArchived(action, now);
    case "pricing":
      return action.type === "PRICE_CHANGE";
    case "events":
      return action.type === "EVENT_PRICING";
    case "watch":
      return action.type === "WATCH_DEMAND";
    case "demo":
      return isActionDemo(action);
    case "parity-demo":
      return action.type === "PARITY_FIX";
    case "inquiries-demo":
      return action.type === "INQUIRY_REVIEW";
    case "strategy":
      return action.type === "STRATEGY_REVIEW";
    case "archived":
      return isActionArchived(action, now);
    default:
      return true;
  }
}

export function sortActionsForDisplay(
  actions: RevenueActionView[]
): RevenueActionView[] {
  return [...actions].sort((a, b) => {
    const demoA = isActionDemo(a) ? 1 : 0;
    const demoB = isActionDemo(b) ? 1 : 0;
    if (demoA !== demoB) return demoA - demoB;

    const urg =
      (URGENCY_RANK[a.urgency] ?? 99) - (URGENCY_RANK[b.urgency] ?? 99);
    if (urg !== 0) return urg;

    return (
      (TYPE_PRIORITY_RANK[a.type] ?? 99) - (TYPE_PRIORITY_RANK[b.type] ?? 99)
    );
  });
}

/** Active workflow check for Prisma rows (rate calendar, etc.). */
export function isActiveRevenueActionRecord(
  action: {
    status: RevenueActionStatus;
    stayDate: Date | null;
    expiresAt: Date | null;
    snoozedUntil: Date | null;
  },
  now = new Date()
): boolean {
  if (action.stayDate) {
    const today = toDateString(now);
    if (toDateString(action.stayDate) < today) return false;
  }
  if (action.status === "EXPIRED") return false;
  if (action.expiresAt && action.expiresAt < now) return false;
  if (action.status === "PENDING") return true;
  if (action.status === "SNOOZED") {
    if (!action.snoozedUntil) return true;
    return action.snoozedUntil <= now;
  }
  return false;
}

export function filterActiveOperationalActions(
  actions: RevenueActionView[],
  now = new Date()
): RevenueActionView[] {
  return sortActionsForDisplay(
    actions.filter((a) => isActionActiveWorkflow(a, now))
  );
}

export function prioritizeLiveActions(
  actions: RevenueActionView[]
): RevenueActionView[] {
  const sorted = sortActionsForDisplay(actions);
  const live = sorted.filter(isActionLive);
  if (live.length === 0) return sorted;
  const demo = sorted.filter((a) => !isActionLive(a));
  return [...live, ...demo];
}

export function limitCommandCentreActions(
  actions: RevenueActionView[],
  limit = COMMAND_CENTRE_ACTION_LIMIT
): { display: RevenueActionView[]; hiddenCount: number } {
  const prioritized = prioritizeLiveActions(actions);
  return {
    display: prioritized.slice(0, limit),
    hiddenCount: Math.max(0, prioritized.length - limit),
  };
}
