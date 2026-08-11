"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowUpRight, TrendDown01, TrendUp01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { cx } from "@/utils/cx";

type DayPoint = {
  label: string;
  yours: number;
  comp: number;
  recommended: number;
};

const SERIES: DayPoint[] = [
  { label: "Mon", yours: 128, comp: 118, recommended: 132 },
  { label: "Tue", yours: 131, comp: 120, recommended: 135 },
  { label: "Wed", yours: 136, comp: 124, recommended: 140 },
  { label: "Thu", yours: 142, comp: 128, recommended: 146 },
  { label: "Fri", yours: 148, comp: 132, recommended: 152 },
  { label: "Sat", yours: 155, comp: 138, recommended: 158 },
  { label: "Sun", yours: 149, comp: 134, recommended: 154 },
  { label: "Mon", yours: 140, comp: 126, recommended: 145 },
  { label: "Tue", yours: 136, comp: 122, recommended: 141 },
  { label: "Wed", yours: 133, comp: 120, recommended: 138 },
  { label: "Thu", yours: 130, comp: 118, recommended: 136 },
  { label: "Fri", yours: 138, comp: 124, recommended: 142 },
  { label: "Sat", yours: 146, comp: 130, recommended: 150 },
  { label: "Sun", yours: 141, comp: 127, recommended: 145 },
];

const RANGES = [
  { days: 7 as const, label: "7 days" },
  { days: 14 as const, label: "14 days" },
];

function buildPath(points: number[], width: number, height: number, min: number, max: number) {
  const span = Math.max(max - min, 1);
  return points
    .map((value, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * width;
      const y = height - ((value - min) / span) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function AnimatedCurrency({ value, prefix = "$" }: { value: number; prefix?: string }) {
  const reduced = useReducedMotion();
  const motionValue = useMotionValue(value);
  const spring = useSpring(motionValue, { stiffness: 120, damping: 22, mass: 0.6 });
  const display = useTransform(spring, (latest) => `${prefix}${Math.round(latest)}`);
  const [text, setText] = useState(`${prefix}${value}`);

  useEffect(() => {
    if (reduced) {
      setText(`${prefix}${value}`);
      motionValue.set(value);
      return;
    }
    motionValue.set(value);
  }, [value, prefix, reduced, motionValue]);

  useEffect(() => {
    return display.on("change", (v) => setText(v));
  }, [display]);

  return <span className="tabular-nums">{text}</span>;
}

function RateChart({ data, chartKey }: { data: DayPoint[]; chartKey: string }) {
  const reduced = useReducedMotion();
  const width = 560;
  const height = 168;
  const padY = 10;
  const chartH = height - padY * 2;

  const values = data.flatMap((d) => [d.yours, d.comp, d.recommended]);
  const min = Math.min(...values) - 8;
  const max = Math.max(...values) + 8;

  const toY = (value: number) => {
    const span = Math.max(max - min, 1);
    return chartH - ((value - min) / span) * chartH;
  };

  const yoursPath = buildPath(
    data.map((d) => d.yours),
    width,
    chartH,
    min,
    max
  );
  const compPath = buildPath(
    data.map((d) => d.comp),
    width,
    chartH,
    min,
    max
  );
  const recPath = buildPath(
    data.map((d) => d.recommended),
    width,
    chartH,
    min,
    max
  );

  const last = data[data.length - 1];
  const lastY = toY(last.yours);

  const draw = reduced
    ? undefined
    : {
        initial: { pathLength: 0, opacity: 0.3 },
        animate: { pathLength: 1, opacity: 1 },
      };

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[168px] w-full overflow-visible"
        role="img"
        aria-label="Your hotel rate versus competitor average and recommended rate"
      >
        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1="0"
            x2={width}
            y1={padY + chartH * t}
            y2={padY + chartH * t}
            stroke="currentColor"
            className="text-border-secondary"
            strokeWidth="1"
            strokeDasharray="4 6"
            opacity="0.9"
          />
        ))}

        <g transform={`translate(0 ${padY})`}>
          <motion.path
            key={`comp-${chartKey}`}
            d={compPath}
            fill="none"
            stroke="currentColor"
            className="text-fg-quaternary"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={draw?.initial}
            animate={draw?.animate}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
          />
          <motion.path
            key={`rec-${chartKey}`}
            d={recPath}
            fill="none"
            stroke="currentColor"
            className="text-fg-success-primary"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.45 }}
            style={{ strokeDasharray: "5 5" }}
          />
          <motion.path
            key={`yours-${chartKey}`}
            d={yoursPath}
            fill="none"
            stroke="currentColor"
            className="text-fg-brand-primary"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={draw?.initial}
            animate={draw?.animate}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.18 }}
          />

          <motion.g
            key={`dot-${chartKey}`}
            initial={reduced ? false : { opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: reduced ? 0 : 0.95, type: "spring", stiffness: 280, damping: 18 }}
          >
            {!reduced && (
              <motion.circle
                cx={width}
                cy={lastY}
                r="10"
                fill="currentColor"
                className="text-fg-brand-primary"
                initial={{ opacity: 0.35, scale: 0.6 }}
                animate={{ opacity: 0, scale: 1.8 }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
              />
            )}
            <circle
              cx={width}
              cy={lastY}
              r="4.5"
              fill="currentColor"
              className="text-fg-brand-primary"
              stroke="var(--color-bg-primary)"
              strokeWidth="2.5"
            />
          </motion.g>
        </g>
      </svg>

      <motion.div
        key={`legend-${chartKey}`}
        initial={reduced ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduced ? 0 : 0.55, duration: 0.35 }}
        className="mt-3 flex items-center justify-between gap-3 text-xs text-tertiary"
      >
        <span>{data[0]?.label}</span>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-fg-brand-primary" />
            Your rate
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-fg-quaternary" />
            Comp avg
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-fg-success-primary" />
            Recommended
          </span>
        </div>
        <span>{data[data.length - 1]?.label}</span>
      </motion.div>
    </div>
  );
}

