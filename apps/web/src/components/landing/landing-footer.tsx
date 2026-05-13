"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { TroskyMark } from "@/components/brand/trosky-logo";

export function LandingFooter() {
  return (
    <footer
      className="border-t border-border bg-muted/30 px-4 py-16 sm:px-6 lg:px-8 dark:bg-muted/15"
      role="contentinfo"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <motion.div className="flex items-center gap-2 font-landing-display text-lg font-semibold">
              <TroskyMark className="h-10 w-10" />
              Trosky
            </motion.div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Automated competitor intelligence and AI-backed rates — so revenue teams spend less time in spreadsheets and more time winning share.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link href="#platform" className="relative text-foreground/90 transition-colors after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:bg-primary after:transition-all after:content-[''] hover:text-primary hover:after:w-full">
                  Platform
                </Link>
              </li>
              <li>
                <Link href="/inquire" className="relative text-foreground/90 transition-colors after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:bg-primary after:transition-all after:content-[''] hover:text-primary hover:after:w-full">
                  Contact / inquiry
                </Link>
              </li>
              <li>
                <Link href="/login" className="relative text-foreground/90 transition-colors after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:bg-primary after:transition-all after:content-[''] hover:text-primary hover:after:w-full">
                  Log in
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Company</p>
            <p className="mt-4 text-sm text-muted-foreground">
              Bangalore, KA 560038
            </p>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border/80 pt-8 text-center text-xs text-muted-foreground sm:flex-row sm:text-left"
        >
          <span>© {new Date().getFullYear()} Trosky. All rights reserved.</span>
          <span className="font-medium text-foreground/80">Built for hotel revenue & commercial teams</span>
        </motion.div>
      </div>
    </footer>
  );
}
