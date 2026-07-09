"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useJoyride } from "react-joyride";
import {
  ONBOARDING_STORAGE_KEY,
  ONBOARDING_TOUR_VERSION,
  buildOnboardingSteps,
} from "@/lib/onboarding-steps";
import {
  enrichTourSteps,
  pathMatchesRoute,
  type TourNavigationContext,
} from "@/lib/onboarding-navigation";
import { OnboardingProvider } from "./onboarding-context";
import { OnboardingTooltip } from "./onboarding-tooltip";

const joyrideOptions = {
  primaryColor: "hsl(var(--primary))",
  backgroundColor: "hsl(var(--card))",
  textColor: "hsl(var(--foreground))",
  arrowColor: "hsl(var(--card))",
  overlayColor: "rgba(20, 14, 12, 0.58)",
  zIndex: 10050,
  spotlightRadius: 14,
  showProgress: true,
  scrollDuration: 480,
  beforeTimeout: 14_000,
  targetWaitTimeout: 8_000,
  loaderDelay: 120,
  overlayClickAction: false as const,
} as const;

type OnboardingTourProps = {
  role: "ANALYST" | "CLIENT";
  hotelId?: string | null;
  children: React.ReactNode;
};

function isDashboardPath(pathname: string) {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

function storageKeyComplete(): boolean {
  try {
    const version = localStorage.getItem(`${ONBOARDING_STORAGE_KEY}:version`);
    const done = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    return done === "1" && version === ONBOARDING_TOUR_VERSION;
  } catch {
    return false;
  }
}

function markStorageComplete() {
  try {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "1");
    localStorage.setItem(`${ONBOARDING_STORAGE_KEY}:version`, ONBOARDING_TOUR_VERSION);
  } catch {
    // ignore
  }
}

export function OnboardingTour({ role, hotelId, children }: OnboardingTourProps) {
  const pathname = usePathname();
  const router = useRouter();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const hasAutoStarted = useRef(false);
  const onDashboard = isDashboardPath(pathname);

  const [transitionMessage, setTransitionMessage] = useState<string | null>(
    null
  );
  const isTransitioning = transitionMessage != null;

  const navContextRef = useRef<TourNavigationContext>({
    getPathname: () => pathnameRef.current,
    pushRoute: (route) => router.push(route),
    onTransitionStart: (message) => setTransitionMessage(message),
    onTransitionEnd: () => setTransitionMessage(null),
  });

  useEffect(() => {
    navContextRef.current.getPathname = () => pathnameRef.current;
    navContextRef.current.pushRoute = (route) => router.push(route);
    navContextRef.current.onTransitionStart = (message) =>
      setTransitionMessage(message);
    navContextRef.current.onTransitionEnd = () => setTransitionMessage(null);
  }, [router]);

  const baseSteps = useMemo(
    () => buildOnboardingSteps({ role, hotelId }),
    [role, hotelId]
  );

  const steps = useMemo(
    () => enrichTourSteps(baseSteps, navContextRef),
    [baseSteps]
  );

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
      open: "Continue",
    },
    options: joyrideOptions,
  });

  const startTour = useCallback(() => {
    setTransitionMessage(null);
    controls.reset();

    const dashboardRoute = hotelId
      ? `/dashboard?hotelId=${encodeURIComponent(hotelId)}`
      : "/dashboard";

    if (!pathMatchesRoute(pathnameRef.current, dashboardRoute)) {
      router.push(dashboardRoute);
      window.setTimeout(() => controls.start(), 700);
      return;
    }

    window.setTimeout(() => controls.start(), 280);
  }, [controls, hotelId, router]);

  useEffect(() => {
    return on("tour:end", () => {
      markStorageComplete();
      setTransitionMessage(null);
    });
  }, [on]);

  useEffect(() => {
    return on("error:target_not_found", (data, tourControls) => {
      const optional = (data.step as { optional?: boolean } | undefined)?.optional;
      if (optional) {
        tourControls.next();
      }
    });
  }, [on]);

  useEffect(() => {
    if (hasAutoStarted.current || !onDashboard) return;
    hasAutoStarted.current = true;

    if (storageKeyComplete()) return;

    const timer = window.setTimeout(() => {
      startTour();
    }, 1600);
    return () => window.clearTimeout(timer);
  }, [onDashboard, startTour]);

  return (
    <OnboardingProvider
      value={{
        startTour,
        isTransitioning,
        transitionMessage,
      }}
    >
      {children}
      {Tour}
    </OnboardingProvider>
  );
}
