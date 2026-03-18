"use client";

import {
  HiCog6Tooth,
  HiBolt,
  HiGlobeAlt,
  HiCheckCircle,
} from "react-icons/hi2";
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
    icon: HiCog6Tooth,
    iconBg: "bg-primary text-primary-foreground",
  },
  {
    title: "Real-Time Tracking",
    body: "Catch competitor movements faster and adjust strategy before the market moves past you.",
    icon: HiBolt,
    iconBg: "bg-landing-amber text-white",
  },
  {
    title: "24/7 Client Portal",
    body: "Reduce update calls and give stakeholders direct access to live market data.",
    icon: HiGlobeAlt,
    iconBg: "bg-landing-sky text-white",
  },
];

export function Advantage() {
  return (
    <SectionWrapper className="border-t border-border bg-background px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-6xl rounded-2xl border border-border bg-muted/40 px-6 py-10 sm:px-8">
        <h2 className="text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
          The Trosky Advantage
        </h2>
        <div className="mt-12 grid gap-10 lg:grid-cols-2">
          <div className="space-y-6">
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
                  className="flex gap-4 rounded-xl border border-border bg-card p-4"
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Stronger benefits
            </h3>
            <ul className="mt-4 space-y-3">
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
                  className="flex items-start gap-3 text-sm text-muted-foreground"
                >
                  <HiCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-landing-emerald" />
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
