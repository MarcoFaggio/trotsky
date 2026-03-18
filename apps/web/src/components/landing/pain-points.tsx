"use client";

import { ClipboardList, Clock, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { SectionWrapper, cardItemVariants } from "./section-wrapper";

const points = [
  {
    title: "Manual Rate Collection",
    body: "Stop spending hours refreshing Expedia and Booking.com every week.",
    consequence: "Time that could go into strategy instead of data entry.",
    icon: ClipboardList,
    iconBg: "bg-landing-amber text-white",
  },
  {
    title: "Market Lag",
    body: "Competitor prices can change multiple times a day. Manual workflows make your team reactive.",
    consequence: "You learn about moves too late to respond.",
    icon: Clock,
    iconBg: "bg-landing-sky text-white",
  },
  {
    title: "The Trust Gap",
    body: "Give stakeholders real-time visibility instead of delayed updates and constant check-in calls.",
    consequence: "Fewer status meetings, more confidence in the numbers.",
    icon: Eye,
    iconBg: "bg-landing-emerald text-white",
  },
];

export function PainPoints() {
  return (
    <SectionWrapper className="landing-bg-elevated px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-2xl font-bold tracking-tight landing-text sm:text-3xl md:text-4xl">
          The Status Quo Is Costing You Revenue
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center landing-text-muted">
          Manual competitor tracking slows decision-making, creates reporting
          delays, and leaves teams reacting too late.
        </p>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {points.map(({ title, body, consequence, icon: Icon, iconBg }, i) => (
            <motion.div
              key={title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={cardItemVariants}
            >
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 400, damping: 26 }}
                className="h-full rounded-xl border border-landing-border landing-bg-card p-6 shadow-landing-card transition-shadow hover:shadow-landing-glow-subtle"
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold landing-text">
                  {title}
                </h3>
                <p className="mt-2 text-sm landing-text-muted">{body}</p>
                {consequence && (
                  <p className="mt-3 text-xs landing-text-muted border-l-2 border-landing-border pl-3">
                    {consequence}
                  </p>
                )}
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
