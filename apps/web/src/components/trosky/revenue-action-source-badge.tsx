"use client";

import type { RevenueActionView } from "@hotel-pricing/shared";
import {
  getRevenueActionSourceMeta,
  isActionDemo,
  isActionLive,
} from "@/lib/revenue-action-display";
import { TroskyStatusBadge } from "./trosky-status-badge";

export function RevenueActionSourceBadge({
  action,
}: {
  action: Pick<RevenueActionView, "source" | "evidenceJson" | "type">;
}) {
  const meta = getRevenueActionSourceMeta(action);

  if (isActionDemo(action)) {
    return (
      <TroskyStatusBadge variant="warning" title={meta.description}>
        Demo data
      </TroskyStatusBadge>
    );
  }

  if (isActionLive(action)) {
    return (
      <TroskyStatusBadge variant="success" title={meta.description}>
        System-generated
      </TroskyStatusBadge>
    );
  }

  return (
    <TroskyStatusBadge variant="neutral" title={meta.description}>
      {meta.label}
    </TroskyStatusBadge>
  );
}
