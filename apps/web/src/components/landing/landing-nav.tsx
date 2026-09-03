"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Menu01, XClose } from "@untitledui/icons";
import { TroskyMark } from "@/components/brand/trosky-logo";
import { Button } from "@/components/base/buttons/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { useActiveSection } from "./use-active-section";

const NAV_LINKS = [
  { id: "product", label: "Product" },
  { id: "connected", label: "Data" },
  { id: "how-it-works", label: "How it works" },
  { id: "presence", label: "Ireland & India" },
] as const;

const SECTION_IDS = NAV_LINKS.map((link) => link.id);

export function LandingNav() {
  const reduced = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const active = useActiveSection(SECTION_IDS);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the sheet if the viewport grows past the mobile breakpoint.
  useEffect(() => {
    if (!mobileOpen) return;
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => mq.matches && setMobileOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mobileOpen]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,box-shadow] duration-300",
        scrolled || mobileOpen
          ? "border-b border-secondary bg-primary/85 shadow-xs backdrop-blur-xl supports-[backdrop-filter]:bg-primary/75"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary focus:shadow-lg"
      >
        Skip to content
      </a>

      <nav
        aria-label="Main"
        className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-5 sm:px-8"
      >
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2.5 rounded-lg text-primary outline-brand focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <TroskyMark priority className="h-9 w-9 shrink-0" />
          <span className="text-md font-semibold tracking-tight">Trosky</span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex" role="list">
          {NAV_LINKS.map((link) => {
            const isActive = active === link.id;
            return (
              <li key={link.id} className="relative">
                <a
                  href={`#${link.id}`}
                  aria-current={isActive ? "location" : undefined}
                  className={cn(
                    "relative z-10 inline-flex rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-200",
                    isActive
                      ? "text-primary"
                      : "text-tertiary hover:text-primary"
                  )}
                >
                  {link.label}
                </a>
                {isActive ? (
                  <motion.span
                    layoutId="nav-active-pill"
                    aria-hidden
                    transition={
                      reduced
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 380, damping: 32 }
                    }
                    className="absolute inset-0 rounded-full bg-secondary ring-1 ring-secondary ring-inset"
                  />
                ) : null}
              </li>
            );
          })}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Button href="/login" size="md" color="tertiary">
            Log in
          </Button>
          <Button href="/inquire" size="md" color="primary" iconTrailing={ArrowRight}>
            Request a walkthrough
          </Button>
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <Button
            type="button"
            color="tertiary"
            size="md"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="landing-mobile-menu"
            onClick={() => setMobileOpen((open) => !open)}
            iconLeading={mobileOpen ? XClose : Menu01}
          />
        </div>
      </nav>

      <AnimatePresence initial={false}>
        {mobileOpen && (
          <motion.div
            id="landing-mobile-menu"
            initial={reduced ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduced ? undefined : { opacity: 0, height: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-secondary md:hidden"
          >
            <div className="mx-auto flex w-full max-w-[1200px] flex-col px-5 pt-2 pb-5 sm:px-8">
              <ul role="list" className="flex flex-col">
                {NAV_LINKS.map((link) => (
                  <li key={link.id}>
                    <a
                      href={`#${link.id}`}
                      onClick={() => setMobileOpen(false)}
                      className="flex min-h-12 items-center justify-between border-b border-secondary text-md font-semibold text-primary"
                    >
                      {link.label}
                      <ArrowRight className="size-4 text-fg-quaternary" aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  href="/login"
                  size="lg"
                  color="secondary"
                  className="justify-center"
                  onClick={() => setMobileOpen(false)}
                >
                  Log in
                </Button>
                <Button
                  href="/inquire"
                  size="lg"
                  color="primary"
                  className="justify-center"
                  onClick={() => setMobileOpen(false)}
                >
                  Walkthrough
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
