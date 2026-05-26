import type { RateCalendarView } from "@hotel-pricing/shared";
import { cn } from "@/lib/utils";
import { troskySurfaces } from "./trosky-primitives";
import { TroskyMetricCard } from "./trosky-metric-card";

export interface RateCalendarSummaryProps {
  summary: RateCalendarView["summary"];
  className?: string;
}

export function RateCalendarSummary({ summary, className }: RateCalendarSummaryProps) {
  return (
    <div
      className={cn(
        "grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-5",
        className
      )}
    >
      <TroskyMetricCard
        label="Urgent dates"
        value={String(summary.urgentCount)}
        hint="High or critical active actions"
        badge={
          summary.urgentCount > 0
            ? { text: "Review", variant: "urgent" }
            : undefined
        }
      />
      <TroskyMetricCard
        label="Watch dates"
        value={String(summary.watchCount)}
        hint="Medium urgency or open items"
      />
      <TroskyMetricCard
        label="Opportunity"
        value={String(summary.opportunityCount)}
        hint="Possible overpricing vs target"
      />
      <TroskyMetricCard
        label="Healthy"
        value={String(summary.healthyCount)}
        hint="No active action on these dates"
      />
      <TroskyMetricCard
        label="Active actions"
        value={String(summary.actionCount)}
        hint="Pending or unsnoozed actions in window"
      />
    </div>
  );
}
