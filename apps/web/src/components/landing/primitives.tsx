"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { motion, type Variants } from "motion/react";
import { cn } from "@/lib/utils";

/** Shared easing: fast start, long settle. Reads as deliberate rather than bouncy. */
export const EASE = [0.22, 1, 0.36, 1] as const;

export const revealVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE, delay: i * 0.07 },
  }),
};

export function Container({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn("mx-auto w-full max-w-[1200px] px-5 sm:px-8", className)}
      {...props}
    />
  );
}

/**
 * Scroll-triggered reveal. Reduced-motion handling is left to the page-level
 * `MotionConfig reducedMotion="user"`, which drops the transform and keeps a
 * short fade; branching on the preference here would render different markup
 * on the server and the client and break hydration.
 */
export function Reveal({
  children,
  className,
  index = 0,
  as = "div",
  amount = 0.3,
}: {
  children: ReactNode;
  className?: string;
  index?: number;
  as?: "div" | "li" | "article" | "section" | "p" | "h2" | "h3" | "figure";
  amount?: number;
}) {
  const Component = motion[as];
  return (
    <Component
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount, margin: "0px 0px -8% 0px" }}
      variants={revealVariants}
      className={className}
    >
      {children}
    </Component>
  );
}

export function Eyebrow({
  children,
  className,
  tone = "brand",
}: {
  children: ReactNode;
  className?: string;
  tone?: "brand" | "muted" | "on-ink";
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-2.5 text-[12px] font-semibold tracking-[0.14em] uppercase",
        tone === "brand" && "text-brand-secondary",
        tone === "muted" && "text-tertiary",
        tone === "on-ink" && "text-white/60",
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "h-px w-6",
          tone === "on-ink" ? "bg-white/30" : "bg-brand-solid"
        )}
      />
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lede,
  className,
  tone = "default",
  align = "left",
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  className?: string;
  tone?: "default" | "on-ink";
  align?: "left" | "center";
}) {
  const onInk = tone === "on-ink";
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow ? (
        <Eyebrow
          tone={onInk ? "on-ink" : "brand"}
          className={cn(align === "center" && "justify-center")}
        >
          {eyebrow}
        </Eyebrow>
      ) : null}
      <h2
        className={cn(
          "mt-4 text-display-sm font-semibold tracking-tight sm:text-display-md",
          onInk ? "text-white" : "text-primary"
        )}
      >
        {title}
      </h2>
      {lede ? (
        <p
          className={cn(
            "mt-4 text-lg leading-relaxed",
            onInk ? "text-white/65" : "text-tertiary"
          )}
        >
          {lede}
        </p>
      ) : null}
    </div>
  );
}

/** Serif italic accent for a single phrase inside a heading. */
export function Accent({ children }: { children: ReactNode }) {
  return <em className="landing-serif">{children}</em>;
}
