import { cn } from "@/lib/utils";

/** Shared surface + layout classes for the Trosky cockpit design layer */
export const troskySurfaces = {
  card:
    "rounded-2xl border border-trosky-border bg-white shadow-sm dark:border-white/10 dark:bg-card",
  panel:
    "rounded-2xl border border-trosky-border/90 bg-white/95 dark:border-white/10 dark:bg-card/90",
  mutedPanel: "rounded-2xl border border-trosky-border bg-trosky-soft",
} as const;

export function troskyTextClamp(className?: string) {
  return cn("min-w-0 break-words [overflow-wrap:anywhere]", className);
}
