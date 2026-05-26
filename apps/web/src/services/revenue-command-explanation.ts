import type {
  RevenueActionView,
  RevenueCommandCentreExplanation,
} from "@hotel-pricing/shared";
import { isActionDemo } from "@/lib/revenue-action-display";

export function buildRevenueCommandExplanation(
  actions: RevenueActionView[]
): RevenueCommandCentreExplanation {
  if (actions.length === 0) {
    return {
      headline: "No urgent revenue actions right now",
      body: "Trosky has not found pending revenue actions for this scope. Once scrapes, recommendations, or worker-generated actions are available, they will appear in your priority queue.",
      bullets: [
        "Run a scrape or refresh recommendations to populate live pricing signals.",
        "Seeded demo actions appear after `pnpm db:seed` on development databases.",
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
      "Current actions include seeded demo intelligence; worker-generated actions will replace these in the next phase."
    );
  }
  if (bullets.length === 0) {
    bullets.push("Review each card for evidence, confidence, and estimated upside before accepting.");
  }

  return { headline, body, bullets };
}
