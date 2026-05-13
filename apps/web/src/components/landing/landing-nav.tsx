"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LogIn, Menu, MessageSquare, Sparkles, X } from "lucide-react";
import { TroskyMark } from "@/components/brand/trosky-logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const navLinks = [
  { href: "#problem", label: "Challenge" },
  { href: "#platform", label: "Platform" },
  { href: "#comparison", label: "Compare" },
  { href: "#process", label: "Launch" },
];

export function LandingNav() {
  const reduced = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      aria-label="Main navigation"
      initial={reduced ? false : { y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 160, damping: 28 }}
      className={`fixed left-0 right-0 top-0 z-50 transition-[background,box-shadow,border-color] duration-500 ${
        scrolled
          ? "border-b border-border/80 bg-background/90 shadow-lg shadow-black/5 backdrop-blur-xl dark:bg-background/85 dark:shadow-black/30"
          : "border-b border-transparent bg-background/70 backdrop-blur-md dark:bg-background/60"
      }`}
    >
      <nav className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex items-center gap-2.5 font-landing-display text-xl font-semibold tracking-tight text-foreground"
        >
          <motion.span
            className="flex h-9 w-9 items-center justify-center"
            whileHover={reduced ? undefined : { rotate: -6, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
          >
            <TroskyMark priority className="h-9 w-9" />
          </motion.span>
          <span className="flex flex-col leading-none">
            <span>Trosky</span>
            <span className="mt-0.5 text-[10px] font-normal uppercase tracking-[0.2em] text-muted-foreground">
              Revenue Intelligence
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-0.5 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group relative rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {link.label}
              <span
                className="absolute inset-x-3 bottom-1 h-px origin-left scale-x-0 bg-gradient-to-r from-primary via-primary/70 to-primary/40 transition-transform duration-300 group-hover:scale-x-100"
                aria-hidden
              />
            </Link>
          ))}
          <Link
            href="/inquire"
            className="ml-1 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            <MessageSquare className="h-4 w-4" />
            Inquire
          </Link>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Link href="/login">
            <motion.span whileHover={reduced ? undefined : { scale: 1.03 }} whileTap={reduced ? undefined : { scale: 0.98 }}>
              <Button size="sm" className="gap-2 rounded-xl px-5 font-semibold shadow-md shadow-primary/20">
                <LogIn className="h-4 w-4" />
                Log in
              </Button>
            </motion.span>
          </Link>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-xl md:hidden"
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileOpen}
          aria-controls="landing-mobile-menu"
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="landing-mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden border-b border-border bg-background/95 backdrop-blur-xl md:hidden"
          >
            <div className="mx-auto flex max-w-6xl flex-col gap-0.5 px-4 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/inquire"
                className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-primary"
                onClick={() => setMobileOpen(false)}
              >
                <Sparkles className="h-4 w-4" />
                Send an inquiry
              </Link>
              <div className="flex items-center justify-between rounded-xl px-4 py-2">
                <span className="text-sm font-medium text-muted-foreground">Theme</span>
                <ThemeToggle />
              </div>
              <Link href="/login" className="mt-2" onClick={() => setMobileOpen(false)}>
                <Button className="w-full gap-2 rounded-xl py-6 font-semibold">
                  <LogIn className="h-4 w-4" />
                  Log in to dashboard
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
