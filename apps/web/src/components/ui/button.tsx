"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import {
  Button as UntitledButton,
  styles as untitledButtonStyles,
  type CommonProps as UntitledCommonProps,
} from "@/components/base/buttons/button";
import { cn } from "@/lib/utils";
import { cx } from "@/utils/cx";

const buttonVariants = cva("", {
  variants: {
    variant: {
      default: "",
      destructive: "",
      outline: "",
      secondary: "",
      ghost: "",
      link: "",
    },
    size: {
      default: "",
      sm: "",
      lg: "",
      icon: "",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

type UntitledColor = NonNullable<UntitledCommonProps["color"]>;
type UntitledSize = NonNullable<UntitledCommonProps["size"]>;

function mapVariant(variant: ButtonProps["variant"]): UntitledColor {
  switch (variant) {
    case "destructive":
      return "primary-destructive";
    case "outline":
    case "secondary":
      return "secondary";
    case "ghost":
      return "tertiary";
    case "link":
      return "link-color";
    default:
      return "primary";
  }
}

function mapSize(size: ButtonProps["size"]): UntitledSize {
  if (size === "lg") return "lg";
  if (size === "sm" || size === "icon") return "sm";
  return "md";
}

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      asChild = false,
      disabled,
      isLoading,
      children,
      type = "button",
      ...props
    },
    _ref
  ) => {
    const color = mapVariant(variant);
    const untitledSize = mapSize(size);
    const isLinkType = ["link-gray", "link-color", "link-destructive"].includes(color);

    if (asChild) {
      return (
        <Slot
          className={cx(
            untitledButtonStyles.common.root,
            untitledButtonStyles.sizes[untitledSize].root,
            untitledButtonStyles.colors[color].root,
            isLinkType && untitledButtonStyles.sizes[untitledSize].linkRoot,
            className
          )}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <UntitledButton
        {...(props as object)}
        type={type}
        color={color}
        size={untitledSize}
        isDisabled={disabled}
        isLoading={isLoading}
        className={cn(size === "icon" && "size-10! p-2!", className)}
      >
        {children}
      </UntitledButton>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
