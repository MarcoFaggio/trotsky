"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import { useJoyride } from "react-joyride";
import {
  ONBOARDING_STORAGE_KEY,
  buildOnboardingSteps,
} from "@/lib/onboarding-steps";
import { OnboardingProvider } from "./onboarding-context";
import { OnboardingTooltip } from "./onboarding-tooltip";

const joyrideOptions = {
  primaryColor: "hsl(0 99% 33%)",
  backgroundColor: "hsl(var(--card))",
  textColor: "hsl(var(--foreground))",
  arrowColor: "hsl(var(--card))",
  overlayColor: "rgba(15, 15, 15, 0.55)",
  zIndex: 10050,
  spotlightRadius: 12,
  showProgress: false,
} as const;

type OnboardingTourProps = {
  role: "ANALYST" | "CLIENT";
  children: React.ReactNode;
};

export function OnboardingTour({ role, children }: OnboardingTourProps) {
  const pathname = usePathname();
  const hasAutoStarted = useRef(false);

  const includeDashboardSteps =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  const steps = useMemo(
    () => buildOnboardingSteps({ role, includeDashboardSteps }),
    [role, includeDashboardSteps]
  );

  const markComplete = useCallback(() => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "1");
    } catch {
      // ignore storage errors
    }
  }, []);

  const { controls, on, Tour } = useJoyride({
    steps,
    continuous: true,
    scrollToFirstStep: true,
    tooltipComponent: OnboardingTooltip,
    locale: {
      back: "Back",
      close: "Close",
      last: "Done",
      next: "Next",
      skip: "Skip tour",
    },
    options: joyrideOptions,
  });

  const startTour = useCallback(() => {
    controls.reset();
    window.setTimeout(() => controls.start(), 150);
  }, [controls]);

  useEffect(() => {
    return on("tour:end", () => {
      markComplete();
    });
  }, [on, markComplete]);

  useEffect(() => {
    if (hasAutoStarted.current) return;
    hasAutoStarted.current = true;

    try {
      if (localStorage.getItem(ONBOARDING_STORAGE_KEY)) return;
    } catch {
      return;
    }

    const timer = window.setTimeout(() => controls.start(), 1200);
    return () => window.clearTimeout(timer);
  }, [controls]);

  return (
    <OnboardingProvider value={{ startTour }}>
      {children}
      {Tour}
    </OnboardingProvider>
  );
}
