"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import NumberFlow, { NumberFlowGroup } from "@number-flow/react";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "motion/react";
import { Check, ArrowUp, ArrowDown, ClockRewind } from "@untitledui/icons";
import { cn } from "@/lib/utils";

type Point = { day: string; yours: number; comp: number; rec: number };

type Snapshot = {
  id: string;
  refreshedAt: string;
  occupancy: number;
  pace: number;
  points: Point[];
  action: {
    title: string;
    body: string;
    delta: number;
    dates: string;
  };
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function series(base: number[], comp: number[], rec: number[]): Point[] {
  return base.map((yours, i) => ({
    day: DAYS[i % 7],
    yours,
    comp: comp[i],
    rec: rec[i],
  }));
}

/**
 * Three consecutive "morning refreshes" for one example property. Values are
 * illustrative, not a customer's data, and the card says so.
 */
const SNAPSHOTS: Snapshot[] = [
  {
    id: "refresh-1",
    refreshedAt: "06:10",
    occupancy: 0.82,
    pace: 0.06,
    points: series(
      [128, 131, 136, 142, 148, 155, 149, 140, 136, 133, 130, 138, 146, 141],
      [118, 120, 124, 128, 132, 138, 134, 126, 122, 120, 118, 124, 130, 127],
      [132, 135, 140, 146, 152, 158, 154, 145, 141, 138, 136, 142, 150, 145]
    ),
    action: {
      title: "Raise Fri–Sat by €12",
      dates: "12–13 Sep",
      delta: 12,
      body: "Comp set moved +7% for the weekend. You sit under the recommended band with 82% on the books.",
    },
  },
  {
    id: "refresh-2",
    refreshedAt: "06:12",
    occupancy: 0.84,
    pace: 0.08,
    points: series(
      [140, 143, 146, 150, 160, 167, 158, 146, 141, 138, 136, 144, 152, 147],
      [124, 126, 129, 134, 141, 149, 142, 131, 126, 124, 121, 129, 136, 132],
      [141, 144, 148, 153, 162, 170, 160, 149, 144, 141, 139, 146, 154, 149]
    ),
    action: {
      title: "Hold Thu, watch pickup",
      dates: "18 Sep",
      delta: 0,
      body: "Pickup is ahead of last year and two comps are still open. No change today; review again at 85% occupancy.",
    },
  },
  {
    id: "refresh-3",
    refreshedAt: "06:09",
    occupancy: 0.79,
    pace: 0.03,
    points: series(
      [138, 140, 143, 147, 156, 164, 155, 143, 138, 134, 131, 139, 148, 144],
      [126, 127, 130, 133, 138, 145, 139, 128, 123, 119, 116, 123, 131, 128],
      [136, 138, 141, 145, 154, 162, 152, 140, 134, 129, 126, 135, 145, 141]
    ),
    action: {
      title: "Drop Mon by €8",
      dates: "15 Sep",
      delta: -8,
      body: "Comps are trending down into the week and Monday is 41% sold. A small drop protects pickup without chasing the floor.",
    },
  },
];

const W = 560;
const H = 176;
const PAD_Y = 12;
const CHART_H = H - PAD_Y * 2;

function toPath(values: number[], min: number, max: number) {
  const span = Math.max(max - min, 1);
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * W;
      const y = CHART_H - ((v - min) / span) * CHART_H;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

const euro = { style: "currency", currency: "EUR", maximumFractionDigits: 0 } as const;

export function HeroCockpit() {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { amount: 0.4 });

  const [index, setIndex] = useState(0);
  const [range, setRange] = useState<7 | 14>(7);
  const [accepted, setAccepted] = useState(false);
  const [hover, setHover] = useState<number | null>(null);

  const snapshot = SNAPSHOTS[index];
  const points = useMemo(() => snapshot.points.slice(-range), [snapshot, range]);
  const latest = points[points.length - 1];
  const adr = latest.yours + (accepted ? snapshot.action.delta : 0);
  const gap = adr - latest.comp;

  // Cycle refreshes while the card is on screen. Stops when the visitor asks
  // for reduced motion, or once they have interacted with the action.
  useEffect(() => {
    if (reduced || !inView || accepted) return;
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % SNAPSHOTS.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [reduced, inView, accepted]);

  useEffect(() => {
    if (!accepted) return;
    const timer = window.setTimeout(() => {
      setAccepted(false);
      setIndex((i) => (i + 1) % SNAPSHOTS.length);
    }, 5200);
    return () => window.clearTimeout(timer);
  }, [accepted]);

  const all = points.flatMap((p) => [p.yours, p.comp, p.rec]);
  const min = Math.min(...all) - 4;
  const max = Math.max(...all) + 4;
  const yFor = (v: number) => CHART_H - ((v - min) / Math.max(max - min, 1)) * CHART_H;
  const xFor = (i: number) => (i / (points.length - 1)) * W;

  const yoursPath = toPath(points.map((p) => p.yours), min, max);
  const compPath = toPath(points.map((p) => p.comp), min, max);
  const recPath = toPath(points.map((p) => p.rec), min, max);

  const hovered = hover === null ? null : points[hover];


  return (
    <motion.div
      ref={rootRef}
      initial={{ opacity: 0, y: 28, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
      className="relative"
    >
      {/* Soft drop shadow plate — a single warm shadow, not a glow. */}
      <div
        aria-hidden
        className="absolute inset-x-6 -bottom-6 h-16 rounded-[50%] bg-black/25 blur-2xl dark:bg-black/60"
      />

      <div className="relative overflow-hidden rounded-2xl bg-primary ring-1 ring-secondary shadow-2xl">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-secondary px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="text-sm font-semibold text-primary">Harbour View Hotel</p>
              <span className="text-xs text-quaternary">Cork · 64 rooms</span>
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-tertiary">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fg-success-secondary opacity-60 motion-reduce:hidden" />
                <span className="relative inline-flex size-1.5 rounded-full bg-fg-success-primary" />
              </span>
              <span>
                Rates refreshed{" "}
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={snapshot.id}
                    initial={reduced ? false : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduced ? undefined : { opacity: 0, y: -4 }}
                    transition={{ duration: 0.25 }}
                    className="inline-block tabular-nums"
                  >
                    {snapshot.refreshedAt}
                  </motion.span>
                </AnimatePresence>{" "}
                today
              </span>
              <span className="hidden text-quaternary sm:inline">· example data</span>
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Date range"
            className="flex gap-0.5 rounded-lg bg-secondary_alt p-0.5 ring-1 ring-secondary ring-inset"
          >
            {([7, 14] as const).map((days) => (
              <button
                key={days}
                type="button"
                role="tab"
                aria-selected={range === days}
                onClick={() => setRange(days)}
                className={cn(
                  "min-h-8 rounded-md px-2.5 text-xs font-semibold transition-colors",
                  range === days
                    ? "bg-primary text-primary shadow-xs ring-1 ring-secondary ring-inset"
                    : "text-tertiary hover:text-primary"
                )}
              >
                {days} days
              </button>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <NumberFlowGroup>
          <dl className="grid grid-cols-2 divide-x divide-y divide-secondary border-b border-secondary sm:grid-cols-4 sm:divide-y-0">
            <Kpi label="Your ADR">
              <NumberFlow value={adr} locales="en-IE" format={euro} />
            </Kpi>
            <Kpi label="Comp average">
              <NumberFlow value={latest.comp} locales="en-IE" format={euro} />
            </Kpi>
            <Kpi label="Occupancy">
              <NumberFlow
                value={snapshot.occupancy}
                locales="en-IE"
                format={{ style: "percent", maximumFractionDigits: 0 }}
              />
            </Kpi>
            <Kpi label="Vs comp set">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5",
                  gap >= 0 ? "text-success-primary" : "text-error-primary"
                )}
              >
                {gap >= 0 ? (
                  <ArrowUp className="size-4" aria-hidden />
                ) : (
                  <ArrowDown className="size-4" aria-hidden />
                )}
                <NumberFlow value={Math.abs(gap)} locales="en-IE" format={euro} />
              </span>
            </Kpi>
          </dl>
        </NumberFlowGroup>

        {/* Chart */}
        <div className="px-4 pt-4 pb-3 sm:px-5">
          <div className="relative">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="h-[150px] w-full overflow-visible sm:h-[176px]"
              role="img"
              aria-label="Your rate versus the comp set average and the recommended rate across the selected stay dates"
              onPointerMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const ratio = (e.clientX - rect.left) / rect.width;
                const i = Math.round(Math.min(Math.max(ratio, 0), 1) * (points.length - 1));
                setHover(i);
              }}
              onPointerLeave={() => setHover(null)}
            >
              {[0.25, 0.5, 0.75].map((t) => (
                <line
                  key={t}
                  x1="0"
                  x2={W}
                  y1={PAD_Y + CHART_H * t}
                  y2={PAD_Y + CHART_H * t}
                  stroke="currentColor"
                  className="text-border-secondary"
                  strokeWidth="1"
                  strokeDasharray="3 7"
                />
              ))}

              <g transform={`translate(0 ${PAD_Y})`}>
                {/* Path geometry moves with a CSS transition on `d`; the
                    first draw of the primary line is a Motion pathLength. */}
                <path
                  d={compPath}
                  className="landing-chart-morph text-fg-quaternary"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={recPath}
                  className="landing-chart-morph text-fg-success-primary"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="5 6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <motion.path
                  key={`draw-${range}`}
                  d={yoursPath}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                  fill="none"
                  stroke="currentColor"
                  className="landing-chart-morph text-fg-brand-primary"
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {hovered ? (
                  <g aria-hidden>
                    <line
                      x1={xFor(hover!)}
                      x2={xFor(hover!)}
                      y1={-PAD_Y}
                      y2={CHART_H + PAD_Y}
                      stroke="currentColor"
                      className="text-border-primary"
                      strokeWidth="1"
                    />
                    {[
                      { v: hovered.comp, cls: "text-fg-quaternary" },
                      { v: hovered.rec, cls: "text-fg-success-primary" },
                      { v: hovered.yours, cls: "text-fg-brand-primary" },
                    ].map((dot) => (
                      <circle
                        key={dot.cls}
                        cx={xFor(hover!)}
                        cy={yFor(dot.v)}
                        r="4"
                        fill="currentColor"
                        className={dot.cls}
                        stroke="var(--color-bg-primary)"
                        strokeWidth="2"
                      />
                    ))}
                  </g>
                ) : (
                  <circle
                    cx={W}
                    cy={yFor(latest.yours)}
                    r="4.5"
                    fill="currentColor"
                    className="landing-chart-morph text-fg-brand-primary"
                    stroke="var(--color-bg-primary)"
                    strokeWidth="2.5"
                  />
                )}
              </g>
            </svg>

            {hovered ? (
              <div
                role="status"
                className="pointer-events-none absolute top-0 rounded-lg bg-primary px-2.5 py-2 text-[11px] leading-tight shadow-lg ring-1 ring-secondary"
                style={{
                  left: `${(hover! / (points.length - 1)) * 100}%`,
                  transform: `translateX(${hover! > points.length / 2 ? "calc(-100% - 10px)" : "10px"})`,
                }}
              >
                <p className="font-semibold text-primary">{hovered.day}</p>
                <p className="mt-1 text-tertiary">
                  You <span className="font-semibold text-primary tabular-nums">€{hovered.yours}</span>
                </p>
                <p className="text-tertiary">
                  Comps <span className="font-semibold text-primary tabular-nums">€{hovered.comp}</span>
                </p>
                <p className="text-tertiary">
                  Rec. <span className="font-semibold text-primary tabular-nums">€{hovered.rec}</span>
                </p>
              </div>
            ) : null}
          </div>

          <div className="mt-2.5 flex items-center justify-between gap-3 text-[11px] text-tertiary sm:text-xs">
            <span className="tabular-nums">{points[0].day}</span>
            <div className="flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1">
              <Legend swatch="bg-fg-brand-primary" label="Your rate" />
              <Legend swatch="bg-fg-quaternary" label="Comp avg" />
              <Legend swatch="bg-fg-success-primary" label="Recommended" dashed />
            </div>
            <span className="tabular-nums">{latest.day}</span>
          </div>
        </div>

        {/* Action */}
        <div className="border-t border-secondary bg-secondary_alt px-4 py-4 sm:px-5">
          <AnimatePresence mode="wait" initial={false}>
            {accepted ? (
              <motion.div
                key="accepted"
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="flex items-start gap-3"
              >
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-success-solid text-white">
                  <Check className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-primary">
                    Accepted · pushed to the rate calendar
                  </p>
                  <p className="mt-0.5 text-sm text-tertiary">
                    {snapshot.action.dates} now carries the new rate. The owner view shows
                    the same decision and its evidence.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={snapshot.id}
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-3 sm:flex-row sm:items-start"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-primary">
                      {snapshot.action.title}
                    </p>
                    <span className="rounded-full bg-brand-primary px-2 py-0.5 text-[11px] font-semibold text-brand-secondary ring-1 ring-brand ring-inset">
                      {snapshot.action.dates}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-tertiary">
                    {snapshot.action.body}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => setAccepted(true)}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-brand-solid px-3 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-brand-solid_hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    <Check className="size-4" aria-hidden />
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => setIndex((i) => (i + 1) % SNAPSHOTS.length)}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-secondary ring-1 ring-primary ring-inset transition-colors hover:bg-primary_hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    <ClockRewind className="size-4 text-fg-quaternary" aria-hidden />
                    Snooze
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function Kpi({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3 sm:px-5">
      <dt className="text-[11px] font-medium tracking-wide text-tertiary uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-xl font-semibold tracking-tight text-primary tabular-nums sm:text-display-xs">
        {children}
      </dd>
    </div>
  );
}

function Legend({
  swatch,
  label,
  dashed,
}: {
  swatch: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          "inline-block h-0.5 w-3.5 rounded-full",
          swatch,
          dashed && "[background:repeating-linear-gradient(90deg,currentColor_0_4px,transparent_4px_7px)] text-fg-success-primary"
        )}
      />
      {label}
    </span>
  );
}
