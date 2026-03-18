"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { TrendingUp, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroChart } from "./hero-chart";

const EYEBROW = "Hotel rate intelligence · AI-driven pricing";
const HEADLINE = "Stop Losing Revenue to Your Competitors";
const VALUE_PROP =
  "Automate competitor rate tracking across Expedia, Booking.com, and direct. Get AI-recommended rates, save time, and make better pricing decisions.";
const SUBHEADLINE =
  "Continuous tracking, AI Recommended rate in every view, and live visibility for stakeholders — in one platform.";

export function Hero() {
  const [displayedHeadline, setDisplayedHeadline] = useState("");
  const [headlineComplete, setHeadlineComplete] = useState(false);

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      if (i <= HEADLINE.length) {
        setDisplayedHeadline(HEADLINE.slice(0, i));
        i++;
      } else {
        setHeadlineComplete(true);
        clearInterval(t);
      }
    }, 42);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative overflow-hidden border-landing border-b landing-bg px-4 pt-28 pb-16 sm:px-6 sm:pt-36 sm:pb-24 lg:px-8">
      {/* Background: radial glow + grid + noise */}
      <div
        className="pointer-events-none absolute inset-0 landing-grid-pattern opacity-50"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-[480px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px] bg-[hsl(160_84%_39%_/_0.2)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 landing-noise mix-blend-overlay"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-[1fr,1fr] lg:gap-16 lg:items-center">
          {/* Left: copy + CTAs */}
          <div className="max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-landing-border bg-landing-bg-elevated px-3 py-1.5 text-xs font-medium uppercase tracking-wider landing-text-muted"
            >
              <TrendingUp className="h-3.5 w-3.5 text-landing-emerald" />
              <span>{EYEBROW.split(" · ")[0]}</span>
              <span className="text-landing-emerald">·</span>
              <Sparkles className="h-3.5 w-3.5 text-landing-emerald" />
              <span>AI-driven pricing</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35 }}
              className="text-3xl font-bold tracking-tight landing-text sm:text-4xl md:text-5xl lg:text-[2.75rem] lg:leading-[1.15]"
            >
              <span>{displayedHeadline}</span>
              {!headlineComplete && (
                <span
                  className="ml-0.5 inline-block h-0.85em w-0.5 bg-landing-emerald animate-cursor-blink"
                  aria-hidden
                />
              )}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 120, damping: 24 }}
              className="mt-6 text-lg landing-text-muted sm:text-xl"
            >
              {VALUE_PROP}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, type: "spring", stiffness: 120, damping: 24 }}
              className="mt-3 text-base landing-text-muted"
            >
              {SUBHEADLINE}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85, type: "spring", stiffness: 120, damping: 24 }}
              className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center"
            >
              <Link href="/login">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex"
                >
                  <Button
                    size="lg"
                    className="gap-2 min-w-[200px] font-medium bg-landing-emerald text-white hover:bg-landing-emerald/90 shadow-landing-glow border-0"
                  >
                    Schedule Free Demo
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              </Link>
              <p className="text-sm landing-text-muted">
                No credit card required · 15-minute intro call
              </p>
            </motion.div>
          </div>

          {/* Right (desktop) / below (tablet): real app chart — Competitive Rate Comparison */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, type: "spring", stiffness: 100, damping: 24 }}
            className="relative hidden md:block"
          >
            <HeroChart />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
