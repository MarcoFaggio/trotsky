"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { SectionWrapper } from "./section-wrapper";

export function FinalCta() {
  const reduced = useReducedMotion();

  return (
    <SectionWrapper className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background: `
            radial-gradient(ellipse 80% 80% at 50% 0%, color-mix(in srgb, var(--color-brand-600) 14%, transparent), transparent 60%),
            var(--color-bg-secondary)
          `,
        }}
      />
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45 }}
        className="relative mx-auto max-w-2xl text-center"
      >
        <h2 className="text-display-sm font-semibold tracking-tight text-primary sm:text-display-md">
          Price with full market context
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-lg text-tertiary">
          Open the pilot dashboard, or send an inquiry and we will walk you through comps, actions, and owner reporting.
        </p>
        <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
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
        </div>
      </motion.div>
    </SectionWrapper>
  );
}
