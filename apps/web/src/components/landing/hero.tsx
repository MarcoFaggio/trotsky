"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { TroskyMark } from "@/components/brand/trosky-logo";
import { HeroChart } from "./hero-chart";

export function Hero() {
  const reduced = useReducedMotion();

  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-primary">
      {/* Atmospheric plane — red wash over paper, not purple glow */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background: `
            radial-gradient(ellipse 90% 70% at 70% 20%, color-mix(in srgb, var(--color-brand-600) 10%, transparent), transparent 55%),
            radial-gradient(ellipse 60% 50% at 10% 90%, color-mix(in srgb, var(--color-brand-700) 6%, transparent), transparent 50%),
            linear-gradient(180deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 100%)
          `,
        }}
      />

      <div className="relative mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-center px-4 pb-16 pt-28 sm:px-6 lg:px-8 lg:pb-20 lg:pt-32">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-16">
          <div className="max-w-xl">
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="mb-8"
            >
              <TroskyMark
                priority
                className="h-20 w-20 sm:h-24 sm:w-24"
              />
            </motion.div>

            <motion.p
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: reduced ? 0 : 0.05 }}
              className="mb-4 text-sm font-semibold tracking-[0.18em] text-brand-secondary uppercase"
            >
              Trosky
            </motion.p>

            <motion.h1
              className="text-display-md font-semibold tracking-tight text-primary sm:text-display-lg"
              initial={reduced ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: reduced ? 0 : 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              Hotel revenue intelligence that keeps pace with the market.
            </motion.h1>

            <motion.p
              initial={reduced ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: reduced ? 0 : 0.22 }}
              className="mt-5 max-w-md text-lg text-tertiary sm:text-xl"
            >
              Competitor rates, pace, and recommended actions in one cockpit—built for analysts and owners.
            </motion.p>

            <motion.div
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: reduced ? 0 : 0.34 }}
              className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <Button
                href="/login"
                size="xl"
                color="primary"
                iconTrailing={ArrowRight}
                className="w-full justify-center sm:w-auto"
              >
                Open the dashboard
              </Button>
              <Button
                href="/inquire"
                size="xl"
                color="secondary"
                className="w-full justify-center sm:w-auto"
              >
                Request a conversation
              </Button>
            </motion.div>
          </div>

          <motion.div
            initial={reduced ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: reduced ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-xl justify-self-center lg:max-w-none lg:justify-self-stretch"
          >
            <HeroChart />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
