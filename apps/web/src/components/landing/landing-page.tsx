"use client";

import { MotionConfig } from "framer-motion";
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
    // reducedMotion="user" disables every nested framer animation for
    // visitors with prefers-reduced-motion, including whileInView/whileHover.
    <MotionConfig reducedMotion="user">
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
    </MotionConfig>
  );
}
