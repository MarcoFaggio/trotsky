"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardDay } from "@hotel-pricing/shared";

interface CalendarViewProps {
  days: DashboardDay[];
  onDayClick: (date: string) => void;
}

function fmt(cents: number | null): string {
  if (cents === null) return "—";
  return `$${Math.round(cents / 100)}`;
}

export function CalendarView({ days, onDayClick }: CalendarViewProps) {
  const [monthOffset, setMonthOffset] = useState(0);

  const currentMonth = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();

  const dayMap = useMemo(() => {
    const map = new Map<string, DashboardDay>();
    for (const d of days) {
      map.set(d.date, d);
    }
    return map;
  }, [days]);

  const calendarDays: (DashboardDay | null)[] = [];
  for (let i = 0; i < firstDow; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    calendarDays.push(dayMap.get(dateStr) || ({
      date: dateStr,
      ourRate: null,
      recommendedRate: null,
      compAvgRate: null,
      occPercent: null,
      occLyPercent: null,
      otbRooms: null,
      otbLyRooms: null,
      hasEvent: false,
      hasPromotion: false,
      overrideRate: null,
      confidence: null,
      availableRooms: null,
      forecastRooms: null,
      forecastPercent: null,
      arrivals: null,
      departures: null,
      overbookingLimit: null,
      signalDirection: null,
      signalImpactBps: null,
      signalCount: 0,
      competitors: [],
    } as DashboardDay));
  }

  const monthName = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="border rounded-lg bg-white">
      <div className="flex items-center justify-between p-4 border-b">
        <Button variant="ghost" size="icon" onClick={() => setMonthOffset((p) => p - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-semibold">{monthName}</h3>
        <Button variant="ghost" size="icon" onClick={() => setMonthOffset((p) => p + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dow) => (
          <div key={dow} className="p-2 text-center text-xs font-medium text-muted-foreground border-b">
            {dow}
          </div>
        ))}

        {calendarDays.map((day, i) => {
          if (!day) {
            return <div key={`empty-${i}`} className="min-h-[100px] border-b border-r bg-muted/20" />;
          }

          const dateNum = parseInt(day.date.split("-")[2]);
          const hasData = day.ourRate !== null;
          const priceDiff = day.ourRate && day.compAvgRate
            ? ((day.ourRate - day.compAvgRate) / day.compAvgRate) * 100
            : null;

          return (
            <div
              key={day.date}
              className={cn(
                "min-h-[100px] border-b border-r p-2 cursor-pointer hover:bg-accent/50 transition-colors relative",
                !hasData && "bg-muted/10",
                priceDiff !== null && priceDiff > 10 && "border-l-2 border-l-red-400",
                priceDiff !== null && priceDiff < -10 && "border-l-2 border-l-blue-400",
                priceDiff !== null && Math.abs(priceDiff) <= 10 && "border-l-2 border-l-emerald-400"
              )}
              onClick={() => onDayClick(day.date)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">{dateNum}</span>
                <div className="flex gap-0.5">
                  {day.hasEvent && (
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  )}
                  {day.hasPromotion && (
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                  )}
                  {day.signalCount > 0 && (
                    <div
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        day.signalDirection === "NEGATIVE_DISRUPTION"
                          ? "bg-red-500"
                          : "bg-indigo-500"
                      )}
                    />
                  )}
                </div>
              </div>

              {hasData ? (
                <div className="space-y-0.5">
                  <div className="text-xs">
                    <span className="text-muted-foreground">Rate: </span>
                    <span className="font-semibold">{fmt(day.ourRate)}</span>
                  </div>
                  {day.recommendedRate && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Rec: </span>
                      <span className="font-medium text-emerald-600">
                        {fmt(day.recommendedRate)}
                      </span>
                    </div>
                  )}
                  {day.occPercent !== null && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Occ: </span>
                      <span className="font-medium">{day.occPercent.toFixed(0)}%</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground mt-2">No data</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
