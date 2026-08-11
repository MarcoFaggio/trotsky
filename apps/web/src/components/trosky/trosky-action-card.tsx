import * as React from "react";
import Link from "next/link";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { troskySurfaces, troskyTextClamp } from "./trosky-primitives";

export interface TroskyActionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  actionLabel: string;
  actionHref?: string;
  onAction?: () => void;
  /** Primary urgent CTAs use brand red; secondary actions stay neutral */
  actionTone?: "primary" | "secondary";
  disabled?: boolean;
}

export function TroskyActionCard({
  title,
  description,
  icon: Icon,
  actionLabel,
  actionHref,
  onAction,
  actionTone = "primary",
  disabled,
  className,
  ...props
}: TroskyActionCardProps) {
  const actionButton = (
    <Button
      type="button"
      size="sm"
      disabled={disabled}
      variant={actionTone === "secondary" ? "outline" : "default"}
      className={cn(
        "h-9 shrink-0 rounded-full px-4 text-xs font-semibold",
        actionTone === "primary" &&
          "bg-trosky-red text-white hover:bg-trosky-red-dark focus-visible:ring-trosky-red"
      )}
      onClick={onAction}
    >
      {actionLabel}
    </Button>
  );

  return (
    <div
      className={cn(
        troskySurfaces.card,
        "flex min-w-0 flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5",
        className
      )}
      {...props}
    >
      <div className={cn("flex min-w-0 flex-1 items-start gap-3", troskyTextClamp())}>
        {Icon ? (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-trosky-border bg-trosky-soft text-trosky-ink">
            <Icon className="h-5 w-5" aria-hidden />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-trosky-ink">{title}</h3>
          {description ? (
            <p className="mt-1 text-sm leading-relaxed text-trosky-muted">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 sm:pl-2">
        {actionHref && !disabled ? (
          <Button
            asChild
            size="sm"
            variant={actionTone === "secondary" ? "outline" : "default"}
            className={cn(
              "h-9 rounded-full px-4 text-xs font-semibold",
              actionTone === "primary" &&
                "bg-trosky-red text-white hover:bg-trosky-red-dark"
            )}
          >
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        ) : (
          actionButton
        )}
      </div>
    </div>
  );
}
