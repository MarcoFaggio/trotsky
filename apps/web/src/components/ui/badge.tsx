"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Badge as UntitledBadge } from "@/components/base/badges/badges";
import { cn } from "@/lib/utils";

const badgeVariants = cva("", {
  variants: {
    variant: {
      default: "",
      secondary: "",
      destructive: "",
      outline: "",
      success: "",
      warning: "",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

type UntitledColor = "brand" | "gray" | "error" | "success" | "warning";

function mapColor(variant: BadgeProps["variant"]): UntitledColor {
  switch (variant) {
    case "destructive":
      return "error";
    case "success":
      return "success";
    case "warning":
      return "warning";
    case "secondary":
    case "outline":
      return "gray";
    default:
      return "brand";
  }
}

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  return (
    <span {...props} className={cn("inline-flex items-center", className)}>
      <UntitledBadge
        type={variant === "outline" ? "modern" : "pill-color"}
        size="sm"
        color={mapColor(variant)}
      >
        {children}
      </UntitledBadge>
    </span>
  );
}

export { Badge, badgeVariants };
