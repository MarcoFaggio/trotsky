"use client";

import { forwardRef, useRef, useState, type ReactNode } from "react";
import {
  BarChartSquare02,
  Building07,
  Calendar,
  CheckCircle,
  Globe02,
  Mail01,
  Tag01,
  Users01,
} from "@untitledui/icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { TroskyMark } from "@/components/brand/trosky-logo";
import { AnimatedBeam } from "@/components/magicui/animated-beam";
import { DotPattern } from "@/components/magicui/dot-pattern";
import { cn } from "@/lib/utils";
import { Container, Reveal, SectionHeading } from "./primitives";

type Mode = "before" | "with";

const NODES = [
  { key: "booking", label: "Booking.com", stale: "checked Tue", icon: Globe02 },
  { key: "rateplans", label: "Rate plans", stale: "in a sheet", icon: Tag01 },
  { key: "expedia", label: "Expedia", stale: "checked Fri", icon: Globe02 },
  { key: "occupancy", label: "Occupancy", stale: "PMS export", icon: BarChartSquare02 },
  { key: "events", label: "Events", stale: "someone's calendar", icon: Calendar },
  { key: "inquiries", label: "Inquiries", stale: "inbox", icon: Mail01 },
  { key: "comps", label: "Comp set", stale: "six tabs", icon: Users01 },
  { key: "promotions", label: "Promotions", stale: "email thread", icon: Building07 },
] as const;

type NodeKey = (typeof NODES)[number]["key"];

const Node = forwardRef<
  HTMLDivElement,
  { icon: ReactNode; label: string; stale: string; connected: boolean }
>(function Node({ icon, label, stale, connected }, ref) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={ref}
        className={cn(
          "z-10 flex size-12 items-center justify-center rounded-xl text-white ring-1 transition-[background-color,box-shadow,opacity] duration-500 sm:size-14",
          connected
            ? "bg-white/[0.07] ring-white/15 shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
            : "bg-white/[0.04] ring-white/10 opacity-70"
        )}
      >
        {icon}
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span className="max-w-[5.5rem] text-center text-[11px] leading-tight font-medium text-white/80 sm:text-xs">
          {label}
        </span>
        <AnimatePresence initial={false}>
          {!connected ? (
            <motion.span
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -2 }}
              transition={{ duration: 0.2 }}
              className="text-[10px] text-white/40"
            >
              {stale}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
});

