"use client";

import {
  LayoutDashboard,
  BellRing,
  Target,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { SectionWrapper, cardItemVariants } from "./section-wrapper";

const features = [
  {
    title: "OTA Intelligence",
    body: "Automated daily rate scraping across Expedia, Booking.com, and direct channels. No more manual refresh.",
    icon: LayoutDashboard,
    iconBg: "bg-[hsl(221_83%_53%)] text-white",
    size: "large" as const,
    badge: "Automated",
  },
  {
    title: "24/7 Monitoring",
    body: "Our engine continuously monitors the market and alerts your team when competitors move.",
    icon: BellRing,
    iconBg: "bg-landing-sky text-white",
    size: "small" as const,
  },
  {
    title: "Client Portal",
    body: "Give owners and stakeholders direct access to live market intelligence.",
    icon: Target,
    iconBg: "bg-landing-violet text-white",
    size: "small" as const,
  },
  {
    title: "AI Recommended Rate",
    body: "Every date gets an AI-suggested rate. See it in the Competitive Rate Comparison chart and in Day Detail — same green dashed line you see in the product.",
    icon: Sparkles,
    iconBg: "bg-landing-emerald text-white",
    size: "small" as const,
    badge: "AI",
  },
];

export function WhyDifferent() {
  return (
    <SectionWrapper id="platform" className="landing-bg border-t border-landing-border px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center font-landing-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-[2.35rem]">
          Why Trosky is different
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-center text-base leading-relaxed text-muted-foreground sm:text-lg">
          Built for hotel revenue teams: automated tracking, AI-driven recommended rates, and
          reliable market intelligence.
        </p>
        {/* Bento-style grid: one large, three smaller */}
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
          {features.map(({ title, body, icon: Icon, iconBg, size, badge }, i) => (
            <motion.div
              key={title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={cardItemVariants}
              className={size === "large" ? "sm:col-span-2 lg:row-span-2" : ""}
            >
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 26 }}
                className={`h-full rounded-xl border border-landing-border landing-bg-card p-5 shadow-landing-card transition-shadow hover:shadow-landing-glow-subtle flex flex-col ${
                  size === "large" ? "lg:p-6" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  {badge && (
                    <span className="rounded-full border border-landing-border bg-landing-bg-elevated px-2 py-0.5 text-xs font-medium landing-text-muted">
                      {badge}
                    </span>
                  )}
                </div>
                <h3 className={`mt-4 font-semibold landing-text ${size === "large" ? "text-lg lg:text-xl" : "text-lg"}`}>
                  {title}
                </h3>
                <p className={`mt-2 landing-text-muted ${size === "large" ? "text-sm lg:text-base lg:mt-3" : "text-sm"}`}>
                  {body}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
