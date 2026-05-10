"use client";

import { useEffect, useState } from "react";

/** Resolve Tailwind HSL tokens for SVG defs; updates when `.dark` toggles. */
export function useChartThemeColors() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const root = document.documentElement;
    const bump = () => setTick((t) => t + 1);
    const obs = new MutationObserver(bump);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", bump);
    return () => {
      obs.disconnect();
      mq.removeEventListener("change", bump);
    };
  }, []);

  const read = (varName: string, fallback: string) => {
    if (typeof document === "undefined") return fallback;
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue(varName)
      .trim();
    return raw ? `hsl(${raw})` : fallback;
  };

  return {
    tick,
    primary: read("--chart-primary", "hsl(221 83% 53%)"),
    comparison: read("--chart-comparison", "hsl(215 16% 46%)"),
    recommended: read("--chart-recommended", "hsl(160 84% 39%)"),
    occupancy: read("--chart-occupancy", "hsl(263 70% 72%)"),
    grid: read("--chart-grid", "hsl(214 32% 91%)"),
    axis: read("--chart-axis", "hsl(215 16% 46%)"),
  };
}
