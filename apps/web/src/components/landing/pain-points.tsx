"use client";

import { FileSearch02, Clock, Eye } from "@untitledui/icons";
import { motion } from "framer-motion";
import { SectionWrapper, cardItemVariants } from "./section-wrapper";

const points = [
  {
    title: "Manual rate collection",
    body: "Hours spent refreshing OTAs every week instead of pricing strategy.",
    icon: FileSearch02,
  },
  {
    title: "Market lag",
    body: "Competitors move daily. Spreadsheet workflows leave you reacting late.",
    icon: Clock,
  },
  {
    title: "Trust gap",
    body: "Owners want live context—not delayed decks and constant check-ins.",
    icon: Eye,
  },
];

export function PainPoints() {
  return (
    <SectionWrapper id="problem" className="bg-primary px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <h2 className="text-display-sm font-semibold tracking-tight text-primary sm:text-display-md">
            The status quo costs revenue
          </h2>
          <p className="mt-4 text-lg text-tertiary">
            Manual competitor tracking slows decisions and leaves teams flying blind between reports.
          </p>
        </div>

        <div className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-3">
          {points.map(({ title, body, icon: Icon }, i) => (
            <motion.div
              key={title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={cardItemVariants}
              className="relative border-t border-secondary pt-6"
            >
              <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-brand-primary ring-1 ring-brand ring-inset">
                <Icon className="size-5 text-fg-brand-primary" />
              </div>
              <h3 className="text-lg font-semibold text-primary">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-tertiary">{body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
