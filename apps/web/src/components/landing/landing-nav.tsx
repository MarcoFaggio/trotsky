"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BarChart3, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      aria-label="Main navigation"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 180, damping: 26 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-landing border-b bg-landing-bg-elevated/95 shadow-landing-glow-subtle backdrop-blur-md"
          : "border-landing border-b border-transparent bg-landing-bg/80 backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-semibold tracking-tight landing-text transition-opacity hover:opacity-90"
        >
          <BarChart3 className="h-6 w-6 text-landing-emerald" aria-hidden />
          Trotsky
        </Link>
        <Link href="/login">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              size="sm"
              className="gap-2 font-medium bg-landing-emerald text-white hover:bg-landing-emerald/90 border-0"
            >
              <LogIn className="h-4 w-4" />
              Login
            </Button>
          </motion.div>
        </Link>
      </div>
    </motion.nav>
  );
}
