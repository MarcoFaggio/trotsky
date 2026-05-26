"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  acceptRevenueAction,
  completeRevenueAction,
  rejectRevenueAction,
  snoozeRevenueAction,
} from "@/actions/revenue-actions";
import { fetchRevenueActionInsight } from "@/actions/revenue-action-insights";
import type { RevenueActionInsightView } from "@hotel-pricing/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  formatConfidenceLabel,
  formatUrgencyLabel,
  getRevenueActionSourceMeta,
} from "@/lib/revenue-action-display";
import { TroskyStatusBadge } from "./trosky-status-badge";
import { RevenueActionSourceBadge } from "./revenue-action-source-badge";
import { RevenueActionEvidencePanel } from "./revenue-action-evidence-panel";

function urgencyVariant(
  urgency: RevenueActionInsightView["urgency"]
): "neutral" | "warning" | "urgent" {
  if (urgency === "CRITICAL" || urgency === "HIGH") return "urgent";
  if (urgency === "MEDIUM") return "warning";
  return "neutral";
}

function confidenceVariant(
  confidence: RevenueActionInsightView["confidence"]
): "neutral" | "success" | "warning" {
  if (confidence === "HIGH") return "success";
  if (confidence === "LOW") return "warning";
  return "neutral";
}

export interface RevenueActionInsightDrawerProps {
  actionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActionUpdated?: () => void;
}

export function RevenueActionInsightDrawer({
  actionId,
  open,
  onOpenChange,
  onActionUpdated,
}: RevenueActionInsightDrawerProps) {
  const router = useRouter();
  const [insight, setInsight] = useState<RevenueActionInsightView | null>(null);
  const [errorState, setErrorState] = useState<"not_found" | "forbidden" | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [mutationError, setMutationError] = useState<string | null>(null);

  const loadInsight = useCallback(async (id: string) => {
    setLoading(true);
    setErrorState(null);
    setInsight(null);
    setMutationError(null);
    try {
      const result = await fetchRevenueActionInsight(id);
      if (result.status === "ok") {
        setInsight(result.insight);
      } else if (result.status === "not_found") {
        setErrorState("not_found");
      } else {
        setErrorState("forbidden");
      }
    } catch {
      setErrorState("not_found");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && actionId) {
      void loadInsight(actionId);
    }
    if (!open) {
      setInsight(null);
      setErrorState(null);
      setMutationError(null);
    }
  }, [open, actionId, loadInsight]);

  function runMutation(fn: () => Promise<void>) {
    if (!actionId) return;
    setMutationError(null);
    startTransition(async () => {
      try {
        await fn();
        await loadInsight(actionId);
        onActionUpdated?.();
        router.refresh();
      } catch {
        setMutationError("Could not update this action. Try again.");
      }
    });
  }

  function snoozeOneDay() {
    if (!actionId) return;
    const until = new Date();
    until.setDate(until.getDate() + 1);
    runMutation(() => snoozeRevenueAction(actionId, until));
  }

  const canMutatePending =
    insight?.canManage && insight.status === "PENDING";
  const canComplete =
    insight?.canManage && insight.status === "ACCEPTED";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={loading ? "drawer-loading" : undefined}
        className={cn(
          "fixed inset-y-0 left-auto right-0 top-0 z-50 flex h-full w-full max-w-lg translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-l border-border bg-card p-0 text-card-foreground shadow-xl",
          "data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
          "sm:max-w-md sm:rounded-l-2xl"
        )}
      >
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <DialogHeader className="shrink-0 space-y-2 border-b border-border px-5 py-4 pr-12 text-left">
            {loading ? (
              <>
                <DialogTitle className="sr-only">Loading evidence</DialogTitle>
                <p id="drawer-loading" className="text-sm text-muted-foreground">
                  Loading evidence…
                </p>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </>
            ) : insight ? (
              <>
                <p className="text-xs font-medium text-muted-foreground">
                  {insight.hotelName}
                </p>
                <DialogTitle className="text-left text-lg font-semibold leading-snug text-foreground">
                  {insight.title}
                </DialogTitle>
                <DialogDescription className="text-left text-sm text-muted-foreground">
                  {insight.summary}
                </DialogDescription>
                <div className="flex min-w-0 flex-wrap gap-1.5 pt-1">
                  <RevenueActionSourceBadge
                    action={{
                      source: insight.source,
                      evidenceJson: insight.evidence.raw as Record<string, unknown> | null,
                      type: insight.type,
                    }}
                  />
                  <TroskyStatusBadge variant={urgencyVariant(insight.urgency)}>
                    {formatUrgencyLabel(insight.urgency)}
                  </TroskyStatusBadge>
                  <TroskyStatusBadge variant={confidenceVariant(insight.confidence)}>
                    {formatConfidenceLabel(insight.confidence)}
                  </TroskyStatusBadge>
                </div>
              </>
            ) : errorState ? (
              <DialogTitle className="text-left text-foreground">
                {errorState === "forbidden"
                  ? "Access restricted"
                  : "Action unavailable"}
              </DialogTitle>
            ) : (
              <DialogTitle className="text-left text-foreground">
                Revenue action evidence
              </DialogTitle>
            )}
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
            {loading ? (
              <div className="space-y-3" aria-busy="true">
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-40 w-full rounded-2xl" />
                <Skeleton className="h-32 w-full rounded-2xl" />
              </div>
            ) : errorState === "not_found" ? (
              <p className="text-sm text-muted-foreground">
                This action is no longer available.
              </p>
            ) : errorState === "forbidden" ? (
              <p className="text-sm text-muted-foreground">
                You do not have access to this hotel&apos;s actions.
              </p>
            ) : insight ? (
              <RevenueActionEvidencePanel
                insight={insight}
                showRawEvidence={insight.canViewRawEvidence}
              />
            ) : null}
          </div>

          <div className="shrink-0 border-t border-border bg-muted/40 px-5 py-4">
            {mutationError ? (
              <p className="mb-3 text-sm text-destructive">{mutationError}</p>
            ) : null}

            {insight && !insight.canManage ? (
              <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
                Your role can view this action and evidence. Workflow decisions
                are managed by the analyst.
              </p>
            ) : null}

            {canMutatePending ? (
              <div className="mb-3 flex min-w-0 flex-wrap gap-2">
                <Button
                  size="sm"
                  className="h-9 rounded-full bg-trosky-red text-white hover:bg-trosky-red-dark"
                  disabled={pending}
                  aria-label="Accept revenue action"
                  onClick={() => runMutation(() => acceptRevenueAction(actionId!))}
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 rounded-full"
                  disabled={pending}
                  aria-label="Snooze revenue action for one day"
                  onClick={snoozeOneDay}
                >
                  Snooze 1d
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 rounded-full text-muted-foreground"
                  disabled={pending}
                  aria-label="Reject revenue action"
                  onClick={() => runMutation(() => rejectRevenueAction(actionId!))}
                >
                  Reject
                </Button>
              </div>
            ) : null}

            {canComplete ? (
              <div className="mb-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 rounded-full"
                  disabled={pending}
                  aria-label="Mark revenue action complete"
                  onClick={() => runMutation(() => completeRevenueAction(actionId!))}
                >
                  Mark complete
                </Button>
              </div>
            ) : null}

            <Button
              variant="outline"
              size="sm"
              className="h-9 w-full rounded-full"
              asChild
            >
              <Link href="/actions">
                {insight?.canManage
                  ? "Open in Revenue Actions"
                  : "View revenue actions"}
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
