"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  acceptRevenueAction,
  completeRevenueAction,
  getRevenueActions,
  rejectRevenueAction,
  snoozeRevenueAction,
} from "@/actions/revenue-actions";
import type { RevenueActionView } from "@hotel-pricing/shared";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getFilterEmptyMessage,
  isActionDemo,
  isActionLive,
  matchesCategoryFilter,
  sortActionsForDisplay,
  type RevenueActionCategoryFilter,
} from "@/lib/revenue-action-display";
import { TroskyFilterBar } from "./trosky-filter-bar";
import { TroskyPageHeader } from "./trosky-page-header";
import { RevenueActionQueue } from "./revenue-action-queue";
import { RevenueActionInsightDrawer } from "./revenue-action-insight-drawer";
import { troskySurfaces } from "./trosky-primitives";

interface RevenueActionsDemoProps {
  hotelId: string;
  hotelName: string;
  hotels: { id: string; name: string }[];
  initialActions: RevenueActionView[];
  isAnalyst: boolean;
  demoModeEnabled: boolean;
}

export function RevenueActionsDemo({
  hotelId,
  hotelName,
  hotels,
  initialActions,
  isAnalyst,
  demoModeEnabled,
}: RevenueActionsDemoProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [actions, setActions] = useState(initialActions);
  const [listFilter, setListFilter] =
    useState<RevenueActionCategoryFilter>("active");
  const [pending, startTransition] = useTransition();
  const [insightActionId, setInsightActionId] = useState<string | null>(null);
  const [insightOpen, setInsightOpen] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const hasLive = useMemo(() => actions.some(isActionLive), [actions]);
  const hasDemo = useMemo(() => actions.some(isActionDemo), [actions]);

  useEffect(() => {
    if (!demoModeEnabled && listFilter === "demo") {
      setListFilter("active");
    }
  }, [demoModeEnabled, listFilter]);

  const filtered = useMemo(() => {
    return sortActionsForDisplay(
      actions.filter((a) => matchesCategoryFilter(a, listFilter))
    );
  }, [actions, listFilter]);

  function refreshList() {
    setMutationError(null);
    startTransition(async () => {
      try {
        const next = await getRevenueActions(hotelId);
        setActions(next);
      } catch {
        setMutationError("Could not refresh actions. Reload the page.");
      }
    });
  }

  function handleHotelChange(nextHotelId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("hotelId", nextHotelId);
    router.push(`/actions?${params.toString()}`);
  }

  function runMutation(fn: () => Promise<void>) {
    setMutationError(null);
    startTransition(async () => {
      try {
        await fn();
        const next = await getRevenueActions(hotelId);
        setActions(next);
      } catch {
        setMutationError("Could not update this action. Try again.");
      }
    });
  }

  function snoozeOneDay(actionId: string) {
    const until = new Date();
    until.setDate(until.getDate() + 1);
    runMutation(() => snoozeRevenueAction(actionId, until));
  }

  const emptyMessage = getFilterEmptyMessage(listFilter, isAnalyst);
  const showHotelSelect = isAnalyst && hotels.length > 1;

  return (
    <div className="min-w-0 space-y-6" data-tour="actions-page">
      <TroskyPageHeader
        eyebrow="Revenue actions"
        title={hotelName}
        description="Use this page to review, filter, and manage all revenue actions for the selected hotel."
        badge={{
          text: isAnalyst ? "Analyst" : "Client",
          variant: "neutral",
        }}
      />

      {!isAnalyst ? (
        <p className="text-sm leading-relaxed text-muted-foreground">
          Read-only view for your assigned hotel. Open any action to see evidence;
          workflow decisions are managed by your analyst.
        </p>
      ) : (
        <p className="text-sm leading-relaxed text-muted-foreground">
          Accept records intent only — Trosky does not push rates to a PMS.
          Demo items are labelled; live items come from worker runs.
        </p>
      )}

      {isAnalyst && demoModeEnabled ? (
        <div
          className={`${troskySurfaces.mutedPanel} px-4 py-3 text-xs leading-relaxed text-muted-foreground`}
          role="status"
        >
          <span className="font-medium text-foreground">Demo mode is enabled.</span>{" "}
          Demo actions are visible and labelled.
        </div>
      ) : null}

      {(hasLive || hasDemo) && (
        <div
          className={`${troskySurfaces.mutedPanel} px-4 py-3 text-xs leading-relaxed text-muted-foreground`}
          role="status"
        >
          {hasLive ? (
            <span className="font-medium text-foreground">
              System-generated actions present
            </span>
          ) : (
            <span className="font-medium text-foreground">Demo data only</span>
          )}
          {hasLive && hasDemo
            ? " — demo actions are labelled separately."
            : hasDemo && !hasLive
              ? " — run the worker after scrapes for live actions."
              : null}
        </div>
      )}

      {mutationError ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {mutationError}
        </p>
      ) : null}

      <TroskyFilterBar label="Filters" data-tour="actions-filters">
        {showHotelSelect ? (
          <div className="flex min-w-0 flex-col gap-1.5">
            <Label htmlFor="actions-hotel" className="text-xs text-muted-foreground">
              Hotel
            </Label>
            <Select value={hotelId} onValueChange={handleHotelChange}>
              <SelectTrigger
                id="actions-hotel"
                className="h-9 w-full min-w-[12rem] max-w-md rounded-xl"
                aria-label="Select hotel"
              >
                <SelectValue placeholder="Select hotel" />
              </SelectTrigger>
              <SelectContent>
                {hotels.map((h) => (
                  <SelectItem key={h.id} value={h.id}>
                    {h.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Hotel:</span> {hotelName}
          </p>
        )}
        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor="actions-category" className="text-xs text-muted-foreground">
            Category
          </Label>
          <Select
            value={listFilter}
            onValueChange={(v) =>
              setListFilter(v as RevenueActionCategoryFilter)
            }
          >
            <SelectTrigger
              id="actions-category"
              className="h-9 w-full min-w-[10rem] max-w-xs rounded-xl"
              aria-label="Filter by category"
            >
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pricing">Pricing</SelectItem>
              <SelectItem value="events">Events</SelectItem>
              <SelectItem value="watch">Watch</SelectItem>
              {demoModeEnabled ? (
                <SelectItem value="demo">Demo / beta</SelectItem>
              ) : null}
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </TroskyFilterBar>

      <div data-tour="actions-queue">
      <RevenueActionQueue
        actions={filtered}
        isAnalyst={isAnalyst}
        busy={pending}
        emptyMessage={emptyMessage}
        onViewEvidence={(id) => {
          setInsightActionId(id);
          setInsightOpen(true);
        }}
        onAccept={
          isAnalyst
            ? (id) => runMutation(() => acceptRevenueAction(id))
            : undefined
        }
        onReject={
          isAnalyst ? (id) => runMutation(() => rejectRevenueAction(id)) : undefined
        }
        onSnooze={isAnalyst ? snoozeOneDay : undefined}
        onComplete={
          isAnalyst
            ? (id) => runMutation(() => completeRevenueAction(id))
            : undefined
        }
      />
      </div>

      <RevenueActionInsightDrawer
        actionId={insightActionId}
        open={insightOpen}
        onOpenChange={setInsightOpen}
        onActionUpdated={refreshList}
      />
    </div>
  );
}