export function HeroChart() {
  const reduced = useReducedMotion();
  const [range, setRange] = useState<7 | 14>(7);

  const data = useMemo(() => SERIES.slice(-range), [range]);
  const latest = data[data.length - 1];
  const delta = latest.yours - latest.comp;
  const vsRecommended = latest.recommended - latest.yours;
  const chartKey = `${range}`;

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 18, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-2xl bg-primary shadow-xl ring-1 ring-secondary"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-secondary px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-md font-semibold text-primary">Harbour View Hotel</p>
            <span className="relative inline-flex">
              {!reduced && (
                <span className="absolute inset-0 animate-ping rounded-full bg-utility-success-200 opacity-40" />
              )}
              <Badge type="pill-color" color="success" size="sm">
                Live
              </Badge>
            </span>
          </div>
          <p className="mt-1 text-sm text-tertiary">Rate vs market · next stay dates</p>
        </div>

        <div
          className="flex gap-0.5 rounded-lg bg-secondary_alt p-1 ring-1 ring-secondary ring-inset"
          role="tablist"
          aria-label="Date range"
        >
          {RANGES.map((option) => (
            <button
              key={option.days}
              type="button"
              role="tab"
              aria-selected={range === option.days}
              onClick={() => setRange(option.days)}
              className={cx(
                "rounded-md px-3 py-1.5 text-sm font-semibold transition-colors duration-200",
                range === option.days
                  ? "bg-primary text-secondary shadow-xs ring-1 ring-primary ring-inset"
                  : "text-tertiary hover:text-secondary"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-secondary border-b border-secondary">
        {[
          { label: "Your ADR", node: <AnimatedCurrency value={latest.yours} /> },
          { label: "Comp avg", node: <AnimatedCurrency value={latest.comp} /> },
          {
            label: "Vs market",
            node: (
              <span
                className={cx(
                  "inline-flex items-center gap-1",
                  delta >= 0 ? "text-success-primary" : "text-error-primary"
                )}
              >
                {delta >= 0 ? (
                  <TrendUp01 className="size-4" />
                ) : (
                  <TrendDown01 className="size-4" />
                )}
                <AnimatedCurrency value={Math.abs(delta)} prefix={delta >= 0 ? "+$" : "-$"} />
              </span>
            ),
          },
        ].map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduced ? 0 : 0.12 + index * 0.06, duration: 0.35 }}
            className="px-4 py-4 sm:px-5"
          >
            <p className="text-xs font-medium text-tertiary">{metric.label}</p>
            <p className="mt-1 text-display-xs font-semibold tracking-tight text-primary">
              {metric.node}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="px-5 py-5 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={chartKey}
            initial={reduced ? false : { opacity: 0.4 }}
            animate={{ opacity: 1 }}
            exit={reduced ? undefined : { opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <RateChart data={data} chartKey={chartKey} />
          </motion.div>
        </AnimatePresence>
      </div>

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduced ? 0 : 0.45, duration: 0.4 }}
        whileHover={reduced ? undefined : { backgroundColor: "var(--color-bg-secondary)" }}
        className="border-t border-secondary bg-secondary_alt/60 px-5 py-4 transition-colors sm:px-6"
      >
        <div className="flex items-start gap-3">
          <motion.div
            animate={reduced ? undefined : { y: [0, -2, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-solid text-white"
          >
            <ArrowUpRight className="size-4" />
          </motion.div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-primary">
                Raise Fri–Sat by ${vsRecommended}
              </p>
              <Badge type="pill-color" color="brand" size="sm">
                Recommended
              </Badge>
            </div>
            <p className="mt-1 text-sm text-tertiary">
              Demand is firm and you sit below the recommended band while comps trail your rate.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
