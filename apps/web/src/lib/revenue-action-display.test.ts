import { describe, expect, it } from "vitest";
import { isActionDemo } from "./revenue-action-display";

/**
 * `isActionDemo` decides whether a RevenueAction is fabricated seed data. A
 * false negative presents demo pricing advice as real hotel intelligence, so
 * the classification is pinned here rather than left to inspection.
 */
describe("isActionDemo", () => {
  it("flags the seed sources", () => {
    expect(isActionDemo({ source: "SEED" })).toBe(true);
    expect(isActionDemo({ source: "seed-demo" })).toBe(true);
    expect(isActionDemo({ source: "  SEED  " })).toBe(true);
  });

  it("flags evidence markers regardless of source", () => {
    expect(
      isActionDemo({ source: "RECOMMENDATION", evidenceJson: { source: "seed-demo" } })
    ).toBe(true);
    expect(
      isActionDemo({ source: "RECOMMENDATION", evidenceJson: { demoBeta: true } })
    ).toBe(true);
    expect(
      isActionDemo({ source: "RECOMMENDATION", evidenceJson: { demo: true } })
    ).toBe(true);
  });

  it("treats worker-generated actions as live", () => {
    expect(isActionDemo({ source: "RECOMMENDATION" })).toBe(false);
    expect(isActionDemo({ source: "EVENT_DEMAND" })).toBe(false);
    expect(
      isActionDemo({ source: "RECOMMENDATION", evidenceJson: { compRates: [1, 2] } })
    ).toBe(false);
  });

  it("does not mistake EVENT_DEMAND for demo data", () => {
    // "event_demand" contains "demand", not "demo" — but the substring check is
    // close enough to that word to be worth locking down.
    expect(isActionDemo({ source: "EVENT_DEMAND", evidenceJson: null })).toBe(false);
    expect(isActionDemo({ source: "event_demand" })).toBe(false);
  });

  it("handles missing and malformed evidence without throwing", () => {
    expect(isActionDemo({ source: null })).toBe(false);
    expect(isActionDemo({ source: undefined })).toBe(false);
    expect(isActionDemo({ source: "RECOMMENDATION", evidenceJson: null })).toBe(false);
    expect(isActionDemo({ source: "RECOMMENDATION", evidenceJson: [1, 2, 3] })).toBe(false);
    expect(isActionDemo({ source: "RECOMMENDATION", evidenceJson: "string" })).toBe(false);
  });
});
