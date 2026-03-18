"use client";

import { Settings2, Zap, Globe, Check } from "lucide-react";
import { motion } from "framer-motion";
import { SectionWrapper, cardItemVariants } from "./section-wrapper";

const benefits = [
  "Save 10+ hours per week",
  "React faster to competitor price changes",
  "Reduce manual reporting",
  "Improve trust with live stakeholder visibility",
  "Turn market data into faster revenue decisions",
];

const blocks = [
  {
    title: "Automated Scraping",
    body: "Replace repetitive manual rate checks with automated tracking that runs around the clock.",
    icon: Settings2,
    iconBg: "bg-[hsl(221_83%_53%)] text-white",
  },
  {
    title: "Real-Time Tracking",
    body: "Catch competitor movements faster and adjust strategy before the market moves past you.",
    icon: Zap,
    iconBg: "bg-landing-amber text-white",
  },
  {
    title: "24/7 Client Portal",
    body: "Reduce update calls and give stakeholders direct access to live market data.",
    icon: Globe,
    iconBg: "bg-landing-sky text-white",
  },
];

export function Advantage() {
  return (
    <SectionWrapper className="landing-bg border-t border-landing-border px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-2xl font-bold tracking-tight landing-text sm:text-3xl md:text-4xl">
          The Trotsky Advantage
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center landing-text-muted">
          What changes after you adopt Trotsky: less manual work, more visibility, faster decisions.
        </p>
        <div className="mt-14 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-5">
            {blocks.map(({ title, body, icon: Icon, iconBg }, i) => (
              <motion.div
                key={title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-30px" }}
                variants={cardItemVariants}
              >
                <motion.div
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  className="flex gap-4 rounded-xl border border-landing-border landing-bg-card p-4 shadow-landing-card transition-shadow hover:shadow-landing-glow-subtle"
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold landing-text">
                      {title}
                    </h3>
                    <p className="mt-1 text-sm landing-text-muted">{body}</p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
          <div>
            <h3 className="text-lg font-semibold landing-text">
              Stronger benefits
            </h3>
            <ul className="mt-5 space-y-4">
              {benefits.map((b, i) => (
                <motion.li
                  key={b}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    type: "spring",
                    stiffness: 150,
                    damping: 24,
                    delay: i * 0.07,
                  }}
                  className="flex items-start gap-3 text-sm landing-text-muted"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-landing-emerald/20 text-landing-emerald">
                    <Check className="h-3 w-3" />
                  </span>
                  <span>{b}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
