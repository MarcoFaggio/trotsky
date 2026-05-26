"use client";

import { formatCurrency } from "@hotel-pricing/shared";
import type { RevenueActionView } from "@hotel-pricing/shared";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  formatConfidenceLabel,
  formatRevenueActionStatusLabel,
  formatRevenueActionTypeLabel,
  formatUrgencyLabel,
  getRevenueActionSourceMeta,
  isActionExpired,
  isActionPastStayDate,
} from "@/lib/revenue-action-display";
import { troskySurfaces, troskyTextClamp } from "./trosky-primitives";
import { TroskyStatusBadge } from "./trosky-status-badge";
import { RevenueActionSourceBadge } from "./revenue-action-source-badge";

function urgencyVariant(
  urgency: RevenueActionView["urgency"]
): "neutral" | "warning" | "urgent" {
  if (urgency === "CRITICAL" || urgency === "HIGH") return "urgent";
  if (urgency === "MEDIUM") return "warning";
  return "neutral";
}

function confidenceVariant(
  confidence: RevenueActionView["confidence"]
): "neutral" | "success" | "warning" {
  if (confidence === "HIGH") return "success";
  if (confidence === "LOW") return "warning";
  return "neutral";
}

export interface RevenueActionCardProps {
  action: RevenueActionView;
  hotelName?: string;
  isAnalyst?: boolean;
  onViewEvidence?: (id: string) => void;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onSnooze?: (id: string) => void;
  onComplete?: (id: string) => void;
  busy?: boolean;
  className?: string;
}

export function RevenueActionCard({
  action,
  hotelName,
  isAnalyst = false,
  onViewEvidence,
  onAccept,
  onReject,
  onSnooze,
  onComplete,
  busy,
  className,
}: RevenueActionCardProps) {
  const sourceMeta = getRevenueActionSourceMeta(action);
  const statusLabel = formatRevenueActionStatusLabel(action);
  const inactive =
    isActionPastStayDate(action) || isActionExpired(action);

  const canWorkflowPending =
    isAnalyst &&
    !inactive &&
    action.status === "PENDING" &&
    Boolean(onAccept || onReject || onSnooze);

  const canWorkflowComplete =
    isAnalyst &&
    !inactive &&
    action.status === "ACCEPTED" &&
    Boolean(onComplete);

  const rateLine =
    action.type === "WATCH_DEMAND"
      ? null
      : action.currentValueCents != null && action.recommendedValueCents != null
        ? `${formatCurrency(action.currentValueCents)} → ${formatCurrency(action.recommendedValueCents)}`
        : null;

  const upsideLine =
    action.estimatedUpsideLowCents != null &&
    action.estimatedUpsideHighCents != null
      ? `Estimated upside ${formatCurrency(action.estimatedUpsideLowCents)}–${formatCurrency(action.estimatedUpsideHighCents)}`
      : null;

  return (
    <article
      className={cn(
        troskySurfaces.card,
        "flex min-w-0 flex-col gap-3 p-4 sm:p-5",
        inactive && "opacity-80",
        className
      )}
    >
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {formatRevenueActionTypeLabel(action.type)}
            </span>
            {action.stayDate ? (
              <span className="text-xs text-muted-foreground">
                Stay {action.stayDate}
              </span>
            ) : null}
          </div>
          {hotelName ? (
            <p className="truncate text-xs font-medium text-muted-foreground">
              {hotelName}
            </p>
          ) : null}
          <h3 className="text-base font-semibold leading-snug text-foreground">
            {action.title}
          </h3>
          <p
            className={troskyTextClamp("text-[11px] text-muted-foreground")}
            title={sourceMeta.description}
          >
            {sourceMeta.label}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <RevenueActionSourceBadge action={action} />
          <TroskyStatusBadge variant={urgencyVariant(action.urgency)}>
            {formatUrgencyLabel(action.urgency)}
          </TroskyStatusBadge>
          <TroskyStatusBadge variant={confidenceVariant(action.confidence)}>
            {formatConfidenceLabel(action.confidence)}
          </TroskyStatusBadge>
          <TroskyStatusBadge
            variant={
              inactive || statusLabel === "Expired" || statusLabel === "Past date"
                ? "neutral"
                : "info"
            }
          >
            {statusLabel}
          </TroskyStatusBadge>
        </div>
      </div>

      <p className={troskyTextClamp("line-clamp-2 text-sm leading-relaxed text-muted-foreground")}>
        {action.summary}
      </p>

      {action.reason ? (
        <p className={troskyTextClamp("line-clamp-2 text-xs leading-relaxed text-muted-foreground/90")}>
          {action.reason}
        </p>
      ) : null}

      {action.type === "WATCH_DEMAND" ? (
        <p className="text-xs text-muted-foreground">
          Watch item — review demand signals; not a suggested rate change.
        </p>
      ) : null}

      {(rateLine || upsideLine) && (
        <div className="flex min-w-0 flex-wrap gap-x-4 gap-y-1 text-sm tabular-nums text-foreground">
          {rateLine ? <span>{rateLine}</span> : null}
          {upsideLine ? (
            <span className="text-muted-foreground">{upsideLine}</span>
          ) : null}
        </div>
      )}

      {!isAnalyst && onViewEvidence ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          Your role can view this action and evidence. Workflow decisions are
          managed by the analyst.
        </p>
      ) : null}

      {onViewEvidence || canWorkflowPending || canWorkflowComplete ? (
        <div className="flex min-w-0 flex-col gap-2 border-t border-border/80 pt-3 sm:flex-row sm:flex-wrap">
          {onViewEvidence ? (
            <Button
              size="sm"
              className="h-8 w-full rounded-full bg-trosky-red text-white hover:bg-trosky-red-dark sm:w-auto"
              disabled={busy}
              onClick={() => onViewEvidence(action.id)}
            >
              View evidence
            </Button>
          ) : null}
          {canWorkflowPending ? (
            <div className="flex min-w-0 flex-wrap gap-2">
              {onAccept ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-full"
                  disabled={busy}
                  onClick={() => onAccept(action.id)}
                >
                  Accept
                </Button>
              ) : null}
              {onSnooze ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-full"
                  disabled={busy}
                  onClick={() => onSnooze(action.id)}
                >
                  Snooze 1d
                </Button>
              ) : null}
              {onReject ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 rounded-full text-muted-foreground"
                  disabled={busy}
                  onClick={() => onReject(action.id)}
                >
                  Reject
                </Button>
              ) : null}
            </div>
          ) : null}
          {canWorkflowComplete && onComplete ? (
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-full"
              disabled={busy}
              onClick={() => onComplete(action.id)}
            >
              Mark complete
            </Button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
