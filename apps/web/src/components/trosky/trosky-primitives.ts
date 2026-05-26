import { cn } from "@/lib/utils";

/** Shared surface + layout classes for the Trosky cockpit design layer */
export const troskySurfaces = {
  card:
    "rounded-2xl border border-border bg-card text-card-foreground shadow-sm",
  panel:
    "rounded-2xl border border-border/90 bg-card/95 text-card-foreground shadow-sm",
  mutedPanel:
    "rounded-2xl border border-border bg-muted/40 text-foreground",
} as const;

export function troskyTextClamp(className?: string) {
  return cn("min-w-0 break-words [overflow-wrap:anywhere]", className);
}
