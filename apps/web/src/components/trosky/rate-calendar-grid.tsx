"use client";

import type { RateCalendarDayView } from "@hotel-pricing/shared";
import { cn } from "@/lib/utils";
import { RateCalendarDayCard } from "./rate-calendar-day-card";

export interface RateCalendarGridProps {
  days: RateCalendarDayView[];
  onViewEvidence?: (actionId: string) => void;
  className?: string;
}

export function RateCalendarGrid({
  days,
  onViewEvidence,
  className,
}: RateCalendarGridProps) {
  return (
    <div
      className={cn(
        "grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7",
        className
      )}
    >
      {days.map((day) => (
        <RateCalendarDayCard
          key={day.date}
          day={day}
          onViewEvidence={onViewEvidence}
        />
      ))}
    </div>
  );
}
