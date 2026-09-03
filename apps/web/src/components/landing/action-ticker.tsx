"use client";

import { cn } from "@/lib/utils";
import { Container } from "./primitives";

type Kind = "Price change" | "Event" | "Watch demand" | "Parity" | "Inquiry";

const TONE: Record<Kind, string> = {
  "Price change": "bg-brand-primary text-brand-secondary ring-brand",
  Event: "bg-warning-primary text-warning-primary ring-amber-300 dark:ring-amber-800",
  "Watch demand": "bg-secondary text-secondary ring-primary",
  Parity: "bg-error-primary text-error-primary ring-error_subtle",
  Inquiry: "bg-success-primary text-success-primary ring-emerald-300 dark:ring-emerald-800",
};

const ACTIONS: { kind: Kind; text: string }[] = [
  { kind: "Price change", text: "Raise Sat 13 Sep by €12 — comp set moved +7% for the weekend" },
  { kind: "Event", text: "Cork Jazz Festival, 23–26 Oct — hold BAR, keep the 2-night minimum" },
  { kind: "Watch demand", text: "Thu 18 Sep pickup ahead of pace — review again at 85% occupancy" },
  { kind: "Parity", text: "Expedia showing €6 under direct for Fri 19 Sep" },
  { kind: "Inquiry", text: "Room block, 24 rooms, 3–5 Oct — qualify and quote" },
  { kind: "Price change", text: "Drop Mon 15 Sep by €8 — 41% sold, comps trending down" },
];

function Chip({
  kind,
  text,
  "aria-hidden": ariaHidden,
}: {
  kind: Kind;
  text: string;
  "aria-hidden"?: boolean;
}) {
  return (
    <li
      aria-hidden={ariaHidden || undefined}
      className="flex shrink-0 items-center gap-3 rounded-full bg-primary py-2 pr-4 pl-2 text-sm text-secondary ring-1 ring-secondary"
    >
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ring-1 ring-inset",
          TONE[kind]
        )}
      >
        {kind}
      </span>
      <span className="whitespace-nowrap">{text}</span>
    </li>
  );
}

/**
 * A slow ticker of the action types Trosky raises. Pauses on hover or keyboard
 * focus; under prefers-reduced-motion the CSS turns it into a static, wrapping
 * list (see globals.css) so the markup stays identical for hydration.
 */
export function ActionTicker() {
  return (
    <section
      aria-labelledby="ticker-heading"
      className="border-y border-secondary bg-secondary_alt py-5"
    >
      <Container className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <h2
          id="ticker-heading"
          className="shrink-0 text-[12px] font-semibold tracking-[0.14em] text-tertiary uppercase lg:w-44"
        >
          Example queue
          <span className="mt-0.5 block text-[11px] font-medium tracking-normal text-quaternary normal-case">
            The kinds of action Trosky raises
          </span>
        </h2>

        <div className="landing-ticker-mask relative min-w-0 flex-1 overflow-hidden">
          <ul
            role="list"
            className="landing-ticker-track flex w-max animate-ticker gap-2 [--ticker-duration:70s]"
          >
            {[...ACTIONS, ...ACTIONS].map((a, i) => (
              <Chip key={`${a.text}-${i}`} {...a} aria-hidden={i >= ACTIONS.length} />
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
