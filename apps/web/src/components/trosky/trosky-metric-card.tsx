import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { troskySurfaces, troskyTextClamp } from "./trosky-primitives";
import { TroskyStatusBadge } from "./trosky-status-badge";

export interface TroskyMetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  hint?: string;
  badge?: { text: string; variant?: "neutral" | "urgent" | "warning" | "success" };
  footer?: React.ReactNode;
}

export function TroskyMetricCard({
  label,
  value,
  icon: Icon,
  hint,
  badge,
  footer,
  className,
  ...props
}: TroskyMetricCardProps) {
  return (
    <div
      className={cn(
        troskySurfaces.card,
        "flex min-w-0 flex-col p-4 sm:p-5",
        className
      )}
      {...props}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className={cn("flex min-w-0 flex-1 flex-col gap-1", troskyTextClamp())}>
          <p className="text-xs font-medium uppercase tracking-wide text-trosky-muted">
            {label}
          </p>
          <p className="text-2xl font-semibold tabular-nums tracking-tight text-trosky-ink sm:text-[1.65rem]">
            {value}
          </p>
          {hint ? (
            <p className="text-xs text-trosky-muted">{hint}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {Icon ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-trosky-border bg-trosky-soft text-trosky-muted">
              <Icon className="h-4 w-4" aria-hidden />
            </div>
          ) : null}
          {badge ? (
            <TroskyStatusBadge variant={badge.variant ?? "neutral"}>
              {badge.text}
            </TroskyStatusBadge>
          ) : null}
        </div>
      </div>
      {footer ? (
        <div className="mt-3 min-w-0 border-t border-trosky-border/80 pt-3 text-xs text-trosky-muted">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
