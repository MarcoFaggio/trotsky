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
    <div className="landing-page min-h-screen landing-bg" data-landing>
      <LandingNav />
      <main className="relative">
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