export function ConnectedPlatform() {
  const reduced = useReducedMotion();
  const [mode, setMode] = useState<Mode>("with");
  const connected = mode === "with";

  const containerRef = useRef<HTMLDivElement>(null);
  const hubRef = useRef<HTMLDivElement>(null);
  const bookingRef = useRef<HTMLDivElement>(null);
  const rateplansRef = useRef<HTMLDivElement>(null);
  const expediaRef = useRef<HTMLDivElement>(null);
  const occupancyRef = useRef<HTMLDivElement>(null);
  const eventsRef = useRef<HTMLDivElement>(null);
  const inquiriesRef = useRef<HTMLDivElement>(null);
  const compsRef = useRef<HTMLDivElement>(null);
  const promotionsRef = useRef<HTMLDivElement>(null);
  const refs: Record<NodeKey, React.RefObject<HTMLDivElement>> = {
    booking: bookingRef,
    rateplans: rateplansRef,
    expedia: expediaRef,
    occupancy: occupancyRef,
    events: eventsRef,
    inquiries: inquiriesRef,
    comps: compsRef,
    promotions: promotionsRef,
  };

  const node = (key: NodeKey) => {
    const n = NODES.find((item) => item.key === key)!;
    const Icon = n.icon;
    return (
      <Node
        ref={refs[key]}
        icon={<Icon className="size-5" aria-hidden />}
        label={n.label}
        stale={n.stale}
        connected={connected}
      />
    );
  };

  return (
    <section id="connected" className="scroll-mt-20 border-t border-secondary py-20 sm:py-24 lg:py-32">
      <Container>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <Reveal>
            <SectionHeading
              eyebrow="Data"
              title={
                <>
                  Hotel pricing is{" "}
                  <span className="relative inline-block">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={mode}
                        initial={reduced ? false : { opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduced ? undefined : { opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="landing-serif inline-block text-brand-secondary"
                      >
                        {connected ? "connected." : "fragmented."}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                </>
              }
              lede="OTA rates, rate plans, occupancy, events, promotions and inquiries land in one record per property, so an action can cite all of them."
            />
          </Reveal>

          <Reveal index={1}>
            <div
              role="tablist"
              aria-label="Before and with Trosky"
              className="relative inline-flex rounded-full bg-secondary_alt p-1 ring-1 ring-secondary ring-inset"
            >
              {(
                [
                  { id: "before", label: "Before" },
                  { id: "with", label: "With Trosky" },
                ] as const
              ).map((tab) => {
                const selected = mode === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setMode(tab.id)}
                    className={cn(
                      "relative min-h-10 rounded-full px-4 text-sm font-semibold transition-colors",
                      selected ? "text-white" : "text-tertiary hover:text-primary"
                    )}
                  >
                    {selected ? (
                      <motion.span
                        layoutId="connected-tab"
                        aria-hidden
                        transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 34 }}
                        className="absolute inset-0 rounded-full bg-brand-solid"
                      />
                    ) : null}
                    <span className="relative">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </Reveal>
        </div>

        <Reveal index={2} amount={0.15} className="mt-12">
          <div className="relative overflow-hidden rounded-2xl bg-ink ring-1 ring-black/60 dark:ring-white/10">
            <DotPattern className="fill-white/[0.12]" />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 transition-opacity duration-700"
              style={{
                opacity: connected ? 1 : 0,
                background:
                  "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(166,1,1,0.22), transparent 65%)",
              }}
            />

            <div
              ref={containerRef}
              className="relative mx-auto grid max-w-3xl grid-cols-3 items-center justify-items-center gap-y-8 px-4 py-12 sm:min-h-[30rem] sm:gap-y-10 sm:px-10 sm:py-16"
            >
              {node("booking")}
              {node("rateplans")}
              {node("expedia")}

              {node("occupancy")}

              <div className="flex flex-col items-center gap-2">
                <div
                  ref={hubRef}
                  className={cn(
                    "z-10 flex size-[4.5rem] items-center justify-center rounded-2xl ring-1 transition-[box-shadow,opacity,background-color] duration-700 sm:size-20",
                    connected
                      ? "bg-ink-elevated ring-brand-400/40 shadow-[0_0_48px_rgba(220,38,38,0.28)]"
                      : "bg-ink-elevated ring-white/10 opacity-50"
                  )}
                >
                  <TroskyMark className="size-12 sm:size-14" />
                </div>
                <span className="text-[11px] font-semibold tracking-[0.14em] text-white/80 uppercase">
                  Trosky
                </span>
              </div>

              {node("events")}
              {node("inquiries")}
              {node("comps")}
              {node("promotions")}

              {connected
                ? NODES.map((n, index) => (
                    <AnimatedBeam
                      key={n.key}
                      containerRef={containerRef}
                      fromRef={refs[n.key]}
                      toRef={hubRef}
                      curvature={index % 2 === 0 ? 20 : -20}
                      reverse={index > 3}
                      delay={reduced ? 0 : index * 0.15}
                      duration={5.5}
                      pathColor="rgba(248,113,113,0.26)"
                      pathWidth={1.75}
                      pathOpacity={0.5}
                      gradientStartColor="#fca5a5"
                      gradientStopColor="#dc2626"
                    />
                  ))
                : null}
            </div>

            <div className="relative flex justify-center px-4 pb-10">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={mode}
                  initial={reduced ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? undefined : { opacity: 0, y: -6 }}
                  transition={{ duration: 0.22 }}
                  className={cn(
                    "inline-flex min-h-10 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ring-1 ring-inset",
                    connected
                      ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30"
                      : "bg-white/5 text-white/70 ring-white/15"
                  )}
                >
                  {connected ? <CheckCircle className="size-4 text-emerald-400" aria-hidden /> : null}
                  {connected
                    ? "One revenue record per property, refreshed daily"
                    : "Eight sources, eight refresh dates, no shared record"}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
