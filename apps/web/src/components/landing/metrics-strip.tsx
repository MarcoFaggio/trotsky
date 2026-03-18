"use client";

import { Building2, IndianRupee, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { SectionWrapper } from "./section-wrapper";

const metrics = [
  {
    value: "500+",
    label: "Hotels Optimized",
    icon: Building2,
    bg: "bg-[hsl(221_83%_53%)] text-white",
  },
  {
    value: "₹50Cr+",
    label: "Revenue Analyzed",
    icon: IndianRupee,
    bg: "bg-landing-emerald text-white",
  },
  {
    value: "99.9%",
    label: "Platform Uptime",
    icon: ShieldCheck,
    bg: "bg-landing-amber text-white",
  },
];

export function MetricsStrip() {
  return (
    <SectionWrapper className="landing-bg border-t border-landing-border px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 sm:grid-cols-3">
          {metrics.map(({ value, label, icon: Icon, bg }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                type: "spring",
                stiffness: 120,
                damping: 24,
                delay: i * 0.1,
              }}
              className="flex flex-col items-center text-center"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
                className={`flex h-14 w-14 items-center justify-center rounded-2xl ${bg} shadow-landing-card`}
              >
                <Icon className="h-7 w-7" />
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 + 0.08 }}
                className="mt-5 text-3xl font-bold tracking-tight landing-text sm:text-4xl"
              >
                {value}
              </motion.p>
              <p className="mt-1 text-sm font-medium landing-text-muted">
                {label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
