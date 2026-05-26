"use client";

import type { RevenueActionView } from "@hotel-pricing/shared";
import { cn } from "@/lib/utils";
import { sortActionsForDisplay } from "@/lib/revenue-action-display";
import { RevenueActionCard } from "./revenue-action-card";

export interface RevenueActionQueueProps {
  actions: RevenueActionView[];
  actionHotelNames?: Record<string, string>;
  isAnalyst?: boolean;
  emptyMessage?: string;
  onViewEvidence?: (id: string) => void;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onSnooze?: (id: string) => void;
  onComplete?: (id: string) => void;
  busy?: boolean;
  className?: string;
}

export function RevenueActionQueue({
  actions,
  actionHotelNames,
  isAnalyst = false,
  emptyMessage = "No revenue actions right now. Trosky will surface pricing, demand, event, and parity tasks here.",
  onViewEvidence,
  onAccept,
  onReject,
  onSnooze,
  onComplete,
  busy,
  className,
}: RevenueActionQueueProps) {
  const sorted = sortActionsForDisplay(actions);

  if (sorted.length === 0) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-12 text-center",
          className
        )}
      >
        <p className="text-sm leading-relaxed text-trosky-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("flex min-w-0 flex-col gap-4", className)}>
      {sorted.map((action) => (
        <RevenueActionCard
          key={action.id}
          action={action}
          hotelName={actionHotelNames?.[action.id]}
          isAnalyst={isAnalyst}
          onViewEvidence={onViewEvidence}
          onAccept={onAccept}
          onReject={onReject}
          onSnooze={onSnooze}
          onComplete={onComplete}
          busy={busy}
        />
      ))}
    </div>
  );
}
