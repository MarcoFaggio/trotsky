"use client";

import { PlugZap, ScanSearch, Send } from "lucide-react";
import { motion } from "framer-motion";
import { SectionWrapper, cardItemVariants } from "./section-wrapper";

const steps = [
  {
    title: "Quick Setup",
    body: "Connect your property and select your top 5 local competitors.",
    icon: PlugZap,
    bg: "bg-[hsl(221_83%_53%)] text-white",
  },
  {
    title: "Automated Data Collection",
    body: "Trosky begins tracking competitor prices and availability automatically.",
    icon: ScanSearch,
    bg: "bg-landing-sky text-white",
  },
  {
    title: "Act in Real Time",
    body: "Get alerts by email or mobile and respond faster to market changes.",
    icon: Send,
    bg: "bg-landing-emerald text-white",
  },
];

export function ProcessSteps() {
  return (
    <SectionWrapper className="landing-bg-elevated px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-2xl font-bold tracking-tight landing-text sm:text-3xl md:text-4xl">
          Get Started in 3 Simple Steps
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center landing-text-muted">
          Frictionless onboarding. You focus on strategy; we handle the data.
        </p>
        <div className="mt-14 grid gap-10 sm:grid-cols-3">
          {steps.map(({ title, body, icon: Icon, bg }, index) => (
            <motion.div
              key={title}
              custom={index}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={cardItemVariants}
              className="relative flex flex-col items-center text-center"
            >
              {index < steps.length - 1 && (
                <div
                  className="absolute top-10 left-[calc(50%+2.5rem)] hidden h-0.5 w-[calc(100%-4rem)] max-w-[80px] bg-landing-border sm:block lg:max-w-[120px]"
                  aria-hidden
                />
              )}
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 24 }}
                className={`flex h-16 w-16 items-center justify-center rounded-2xl ${bg} shadow-landing-card`}
              >
                <Icon className="h-8 w-8" />
              </motion.div>
              <span className="mt-4 text-sm font-medium text-landing-emerald">
                Step {index + 1}
              </span>
              <h3 className="mt-2 text-lg font-semibold landing-text">
                {title}
              </h3>
              <p className="mt-2 text-sm landing-text-muted">{body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
