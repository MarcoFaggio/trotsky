"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function LandingNav() {
  return (
    <motion.nav
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 30 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-xl font-semibold tracking-tight text-primary transition-opacity hover:opacity-90"
        >
          Trosky
        </Link>
        <Link href="/login">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button size="sm" className="font-medium">
              Login
            </Button>
          </motion.div>
        </Link>
      </div>
    </motion.nav>
  );
}
