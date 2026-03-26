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
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="sticky left-0 z-10 bg-muted/50 min-w-[200px] px-4 py-3 text-left font-medium">
                Property
              </th>
              {days.map((d) => {
                const { day, dow } = formatDateShort(d.date);
                const isWeekend = dow === "Sat" || dow === "Sun";
                return (
                  <th
                    key={d.date}
                    className={cn(
                      "min-w-[90px] px-3 py-2 text-center font-medium cursor-pointer hover:bg-accent transition-colors",
                      isWeekend && "bg-blue-50/50"
                    )}
                    onClick={() => onCellClick(d.date)}
                  >
                    <div className="text-xs text-muted-foreground">{dow}</div>
                    <div className="text-xs">{day}</div>
                    <div className="mt-1 flex items-center justify-center gap-1">
                      {d.hasEvent && (
                        <div className="h-1.5 w-1.5 rounded-full bg-amber-500" title="Manual event" />
                      )}
                      {d.signalCount > 0 && (
                        <div
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            d.signalDirection === "NEGATIVE_DISRUPTION"
                              ? "bg-red-500"
                              : "bg-indigo-500"
                          )}
                          title="Imported signal"
                        />
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
              <td className="sticky left-0 z-10 bg-primary/5 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="font-semibold text-primary">Our Hotel</span>
                </div>
              </td>
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
                    <div className="text-[10px] text-amber-600 font-normal">override</div>
                  )}
                </td>
              ))}
            </tr>

            {/* Recommended Row */}
            <tr className="border-b bg-emerald-50/30">
              <td className="sticky left-0 z-10 bg-emerald-50/30 px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-emerald-700 text-xs font-medium">AI Recommended</span>
                </div>
              </td>
              {days.map((d) => (
                <td key={d.date} className="px-3 py-2 text-center text-xs">
                  <span className="text-emerald-700 font-medium">
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
            <tr className="border-b bg-slate-50/50">
              <td className="sticky left-0 z-10 bg-slate-50/50 px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-slate-400" />
                  <span className="text-xs font-medium text-slate-600">Comp Average</span>
                </div>
              </td>
              {days.map((d) => (
                <td key={d.date} className="px-3 py-2 text-center text-xs text-slate-600">
                  {fmt(d.compAvgRate)}
                </td>
              ))}
            </tr>

            {/* Individual Competitor Rows */}
            {sortedCompetitors.map((comp) => (
              <tr key={comp.id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="sticky left-0 z-10 bg-white px-4 py-2">
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
                </td>
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
