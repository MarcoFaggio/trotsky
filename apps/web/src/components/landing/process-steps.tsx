"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { Container, EASE, Reveal, SectionHeading } from "./primitives";

const STEPS = [
  {
    title: "Connect the property",
    body: "Add the hotel, its OTA listings and the competitors that matter. Rate plans and occupancy targets live with it from day one.",
    detail: "Half a day with an analyst",
  },
  {
    title: "Trosky collects",
    body: "Comp rates and availability arrive every morning. Occupancy, events and promotions are entered once and stay attached to the stay date.",
    detail: "Runs daily, unattended",
  },
  {
    title: "Act with evidence",
    body: "Each suggested action opens with its evidence. Accept, snooze or reject, and the owner view shows the same decision.",
    detail: "Minutes, not the afternoon",
  },
];

export function ProcessSteps() {
  const lineRef = useRef<HTMLOListElement>(null);
  const inView = useInView(lineRef, { once: true, amount: 0.3 });

  return (
    <section id="how-it-works" className="scroll-mt-20 border-t border-secondary py-20 sm:py-24 lg:py-32">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="How it works"
            title="Live in three steps."
            lede="No integration project. You keep your PMS and channel manager; Trosky reads the market and hands you decisions."
          />
        </Reveal>

        <ol ref={lineRef} role="list" className="relative mt-14 grid gap-12 lg:mt-20 lg:grid-cols-3 lg:gap-8">
          {/* Track: vertical on small screens, horizontal from lg. */}
          <div aria-hidden className="absolute top-2 bottom-2 left-[7px] w-px bg-border-secondary lg:top-[7px] lg:right-0 lg:bottom-auto lg:left-0 lg:h-px lg:w-auto" />
          <motion.div
            aria-hidden
            initial={{ scaleY: 0, scaleX: 1 }}
            animate={inView ? { scaleY: 1, scaleX: 1 } : undefined}
            transition={{ duration: 1.6, ease: EASE }}
            className="absolute top-2 bottom-2 left-[7px] w-px origin-top bg-brand-solid lg:hidden"
          />
          <motion.div
            aria-hidden
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : undefined}
            transition={{ duration: 1.6, ease: EASE }}
            className="absolute top-[7px] right-0 left-0 hidden h-px origin-left bg-brand-solid lg:block"
          />

          {STEPS.map((step, i) => (
            <Reveal key={step.title} as="li" index={i} className="relative pl-9 lg:pl-0 lg:pt-9">
              <span
                aria-hidden
                className="absolute top-0.5 left-0 flex size-[15px] items-center justify-center rounded-full bg-primary ring-1 ring-brand lg:top-0"
              >
                <span className="size-[7px] rounded-full bg-brand-solid" />
              </span>
              <p className="text-[12px] font-semibold tracking-[0.14em] text-brand-secondary uppercase">
                Step 0{i + 1}
              </p>
              <h3 className="mt-2 text-xl font-semibold tracking-tight text-primary sm:text-display-xs">
                {step.title}
              </h3>
              <p className="mt-3 max-w-md text-md leading-relaxed text-tertiary">{step.body}</p>
              <p className="mt-4 text-sm font-medium text-secondary">{step.detail}</p>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}
