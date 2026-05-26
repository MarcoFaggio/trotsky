import type { RefObject } from "react";
import type { TroskyTourStep } from "./onboarding-steps";

const DEFAULT_SETTLE_MS = 320;

/** Wait for a CSS selector to appear in the DOM (e.g. after route change). */
export function waitForElement(
  selector: string,
  timeoutMs = 12_000
): Promise<HTMLElement | null> {
  if (typeof document === "undefined") return Promise.resolve(null);

  const existing = document.querySelector<HTMLElement>(selector);
  if (existing) return Promise.resolve(existing);

  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      const el = document.querySelector<HTMLElement>(selector);
      if (el) {
        observer.disconnect();
        clearTimeout(timer);
        resolve(el);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    const timer = window.setTimeout(() => {
      observer.disconnect();
      resolve(document.querySelector<HTMLElement>(selector));
    }, timeoutMs);
  });
}

export function pathMatchesRoute(pathname: string, route: string): boolean {
  const base = route.split("?")[0];
  if (base === "/dashboard") {
    return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  }
  return pathname === base || pathname.startsWith(`${base}/`);
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/** Smoothly bring a tour target into view inside the main scroll area. */
export function scrollElementIntoView(element: HTMLElement): void {
  const main = document.querySelector<HTMLElement>('[data-tour="main-content"]');
  if (main && main.contains(element)) {
    const mainRect = main.getBoundingClientRect();
    const elRect = element.getBoundingClientRect();
    const offset = elRect.top - mainRect.top + main.scrollTop - 72;
    main.scrollTo({ top: Math.max(0, offset), behavior: "smooth" });
    return;
  }
  element.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
}

/**
 * Prepare the DOM for a step: wait for target, scroll, short settle pause.
 */
export async function prepareStepTarget(step: TroskyTourStep): Promise<void> {
  const target = step.target;
  if (typeof target !== "string") {
    await delay(DEFAULT_SETTLE_MS);
    return;
  }

  if (target === "body") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    await delay(step.transition ? 420 : 220);
    return;
  }

  const timeout = step.optional ? 2_500 : 12_000;
  const el = await waitForElement(target, timeout);
  if (el) {
    scrollElementIntoView(el);
    await delay(DEFAULT_SETTLE_MS);
  } else if (!step.optional) {
    await delay(200);
  }
}

export type TourNavigationContext = {
  getPathname: () => string;
  pushRoute: (route: string) => void;
  onTransitionStart: (message: string) => void;
  onTransitionEnd: () => void;
};

const defaultStepTiming = {
  beforeTimeout: 14_000,
  scrollDuration: 480,
  spotlightPadding: 14,
  loaderDelay: 120,
} as const;

/** Attach `before` hooks so Joyride waits for navigation + scroll (no flicker). */
export function enrichTourSteps(
  steps: TroskyTourStep[],
  ctxRef: RefObject<TourNavigationContext>
): TroskyTourStep[] {
  return steps.map((step) => ({
    ...defaultStepTiming,
    ...step,
    before: async () => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      const needsNav =
        step.route != null && !pathMatchesRoute(ctx.getPathname(), step.route);

      if (needsNav) {
        ctx.onTransitionStart(
          step.transitionMessage ?? "Opening the next section…"
        );
        ctx.pushRoute(step.route!);
        await delay(180);
      }

      try {
        await prepareStepTarget(step);
      } finally {
        if (needsNav) {
          ctx.onTransitionEnd();
        }
      }
    },
  }));
}
