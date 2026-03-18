"use client";

import { Check, X } from "lucide-react";
import { motion } from "framer-motion";
import { SectionWrapper } from "./section-wrapper";

const rows = [
  {
    feature: "Daily Data Entry",
    traditional: "10+ Hours / Week",
    trosky: "100% Automated",
  },
  {
    feature: "Update Frequency",
    traditional: "Once Daily",
    trosky: "Every 60 Minutes",
  },
  {
    feature: "Reporting",
    traditional: "Manual PDF",
    trosky: "Self-Service",
  },
  {
    feature: "Market Visibility",
    traditional: "Limited",
    trosky: "Real-Time",
  },
  {
    feature: "Stakeholder Access",
    traditional: "By Request",
    trosky: "24/7 Portal",
  },
];

export function ComparisonTable() {
  return (
    <SectionWrapper className="landing-bg-elevated px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center text-2xl font-bold tracking-tight landing-text sm:text-3xl md:text-4xl">
          The Efficiency Divide
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center landing-text-muted">
          See how traditional workflows compare with automated market
          intelligence.
        </p>
        <div className="mt-12 hidden overflow-hidden rounded-xl border border-landing-border landing-bg-card shadow-landing-card md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[320px] border-collapse">
              <thead>
                <tr className="border-b border-landing-border landing-bg-elevated">
                  <th className="px-5 py-4 text-left text-sm font-semibold landing-text">
                    Feature
                  </th>
                  <th className="px-5 py-4 text-left text-sm font-semibold landing-text-muted">
                    Traditional
                  </th>
                  <th className="px-5 py-4 text-left text-sm font-semibold text-landing-emerald">
                    Trosky
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <motion.tr
                    key={row.feature}
                    initial={{ opacity: 0, x: -6 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      type: "spring",
                      stiffness: 150,
                      damping: 24,
                      delay: i * 0.04,
                    }}
                    className={
                      i < rows.length - 1
                        ? "border-b border-landing-border"
                        : ""
                    }
                  >
                    <td className="px-5 py-4 text-sm landing-text">
                      {row.feature}
                    </td>
                    <td className="px-5 py-4 text-sm landing-text-muted flex items-center gap-2">
                      <X className="h-4 w-4 shrink-0 text-landing-amber/80" />
                      {row.traditional}
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-landing-emerald flex items-center gap-2">
                      <Check className="h-4 w-4 shrink-0" />
                      {row.trosky}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-8 grid gap-4 md:hidden">
          {rows.map((row, i) => (
            <motion.div
              key={row.feature}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                type: "spring",
                stiffness: 150,
                damping: 24,
                delay: i * 0.05,
              }}
              className="rounded-xl border border-landing-border landing-bg-card p-4 shadow-landing-card"
            >
              <p className="text-sm font-medium landing-text">{row.feature}</p>
              <p className="mt-2 flex items-center gap-2 text-sm landing-text-muted">
                <X className="h-3.5 w-3.5 shrink-0 text-landing-amber/80" />
                Traditional: {row.traditional}
              </p>
              <p className="mt-1 flex items-center gap-2 text-sm font-medium text-landing-emerald">
                <Check className="h-3.5 w-3.5 shrink-0" />
                Trosky: {row.trosky}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
