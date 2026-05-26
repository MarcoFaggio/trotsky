"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DashboardDay } from "@hotel-pricing/shared";
import { weightToLabel } from "@hotel-pricing/shared";

interface RateMatrixProps {
  days: DashboardDay[];
  competitors: { id: string; name: string; weight: number }[];
  onCellClick: (date: string) => void;
}

function fmt(cents: number | null): string {
  if (cents === null) return "—";
  return `$${Math.round(cents / 100)}`;
}

function formatDateShort(dateStr: string): { day: string; dow: string } {
  const d = new Date(dateStr + "T12:00:00Z");
  return {
    day: d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
    dow: d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
  };
}

export function RateMatrix({ days, competitors, onCellClick }: RateMatrixProps) {
  const sortedCompetitors = useMemo(
    () => [...competitors].sort((a, b) => b.weight - a.weight),
    [competitors]
  );

  if (days.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No rate data available for the selected period.
      </div>
    );
  }

  return (
    <div className="app-panel overflow-hidden rounded-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/60">
              <th className="sticky left-0 z-10 min-w-[200px] bg-muted px-4 py-3 text-left font-medium shadow-[1px_0_0_hsl(var(--border))]">
                Property
              </th>
              {days.map((d) => {
                const { day, dow } = formatDateShort(d.date);
                const isWeekend = dow === "Sat" || dow === "Sun";
                return (
                  <th
                    key={d.date}
                    className={cn(
                      "min-w-[90px] cursor-pointer px-3 py-2 text-center font-medium transition-colors hover:bg-accent",
                      isWeekend && "bg-primary/5"
                    )}
                    onClick={() => onCellClick(d.date)}
                  >
                    <div className="text-xs text-muted-foreground">{dow}</div>
                    <div className="text-xs">{day}</div>
                    <div className="mt-1 flex items-center justify-center gap-1">
                      {d.hasEvent && (
                        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" title="Manual event">
                          <span className="sr-only">Manual event</span>
                        </span>
                      )}
                      {d.signalCount > 0 && (
                        <span
                          className={cn(
                            "inline-flex h-1.5 w-1.5 rounded-full",
                            d.signalDirection === "NEGATIVE_DISRUPTION"
                              ? "bg-red-500"
                              : "bg-indigo-500"
                          )}
                          title="Imported signal"
                        >
                          <span className="sr-only">Imported signal</span>
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {/* Our Hotel Row - pinned */}
            <tr className="border-b bg-primary/5 font-medium">
              <th scope="row" className="sticky left-0 z-10 bg-primary/10 px-4 py-3 text-left shadow-[1px_0_0_hsl(var(--border))]">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="font-semibold text-primary">Our Hotel</span>
                </div>
              </th>
              {days.map((d) => (
                <td
                  key={d.date}
                  className="px-3 py-3 text-center cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => onCellClick(d.date)}
                >
                  <span
                    className={cn(
                      "font-semibold",
                      d.ourRate === null && "text-muted-foreground"
                    )}
                  >
                    {fmt(d.ourRate)}
                  </span>
                  {d.overrideRate && (
                    <div className="text-[10px] font-normal text-amber-600 dark:text-amber-400">
                      override
                    </div>
                  )}
                </td>
              ))}
            </tr>

            {/* Recommended Row */}
            <tr className="border-b bg-emerald-500/10">
              <th scope="row" className="sticky left-0 z-10 bg-emerald-500/10 px-4 py-2 text-left shadow-[1px_0_0_hsl(var(--border))]">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">AI Recommended</span>
                </div>
              </th>
              {days.map((d) => (
                <td key={d.date} className="px-3 py-2 text-center text-xs">
                  <span className="font-medium text-emerald-700 dark:text-emerald-300">
                    {fmt(d.recommendedRate)}
                  </span>
                  {d.confidence !== null && (
                    <div className="text-[10px] text-muted-foreground">
                      {Math.round(d.confidence * 100)}%
                    </div>
                  )}
                </td>
              ))}
            </tr>

            {/* Comp Average Row */}
            <tr className="border-b bg-muted/40">
              <th scope="row" className="sticky left-0 z-10 bg-muted px-4 py-2 text-left shadow-[1px_0_0_hsl(var(--border))]">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Comp Average</span>
                </div>
              </th>
              {days.map((d) => (
                <td key={d.date} className="px-3 py-2 text-center text-xs text-muted-foreground">
                  {fmt(d.compAvgRate)}
                </td>
              ))}
            </tr>

            {/* Individual Competitor Rows */}
            {sortedCompetitors.map((comp) => (
              <tr key={comp.id} className="border-b hover:bg-muted/30 transition-colors">
                <th scope="row" className="sticky left-0 z-10 bg-card px-4 py-2 text-left shadow-[1px_0_0_hsl(var(--border))]">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        comp.weight > 0.66
                          ? "default"
                          : comp.weight > 0.33
                            ? "secondary"
                            : "outline"
                      }
                      className="text-[10px] px-1.5 py-0"
                    >
                      {weightToLabel(comp.weight)}
                    </Badge>
                    <span className="text-xs truncate max-w-[140px]">{comp.name}</span>
                  </div>
                </th>
                {days.map((d) => {
                  const compData = d.competitors.find((c) => c.id === comp.id);
                  const diff =
                    compData?.rate && d.ourRate
                      ? ((compData.rate - d.ourRate) / d.ourRate) * 100
                      : null;
                  return (
                    <td
                      key={d.date}
                      className="px-3 py-2 text-center text-xs cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => onCellClick(d.date)}
                    >
                      <span
                        className={cn(
                          compData?.rate === null && "text-muted-foreground"
                        )}
                      >
                        {fmt(compData?.rate ?? null)}
                      </span>
                      {diff !== null && Math.abs(diff) > 5 && (
                        <div
                          className={cn(
                            "text-[10px]",
                            diff > 0 ? "text-red-500" : "text-emerald-600"
                          )}
                        >
                          {diff > 0 ? "+" : ""}
                          {diff.toFixed(0)}%
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
