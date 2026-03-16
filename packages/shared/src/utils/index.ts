export function formatCurrency(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function centsToDecimal(cents: number): number {
  return cents / 100;
}

export function decimalToCents(amount: number): number {
  return Math.round(amount * 100);
}

export function formatPercent(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return `${value.toFixed(1)}%`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatDateFull(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getDateRange(days: number): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  return dates;
}

export function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function computeWeightedAvg(
  items: { rate: number; weight: number }[]
): number {
  const valid = items.filter((i) => i.rate > 0);
  if (valid.length === 0) return 0;
  const totalWeight = valid.reduce((sum, i) => sum + i.weight, 0);
  if (totalWeight === 0) return 0;
  return valid.reduce((sum, i) => sum + i.rate * i.weight, 0) / totalWeight;
}

export function computeRecommendation(input: {
  ourRate: number;
  competitorRates: { rate: number; weight: number }[];
  occPercent: number | null;
  occTarget: number;
  occLyPercent: number | null;
  otbRooms: number | null;
  otbLyRooms: number | null;
  hasEvent: boolean;
  minRate: number | null;
  maxRate: number | null;
  discountWarning: boolean;
}): { recommendedPriceCents: number; confidence: number; rationale: string[] } {
  const rationale: string[] = [];
  const validCompRates = input.competitorRates.filter((c) => c.rate > 0);
  const compAnchor = computeWeightedAvg(validCompRates);

  if (compAnchor === 0) {
    return {
      recommendedPriceCents: input.ourRate,
      confidence: 0.1,
      rationale: ["No competitor data available; maintaining current rate."],
    };
  }

  rationale.push(
    `Comp anchor (weighted avg): $${(compAnchor / 100).toFixed(0)}`
  );

  let adjustment = 0;

  if (input.occPercent !== null && input.occTarget > 0) {
    const diff = input.occPercent - input.occTarget;
    if (diff > 0) {
      const bump = Math.floor(diff / 5) * 0.03;
      adjustment += bump;
      rationale.push(
        `Occupancy ${input.occPercent.toFixed(0)}% above target ${input.occTarget}%: +${(bump * 100).toFixed(0)}%`
      );
    } else if (diff < 0) {
      const dip = Math.floor(Math.abs(diff) / 5) * 0.02;
      adjustment -= dip;
      rationale.push(
        `Occupancy ${input.occPercent.toFixed(0)}% below target ${input.occTarget}%: -${(dip * 100).toFixed(0)}%`
      );
    }
  }

  if (input.otbRooms !== null && input.otbLyRooms !== null) {
    const pace =
      (input.otbRooms - input.otbLyRooms) / Math.max(input.otbLyRooms, 1);
    if (pace > 0.1) {
      adjustment += 0.02;
      rationale.push(`Strong pace vs LY (+${(pace * 100).toFixed(0)}%): +2%`);
    } else if (pace < -0.1) {
      adjustment -= 0.02;
      rationale.push(`Weak pace vs LY (${(pace * 100).toFixed(0)}%): -2%`);
    }
  }

  if (input.hasEvent) {
    adjustment += 0.05;
    rationale.push("Event on this date: +5%");
  }

  if (input.discountWarning) {
    adjustment -= 0.02;
    rationale.push("Discount warning active: -2% conservative adjustment");
  }

  let price = compAnchor * (1 + adjustment);

  if (input.minRate !== null && price < input.minRate) {
    price = input.minRate;
    rationale.push(`Clamped to min rate: $${(input.minRate / 100).toFixed(0)}`);
  }
  if (input.maxRate !== null && price > input.maxRate) {
    price = input.maxRate;
    rationale.push(`Clamped to max rate: $${(input.maxRate / 100).toFixed(0)}`);
  }

  price = Math.round(price / 100) * 100;

  let confidence = 0.3;
  confidence += Math.min(validCompRates.length / 5, 0.3);
  if (input.occPercent !== null) confidence += 0.15;
  if (input.otbRooms !== null) confidence += 0.1;
  if (input.occLyPercent !== null) confidence += 0.1;
  confidence = Math.min(confidence, 1);

  return {
    recommendedPriceCents: Math.round(price),
    confidence: Math.round(confidence * 100) / 100,
    rationale,
  };
}

export function computeADR(
  barRate: number,
  plans: { discountPercent: number; sharePercent: number }[]
): number {
  if (plans.length === 0) return barRate;
  return plans.reduce((sum, p) => {
    const planRate = barRate * (1 - p.discountPercent / 100);
    return sum + planRate * (p.sharePercent / 100);
  }, 0);
}

export function checkDiscountWarning(
  adr: number,
  barRate: number,
  totalDiscountShare: number,
  adrThreshold = 12,
  shareThreshold = 35
): { warning: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const adrDrop = ((barRate - adr) / barRate) * 100;
  if (adrDrop > adrThreshold) {
    reasons.push(
      `ADR is ${adrDrop.toFixed(1)}% below BAR (threshold: ${adrThreshold}%)`
    );
  }
  if (totalDiscountShare > shareThreshold) {
    reasons.push(
      `Discount share at ${totalDiscountShare.toFixed(0)}% (threshold: ${shareThreshold}%)`
    );
  }
  return { warning: reasons.length > 0, reasons };
}
