"use client";

import Link from "next/link";
import { TroskyMark } from "@/components/brand/trosky-logo";

export function LandingFooter() {
  return (
    <footer className="border-t border-secondary bg-primary px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <TroskyMark className="h-8 w-8" />
          <div>
            <p className="text-sm font-semibold text-primary">Trosky</p>
            <p className="text-xs text-tertiary">Hotel revenue intelligence</p>
          </div>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-tertiary">
          <Link href="#platform" className="hover:text-secondary">
            Platform
          </Link>
          <Link href="/inquire" className="hover:text-secondary">
            Inquire
          </Link>
          <Link href="/login" className="hover:text-secondary">
            Log in
          </Link>
        </nav>
      </div>
      <p className="mx-auto mt-10 max-w-7xl text-xs text-quaternary">
        © {new Date().getFullYear()} Trosky. All rights reserved.
      </p>
    </footer>
  );
}
