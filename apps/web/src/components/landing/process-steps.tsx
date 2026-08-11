"use client";

import { motion } from "framer-motion";
import { SectionWrapper, cardItemVariants } from "./section-wrapper";

const steps = [
  {
    step: "01",
    title: "Connect the property",
    body: "Add your hotel and pick the competitors that matter in your market.",
  },
  {
    step: "02",
    title: "Let Trosky collect",
    body: "Rates and availability flow in automatically—no weekly OTA refresh ritual.",
  },
  {
    step: "03",
    title: "Act with evidence",
    body: "Review recommended actions, accept or reject, and keep owners aligned.",
  },
];

export function ProcessSteps() {
  return (
    <SectionWrapper id="process" className="bg-primary px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <h2 className="text-display-sm font-semibold tracking-tight text-primary sm:text-display-md">
            Live in three steps
          </h2>
          <p className="mt-4 text-lg text-tertiary">
            Frictionless onboarding. You focus on strategy; we handle the data.
          </p>
        </div>

        <ol className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
          {steps.map(({ step, title, body }, index) => (
            <motion.li
              key={step}
              custom={index}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={cardItemVariants}
              className="relative"
            >
              <p className="text-display-xs font-semibold tabular-nums text-brand-secondary">
                {step}
              </p>
              <h3 className="mt-3 text-lg font-semibold text-primary">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-tertiary">{body}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </SectionWrapper>
  );
}
