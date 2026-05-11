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
    <div
      className="landing-page landing-editorial min-h-screen bg-background font-landing-sans text-foreground antialiased"
      data-landing
    >
      <LandingNav />
      <main className="relative overflow-x-hidden">
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
