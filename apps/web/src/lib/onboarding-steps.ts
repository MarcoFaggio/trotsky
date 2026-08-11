import type { Step } from "react-joyride";
import { pathMatchesRoute } from "./onboarding-navigation";

export const ONBOARDING_STORAGE_KEY = "trosky:onboardingComplete";
/** Bump when tour content changes materially so analysts can re-see auto-start once. */
export const ONBOARDING_TOUR_VERSION = "3";

type Role = "ANALYST" | "CLIENT";

export type TroskyTourStep = Step & {
  /** Navigate here in the step `before` hook (section transitions only). */
  route?: string;
  /** Center interstitial before a new page section. */
  transition?: boolean;
  transitionMessage?: string;
  /** Only include for these roles. */
  roles?: Role[];
  /** Skip automatically if target is missing (optional UI). */
  optional?: boolean;
};

type BuildStepsOptions = {
  role: Role;
  hotelId?: string | null;
};

function step(
  partial: TroskyTourStep,
  role: Role,
  roles?: Role[]
): TroskyTourStep | null {
  if (roles && !roles.includes(role)) return null;
  return partial;
}

export function buildOnboardingSteps({
  role,
  hotelId,
}: BuildStepsOptions): TroskyTourStep[] {
  const isAnalyst = role === "ANALYST";
  const hotelQ = hotelId ? `?hotelId=${encodeURIComponent(hotelId)}` : "";

  const raw: Array<TroskyTourStep | null> = [
    // —— Intro ——
    {
      target: "body",
      placement: "center",
      title: "Welcome to Trosky",
      content:
        "Trosky is a revenue cockpit built around one question: what should you do next? This tour walks through navigation, the command centre, revenue actions, the rate calendar, and the evidence drawer.",
      skipBeacon: true,
    },
    {
      target: "body",
      placement: "center",
      title: "How Trosky is organized",
      content:
        "1. Action — priority tasks on the dashboard and Revenue Actions. 2. Reason — short summaries on each card. 3. Evidence — the drawer with rates, comp reference, and source. 4. Detail — matrices and charts when you need depth.",
      skipBeacon: true,
    },

    // —— Shell: sidebar (every link) ——
    step(
      {
        target: '[data-tour="sidebar"]',
        placement: "right",
        title: "Main navigation",
        content:
          "The sidebar is your map. MVP workflows live at the top: Dashboard (command centre), Rate Calendar, and Revenue Actions.",
      },
      role
    ),
    step(
      {
        target: '[data-tour="nav-dashboard"]',
        placement: "right",
        title: "Dashboard / Command centre",
        content:
          "Your homepage. See urgent actions, estimated upside, priority queue, rate vs comp, and Trosky’s summary — then scroll for the detailed rate matrix.",
      },
      role
    ),
    step(
      {
        target: '[data-tour="nav-rate-calendar"]',
        placement: "right",
        title: "Rate calendar",
        content:
          "30-day scan: urgent (red), watch, healthy (no active action), opportunity, and no-data days. Open evidence from any day with an action.",
      },
      role
    ),
    step(
      {
        target: '[data-tour="nav-actions"]',
        placement: "right",
        title: "Revenue actions",
        content:
          "Full triage queue. Filter by pricing, events, watch demand, demo/beta, or archived. Accept, snooze, reject, or complete when you are an analyst.",
      },
      role
    ),
    step(
      {
        target: '[data-tour="nav-portfolio"]',
        placement: "right",
        title: "Portfolio",
        content: "Compare hotels side by side, then drill into any property.",
        roles: ["ANALYST"],
      },
      role,
      ["ANALYST"]
    ),
    step(
      {
        target: '[data-tour="nav-hotels"]',
        placement: "right",
        title: "Manage hotels",
        content: "Add properties, competitors, and configuration.",
        roles: ["ANALYST"],
      },
      role,
      ["ANALYST"]
    ),
    step(
      {
        target: '[data-tour="nav-events"]',
        placement: "right",
        title: "Events",
        content:
          "Manual and scraped events that feed event-pricing and watch-demand actions.",
      },
      role
    ),
    step(
      {
        target: '[data-tour="nav-occupancy"]',
        placement: "right",
        title: "Occupancy",
        content: "Targets and actuals that inform pacing and strategy.",
        roles: ["ANALYST"],
      },
      role,
      ["ANALYST"]
    ),
    step(
      {
        target: '[data-tour="nav-pace"]',
        placement: "right",
        title: "Pace / OTB",
        content: "On-the-books pace vs targets for forward dates.",
      },
      role
    ),
    step(
      {
        target: '[data-tour="nav-promotions"]',
        placement: "right",
        title: "Promotions",
        content: "Discount and promotion rules that affect recommended rates.",
      },
      role
    ),
    step(
      {
        target: '[data-tour="nav-inquiries"]',
        placement: "right",
        title: "Inquiries",
        content:
          "Inbound leads with intent, missing fields, and RFP details for sales follow-up.",
      },
      role
    ),
    step(
      {
        target: '[data-tour="nav-messages"]',
        placement: "right",
        title: isAnalyst ? "Messages" : "Message Trosky",
        content: isAnalyst
          ? "Collaborate with clients on pricing decisions."
          : "Reach your analyst team when you need help interpreting an action.",
      },
      role
    ),
    step(
      {
        target: '[data-tour="nav-scrapes"]',
        placement: "right",
        title: "Scrape admin",
        content:
          "Monitor competitor scrape jobs and data freshness (analyst only).",
        roles: ["ANALYST"],
      },
      role,
      ["ANALYST"]
    ),

    // —— Top bar ——
    step(
      {
        target: '[data-tour="hotel-search"]',
        placement: "bottom",
        title: "Hotel search",
        content:
          "Switch properties. The command centre, calendar, and action list refresh for the selected hotel. Your last choice is remembered.",
        roles: ["ANALYST"],
      },
      role,
      ["ANALYST"]
    ),
    step(
      {
        target: '[data-tour="hotel-name"]',
        placement: "bottom",
        title: "Your hotel",
        content:
          "Everything is scoped to your assigned property. You can view actions and evidence; workflow changes are managed by your analyst.",
        roles: ["CLIENT"],
      },
      role,
      ["CLIENT"]
    ),
    step(
      {
        target: '[data-tour="top-bar-refresh"]',
        placement: "bottom",
        title: "Refresh data",
        content: "Reload dashboard data after scrapes or worker runs.",
        optional: true,
        roles: ["ANALYST"],
      },
      role,
      ["ANALYST"]
    ),
    step(
      {
        target: '[data-tour="top-bar-add-hotel"]',
        placement: "bottom",
        title: "Add hotel",
        content: "Create a new property in Trosky.",
        roles: ["ANALYST"],
      },
      role,
      ["ANALYST"]
    ),
    step(
      {
        target: '[data-tour="theme-toggle"]',
        placement: "bottom",
        title: "Light / dark mode",
        content: "Toggle appearance. Your preference is saved on this device.",
      },
      role
    ),

    // —— Command centre (single navigation, then walk through) ——
    step(
      {
        target: "body",
        placement: "center",
        title: "Command centre",
        content: "Opening your daily revenue homepage…",
        route: `/dashboard${hotelQ}`,
        transition: true,
        transitionMessage: "Opening command centre…",
        skipBeacon: true,
      },
      role
    ),
    step(
      {
        target: '[data-tour="command-centre"]',
        placement: "top",
        title: "Command centre",
        content:
          "The daily revenue homepage: what needs attention, for which hotel, and whether data is live or demo.",
      },
      role
    ),
    step(
      {
        target: '[data-tour="command-centre-header"]',
        placement: "bottom",
        title: "Scope & freshness",
        content:
          "Hotel or portfolio badge, how many actions need attention, link to the full queue, and latest action evaluation time when available.",
        optional: true,
      },
      role
    ),
    step(
      {
        target: '[data-tour="command-centre-metrics"]',
        placement: "top",
        title: "Key metrics",
        content:
          "Estimated upside (heuristic, not guaranteed), urgent actions, and pending review. Open More metrics for parity demo and events/watch counts.",
      },
      role
    ),
    step(
      {
        target: '[data-tour="command-centre-data-status"]',
        placement: "top",
        title: "Live vs demo data",
        content:
          "System-generated actions come from the recommendation and event workers. Demo seed data is labelled and ranked below live actions.",
        optional: true,
      },
      role
    ),
    step(
      {
        target: '[data-tour="priority-actions"]',
        placement: "top",
        title: "Priority action queue",
        content:
          "Up to four actions on the dashboard. Each card shows type (pricing, event, watch), urgency, confidence, source badge, and rate line when relevant. Open Revenue Actions for the full list.",
      },
      role
    ),
    step(
      {
        target: "body",
        placement: "center",
        title: "Revenue action cards",
        content:
          "Pricing actions show current → suggested rate. Watch items explain demand signals (not rate changes). Analysts: Accept is primary; View evidence and More (Reject, Snooze, Complete) stay available. Clients: View evidence opens the insight drawer.",
        skipBeacon: true,
      },
      role
    ),
    step(
      {
        target: "body",
        placement: "center",
        title: "Evidence drawer",
        content:
          "Opens from View evidence. Sections: recommendation summary (rates or event/watch), why Trosky surfaced this, evidence (comp reference, confidence), source & freshness, estimated upside, and workflow controls. Raw JSON is analyst-only.",
        skipBeacon: true,
      },
      role
    ),
    step(
      {
        target: '[data-tour="command-centre-chart"]',
        placement: "left",
        title: "Rate vs comp median",
        content:
          "14-day view of your rate against weighted comp median from available scrapes.",
      },
      role
    ),
    step(
      {
        target: '[data-tour="command-centre-explanation"]',
        placement: "left",
        title: "Why Trosky surfaced these",
        content:
          "Deterministic summary from Trosky rules — not an LLM forecast. Explains the current action mix in plain language.",
      },
      role
    ),
    step(
      {
        target: '[data-tour="dashboard-tab-market"]',
        placement: "bottom",
        title: "Market detail",
        content:
          "Switch to Market for the rate matrix, competitor cards, and calendar without leaving the dashboard.",
        optional: true,
      },
      role
    ),

    // —— Revenue Actions ——
    step(
      {
        target: "body",
        placement: "center",
        title: "Revenue Actions",
        content: "Opening your full action queue for triage…",
        route: `/actions${hotelQ}`,
        transition: true,
        transitionMessage: "Opening Revenue Actions…",
        skipBeacon: true,
      },
      role
    ),
    step(
      {
        target: '[data-tour="actions-page"]',
        placement: "top",
        title: "Revenue Actions page",
        content:
          "Operational triage for one hotel. Analysts manage workflow; clients have a read-only view with the same evidence.",
      },
      role
    ),
    step(
      {
        target: '[data-tour="actions-filters"]',
        placement: "bottom",
        title: "Filters",
        content:
          "Active, Pricing, Events, Watch, Demo/beta, and Archived. Hotel selector appears when you manage multiple properties.",
      },
      role
    ),
    step(
      {
        target: '[data-tour="actions-queue"]',
        placement: "top",
        title: "Action list",
        content:
          "Same cards as the command centre, with full list and filters. Demo items show a Demo data badge; live worker output shows System-generated.",
      },
      role
    ),

    // —— Rate calendar ——
    step(
      {
        target: "body",
        placement: "center",
        title: "Rate calendar",
        content: "Opening the 30-day rate calendar…",
        route: `/rate-calendar${hotelQ}`,
        transition: true,
        transitionMessage: "Opening Rate Calendar…",
        skipBeacon: true,
      },
      role
    ),
    step(
      {
        target: '[data-tour="calendar-page"]',
        placement: "top",
        title: "Rate calendar",
        content:
          "Scan 30 days in under five seconds. Red is urgent; healthy means no active action; no data is quiet, not an error.",
      },
      role
    ),
    step(
      {
        target: '[data-tour="calendar-summary"]',
        placement: "bottom",
        title: "Calendar summary",
        content:
          "Counts of urgent, watch, opportunity, healthy dates, and total active actions in the window.",
      },
      role
    ),
    step(
      {
        target: '[data-tour="calendar-grid"]',
        placement: "top",
        title: "Day cards",
        content:
          "Each day: your rate, comp reference (from scrapes, not a guaranteed median), gap vs comp, action count, and View evidence when an action exists.",
      },
      role
    ),

    // —— Close ——
    step(
      {
        target: "body",
        placement: "center",
        title: isAnalyst ? "Analyst workflow" : "Client workflow",
        content: isAnalyst
          ? "Review command centre → open evidence → accept or snooze on Revenue Actions → use the calendar for date-level context. Accept records intent only — Trosky does not push rates to a PMS."
          : "Review the command centre and calendar, open evidence to understand recommendations, and message your analyst to act on pricing decisions.",
        skipBeacon: true,
      },
      role
    ),
    step(
      {
        target: '[data-tour="user-menu"]',
        placement: "bottom",
        title: "Replay anytime",
        content:
          "Profile menu → Product tour. Clear site data or ask your admin if you need the first-run tour again on a new device.",
        skipBeacon: true,
      },
      role
    ),
  ];

  return raw.filter((s): s is TroskyTourStep => s != null);
}

/** Steps whose targets exist on the current route (for prefetch). */
export function getStepsForCurrentRoute(
  steps: TroskyTourStep[],
  pathname: string
): TroskyTourStep[] {
  return steps.filter((s) => !s.route || pathMatchesRoute(pathname, s.route));
}
