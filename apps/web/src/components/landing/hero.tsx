"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const HEADLINE = "Stop Losing Revenue to Your Competitors";
const VALUE_PROP =
  "Trosky Analytics automates hotel rate tracking across OTAs and direct channels, helping revenue teams save time, react faster, and make better pricing decisions with confidence.";
const SUBHEADLINE =
  "Monitor competitor prices across Expedia, Booking.com, and direct channels. Get continuous tracking, faster decisions, and live visibility for stakeholders — all in one platform.";

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
    }, 38);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative overflow-hidden border-b border-border bg-background px-4 pt-24 pb-20 sm:px-6 sm:pt-32 sm:pb-28 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
          className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl"
        >
          <span>{displayedHeadline}</span>
          {!headlineComplete && (
            <span
              className="ml-0.5 inline-block h-0.75em w-0.5 bg-primary animate-cursor-blink"
              aria-hidden
            />
          )}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, type: "spring", stiffness: 120, damping: 24 }}
          className="mt-6 text-lg text-muted-foreground sm:text-xl"
        >
          {VALUE_PROP}
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, type: "spring", stiffness: 120, damping: 24 }}
          className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground"
        >
          {SUBHEADLINE}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, type: "spring", stiffness: 120, damping: 24 }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
        >
          <Link href="/login">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Button
                size="lg"
                className="min-w-[200px] font-medium shadow-md transition-shadow hover:shadow-lg"
              >
                Schedule Free Demo
              </Button>
            </motion.div>
          </Link>
          <p className="text-sm text-muted-foreground">
            No credit card required • 15-minute intro call
          </p>
        </motion.div>
      </div>
    </section>
  );
}
