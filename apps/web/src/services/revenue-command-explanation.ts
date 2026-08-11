import type {
  RevenueActionView,
  RevenueCommandCentreExplanation,
} from "@hotel-pricing/shared";
import { isActionDemo } from "@/lib/revenue-action-display";

export type RevenueCommandExplanationOptions = {
  /** Demo actions excluded from the view when demo mode is disabled. */
  hiddenDemoActionCount?: number;
  demoModeEnabled?: boolean;
  /** When false, omit deploy/ops env guidance (client surfaces). */
  includeOpsGuidance?: boolean;
};

export function buildRevenueCommandExplanation(
  actions: RevenueActionView[],
  options?: RevenueCommandExplanationOptions
): RevenueCommandCentreExplanation {
  const hiddenDemoActionCount = options?.hiddenDemoActionCount ?? 0;
  const demoModeEnabled = options?.demoModeEnabled ?? true;
  const includeOpsGuidance = options?.includeOpsGuidance ?? false;

  if (actions.length === 0) {
    if (!demoModeEnabled && hiddenDemoActionCount > 0) {
      if (!includeOpsGuidance) {
        return {
          headline: "No urgent revenue actions right now",
          body: "There are no active revenue actions for your hotel right now. New items will appear here after the next pricing review cycle.",
          bullets: [
            "Open the rate calendar when actions appear to review evidence.",
          ],
        };
      }
      const n = hiddenDemoActionCount;
      return {
        headline: "Demo actions are hidden in this environment",
        body:
          "Seeded revenue actions exist in the database but are filtered out because demo mode is off in production. Enable demo mode for a labelled demo tenant, or generate live actions via the worker.",
        bullets: [
          `${n} seeded demo action${n === 1 ? "" : "s"} currently hidden from this queue.`,
          "Set TROSKY_DEMO_MODE=true on the deploy and redeploy to show labelled demo actions.",
          "Or set REDIS_URL and run the worker so scrapes can create live pricing actions.",
        ],
      };
    }

    if (!includeOpsGuidance) {
      return {
        headline: "No urgent revenue actions right now",
        body: "Trosky has not found pending revenue actions for this scope. Once new pricing or demand items are available, they will appear in your priority queue.",
        bullets: [
          "Check back after the next data refresh.",
          "Open evidence from the rate calendar when actions appear.",
        ],
      };
    }

    return {
      headline: "No urgent revenue actions right now",
      body: "Trosky has not found pending revenue actions for this scope. Once scrapes, recommendations, or worker-generated actions are available, they will appear in your priority queue.",
      bullets: [
        "Run a scrape or refresh recommendations to populate live pricing signals.",
        "Configure REDIS_URL and deploy the worker if scrape/refresh jobs are not running.",
        demoModeEnabled
          ? "If this is an old demo DB, run `SEED_FORCE=true pnpm db:refresh-demo` so seed action stay dates fall in the current window."
          : "Seeded demo actions stay hidden while TROSKY_DEMO_MODE is unset/false in production.",
      ],
    };
  }

  const urgent = actions.filter(
    (a) => a.urgency === "HIGH" || a.urgency === "CRITICAL"
  );
  const priceCount = actions.filter((a) => a.type === "PRICE_CHANGE").length;
  const eventCount = actions.filter(
    (a) => a.type === "EVENT_PRICING" || a.type === "WATCH_DEMAND"
  ).length;
  const parityCount = actions.filter((a) => a.type === "PARITY_FIX").length;
  const inquiryCount = actions.filter((a) => a.type === "INQUIRY_REVIEW").length;
  const mostlyDemo = actions.every(isActionDemo);

  const headline =
    urgent.length > 0
      ? `Today's focus: ${urgent.length} urgent revenue action${urgent.length === 1 ? "" : "s"} need review`
      : "Today's focus: review your revenue action queue";

  const body =
    urgent.length > 0
      ? `Trosky surfaced ${actions.length} active action${actions.length === 1 ? "" : "s"} for this scope. Start with high-urgency pricing and demand items, then work through watch-list and strategy reviews. Accepting an action records your decision only — Trosky does not push rates to a PMS.`
      : `Trosky surfaced ${actions.length} active action${actions.length === 1 ? "" : "s"} without critical urgency. Review pricing, events, and inquiry items when you have bandwidth.`;

  const bullets: string[] = [];

  if (priceCount > 0) {
    bullets.push(
      `${priceCount} pricing action${priceCount === 1 ? "" : "s"} may adjust BAR on upcoming stay dates.`
    );
  }
  if (eventCount > 0) {
    bullets.push(
      `${eventCount} event or demand watch item${eventCount === 1 ? "" : "s"} tie to calendar or pickup signals.`
    );
  }
  if (parityCount > 0) {
    bullets.push(
      `${parityCount} parity item${parityCount === 1 ? "" : "s"} are demo/beta until channel metadata and a live parity engine ship.`
    );
  }
  if (inquiryCount > 0) {
    bullets.push(
      `${inquiryCount} inquiry action${inquiryCount === 1 ? "" : "s"} need sales qualification in the inbox.`
    );
  }
  if (mostlyDemo) {
    bullets.push(
      includeOpsGuidance
        ? "Current actions include seeded demo intelligence; worker-generated actions will replace these in the next phase."
        : "Some items are labelled demo/preview and should not be treated as live hotel intelligence."
    );
  }
  if (bullets.length === 0) {
    bullets.push("Review each card for evidence, confidence, and estimated upside before accepting.");
  }

  return { headline, body, bullets };
}
