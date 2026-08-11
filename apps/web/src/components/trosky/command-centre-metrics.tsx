"use client";

import { useState } from "react";
import { formatCurrency } from "@hotel-pricing/shared";
import type { RevenueCommandCentreMetrics } from "@hotel-pricing/shared";
import { TroskyMetricCard } from "./trosky-metric-card";
import {
  AlertTriangle,
  ChevronDown,
  ListChecks,
  Radio,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CommandCentreMetricsProps {
  metrics: RevenueCommandCentreMetrics;
  hasLiveActions?: boolean;
  hasSeededActions?: boolean;
  totalActiveCount?: number;
}

export function CommandCentreMetrics({
  metrics,
  hasLiveActions = false,
  hasSeededActions = false,
  totalActiveCount = 0,
}: CommandCentreMetricsProps) {
  const [showMore, setShowMore] = useState(false);

  const scopeHint =
    hasLiveActions && hasSeededActions
      ? "Estimated metrics use live system-generated actions; demo items are labelled separately."
      : hasLiveActions
        ? "Based on pending, unsnoozed system-generated actions."
        : hasSeededActions
          ? "Based on demo seed data — not live worker output."
          : "Based on active actions in this scope.";
  const upsideLabel =
    metrics.estimatedUpsideLowCents > 0 || metrics.estimatedUpsideHighCents > 0
      ? `${formatCurrency(metrics.estimatedUpsideLowCents)}–${formatCurrency(metrics.estimatedUpsideHighCents)}`
      : "—";

  return (
    <div className="min-w-0 space-y-2">
      <p className="text-xs leading-relaxed text-muted-foreground">{scopeHint}</p>
      {hasLiveActions && hasSeededActions ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          Demo actions are labelled and ranked below live actions on the command
          centre.
        </p>
      ) : null}
      <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <TroskyMetricCard
          label="Estimated upside"
          value={upsideLabel}
          icon={TrendingUp}
          hint={
            upsideLabel === "—"
              ? "Heuristic range when rate deltas exist"
              : totalActiveCount > 0
                ? `From ${totalActiveCount} active action${totalActiveCount === 1 ? "" : "s"} — not guaranteed`
                : "Heuristic — not guaranteed revenue"
          }
        />
        <TroskyMetricCard
          label="Urgent actions"
          value={metrics.urgentActionCount}
          icon={AlertTriangle}
          hint={
            metrics.urgentDateCount > 0
              ? `${metrics.urgentDateCount} stay date${metrics.urgentDateCount === 1 ? "" : "s"}`
              : "High or critical urgency"
          }
          badge={
            metrics.urgentActionCount > 0
              ? { text: "Review first", variant: "urgent" }
              : undefined
          }
        />
        <TroskyMetricCard
          label="Pending review"
          value={metrics.pendingActionCount}
          icon={ListChecks}
          hint="Awaiting analyst decision"
        />
      </div>

      <div className="min-w-0">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 rounded-full px-2 text-xs text-muted-foreground"
          aria-expanded={showMore}
          onClick={() => setShowMore((v) => !v)}
        >
          More metrics
          <ChevronDown
            className={cn("h-3.5 w-3.5 transition-transform", showMore && "rotate-180")}
          />
        </Button>
        {showMore ? (
          <div className="mt-2 grid min-w-0 gap-3 sm:grid-cols-2">
            <TroskyMetricCard
              label="Parity (demo)"
              value={metrics.parityIssueCount}
              icon={Radio}
              hint="Preview only — no live parity engine"
            />
            <TroskyMetricCard
              label="Events & watch"
              value={metrics.eventActionCount}
              icon={Sparkles}
              hint="Event pricing and watch demand items"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
