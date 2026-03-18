"use client";

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
    <SectionWrapper className="bg-muted/30 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
          The Efficiency Divide
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          See how traditional workflows compare with automated market
          intelligence.
        </p>
        <div className="mt-10 hidden overflow-hidden rounded-xl border border-border bg-card shadow-sm md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[320px] border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                    Feature
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                    Traditional
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-landing-emerald">
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
                        ? "border-b border-border"
                        : ""
                    }
                  >
                    <td className="px-4 py-3 text-sm text-foreground">
                      {row.feature}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {row.traditional}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-landing-emerald">
                      {row.trosky}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:hidden">
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
              className="rounded-xl border border-border bg-card p-4"
            >
              <p className="text-sm font-medium text-foreground">{row.feature}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Traditional: {row.traditional}
              </p>
              <p className="mt-1 text-sm font-medium text-landing-emerald">
                Trosky: {row.trosky}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
