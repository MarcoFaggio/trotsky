"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu01, XClose, LogIn01 } from "@untitledui/icons";
import { TroskyMark } from "@/components/brand/trosky-logo";
import { Button } from "@/components/base/buttons/button";
import { ThemeToggle } from "@/components/theme-toggle";

const navLinks = [
  { href: "#problem", label: "Challenge" },
  { href: "#platform", label: "Platform" },
  { href: "#process", label: "How it works" },
];

export function LandingNav() {
  const reduced = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      aria-label="Main navigation"
      className={`fixed inset-x-0 top-0 z-50 transition-[background,box-shadow,border-color] duration-300 ${
        scrolled
          ? "border-b border-secondary bg-primary/90 shadow-xs backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2.5 text-primary"
        >
          <TroskyMark priority className="h-9 w-9 shrink-0" />
          <span className="hidden text-md font-semibold tracking-tight sm:inline">
            Trosky
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-tertiary transition-colors hover:bg-primary_hover hover:text-secondary"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Button href="/login" size="md" color="primary" iconLeading={LogIn01}>
            Log in
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

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="landing-mobile-menu"
            initial={reduced ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-b border-secondary bg-primary md:hidden"
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3 py-3 text-sm font-semibold text-secondary"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Button
                href="/login"
                size="lg"
                color="primary"
                className="mt-2 w-full justify-center"
                iconLeading={LogIn01}
                onClick={() => setMobileOpen(false)}
              >
                Log in to dashboard
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
