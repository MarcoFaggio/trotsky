"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  acceptRevenueAction,
  completeRevenueAction,
  rejectRevenueAction,
  snoozeRevenueAction,
} from "@/actions/revenue-actions";
import type { RevenueCommandCentreView } from "@hotel-pricing/shared";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TroskyPageHeader } from "./trosky-page-header";
import { CommandCentreMetrics } from "./command-centre-metrics";
import { RevenueActionQueue } from "./revenue-action-queue";
import { RateVsCompChart } from "./rate-vs-comp-chart";
import { RevenueCommandExplanationPanel } from "./revenue-command-explanation-panel";
import { RevenueActionInsightDrawer } from "./revenue-action-insight-drawer";
import {
  formatEvaluationFreshnessLine,
  formatUrgencyLabel,
  isActionDemo,
  isActionLive,
  limitCommandCentreActions,
  prioritizeLiveActions,
} from "@/lib/revenue-action-display";
import { troskySurfaces } from "./trosky-primitives";

function greetingForHour(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export interface RevenueCommandCentreProps {
  view: RevenueCommandCentreView;
  userDisplayName?: string | null;
  canManageActions: boolean;
}

export function RevenueCommandCentre({
  view,
  userDisplayName,
  canManageActions,
}: RevenueCommandCentreProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [insightActionId, setInsightActionId] = useState<string | null>(null);
  const [insightOpen, setInsightOpen] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const scopeTitle =
    view.scope.mode === "HOTEL" && view.scope.hotelName
      ? view.scope.hotelName
      : "Portfolio";

  const description =
    view.scope.mode === "PORTFOLIO"
      ? "Your highest-priority revenue actions across active hotels."
      : `What to review first for ${view.scope.hotelName ?? "this property"}.`;

  const evaluationLine = useMemo(
    () => formatEvaluationFreshnessLine(view.actions),
    [view.actions]
  );

  const { display: displayActions, hiddenCount } = limitCommandCentreActions(
    view.actions
  );

  const topAction = prioritizeLiveActions(view.actions)[0] ?? null;

  const emptyMessage = useMemo(() => {
    if (view.hasSeededActions && !view.hasLiveActions && view.demoModeEnabled) {
      return "You are viewing demo actions. Live actions will appear after the worker processes recommendations and events.";
    }
    if (canManageActions) {
      return "Trosky has not found active revenue actions for this hotel right now. New pricing, event, and demand actions will appear here after scrapes and recommendation runs.";
    }
    return "There are no active revenue actions for your hotel right now. Open evidence from the rate calendar when actions appear.";
  }, [
    view.hasSeededActions,
    view.hasLiveActions,
    view.demoModeEnabled,
    canManageActions,
  ]);

  function runMutation(fn: () => Promise<void>) {
    setMutationError(null);
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
      } catch {
        setMutationError(
          "Could not update this action. Try again or open it from Revenue Actions."
        );
      }
    });
  }

  function snoozeOneDay(actionId: string) {
    const until = new Date();
    until.setDate(until.getDate() + 1);
    runMutation(() => snoozeRevenueAction(actionId, until));
  }

  const attentionCount = view.totalActiveCount;
  const attentionLabel =
    attentionCount === 0
      ? "No actions need attention"
      : attentionCount === 1
        ? "1 action needs attention"
        : `${attentionCount} actions need attention`;

  return (
    <section
      className="min-w-0 space-y-6"
      aria-labelledby="command-centre-heading"
      data-tour="command-centre"
    >
      <div data-tour="command-centre-header">
      <TroskyPageHeader
        eyebrow="Command centre"
        title={`${greetingForHour()}${userDisplayName ? `, ${userDisplayName.split(" ")[0]}` : ""}`}
        description={description}
        badge={{
          text: scopeTitle,
          variant: view.metrics.urgentActionCount > 0 ? "urgent" : "neutral",
        }}
        actions={
          <div className="flex min-w-0 flex-col items-end gap-1 sm:items-end">
            <p className="text-xs text-muted-foreground">{evaluationLine}</p>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <span className="text-xs font-medium text-foreground">{attentionLabel}</span>
              <Button variant="outline" size="sm" className="h-9 rounded-full" asChild>
                <Link href="/actions">
                  {canManageActions ? "View all revenue actions" : "View revenue actions"}
                </Link>
              </Button>
            </div>
          </div>
        }
      />
      </div>

      {(view.hasLiveActions || view.hasSeededActions) && (
        <div
          data-tour="command-centre-data-status"
          className={`${troskySurfaces.mutedPanel} flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-xs leading-relaxed text-muted-foreground`}
          role="status"
        >
          {view.hasLiveActions ? (
            <span className="font-medium text-foreground">
              Viewing system-generated actions
            </span>
          ) : (
            <span className="font-medium text-foreground">Viewing demo data</span>
          )}
          {view.hasLiveActions && view.hasSeededActions ? (
            <span>Demo items are labelled and ranked below live actions.</span>
          ) : null}
          {!view.hasLiveActions && view.hasSeededActions ? (
            <span>
              Run the worker after scrapes to replace demo items with live actions.
            </span>
          ) : null}
        </div>
      )}

      {canManageActions &&
      !view.demoModeEnabled &&
      view.hiddenDemoActionCount > 0 ? (
        <div
          className={`${troskySurfaces.mutedPanel} px-4 py-3 text-xs leading-relaxed text-muted-foreground`}
          role="status"
        >
          Demo actions are hidden because demo mode is disabled.
        </div>
      ) : null}

      {mutationError ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {mutationError}
        </p>
      ) : null}

      <div data-tour="command-centre-metrics">
      <CommandCentreMetrics
        metrics={view.metrics}
        hasLiveActions={view.hasLiveActions}
        hasSeededActions={view.hasSeededActions}
        totalActiveCount={view.totalActiveCount}
      />
      </div>

      {topAction ? (
        <div
          data-tour="command-centre-top-priority"
          className={`${troskySurfaces.panel} min-w-0 p-4 sm:p-5`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Highest priority
          </p>
          <p className="mt-1 text-sm font-semibold leading-snug text-foreground">
            {topAction.title}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatUrgencyLabel(topAction.urgency)}
            {topAction.stayDate ? ` · Stay ${topAction.stayDate}` : ""}
            {isActionLive(topAction)
              ? " · System-generated"
              : isActionDemo(topAction)
                ? " · Demo data"
                : ""}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-3 h-8 rounded-full"
            onClick={() => {
              setInsightActionId(topAction.id);
              setInsightOpen(true);
            }}
          >
            View evidence
          </Button>
        </div>
      ) : null}

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-3">
          <div className="flex min-w-0 flex-wrap items-end justify-between gap-2">
            <h2
              id="command-centre-heading"
              className="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Priority actions
            </h2>
            {hiddenCount > 0 ? (
              <Link
                href="/actions"
                className="text-xs font-medium text-foreground underline-offset-2 hover:underline"
              >
                +{hiddenCount} more in Revenue Actions
              </Link>
            ) : null}
          </div>
          <div data-tour="priority-actions">
          <RevenueActionQueue
            actions={displayActions}
            actionHotelNames={
              view.scope.mode === "PORTFOLIO" ? view.actionHotelNames : undefined
            }
            isAnalyst={canManageActions}
            busy={pending}
            onViewEvidence={(id) => {
              setInsightActionId(id);
              setInsightOpen(true);
            }}
            emptyMessage={emptyMessage}
            onAccept={
              canManageActions
                ? (id) => runMutation(() => acceptRevenueAction(id))
                : undefined
            }
            onReject={
              canManageActions
                ? (id) => runMutation(() => rejectRevenueAction(id))
                : undefined
            }
            onSnooze={canManageActions ? snoozeOneDay : undefined}
            onComplete={
              canManageActions
                ? (id) => runMutation(() => completeRevenueAction(id))
                : undefined
            }
          />
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <div data-tour="command-centre-chart">
            <RateVsCompChart
              data={view.rateChart}
              hotelLabel={view.chartHotelName ?? view.scope.hotelName}
            />
          </div>
          <div data-tour="command-centre-explanation">
            <RevenueCommandExplanationPanel explanation={view.explanation} />
          </div>
        </div>
      </div>

      <Separator className="bg-border/80" />

      <RevenueActionInsightDrawer
        actionId={insightActionId}
        open={insightOpen}
        onOpenChange={setInsightOpen}
        onActionUpdated={() => router.refresh()}
      />
    </section>
  );
}
