"use client";

import { Check, X, ClipboardList, RefreshCw, FileText, Eye, Users } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { SectionWrapper } from "./section-wrapper";

const rows = [
  {
    feature: "Daily Data Entry",
    icon: ClipboardList,
    traditional: "10+ Hours / Week",
    trosky: "100% Automated",
  },
  {
    feature: "Update Frequency",
    icon: RefreshCw,
    traditional: "Once Daily",
    trosky: "Every 60 Minutes",
  },
  {
    feature: "Reporting",
    icon: FileText,
    traditional: "Manual PDF",
    trosky: "Self-Service",
  },
  {
    feature: "Market Visibility",
    icon: Eye,
    traditional: "Limited",
    trosky: "Real-Time",
  },
  {
    feature: "Stakeholder Access",
    icon: Users,
    traditional: "By Request",
    trosky: "24/7 Portal",
  },
];

function EfficiencyDivideHeading() {
  const reduced = useReducedMotion();

  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-trosky-red">
        Compare
      </p>
      <div className="group relative mt-4 inline-block px-1">
        <motion.h2
          className="font-landing-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-[2.35rem]"
          initial={reduced ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
        >
          The efficiency divide
        </motion.h2>
        <motion.span
          aria-hidden
          className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-gradient-to-r from-trosky-red/50 via-trosky-red to-trosky-red/80 shadow-none transition-[box-shadow,filter] duration-500 group-hover:shadow-[0_10px_36px_-12px_rgba(166,1,1,0.45)] dark:from-trosky-red/60 dark:via-trosky-red dark:to-trosky-red/90 dark:group-hover:shadow-[0_12px_40px_-14px_rgba(120,0,0,0.4)]"
          initial={reduced ? false : { scaleX: 0, opacity: 0 }}
          whileInView={{ scaleX: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{
            duration: reduced ? 0 : 0.75,
            delay: reduced ? 0 : 0.12,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{ transformOrigin: "left center" }}
        />
        <motion.span
          aria-hidden
          className="absolute -bottom-2 left-0 h-px w-full origin-center bg-gradient-to-r from-transparent via-border to-transparent opacity-80 transition-[opacity,transform] duration-500 group-hover:opacity-100 group-hover:scale-x-[1.02]"
          initial={reduced ? false : { scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{
            duration: reduced ? 0 : 0.55,
            delay: reduced ? 0 : 0.35,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{ transformOrigin: "center" }}
        />
      </div>
      <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
        See how traditional workflows compare with automated market intelligence.
      </p>
    </div>
  );
}

export function ComparisonTable() {
  return (
    <SectionWrapper
      id="comparison"
      className="bg-gradient-to-b from-background via-muted/20 to-background px-4 py-20 dark:via-muted/10 sm:px-6 sm:py-24 lg:px-8"
    >
      <div className="mx-auto max-w-4xl">
        <EfficiencyDivideHeading />

        <div className="mt-14 hidden overflow-hidden rounded-2xl border border-border bg-card shadow-lg dark:border-white/[0.08] dark:bg-card/90 dark:shadow-black/40 md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse">
              <colgroup>
                <col className="min-w-[200px] md:w-[38%]" />
                <col className="md:w-[31%]" />
                <col className="md:w-[31%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-border bg-muted/40 dark:bg-muted/25">
                  <th
                    scope="col"
                    className="px-5 py-4 text-left text-sm font-semibold text-foreground sm:px-6 sm:py-5"
                  >
                    Feature
                  </th>
                  <th
                    scope="col"
                    className="group relative px-5 py-4 text-left text-sm font-semibold text-muted-foreground sm:px-6 sm:py-5"
                  >
                    <span className="relative inline-block">
                      Traditional
                      <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-muted-foreground/50 transition-all duration-500 group-hover:w-full" />
                    </span>
                  </th>
                  <th
                    scope="col"
                    className="group relative px-5 py-4 text-left text-sm font-semibold text-trosky-red sm:px-6 sm:py-5"
                  >
                    <span className="relative inline-block">
                      Trosky
                      <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-trosky-red/70 transition-all duration-500 group-hover:w-full" />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const Icon = row.icon;
                  return (
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
                          ? "group border-b border-border transition-colors hover:bg-muted/25 dark:hover:bg-muted/15"
                          : "group transition-colors hover:bg-muted/25 dark:hover:bg-muted/15"
                      }
                    >
                      <th
                        scope="row"
                        className="px-5 py-4 text-left align-middle font-normal sm:px-6 sm:py-5"
                      >
                        <span className="relative flex items-center gap-3 text-sm font-medium text-foreground">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-trosky-red/10 group-hover:text-trosky-red">
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="relative">
                            {row.feature}
                            <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-trosky-red/40 transition-all duration-300 group-hover:w-full" />
                          </span>
                        </span>
                      </th>
                      <td className="px-5 py-4 align-middle text-sm text-muted-foreground sm:px-6 sm:py-5">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive"
                            aria-hidden
                          >
                            <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                          </span>
                          <span>{row.traditional}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 align-middle text-sm font-medium text-trosky-red sm:px-6 sm:py-5">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-trosky-red/15 text-trosky-red"
                            aria-hidden
                          >
                            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                          </span>
                          <span>{row.trosky}</span>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:hidden">
          {rows.map((row, i) => {
            const Icon = row.icon;
            return (
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
                className="rounded-2xl border border-border bg-card p-5 shadow-md dark:border-white/[0.08] dark:bg-card/95"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-trosky-red/12 text-trosky-red">
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="text-sm font-semibold text-foreground">{row.feature}</p>
                </div>
                <div className="mt-4 flex flex-col gap-3 rounded-xl bg-muted/35 p-4 dark:bg-muted/20">
                  <p className="flex items-start gap-2 text-sm text-muted-foreground">
                    <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive/90" />
                    <span>
                      <span className="font-semibold text-foreground/80">Traditional: </span>
                      {row.traditional}
                    </span>
                  </p>
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
                  <p className="flex items-start gap-2 text-sm font-medium text-trosky-red">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      <span className="text-primary/90">Trosky: </span>
                      {row.trosky}
                    </span>
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </SectionWrapper>
  );
}
