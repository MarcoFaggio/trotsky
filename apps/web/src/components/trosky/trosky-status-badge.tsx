import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const troskyStatusBadgeVariants = cva(
  "inline-flex max-w-full shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium leading-snug",
  {
    variants: {
      variant: {
        neutral:
          "border-trosky-border bg-white text-trosky-muted dark:border-white/15 dark:bg-card dark:text-muted-foreground",
        info: "border-trosky-border bg-trosky-soft text-trosky-ink dark:border-white/15",
        success:
          "border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
        warning:
          "border-amber-200/80 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
        urgent:
          "border-trosky-red/25 bg-trosky-red text-white dark:border-trosky-red/40",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
);

export interface TroskyStatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof troskyStatusBadgeVariants> {
  dot?: boolean;
}

export function TroskyStatusBadge({
  className,
  variant,
  dot,
  children,
  ...props
}: TroskyStatusBadgeProps) {
  return (
    <span
      className={cn(troskyStatusBadgeVariants({ variant }), className)}
      {...props}
    >
      {dot ? (
        <span
          className={cn(
            "h-1.5 w-1.5 shrink-0 rounded-full",
            variant === "urgent"
              ? "bg-white"
              : variant === "success"
                ? "bg-emerald-500"
                : variant === "warning"
                  ? "bg-amber-500"
                  : "bg-trosky-muted"
          )}
          aria-hidden
        />
      ) : null}
      <span className="truncate">{children}</span>
    </span>
  );
}
