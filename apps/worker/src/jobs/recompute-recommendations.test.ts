import { describe, expect, it } from "vitest";
import { shouldComputeRecommendation } from "./recompute-recommendations";
import { eventUrgency } from "../services/demand-action-builder";

describe("shouldComputeRecommendation", () => {
  it("skips a day with no own rate and no competitor observations", () => {
    expect(shouldComputeRecommendation(0, 0)).toBe(false);
  });

  it("computes when either own rate or comps exist", () => {
    expect(shouldComputeRecommendation(11900, 0)).toBe(true);
    expect(shouldComputeRecommendation(0, 2)).toBe(true);
  });
});

describe("eventUrgency", () => {
  it("returns null for past events and events beyond 14 days", () => {
    expect(eventUrgency(-1)).toBeNull();
    expect(eventUrgency(15)).toBeNull();
  });

  it("escalates as the stay date approaches", () => {
    expect(eventUrgency(14)).toBe("MEDIUM");
    expect(eventUrgency(7)).toBe("HIGH");
    expect(eventUrgency(3)).toBe("CRITICAL");
  });
});
