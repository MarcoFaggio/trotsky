"use client";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { SevenDayRate } from "@hotel-pricing/shared";

interface SevenDayCardsProps {
  rates: SevenDayRate[];
  loading?: boolean;
  onDateClick?: (date: string) => void;
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
            <Skeleton key={i} className="h-28 w-36 shrink-0 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (rates.length === 0) {
    return (
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold">Your Rates &mdash; Next 7 Days</h3>
          <p className="text-xs text-muted-foreground">Daily rate overview</p>
        </div>
        <div className="rounded-lg border-2 border-dashed p-8 text-center text-sm text-muted-foreground">
          Rate data collection in progress. Data will appear within 24 hours.
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
          const priceDollars = rate.rateCents
            ? Math.round(rate.rateCents / 100)
            : null;
          const occVal = rate.occPercent
            ? Math.round(rate.occPercent)
            : null;

          return (
            <button
              key={rate.date}
              onClick={() => onDateClick?.(rate.date)}
              className={cn(
                "flex flex-col items-center shrink-0 rounded-lg border p-3 w-[130px] transition-all hover:shadow-md cursor-pointer text-center",
                rate.isToday
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border bg-white hover:border-primary/30"
              )}
            >
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                {weekday}
              </span>
              <span className="text-xs text-muted-foreground">{day}</span>

              {priceDollars !== null ? (
                <span className="text-xl font-bold mt-1">
                  ${priceDollars}
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
                      ? "text-emerald-600"
                      : "text-red-500"
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
                      className="h-1 rounded-full bg-primary/60"
                      style={{ width: `${Math.min(occVal, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {rate.isToday && (
                <span className="text-[9px] font-semibold text-primary mt-1 uppercase">
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
