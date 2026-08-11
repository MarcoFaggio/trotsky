"use client";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { SevenDayRate } from "@hotel-pricing/shared";
import { formatCurrency } from "@hotel-pricing/shared";

interface SevenDayCardsProps {
  rates: SevenDayRate[];
  loading?: boolean;
  onDateClick?: (date: string) => void;
  /** Analyst-only ops guidance for empty rate windows. */
  isAnalyst?: boolean;
}

function formatShortDate(dateStr: string): { day: string; weekday: string } {
  const d = new Date(dateStr + "T12:00:00");
  return {
    day: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
  };
}

export function SevenDayCards({
  rates,
  loading,
  onDateClick,
  isAnalyst = false,
}: SevenDayCardsProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold">Your Rates &mdash; Next 7 Days</h3>
          <p className="text-xs text-muted-foreground">Daily rate overview</p>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-[calc(50vw-1.5rem)] min-w-32 max-w-36 shrink-0 rounded-lg sm:w-36" />
          ))}
        </div>
      </div>
    );
  }

  const hasAnyRate = rates.some((r) => r.rateCents != null);

  if (rates.length === 0 || !hasAnyRate) {
    return (
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold">Your Rates &mdash; Next 7 Days</h3>
          <p className="text-xs text-muted-foreground">Daily rate overview</p>
        </div>
        <div className="rounded-lg border-2 border-dashed p-8 text-center text-sm text-muted-foreground">
          {rates.length > 0 && !hasAnyRate ? (
            isAnalyst ? (
              <>
                No rates in the next 7 days. Demo data ages out of this window —
                run <code className="text-xs">SEED_FORCE=true pnpm db:refresh-demo</code>{" "}
                against the database, or configure Redis + the worker for live scrapes.
              </>
            ) : (
              <>
                Rates for the next 7 days are not available yet. Check back after the
                next data refresh.
              </>
            )
          ) : (
            <>Rate data collection in progress. Data will appear within 24 hours.</>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">Your Rates &mdash; Next 7 Days</h3>
        <p className="text-xs text-muted-foreground">Daily rate overview</p>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {rates.map((rate) => {
          const { day, weekday } = formatShortDate(rate.date);
          const price = rate.rateCents ? formatCurrency(rate.rateCents) : null;
          const occVal = rate.occPercent
            ? Math.round(rate.occPercent)
            : null;

          return (
            <button
              key={rate.date}
              onClick={() => onDateClick?.(rate.date)}
              className={cn(
                "flex min-h-28 w-[calc(50vw-1.5rem)] min-w-32 max-w-36 shrink-0 flex-col items-center rounded-lg border p-3 text-center transition-all hover:shadow-md cursor-pointer sm:w-36",
                rate.isToday
                  ? "border-trosky-red bg-trosky-red/5 ring-1 ring-trosky-red/20"
                  : "border-border bg-card hover:border-trosky-red/30"
              )}
            >
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                {weekday}
              </span>
              <span className="text-xs text-muted-foreground">{day}</span>

              {price !== null ? (
                <span className="text-xl font-bold mt-1">
                  {price}
                </span>
              ) : (
                <span className="text-lg font-medium text-muted-foreground mt-1">
                  &mdash;
                </span>
              )}

              {rate.changePct !== null && rate.changePct !== 0 && (
                <span
                  className={cn(
                    "text-[10px] font-semibold mt-0.5",
                    rate.changePct > 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-destructive"
                  )}
                >
                  {rate.changePct > 0 ? "+" : ""}
                  {rate.changePct.toFixed(1)}%
                </span>
              )}

              {occVal !== null && (
                <div className="w-full mt-2">
                  <div className="text-[10px] text-muted-foreground">
                    {occVal}% occ
                  </div>
                  <div className="h-1 w-full rounded-full bg-muted mt-0.5">
                    <div
                      className="h-1 rounded-full bg-trosky-red/60"
                      style={{ width: `${Math.min(occVal, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {rate.isToday && (
                <span className="text-[9px] font-semibold text-trosky-red mt-1 uppercase">
                  Today
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
