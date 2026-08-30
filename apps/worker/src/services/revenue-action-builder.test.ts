import { describe, expect, it } from "vitest";
import {
  MIN_RATE_DELTA_CENTS,
  decidePersistAction,
  deriveUrgency,
  mapConfidenceScore,
  qualifiesForPriceChangeAction,
  type PersistableActionDraft,
} from "./revenue-action-builder";
import type { RevenueAction } from "@hotel-pricing/db";

const today = new Date("2026-08-30T00:00:00.000Z");
const staySoon = new Date("2026-09-01T00:00:00.000Z");
const windowEnd = new Date("2026-09-28T00:00:00.000Z");

function draft(
  overrides: Partial<PersistableActionDraft> = {}
): PersistableActionDraft {
  return {
    actionKey: "price-change:2026-09-01:default",
    stayDate: staySoon,
    title: "Raise Mon 1 Sep to $169",
    summary: "Comp gap",
    reason: "Test",
    urgency: "HIGH",
    confidence: "HIGH",
    currentValueCents: 14500,
    recommendedValueCents: 16900,
    estimatedUpsideLowCents: 2400,
    estimatedUpsideHighCents: 3600,
    evidenceJson: { source: "recommendation-worker" },
    sourceEntityId: "rec_1",
    ...overrides,
  };
}

function existing(
  overrides: Partial<RevenueAction> = {}
): RevenueAction {
  return {
    id: "act_1",
    hotelId: "hotel_1",
    actionKey: "price-change:2026-09-01:default",
    type: "PRICE_CHANGE",
    status: "PENDING",
    title: "old",
    summary: "old",
    reason: null,
    urgency: "MEDIUM",
    confidence: "MEDIUM",
    stayDate: staySoon,
    currentValueCents: 14500,
    recommendedValueCents: 16000,
    estimatedUpsideLowCents: null,
    estimatedUpsideHighCents: null,
    evidenceJson: {},
    source: "RECOMMENDATION",
    sourceEntityId: "rec_1",
    createdAt: today,
    updatedAt: today,
    lastEvaluatedAt: today,
    expiresAt: null,
    decidedById: null,
    decidedAt: null,
    decisionNote: null,
    snoozedUntil: null,
    ...overrides,
  };
}

describe("mapConfidenceScore", () => {
  it("rejects scores below the live-action floor", () => {
    expect(mapConfidenceScore(0.44)).toBeNull();
  });

  it("maps mid scores to MEDIUM and high scores to HIGH", () => {
    expect(mapConfidenceScore(0.45)).toBe("MEDIUM");
    expect(mapConfidenceScore(0.75)).toBe("HIGH");
  });
});

describe("deriveUrgency", () => {
  it("is CRITICAL for a large gap inside 3 days", () => {
    expect(deriveUrgency(2500, staySoon, today)).toBe("CRITICAL");
  });

  it("is HIGH for a $20+ gap further out", () => {
    const later = new Date("2026-09-10T00:00:00.000Z");
    expect(deriveUrgency(2000, later, today)).toBe("HIGH");
  });

  it("is MEDIUM at the minimum live delta", () => {
    const later = new Date("2026-09-10T00:00:00.000Z");
    expect(deriveUrgency(MIN_RATE_DELTA_CENTS, later, today)).toBe("MEDIUM");
  });
});

describe("qualifiesForPriceChangeAction", () => {
  const base = {
    stayDate: staySoon,
    today,
    windowEnd,
    currentCents: 14500,
    recommendedCents: 16900,
    confidenceScore: 0.7,
  };

  it("accepts a material in-window recommendation", () => {
    expect(qualifiesForPriceChangeAction(base)).toEqual({ ok: true });
  });

  it("skips past stay dates and missing rates", () => {
    expect(
      qualifiesForPriceChangeAction({
        ...base,
        stayDate: new Date("2026-08-20T00:00:00.000Z"),
      })
    ).toEqual({ ok: false, reason: "past_stay_date" });
    expect(
      qualifiesForPriceChangeAction({ ...base, currentCents: 0 })
    ).toEqual({ ok: false, reason: "missing_current_rate" });
  });

  it("skips tiny or identical deltas", () => {
    expect(
      qualifiesForPriceChangeAction({ ...base, recommendedCents: 14500 })
    ).toEqual({ ok: false, reason: "no_delta" });
    expect(
      qualifiesForPriceChangeAction({ ...base, recommendedCents: 14900 })
    ).toEqual({ ok: false, reason: "delta_too_small" });
  });
});

describe("decidePersistAction", () => {
  it("creates when no row exists and updates PENDING", () => {
    expect(decidePersistAction(null, draft(), today)).toBe("create");
    expect(decidePersistAction(existing(), draft(), today)).toBe("update");
  });

  it("does not overwrite accepted rows unless the rec moved enough", () => {
    const accepted = existing({ status: "ACCEPTED", recommendedValueCents: 16900 });
    expect(decidePersistAction(accepted, draft(), today)).toBe("touch");
    expect(
      decidePersistAction(
        accepted,
        draft({ recommendedValueCents: 19000 }),
        today
      )
    ).toBe("review");
  });
});
