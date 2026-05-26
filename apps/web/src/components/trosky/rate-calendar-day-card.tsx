"use client";

import { formatCurrency } from "@hotel-pricing/shared";
import type { RateCalendarDayView } from "@hotel-pricing/shared";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { troskySurfaces, troskyTextClamp } from "./trosky-primitives";
import { TroskyStatusBadge } from "./trosky-status-badge";

function statusLabel(status: RateCalendarDayView["status"]): string {
  switch (status) {
    case "URGENT":
      return "Urgent";
    case "WATCH":
      return "Watch";
    case "HEALTHY":
      return "Healthy";
    case "OPPORTUNITY":
      return "Opportunity";
    default:
      return "No data";
  }
}

function statusVariant(
  status: RateCalendarDayView["status"]
): "neutral" | "warning" | "urgent" | "success" {
  if (status === "URGENT") return "urgent";
  if (status === "WATCH") return "warning";
  if (status === "HEALTHY") return "neutral";
  if (status === "OPPORTUNITY") return "neutral";
  return "neutral";
}

function statusHint(status: RateCalendarDayView["status"]): string | null {
  if (status === "HEALTHY") return "No active action";
  if (status === "NO_DATA") return "Rates not loaded yet";
  if (status === "OPPORTUNITY") return "May warrant review";
  return null;
}

function formatMoney(cents: number | null): string {
  if (cents == null) return "—";
  return formatCurrency(cents);
}

export interface RateCalendarDayCardProps {
  day: RateCalendarDayView;
  onViewEvidence?: (actionId: string) => void;
  className?: string;
}

export function RateCalendarDayCard({
  day,
  onViewEvidence,
  className,
}: RateCalendarDayCardProps) {
  const dayNum = day.date.slice(8, 10).replace(/^0/, "");

  return (
    <article
      className={cn(
        troskySurfaces.card,
        "flex min-w-0 flex-col gap-2 p-3 sm:p-4",
        day.isToday && "ring-2 ring-trosky-red/30",
        day.status === "URGENT" && "border-trosky-red/30",
        day.status === "NO_DATA" && "opacity-90",
        className
      )}
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-lg font-semibold tabular-nums text-foreground">
            {dayNum}
          </p>
          <p className={troskyTextClamp("text-[11px] font-medium text-muted-foreground")}>
            {day.dayLabel}
          </p>
        </div>
        <TroskyStatusBadge variant={statusVariant(day.status)}>
          {statusLabel(day.status)}
        </TroskyStatusBadge>
      </div>

      {statusHint(day.status) ? (
        <p className="text-[10px] leading-snug text-muted-foreground">
          {statusHint(day.status)}
        </p>
      ) : null}

      <dl className="min-w-0 space-y-1 text-xs">
        <div className="flex min-w-0 justify-between gap-2">
          <dt className="text-muted-foreground">Your rate</dt>
          <dd className="shrink-0 tabular-nums font-medium text-foreground">
            {formatMoney(day.yourRateCents)}
          </dd>
        </div>
        <div className="flex min-w-0 justify-between gap-2">
          <dt
            className="text-muted-foreground"
            title="Competitor reference from available scrape data — not a guaranteed median"
          >
            Comp ref.
          </dt>
          <dd className="shrink-0 tabular-nums text-foreground">
            {formatMoney(day.compReferenceCents)}
          </dd>
        </div>
        {day.rateGapCents != null ? (
          <div className="flex min-w-0 justify-between gap-2">
            <dt className="text-muted-foreground">Vs comp</dt>
            <dd className="shrink-0 tabular-nums text-foreground">
              {formatCurrency(day.rateGapCents)}
            </dd>
          </div>
        ) : null}
      </dl>

      {day.actionCount > 0 ? (
        <p className={troskyTextClamp("text-[11px] font-medium text-foreground")}>
          {day.actionCount} revenue action{day.actionCount === 1 ? "" : "s"}
          {day.topActionTitle ? (
            <span className="block font-normal text-muted-foreground">
              {day.topActionTitle}
            </span>
          ) : null}
        </p>
      ) : null}

      {day.topActionId && onViewEvidence ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-auto h-8 w-full rounded-full text-xs"
          aria-label={`View evidence for ${day.date}`}
          onClick={() => onViewEvidence(day.topActionId!)}
        >
          View evidence
        </Button>
      ) : null}
    </article>
  );
}
