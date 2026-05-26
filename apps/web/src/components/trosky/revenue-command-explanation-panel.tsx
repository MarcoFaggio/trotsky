import type { RevenueCommandCentreExplanation } from "@hotel-pricing/shared";
import { Sparkles } from "lucide-react";
import { troskySurfaces } from "./trosky-primitives";

interface RevenueCommandExplanationPanelProps {
  explanation: RevenueCommandCentreExplanation;
}

export function RevenueCommandExplanationPanel({
  explanation,
}: RevenueCommandExplanationPanelProps) {
  return (
    <aside
      className={`${troskySurfaces.card} flex min-w-0 flex-col gap-3 p-4 sm:p-5`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-trosky-red">
          <Sparkles className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Why Trosky surfaced these
          </p>
          <h3 className="mt-1 text-sm font-semibold leading-snug text-foreground">
            {explanation.headline}
          </h3>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{explanation.body}</p>
      {explanation.bullets.length > 0 ? (
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          {explanation.bullets.map((bullet) => (
            <li key={bullet} className="break-words [overflow-wrap:anywhere]">
              {bullet}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="text-[11px] text-muted-foreground/80">
        Summary from Trosky rules and available data — not an LLM forecast.
      </p>
    </aside>
  );
}
