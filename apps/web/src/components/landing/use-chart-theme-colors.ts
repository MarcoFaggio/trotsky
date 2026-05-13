"use client";

import { useEffect, useState } from "react";

const DEFAULTS = {
  primary: "hsl(0 99% 33%)",
  comparison: "hsl(0 2% 48%)",
  recommended: "hsl(164 82% 42%)",
  occupancy: "hsl(263 70% 64%)",
  grid: "hsl(214 32% 91%)",
  axis: "hsl(0 2% 37%)",
} as const;

/** Resolve Tailwind HSL tokens for SVG defs; updates when `.dark` toggles. */
export function useChartThemeColors() {
  const [colors, setColors] = useState(DEFAULTS);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const read = (varName: string, fallback: string) => {
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue(varName)
        .trim();
      return raw ? `hsl(${raw})` : fallback;
    };

    const sync = () => {
      setColors({
        primary: read("--chart-primary", DEFAULTS.primary),
        comparison: read("--chart-comparison", DEFAULTS.comparison),
        recommended: read("--chart-recommended", DEFAULTS.recommended),
        occupancy: read("--chart-occupancy", DEFAULTS.occupancy),
        grid: read("--chart-grid", DEFAULTS.grid),
        axis: read("--chart-axis", DEFAULTS.axis),
      });
      setTick((t) => t + 1);
    };

    sync();

    const root = document.documentElement;
    const obs = new MutationObserver(sync);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", sync);
    return () => {
      obs.disconnect();
      mq.removeEventListener("change", sync);
    };
  }, []);

  return { tick, ...colors };
}
