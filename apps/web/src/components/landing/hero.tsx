"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, MessageSquareQuote, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TroskyMark } from "@/components/brand/trosky-logo";
import { HeroChart } from "./hero-chart";

const HEADLINE = "Trosky Revenue Intelligence";
const SUB =
  "Automated competitor rates across OTAs, AI-backed recommendations, and a live dashboard your owners can trust. Built for hotel teams that need sharper pricing decisions without spreadsheet drag.";
const STATS = [
  { label: "Hotels on Trosky", value: "500+", valueClass: "text-primary" },
  { label: "Rates tracked / week", value: "2.4M+", valueClass: "text-primary" },
  { label: "Avg. time saved", value: "10h+", valueClass: "text-primary/80" },
];

export function Hero() {
  const reduced = useReducedMotion();

  return (
    <section className="landing-bg relative border-b border-border/60 px-4 pb-16 pt-24 sm:px-6 sm:pb-24 sm:pt-32 lg:px-8 lg:pb-28 lg:pt-36">
      <div className="landing-aurora-blobs opacity-90 dark:opacity-100" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.12] dark:mix-blend-soft-light"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 48V0h48' fill='none' stroke='%23000' stroke-opacity='0.06'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14">
          <div className="max-w-2xl">
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="mb-7"
            >
              <TroskyMark priority className="h-24 w-24 sm:h-28 sm:w-28" />
            </motion.div>

            <motion.div
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: reduced ? 0 : 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="mb-6 inline-flex flex-wrap items-center gap-2"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card/90 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
                <Zap className="h-3.5 w-3.5 text-primary" aria-hidden />
                Trosky Revenue Intelligence
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                AI recommendations in every view
              </span>
            </motion.div>

            <motion.h1
              className="font-landing-display text-4xl font-semibold leading-[1.02] tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-[4.2rem]"
              initial={reduced ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
            >
              {HEADLINE}
            </motion.h1>

            <motion.p
              initial={reduced ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: reduced ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
            >
              {SUB}
            </motion.p>

            <motion.div
              initial={reduced ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: reduced ? 0 : 0.5 }}
              className="mt-10 flex w-full max-w-lg flex-col gap-3 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:gap-4"
            >
              <Link href="/login" className="w-full sm:w-auto">
                <motion.span
                  whileHover={reduced ? undefined : { scale: 1.02 }}
                  whileTap={reduced ? undefined : { scale: 0.98 }}
                  className="flex w-full sm:inline-flex"
                >
                  <Button
                    size="lg"
                    className="w-full gap-2 rounded-xl px-8 text-base font-semibold shadow-lg shadow-primary/30 dark:shadow-primary/20 sm:min-w-[220px]"
                  >
                    Sign in with pilot access
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.span>
              </Link>
              <Link href="/inquire" className="w-full sm:w-auto">
                <motion.span
                  whileHover={reduced ? undefined : { scale: 1.02 }}
                  whileTap={reduced ? undefined : { scale: 0.98 }}
                  className="flex w-full sm:inline-flex"
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full gap-2 rounded-xl border-2 border-border bg-card/90 px-8 text-base font-semibold backdrop-blur-sm dark:border-white/15 dark:bg-card/50 sm:min-w-[220px]"
                  >
                    <MessageSquareQuote className="h-4 w-4" />
                    Send us an inquiry
                  </Button>
                </motion.span>
              </Link>
            </motion.div>

            <motion.p
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: reduced ? 0 : 0.65 }}
              className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground"
            >
              Use analyst or client demo accounts from the login page when demo hints are enabled.
            </motion.p>

            <motion.div
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduced ? 0 : 0.7, duration: 0.45 }}
              className="mt-12 grid gap-4 sm:grid-cols-3"
            >
              {STATS.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={reduced ? false : { opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: reduced ? 0 : 0.08 * i }}
                  className="motion-safe-soft rounded-xl border border-border/80 bg-card/70 p-4 shadow-sm backdrop-blur-md hover:-translate-y-1 hover:border-primary/25 hover:shadow-md"
                >
                  <p className={`text-2xl font-bold tracking-tight tabular-nums ${s.valueClass}`}>
                    {s.value}
                  </p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {s.label}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>

            <motion.div
              initial={reduced ? false : { opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                type: "spring",
                stiffness: 90,
                damping: 22,
                delay: reduced ? 0 : 0.25,
              }}
              className="relative order-first mx-auto w-full max-w-lg lg:order-none lg:max-w-none"
            >
              <div
                className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-primary/25 via-primary/5 to-primary/15 blur-2xl dark:from-primary/30 dark:via-transparent dark:to-primary/20"
                aria-hidden
              />
              <motion.div
                whileHover={reduced ? undefined : { y: -3 }}
                transition={{ type: "spring", stiffness: 280, damping: 22 }}
                className="relative rounded-xl border border-border/70 bg-card/95 p-1 shadow-2xl shadow-black/[0.08] ring-1 ring-black/[0.04] backdrop-blur dark:border-white/10 dark:bg-card/80 dark:shadow-black/50 dark:ring-white/[0.06]"
              >
                <HeroChart />
              </motion.div>
            </motion.div>

          {/* Mobile: chart stacks below; stats already visible */}
        </div>
      </div>
    </section>
  );
}
