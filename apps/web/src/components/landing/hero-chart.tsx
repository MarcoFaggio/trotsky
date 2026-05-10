"use client";

import { useState, useMemo } from "react";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useChartThemeColors } from "./use-chart-theme-colors";

/**
 * Interactive Competitive Rate Comparison — landing preview.
 * Gradient bars + soft shadows for depth; solid lines (no dashed strokes).
 */
const FULL_MOCK_DATA = [
  { dateLabel: "Mar 18", "Your Hotel": 11200, "Comp Avg": 10800, Recommended: 11500, Occupancy: 72 },
  { dateLabel: "Mar 19", "Your Hotel": 11600, "Comp Avg": 11000, Recommended: 11800, Occupancy: 68 },
  { dateLabel: "Mar 20", "Your Hotel": 12000, "Comp Avg": 11400, Recommended: 12200, Occupancy: 75 },
  { dateLabel: "Mar 21", "Your Hotel": 12400, "Comp Avg": 11800, Recommended: 12600, Occupancy: 78 },
  { dateLabel: "Mar 22", "Your Hotel": 12800, "Comp Avg": 12000, Recommended: 13000, Occupancy: 82 },
  { dateLabel: "Mar 23", "Your Hotel": 13200, "Comp Avg": 12400, Recommended: 13400, Occupancy: 85 },
  { dateLabel: "Mar 24", "Your Hotel": 13000, "Comp Avg": 12200, Recommended: 13200, Occupancy: 80 },
  { dateLabel: "Mar 25", "Your Hotel": 12600, "Comp Avg": 12000, Recommended: 12800, Occupancy: 76 },
  { dateLabel: "Mar 26", "Your Hotel": 12400, "Comp Avg": 11800, Recommended: 12600, Occupancy: 74 },
  { dateLabel: "Mar 27", "Your Hotel": 12200, "Comp Avg": 11600, Recommended: 12400, Occupancy: 70 },
  { dateLabel: "Mar 28", "Your Hotel": 12000, "Comp Avg": 11500, Recommended: 12200, Occupancy: 72 },
  { dateLabel: "Mar 29", "Your Hotel": 11800, "Comp Avg": 11400, Recommended: 12000, Occupancy: 68 },
  { dateLabel: "Mar 30", "Your Hotel": 11600, "Comp Avg": 11200, Recommended: 11800, Occupancy: 65 },
  { dateLabel: "Mar 31", "Your Hotel": 11400, "Comp Avg": 11000, Recommended: 11600, Occupancy: 62 },
];

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length || !label) return null;
  return (
    <div className="rounded-xl border border-border/80 bg-popover/95 px-3 py-2.5 text-xs shadow-xl backdrop-blur-md">
      <p className="mb-2 font-semibold text-popover-foreground">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}</span>
          </div>
          <span className="font-medium tabular-nums text-popover-foreground">
            {entry.name === "Occupancy"
              ? `${Math.round(entry.value)}%`
              : `$${Math.round(entry.value / 100)}`}
          </span>
        </div>
      ))}
    </div>
  );
}

const RANGES = [7, 14, 30] as const;

const ANIM_MS = 1100;

