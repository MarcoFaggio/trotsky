import * as React from "react";
import { cn } from "@/lib/utils";
import { troskyTextClamp } from "./trosky-primitives";
import { TroskyStatusBadge } from "./trosky-status-badge";

export interface TroskyPageHeaderProps extends React.HTMLAttributes<HTMLElement> {
  title: string;
  description?: string;
  eyebrow?: string;
  badge?: { text: string; variant?: "neutral" | "urgent" | "warning" | "success" };
  actions?: React.ReactNode;
}

export function TroskyPageHeader({
  title,
  description,
  eyebrow,
  badge,
  actions,
  className,
  ...props
}: TroskyPageHeaderProps) {
  return (
    <header
      className={cn(
        "mb-4 flex min-w-0 flex-col gap-4 border-b border-border/80 pb-4 sm:mb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-6 sm:pb-5 lg:mb-6",
        className
      )}
      {...props}
    >
      <div className={cn("min-w-0 flex-1 space-y-1.5", troskyTextClamp())}>
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-trosky-muted">
            {eyebrow}
          </p>
        ) : null}
        <div className="flex min-w-0 flex-wrap items-center gap-2 gap-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-trosky-ink sm:text-2xl">
            {title}
          </h1>
          {badge ? (
            <TroskyStatusBadge variant={badge.variant ?? "neutral"}>
              {badge.text}
            </TroskyStatusBadge>
          ) : null}
        </div>
        {description ? (
          <p className="max-w-3xl text-sm leading-relaxed text-trosky-muted">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
