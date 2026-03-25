"use client";

import { BarChart3 } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t border-landing-border landing-bg px-4 py-10 sm:px-6 lg:px-8" role="contentinfo">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:items-center">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-landing-emerald" aria-hidden />
            <span className="text-sm font-semibold landing-text">Trosky</span>
          </div>
          <p className="text-sm landing-text-muted">
            Empowering hotels with precise, real-time market intelligence.
          </p>
          <p className="text-sm landing-text-muted">
            Bangalore, KA 560038
          </p>
        </div>
      </div>
    </footer>
  );
}
