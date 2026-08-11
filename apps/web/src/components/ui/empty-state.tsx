import * as React from "react";
import { cn } from "@/lib/utils";

type IconComponent = React.ComponentType<{ className?: string }>;

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: IconComponent;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

/** Standard designed empty state — dashed panel with icon, copy, optional action. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-secondary bg-secondary_alt/40 px-6 py-12 text-center",
        className
      )}
      {...props}
    >
      {Icon ? (
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-primary ring-1 ring-brand ring-inset">
          <Icon className="h-5 w-5 text-fg-brand-primary" aria-hidden />
        </div>
      ) : null}
      <p className="text-sm font-semibold text-primary">{title}</p>
      {description ? (
        <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-tertiary">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
