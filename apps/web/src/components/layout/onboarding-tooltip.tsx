"use client";

import type { TooltipRenderProps } from "react-joyride";
import { Compass, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOnboarding } from "./onboarding-context";

export function OnboardingTooltip({
  backProps,
  continuous,
  index,
  isLastStep,
  primaryProps,
  skipProps,
  size,
  step,
  tooltipProps,
  closeProps,
}: TooltipRenderProps) {
  const { isTransitioning, transitionMessage } = useOnboarding();
  const showBack = index > 0;
  const busy = isTransitioning;

  return (
    <div
      {...tooltipProps}
      className={cn(
        "relative w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-border/80 bg-card text-card-foreground shadow-2xl shadow-black/15 transition-shadow duration-300",
        "dark:shadow-black/40",
        busy && "ring-2 ring-primary/20"
      )}
    >
      <div className="flex items-center gap-2 border-b border-border/60 bg-primary/5 px-4 py-3 pr-10">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Compass className="h-4 w-4" aria-hidden />
          )}
        </span>
        <div className="min-w-0 flex-1">
          {step.title ? (
            <p className="text-sm font-semibold leading-snug">{step.title}</p>
          ) : null}
          {continuous && size > 0 ? (
            <p className="text-[11px] text-muted-foreground">
              Step {index + 1} of {size}
            </p>
          ) : null}
        </div>
      </div>

      {busy && transitionMessage ? (
        <p className="border-b border-border/50 bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
          {transitionMessage}
        </p>
      ) : null}

      <div className="px-4 py-3 text-sm leading-6 text-muted-foreground">
        {step.content}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border/60 px-3 py-2.5">
        <div className="flex gap-1">
          {continuous && !isLastStep ? (
            <button
              {...skipProps}
              type="button"
              disabled={busy}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              Skip tour
            </button>
          ) : null}
        </div>
        <div className="flex gap-1.5">
          {showBack ? (
            <button
              {...backProps}
              type="button"
              disabled={busy}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50"
            >
              Back
            </button>
          ) : null}
          <button
            {...primaryProps}
            type="button"
            disabled={busy}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "Please wait…" : isLastStep ? "Done" : "Next"}
          </button>
        </div>
      </div>

      <button
        {...closeProps}
        type="button"
        disabled={busy}
        aria-label="Close tour"
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md text-lg leading-none text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
      >
        ×
      </button>
    </div>
  );
}
