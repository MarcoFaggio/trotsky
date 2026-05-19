import type { Step } from "react-joyride";

export const ONBOARDING_STORAGE_KEY = "trosky:onboardingComplete";

type BuildStepsOptions = {
  role: "ANALYST" | "CLIENT";
  includeDashboardSteps: boolean;
};

export function buildOnboardingSteps({
  role,
  includeDashboardSteps,
}: BuildStepsOptions): Step[] {
  const isAnalyst = role === "ANALYST";

  const steps: Step[] = [
    {
      target: "body",
      placement: "center",
      title: "Welcome to Trosky",
      content:
        "A guided walkthrough of your revenue cockpit — pricing, demand, competitors, and inbound leads in one place.",
      skipBeacon: true,
    },
    {
      target: '[data-tour="sidebar"]',
      placement: "right",
      title: "Your command center",
      content:
        "Every workflow lives here: dashboard, portfolio, events, pace, promotions, inquiries, and messages.",
    },
    {
      target: '[data-tour="nav-dashboard"]',
      placement: "right",
      title: "Revenue dashboard",
      content:
        "Open a hotel to see rate posture, comp average, occupancy, recommendations, matrix, and calendar views.",
    },
  ];

  if (isAnalyst) {
    steps.push({
      target: '[data-tour="hotel-search"]',
      placement: "bottom",
      title: "Find any hotel instantly",
      content:
        "Search by name or city to jump between properties. Your last selection is remembered.",
    });
    steps.push({
      target: '[data-tour="nav-portfolio"]',
      placement: "right",
      title: "Portfolio overview",
      content:
        "Compare hotels at a glance and drill into any property when you need portfolio-level context.",
    });
  } else {
    steps.push({
      target: '[data-tour="hotel-name"]',
      placement: "bottom",
      title: "Your property",
      content:
        "This is your assigned hotel. All metrics and views are scoped to your property.",
    });
  }

  steps.push({
    target: '[data-tour="nav-inquiries"]',
    placement: "right",
    title: "Inquiries & group demand",
    content:
      "Public leads land here with intent, missing fields, and RFP details — ready for qualification and proposals.",
  });

  if (!isAnalyst) {
    steps.push({
      target: '[data-tour="nav-messages"]',
      placement: "right",
      title: "Message Trosky",
      content:
        "Ask your analyst team for help interpreting pricing, pace, or demand signals.",
    });
  }

  if (includeDashboardSteps) {
    steps.push(
      {
        target: '[data-tour="dashboard-views"]',
        placement: "bottom",
        title: "Three lenses on your dates",
        content:
          "Overview for the story, Matrix for dense comparisons, Calendar for day-by-day operations.",
      },
      {
        target: '[data-tour="dashboard-kpis"]',
        placement: "top",
        title: "Seven-day pulse",
        content:
          "Scan the week at a glance, then click any day to open rate, comp, and recommendation detail.",
      }
    );
  } else {
    steps.push({
      target: '[data-tour="main-content"]',
      placement: "top",
      title: "Your workspace",
      content:
        "Open the dashboard to see KPIs, matrix, and calendar. Use the sidebar anytime to revisit this tour.",
    });
  }

  steps.push({
    target: '[data-tour="user-menu"]',
    placement: "bottom",
    title: "Replay anytime",
    content:
      "Open your profile menu and choose Onboarding to run this tour again. Happy pricing.",
    skipBeacon: true,
  });

  return steps;
}
