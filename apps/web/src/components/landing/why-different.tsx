"use client";

import {
  BarChartSquare02,
  Bell01,
  Users01,
  Stars01,
} from "@untitledui/icons";
import { motion } from "framer-motion";
import { Badge } from "@/components/base/badges/badges";
import { SectionWrapper, cardItemVariants } from "./section-wrapper";

const features = [
  {
    title: "OTA intelligence",
    body: "Daily rate scraping across Expedia, Booking.com, and direct channels—without the refresh grind.",
    icon: BarChartSquare02,
    badge: "Automated" as const,
  },
  {
    title: "Always-on monitoring",
    body: "The engine watches the market and surfaces moves when competitors change price.",
    icon: Bell01,
  },
  {
    title: "Owner-ready portal",
    body: "Share live pace, comps, and actions with stakeholders—no extra reporting layer.",
    icon: Users01,
  },
  {
    title: "Recommended rates",
    body: "Every stay date gets a suggested rate in the command centre and day detail views.",
    icon: Stars01,
    badge: "AI" as const,
  },
];

export function WhyDifferent() {
  return (
    <SectionWrapper
      id="platform"
      className="border-t border-secondary bg-secondary_alt px-4 py-20 sm:px-6 sm:py-24 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <h2 className="text-display-sm font-semibold tracking-tight text-primary sm:text-display-md">
            Built for revenue teams
          </h2>
          <p className="mt-4 text-lg text-tertiary">
            Automated tracking, recommended rates, and a cockpit analysts and clients can trust.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {features.map(({ title, body, icon: Icon, badge }, i) => (
            <motion.div
              key={title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={cardItemVariants}
              className="rounded-xl bg-primary p-6 shadow-xs ring-1 ring-secondary"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex size-11 items-center justify-center rounded-lg bg-brand-solid text-white">
                  <Icon className="size-5" />
                </div>
                {badge ? (
                  <Badge type="pill-color" color="brand" size="sm">
                    {badge}
                  </Badge>
                ) : null}
              </div>
              <h3 className="mt-5 text-lg font-semibold text-primary">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-tertiary">{body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
