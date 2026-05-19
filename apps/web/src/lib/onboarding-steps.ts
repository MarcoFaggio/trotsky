import type { Step } from "react-joyride";

export const ONBOARDING_STORAGE_KEY = "trosky:onboardingComplete";

type BuildStepsOptions = {
  role: "ANALYST" | "CLIENT";
};

export function buildOnboardingSteps({ role }: BuildStepsOptions): Step[] {
  const isAnalyst = role === "ANALYST";

  const steps: Step[] = [
    {
      target: "body",
      placement: "center",
      title: "Welcome to Trosky",
      content:
        "A quick tour of pricing, demand, competitors, and inbound leads in one workspace.",
      skipBeacon: true,
    },
    {
      target: '[data-tour="sidebar"]',
      placement: "right",
      title: "Navigation",
      content:
        "Dashboard, portfolio, events, pace, promotions, inquiries, and messages are all here.",
    },
    {
      target: '[data-tour="nav-dashboard"]',
      placement: "right",
      title: "Revenue dashboard",
      content:
        "Pick a hotel to see rates, comp average, occupancy, recommendations, matrix, and calendar.",
    },
  ];

  if (isAnalyst) {
    steps.push({
      target: '[data-tour="hotel-search"]',
      placement: "bottom",
      title: "Hotel search",
      content:
        "Search by name or city to switch properties. Your last selection is saved.",
    });
    steps.push({
      target: '[data-tour="nav-portfolio"]',
      placement: "right",
      title: "Portfolio",
      content:
        "Compare hotels side by side, then open any property for detail.",
    });
  } else {
    steps.push({
      target: '[data-tour="hotel-name"]',
      placement: "bottom",
      title: "Your property",
      content: "Metrics and views are scoped to your assigned hotel.",
    });
  }

  steps.push({
    target: '[data-tour="nav-inquiries"]',
    placement: "right",
    title: "Inquiries",
    content:
      "Leads show up here with intent, missing fields, and RFP details for follow-up.",
  });

  if (!isAnalyst) {
    steps.push({
      target: '[data-tour="nav-messages"]',
      placement: "right",
      title: "Messages",
      content:
        "Reach your analyst team when you need help with pricing or demand.",
    });
  }

  steps.push({
    target: '[data-tour="main-content"]',
    placement: "top",
    title: "Main workspace",
    content:
      "Charts, matrices, and calendars load here once you open a hotel on the dashboard.",
  });

  steps.push({
    target: '[data-tour="user-menu"]',
    placement: "bottom",
    title: "Run this again",
    content:
      "Open your profile menu and choose Product tour anytime you want a refresher.",
    skipBeacon: true,
  });

  return steps;
}
