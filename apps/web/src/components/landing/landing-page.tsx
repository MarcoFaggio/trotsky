"use client";

import {
  LandingNav,
  Hero,
  PainPoints,
  WhyDifferent,
  ComparisonTable,
  Advantage,
  ProcessSteps,
  MetricsStrip,
  FinalCta,
  LandingFooter,
} from "./index";

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <LandingNav />
      <main>
        <Hero />
        <PainPoints />
        <WhyDifferent />
        <ComparisonTable />
        <Advantage />
        <ProcessSteps />
        <MetricsStrip />
        <FinalCta />
        <LandingFooter />
      </main>
    </div>
  );
}
