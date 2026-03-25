"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarDays, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionWrapper } from "./section-wrapper";

export function FinalCta() {
  return (
    <SectionWrapper className="landing-bg-elevated px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 100, damping: 24 }}
        className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl border border-landing-border landing-bg-card px-8 py-14 text-center shadow-landing-card sm:px-12"
      >
        <div className="absolute inset-0 landing-grid-pattern opacity-30" aria-hidden />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-landing-border bg-landing-bg-elevated px-3 py-1 text-xs font-medium landing-text-muted mb-6">
            <CalendarDays className="h-3.5 w-3.5" />
            Free 15-minute intro call
          </span>
          <h2 className="text-2xl font-bold tracking-tight landing-text sm:text-3xl md:text-4xl">
            Ready to Outpace the Competition?
          </h2>
          <p className="mt-4 landing-text-muted">
            Join hotel revenue teams using Trosky Analytics to save time,
            improve visibility, and make faster pricing decisions.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/login">
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="inline-flex"
              >
                <Button
                  size="lg"
                  className="gap-2 min-w-[200px] font-medium"
                >
                  Schedule Free Demo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            </Link>
            <p className="text-sm landing-text-muted">
              No credit card required
            </p>
          </div>
        </div>
      </motion.div>
    </SectionWrapper>
  );
}
