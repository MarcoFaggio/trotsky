"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { RateCalendarView } from "@hotel-pricing/shared";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TroskyFilterBar } from "./trosky-filter-bar";
import { TroskyPageHeader } from "./trosky-page-header";
import { RateCalendarSummary } from "./rate-calendar-summary";
import { RateCalendarGrid } from "./rate-calendar-grid";
import { RevenueActionInsightDrawer } from "./revenue-action-insight-drawer";

export interface RateCalendarViewProps {
  view: RateCalendarView;
  hotels: { id: string; name: string }[];
  hotelId: string | null;
  isAnalyst: boolean;
}

export function RateCalendarViewPanel({
  view,
  hotels,
  hotelId,
  isAnalyst,
}: RateCalendarViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [insightActionId, setInsightActionId] = useState<string | null>(null);
  const [insightOpen, setInsightOpen] = useState(false);

  const hasHotel = view.scope.hotelId != null;
  const hasAnyData = view.days.some(
    (d) =>
      d.yourRateCents != null ||
      d.actionCount > 0 ||
      d.status !== "NO_DATA"
  );

  function handleHotelChange(nextHotelId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("hotelId", nextHotelId);
    router.push(`/rate-calendar?${params.toString()}`);
  }

  function openEvidence(actionId: string) {
    setInsightActionId(actionId);
    setInsightOpen(true);
  }

  return (
    <div className="min-w-0 space-y-6" data-tour="calendar-page">
      <TroskyPageHeader
        eyebrow="Rate calendar"
        title={view.scope.hotelName ?? "Rate calendar"}
        description={
          isAnalyst
            ? "Scan the next 30 days for pricing health and active revenue actions. Red marks urgent dates; healthy days have no active action."
            : "Read-only view of daily pricing health for your hotel. Open evidence on dates with an active action."
        }
        badge={{
          text: isAnalyst ? "Analyst" : "Client",
          variant: "neutral",
        }}
      />

      <p className="text-xs leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">Comp ref.</span> means
        competitor reference from available scrape data — not a guaranteed
        median. Calendar health combines rates and active revenue actions.
      </p>

      {isAnalyst && hotels.length > 1 ? (
        <TroskyFilterBar label="Filters">
          <div className="flex min-w-0 flex-col gap-1.5">
            <Label htmlFor="calendar-hotel" className="text-xs text-muted-foreground">
              Hotel
            </Label>
            <Select
              value={hotelId ?? hotels[0]?.id}
              onValueChange={handleHotelChange}
            >
              <SelectTrigger
                id="calendar-hotel"
                className="h-9 w-full min-w-[12rem] max-w-md rounded-xl"
                aria-label="Select hotel for rate calendar"
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
        </TroskyFilterBar>
      ) : !isAnalyst && view.scope.hotelName ? (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Hotel:</span>{" "}
          {view.scope.hotelName}
        </p>
      ) : null}

      {!hasHotel ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {isAnalyst
              ? "Select a hotel to view the rate calendar."
              : "Your hotel is not configured for the rate calendar yet. Contact your analyst."}
          </p>
        </div>
      ) : !hasAnyData ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-12 text-center">
          <p className="text-sm leading-relaxed text-muted-foreground">
            No calendar data yet. More dates will populate as scrapes and
            recommendation runs complete.
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {view.startDate} → {view.endDate}
          </p>
          <div data-tour="calendar-summary">
            <RateCalendarSummary summary={view.summary} />
          </div>
          <div data-tour="calendar-grid">
            <RateCalendarGrid days={view.days} onViewEvidence={openEvidence} />
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Calendar health is based on available rates and active revenue
            actions. Empty days are quiet — they do not mean something is wrong.
          </p>
        </>
      )}

      <RevenueActionInsightDrawer
        actionId={insightActionId}
        open={insightOpen}
        onOpenChange={setInsightOpen}
        onActionUpdated={() => router.refresh()}
      />
    </div>
  );
}
