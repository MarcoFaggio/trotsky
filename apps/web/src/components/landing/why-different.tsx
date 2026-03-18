"use client";

import {
  HiCog6Tooth,
  HiGlobeAlt,
  HiPresentationChartBar,
  HiDocumentChartBar,
} from "react-icons/hi2";
import { motion } from "framer-motion";
import { SectionWrapper, cardItemVariants } from "./section-wrapper";

const features = [
  {
    title: "Automated Daily Rate Scraping",
    body: "Track competitor pricing automatically across Expedia, Booking.com, and direct channels.",
    icon: HiCog6Tooth,
    iconBg: "bg-primary text-primary-foreground",
  },
  {
    title: "24/7 Market Monitoring",
    body: "Our engine continuously monitors the market and alerts your team when competitors move.",
    icon: HiGlobeAlt,
    iconBg: "bg-landing-sky text-white",
  },
  {
    title: "Live Client Portal",
    body: "Give owners and stakeholders direct access to live market intelligence.",
    icon: HiPresentationChartBar,
    iconBg: "bg-landing-violet text-white",
  },
  {
    title: "Self-Service Reporting",
    body: "Replace manual PDFs with a faster, more transparent way to share insights.",
    icon: HiDocumentChartBar,
    iconBg: "bg-landing-emerald text-white",
  },
];

export function WhyDifferent() {
  return (
    <SectionWrapper className="border-t border-border bg-background px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-6xl rounded-2xl border border-border bg-muted/40 px-6 py-12 sm:px-8">
        <h2 className="text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
          Why Trosky Analytics Is Different
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          Built for hotel revenue teams that need speed, visibility, and
          reliable market intelligence.
        </p>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ title, body, icon: Icon, iconBg }, i) => (
            <motion.div
              key={title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={cardItemVariants}
            >
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBg}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
