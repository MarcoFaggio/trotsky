import { cn } from "@/lib/utils";

/** Shared surface + layout classes for the Trosky cockpit (Untitled tokens) */
export const troskySurfaces = {
  card:
    "rounded-xl bg-primary text-primary shadow-xs ring-1 ring-secondary",
  panel:
    "rounded-xl bg-primary/95 text-primary shadow-xs ring-1 ring-secondary",
  mutedPanel:
    "rounded-xl bg-secondary_alt text-primary ring-1 ring-secondary ring-inset",
} as const;

export function troskyTextClamp(className?: string) {
  return cn("min-w-0 break-words [overflow-wrap:anywhere]", className);
}
