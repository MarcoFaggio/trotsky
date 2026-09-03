"use client";

import { motion } from "motion/react";
import { ArrowRight } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Accent, Container, EASE, Eyebrow } from "./primitives";
import { HeroCockpit } from "./hero-cockpit";

const FACTS = [
  "Rates refreshed daily from Booking.com and Expedia",
  "Production data in Frankfurt, eu-central-1",
  "Analyst and owner views on the same record",
];

export function Hero() {
  const rise = (delay: number) => ({
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.65, ease: EASE, delay },
  });

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="landing-hairline-grid pointer-events-none absolute inset-x-0 top-0 h-[70vh] min-h-[560px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[60vh]"
        style={{
          background:
            "radial-gradient(60% 55% at 78% 0%, color-mix(in srgb, var(--color-brand-600) 9%, transparent), transparent 70%)",
        }}
      />

      <Container className="relative pt-28 pb-16 sm:pt-32 lg:pt-40 lg:pb-24">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <motion.div {...rise(0)}>
              <Eyebrow>
                Hotel revenue intelligence
                <span className="hidden sm:inline"> · Cork, Ireland</span>
              </Eyebrow>
            </motion.div>

            <motion.h1
              {...rise(0.08)}
              className="mt-6 text-display-md font-semibold tracking-tight text-primary sm:text-display-lg lg:text-display-xl"
            >
              Know where your rate stands{" "}
              <Accent>before the market moves.</Accent>
            </motion.h1>

            <motion.p
              {...rise(0.16)}
              className="mt-6 max-w-lg text-lg leading-relaxed text-tertiary sm:text-xl"
            >
              Trosky checks your comp set on Booking.com and Expedia every day,
              lines it up against pace, occupancy and local events, and turns
              the gap into a rate action your team can accept in one click.
            </motion.p>

            <motion.div
              {...rise(0.24)}
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <Button
                href="/login"
                size="xl"
                color="primary"
                iconTrailing={ArrowRight}
                className="w-full justify-center sm:w-auto"
              >
                Open the command centre
              </Button>
              <Button
                href="/inquire"
                size="xl"
                color="secondary"
                className="w-full justify-center sm:w-auto"
              >
                Request a walkthrough
              </Button>
            </motion.div>

            <motion.ul
              {...rise(0.34)}
              role="list"
              className="mt-10 flex flex-col gap-2.5 border-t border-secondary pt-6 text-sm text-tertiary"
            >
              {FACTS.map((fact) => (
                <li key={fact} className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-[0.55rem] h-px w-4 shrink-0 bg-brand-solid"
                  />
                  {fact}
                </li>
              ))}
            </motion.ul>
          </div>

          <div className="lg:col-span-7">
            <HeroCockpit />
          </div>
        </div>
      </Container>
    </section>
  );
}
