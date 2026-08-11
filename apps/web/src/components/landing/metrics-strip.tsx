"use client";

import { SectionWrapper } from "./section-wrapper";

const metrics = [
  { value: "500+", label: "Hotels on Trosky" },
  { value: "2.4M+", label: "Rates tracked weekly" },
  { value: "10h+", label: "Avg. time saved / week" },
];

export function MetricsStrip() {
  return (
    <SectionWrapper className="border-y border-secondary bg-secondary_alt px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-3 sm:gap-6">
        {metrics.map((m) => (
          <div key={m.label} className="text-center sm:text-left">
            <p className="text-display-sm font-semibold tracking-tight text-brand-secondary tabular-nums">
              {m.value}
            </p>
            <p className="mt-1 text-sm font-medium text-tertiary">{m.label}</p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
