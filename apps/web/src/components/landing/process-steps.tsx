"use client";

import {
  HiCog6Tooth,
  HiCircleStack,
  HiBolt,
} from "react-icons/hi2";
import { motion } from "framer-motion";
import { SectionWrapper, cardItemVariants } from "./section-wrapper";

const steps = [
  {
    title: "Quick Setup",
    body: "Connect your property and select your top 5 local competitors.",
    icon: HiCog6Tooth,
    bg: "bg-primary text-primary-foreground",
  },
  {
    title: "Automated Data Collection",
    body: "Trosky begins tracking competitor prices and availability automatically.",
    icon: HiCircleStack,
    bg: "bg-landing-sky text-white",
  },
  {
    title: "Act in Real Time",
    body: "Get alerts by email or mobile and respond faster to market changes.",
    icon: HiBolt,
    bg: "bg-landing-emerald text-white",
  },
];

export function ProcessSteps() {
  return (
    <SectionWrapper className="bg-muted/30 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
          Get Started in 3 Simple Steps
        </h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
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
                  className="absolute top-8 left-[calc(50%+2.5rem)] hidden h-0.5 w-[calc(100%-4rem)] max-w-[80px] bg-border sm:block lg:max-w-[120px]"
                  aria-hidden
                />
              )}
              <motion.div
                whileHover={{ scale: 1.06 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
                className={`flex h-16 w-16 items-center justify-center rounded-2xl ${bg} shadow-md`}
              >
                <Icon className="h-8 w-8" />
              </motion.div>
              <span className="mt-4 text-sm font-medium text-primary">
                Step {index + 1}
              </span>
              <h3 className="mt-2 text-lg font-semibold text-foreground">
                {title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
