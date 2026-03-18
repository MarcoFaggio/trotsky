"use client";

import { HiBuildingOffice2, HiCurrencyDollar, HiShieldCheck } from "react-icons/hi2";
import { motion } from "framer-motion";
import { SectionWrapper } from "./section-wrapper";

const metrics = [
  {
    value: "500+",
    label: "Hotels Optimized",
    icon: HiBuildingOffice2,
    bg: "bg-primary text-primary-foreground",
  },
  {
    value: "₹50Cr+",
    label: "Revenue Analyzed",
    icon: HiCurrencyDollar,
    bg: "bg-landing-emerald text-white",
  },
  {
    value: "99.9%",
    label: "Platform Uptime",
    icon: HiShieldCheck,
    bg: "bg-landing-amber text-white",
  },
];

export function MetricsStrip() {
  return (
    <SectionWrapper className="border-t border-border bg-muted/40 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 sm:grid-cols-3">
          {metrics.map(({ value, label, icon: Icon, bg }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                type: "spring",
                stiffness: 120,
                damping: 22,
                delay: i * 0.12,
              }}
              className="flex flex-col items-center"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
                className={`flex h-14 w-14 items-center justify-center rounded-2xl ${bg} shadow-md`}
              >
                <Icon className="h-7 w-7" />
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 + 0.1 }}
                className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
              >
                {value}
              </motion.p>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                {label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
