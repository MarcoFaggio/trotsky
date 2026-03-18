"use client";

import { HiClipboardDocumentList, HiClock, HiUserGroup } from "react-icons/hi2";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { SectionWrapper, cardItemVariants } from "./section-wrapper";

const points = [
  {
    title: "Manual Rate Collection",
    body: "Stop spending hours refreshing Expedia and Booking.com every week.",
    icon: HiClipboardDocumentList,
    iconBg: "bg-landing-amber text-white",
  },
  {
    title: "Market Lag",
    body: "Competitor prices can change multiple times a day. Manual workflows make your team reactive.",
    icon: HiClock,
    iconBg: "bg-landing-sky text-white",
  },
  {
    title: "The Trust Gap",
    body: "Give stakeholders real-time visibility instead of delayed updates and constant check-in calls.",
    icon: HiUserGroup,
    iconBg: "bg-landing-emerald text-white",
  },
];

export function PainPoints() {
  return (
    <SectionWrapper className="bg-muted/30 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
          The Status Quo Is Costing You Revenue
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          Manual competitor tracking slows decision-making, creates reporting
          delays, and leaves teams reacting too late.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {points.map(({ title, body, icon: Icon, iconBg }, i) => (
            <motion.div
              key={title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={cardItemVariants}
            >
              <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
                <Card className="h-full border border-border bg-card">
                  <CardContent className="p-6">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBg}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-foreground">
                      {title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">{body}</p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
