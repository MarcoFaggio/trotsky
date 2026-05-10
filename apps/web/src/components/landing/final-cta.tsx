"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionWrapper } from "./section-wrapper";

export function FinalCta() {
  const reduced = useReducedMotion();

  return (
    <SectionWrapper className="relative overflow-hidden bg-gradient-to-br from-primary/12 via-background to-emerald-500/10 px-4 py-20 dark:from-primary/10 dark:via-background dark:to-emerald-500/[0.07] sm:px-6 sm:py-28 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent dark:from-primary/20" />
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 100, damping: 24 }}
        className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-border/80 bg-card/90 px-6 py-14 text-center shadow-2xl shadow-black/10 backdrop-blur-xl dark:border-white/[0.08] dark:bg-card/75 dark:shadow-black/40 sm:px-12 sm:py-16 md:px-14"
      >
        <div className="absolute inset-0 landing-grid-pattern opacity-40 dark:opacity-20" aria-hidden />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground dark:border-white/10 dark:bg-muted/40">
            <CalendarDays className="h-3.5 w-3.5" />
            Pilot & demo access
          </span>
          <h2 className="mt-8 font-landing-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-[2.5rem] md:leading-[1.15]">
            Start pricing with full market context
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
            Open the dashboard with your pilot login, or send an inquiry and we will walk you through comps, AI recommendations, and owner-ready reporting.
          </p>
          <div className="mt-10 flex w-full flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Link href="/login" className="w-full sm:w-auto sm:flex-1 sm:max-w-[280px]">
              <motion.span
                whileHover={reduced ? undefined : { scale: 1.02 }}
                whileTap={reduced ? undefined : { scale: 0.98 }}
                className="flex w-full"
              >
                <Button
                  size="lg"
                  className="w-full gap-2 rounded-xl px-8 text-base font-semibold shadow-lg shadow-primary/30 dark:shadow-primary/20"
                >
                  Open the dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.span>
            </Link>
            <Link href="/inquire" className="w-full sm:w-auto sm:flex-1 sm:max-w-[280px]">
              <motion.span className="flex w-full" whileHover={reduced ? undefined : { scale: 1.02 }} whileTap={reduced ? undefined : { scale: 0.98 }}>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full rounded-xl border-2 border-border px-8 text-base font-semibold dark:border-white/15 dark:bg-transparent"
                >
                  Request a conversation
                </Button>
              </motion.span>
            </Link>
          </div>
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            Already invited? Sign in with your pilot credentials. New team? We reply to inquiries within one business day.
          </p>
        </div>
      </motion.div>
    </SectionWrapper>
  );
}