export function HeroChart() {
  const [graphRange, setGraphRange] = useState<7 | 14 | 30>(14);
  const c = useChartThemeColors();

  const chartData = useMemo(
    () => FULL_MOCK_DATA.slice(-graphRange),
    [graphRange]
  );

  const barSize = graphRange > 14 ? 7 : 12;

  const uid = useMemo(() => `hc-${Math.random().toString(36).slice(2, 9)}`, []);

  return (
    <div
      className="rounded-2xl border border-border/60 bg-gradient-to-b from-card via-card to-muted/40 p-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] dark:border-white/[0.08] dark:from-card dark:via-card dark:to-muted/25 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] sm:p-4"
      key={c.tick}
    >
      <div className="mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold leading-tight text-foreground sm:text-base">
          Competitive Rate Comparison
        </h3>
        <div
          className="flex shrink-0 rounded-lg border border-border/80 bg-muted/50 p-0.5 dark:bg-muted/30"
          role="tablist"
          aria-label="Date range"
        >
          {RANGES.map((days) => (
            <button
              key={days}
              type="button"
              role="tab"
              aria-selected={graphRange === days}
              onClick={() => setGraphRange(days)}
              className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all sm:px-3 ${
                graphRange === days
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                  : "text-muted-foreground hover:bg-background/80 hover:text-foreground"
              }`}
            >
              {days} days
            </button>
          ))}
        </div>
      </div>

      <div className="h-[200px] w-full sm:h-[248px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 8, right: 6, left: 0, bottom: 4 }}
          >
            <defs>
              <linearGradient id={`${uid}-occ`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={c.occupancy} stopOpacity={0.95} />
                <stop offset="55%" stopColor={c.occupancy} stopOpacity={0.72} />
                <stop offset="100%" stopColor={c.occupancy} stopOpacity={0.38} />
              </linearGradient>
              <filter id={`${uid}-barShadow`} x="-20%" y="-10%" width="140%" height="130%">
                <feDropShadow dx="0" dy="3" stdDeviation="2" floodOpacity="0.35" />
              </filter>
              <filter id={`${uid}-glowPrimary`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id={`${uid}-glowRec`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.5" result="b2" />
                <feMerge>
                  <feMergeNode in="b2" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <CartesianGrid
              stroke={c.grid}
              strokeOpacity={0.38}
              vertical={false}
            />

            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 10, fill: c.axis }}
              tickLine={false}
              axisLine={{ stroke: c.grid, strokeOpacity: 0.5 }}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="price"
              tick={{ fontSize: 10, fill: c.axis }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${Math.round(v / 100)}`}
              width={40}
            />
            <YAxis
              yAxisId="occ"
              orientation="right"
              tick={{ fontSize: 10, fill: c.axis }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
              width={30}
              domain={[0, 100]}
            />

            <Tooltip content={<ChartTooltip />} cursor={{ stroke: c.grid, strokeOpacity: 0.5 }} />

            <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} iconSize={8} />

            <Bar
              yAxisId="occ"
              dataKey="Occupancy"
              fill={`url(#${uid}-occ)`}
              radius={[4, 4, 0, 0]}
              barSize={barSize}
              name="Occupancy"
              animationDuration={ANIM_MS}
              animationEasing="ease-out"
              filter={`url(#${uid}-barShadow)`}
            />

            <Line
              yAxisId="price"
              type="monotone"
              dataKey="Your Hotel"
              stroke={c.primary}
              strokeWidth={2.75}
              dot={{ r: 3, fill: c.primary, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              connectNulls
              name="Your Hotel"
              animationDuration={ANIM_MS + 200}
              filter={`url(#${uid}-glowPrimary)`}
            />

            <Line
              yAxisId="price"
              type="monotone"
              dataKey="Comp Avg"
              stroke={c.comparison}
              strokeWidth={2}
              strokeOpacity={0.92}
              dot={{ r: 2, fill: c.comparison, strokeWidth: 0 }}
              connectNulls
              name="Comp avg"
              animationDuration={ANIM_MS + 150}
            />

            <Line
              yAxisId="price"
              type="monotone"
              dataKey="Recommended"
              stroke={c.recommended}
              strokeWidth={2.25}
              dot={{ r: 2.5, fill: c.recommended, strokeWidth: 0 }}
              connectNulls
              name="AI recommended"
              animationDuration={ANIM_MS + 300}
              filter={`url(#${uid}-glowRec)`}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-2 text-center text-[10px] leading-snug text-muted-foreground sm:text-[11px]">
        Same chart as your dashboard. Switch range for 7, 14, or 30 days.
      </p>
    </div>
  );
}
