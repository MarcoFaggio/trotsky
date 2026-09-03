"use client";

import { MotionConfig } from "motion/react";
import {
  LandingNav,
  Hero,
  ActionTicker,
  PainPoints,
  ProductTour,
  ConnectedPlatform,
  ProcessSteps,
  Presence,
  FinalCta,
  LandingFooter,
} from "./index";

export function LandingPage() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="landing-page min-h-screen bg-primary font-body text-primary antialiased">
        <LandingNav />
        <main id="main" className="relative overflow-x-clip">
          <Hero />
          <ActionTicker />
          <PainPoints />
          <ProductTour />
          <ConnectedPlatform />
          <ProcessSteps />
          <Presence />
          <FinalCta />
        </main>
        <LandingFooter />
      </div>
    </MotionConfig>
  );
}
