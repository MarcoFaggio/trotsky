import * as React from "react";
import { cn } from "@/lib/utils";
import { troskySurfaces } from "./trosky-primitives";

export interface TroskyFilterBarProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  trailing?: React.ReactNode;
}

export function TroskyFilterBar({
  label,
  trailing,
  children,
  className,
  ...props
}: TroskyFilterBarProps) {
  return (
    <div
      className={cn(
        troskySurfaces.panel,
        "flex min-w-0 flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4",
        className
      )}
      {...props}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        {label ? (
          <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-trosky-muted sm:mr-1">
            {label}
          </span>
        ) : null}
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3">
          {children}
        </div>
      </div>
      {trailing ? (
        <div className="flex min-w-0 shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          {trailing}
        </div>
      ) : null}
    </div>
  );
}
