"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SectionWrapper } from "./section-wrapper";

export function FinalCta() {
  return (
    <SectionWrapper className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 100, damping: 24 }}
        className="mx-auto max-w-3xl rounded-2xl border border-border bg-muted/50 px-8 py-14 text-center sm:px-12"
      >
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
          Ready to Outpace the Competition?
        </h2>
        <p className="mt-4 text-muted-foreground">
          Join hotel revenue teams using Trosky Analytics to save time,
          improve visibility, and make faster pricing decisions.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link href="/login">
            <motion.div
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Button size="lg" className="min-w-[200px] font-medium shadow-md">
                Schedule Free Demo
              </Button>
            </motion.div>
          </Link>
          <p className="text-sm text-muted-foreground">
            No credit card required • 15-minute intro call
          </p>
        </div>
      </motion.div>
    </SectionWrapper>
  );
}
