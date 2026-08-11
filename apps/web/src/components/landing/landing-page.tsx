"use client";

import { MotionConfig } from "framer-motion";
import {
  LandingNav,
  Hero,
  MetricsStrip,
  PainPoints,
  WhyDifferent,
  ProcessSteps,
  FinalCta,
  LandingFooter,
} from "./index";

export function LandingPage() {
  return (
    <MotionConfig reducedMotion="user">
      <div
        className="landing-page min-h-screen bg-primary font-body text-primary antialiased"
        data-landing
      >
        <LandingNav />
        <main className="relative overflow-x-hidden">
          <Hero />
          <MetricsStrip />
          <PainPoints />
          <WhyDifferent />
          <ProcessSteps />
          <FinalCta />
          <LandingFooter />
        </main>
      </div>
    </MotionConfig>
  );
}
