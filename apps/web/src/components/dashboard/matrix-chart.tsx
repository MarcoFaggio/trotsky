"use client";

import { useId, useMemo } from "react";
import { useReducedMotion } from "framer-motion";
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
  ReferenceDot,
} from "recharts";
import { chartColors } from "@/lib/chart-colors";
import type { DashboardDay } from "@hotel-pricing/shared";
import { formatCurrency } from "@hotel-pricing/shared";

interface MatrixChartProps {
  days: DashboardDay[];
}

/** Chart data holds dollars; convert back to cents for the shared formatter. */
function fmtDollars(dollars: number): string {
  return formatCurrency(Math.round(dollars * 100));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function MatrixChart({ days }: MatrixChartProps) {
  const reduced = useReducedMotion();
  const rawId = useId();
  const uid = useMemo(() => `matrix-${rawId.replace(/:/g, "")}`, [rawId]);
  const chartData = useMemo(
    () =>
      days.map((d) => ({
        date: formatDate(d.date),
        fullDate: d.date,
        ourRate: d.ourRate ? d.ourRate / 100 : null,
        compAvg: d.compAvgRate ? d.compAvgRate / 100 : null,
        recommended: d.recommendedRate ? d.recommendedRate / 100 : null,
        occupancy: d.occPercent,
        hasEvent: d.hasEvent,
      })),
    [days]
  );

  const eventDots = chartData
    .filter((d) => d.hasEvent && d.ourRate)
    .map((d) => ({ x: d.date, y: d.ourRate! }));

  return (
    <div className="relative overflow-hidden rounded-lg border bg-card p-4">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary via-primary to-landing-emerald" />
      <h3 className="relative mb-4 w-fit text-sm font-medium">
        Rate Comparison & Occupancy
        <span
          className="absolute -bottom-1 left-0 h-px w-full bg-gradient-to-r from-primary/80 to-transparent"
          aria-hidden
        />
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id={`${uid}-occupancy`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColors.occupancy} stopOpacity={0.78} />
              <stop offset="62%" stopColor={chartColors.occupancy} stopOpacity={0.45} />
              <stop offset="100%" stopColor={chartColors.occupancy} stopOpacity={0.18} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={chartColors.grid} strokeOpacity={0.5} vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: chartColors.axis }}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 11, fill: chartColors.axis }}
            tickFormatter={(v) => fmtDollars(v)}
            domain={["auto", "auto"]}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 11, fill: chartColors.axis }}
            tickFormatter={(v) => `${v}%`}
            domain={[0, 100]}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const data = payload[0]?.payload;
              return (
                <div className="bg-popover text-popover-foreground border rounded-lg shadow-lg p-3 text-xs space-y-1">
                  <p className="font-semibold">{label}</p>
                  {data?.ourRate && (
                    <p className="text-primary">
                      Our Rate: <span className="font-medium">{fmtDollars(data.ourRate)}</span>
                    </p>
                  )}
                  {data?.compAvg && (
                    <p className="text-muted-foreground">
                      Comp Avg: <span className="font-medium">{fmtDollars(data.compAvg)}</span>
                    </p>
                  )}
                  {data?.recommended && (
                    <p className="text-emerald-600 dark:text-emerald-400">
                      Recommended: <span className="font-medium">{fmtDollars(data.recommended)}</span>
                    </p>
                  )}
                  {data?.occupancy !== null && data?.occupancy !== undefined && (
                    <p className="text-violet-600 dark:text-violet-300">
                      Occupancy: <span className="font-medium">{data.occupancy.toFixed(1)}%</span>
                    </p>
                  )}
                  {data?.hasEvent && (
                    <p className="font-medium text-amber-600 dark:text-amber-400">
                      Event day
                    </p>
                  )}
                </div>
              );
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11 }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="ourRate"
            stroke={chartColors.primary}
            strokeWidth={2.5}
            name="Our Rate"
            dot={{ r: 3, fill: chartColors.primary, strokeWidth: 0 }}
            connectNulls
            animationDuration={900}
            isAnimationActive={!reduced}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="compAvg"
            stroke={chartColors.comparison}
            strokeWidth={1.85}
            strokeOpacity={0.78}
            name="Comp Avg"
            dot={{ r: 2, fill: chartColors.comparison, strokeWidth: 0 }}
            connectNulls
            animationDuration={860}
            isAnimationActive={!reduced}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="recommended"
            stroke={chartColors.recommended}
            strokeWidth={2.35}
            name="Recommended"
            dot={{ r: 2.5, fill: chartColors.recommended, strokeWidth: 0 }}
            connectNulls
            animationDuration={980}
            isAnimationActive={!reduced}
          />
          <Bar
            yAxisId="right"
            dataKey="occupancy"
            fill={`url(#${uid}-occupancy)`}
            opacity={0.82}
            name="Occupancy %"
            barSize={20}
            animationDuration={820}
            animationEasing="ease-out"
            isAnimationActive={!reduced}
          />
          {eventDots.map((dot, i) => (
            <ReferenceDot
              key={i}
              yAxisId="left"
              x={dot.x}
              y={dot.y}
              r={6}
              fill={chartColors.warning}
              stroke={chartColors.surface}
              strokeWidth={2}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
