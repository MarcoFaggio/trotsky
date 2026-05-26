"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RevenueCommandCentreRatePoint } from "@hotel-pricing/shared";
import { chartColors } from "@/lib/chart-colors";
import { troskySurfaces } from "./trosky-primitives";

interface RateVsCompChartProps {
  data: RevenueCommandCentreRatePoint[];
  hotelLabel?: string;
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-xs text-card-foreground shadow-md">
      <p className="mb-2 font-semibold text-foreground">{formatShortDate(label)}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex justify-between gap-4 py-0.5">
          <span className="text-muted-foreground">{entry.name}</span>
          <span className="font-medium tabular-nums text-foreground">
            {entry.value != null ? `$${Math.round(entry.value / 100)}` : "—"}
          </span>
        </div>
      ))}
    </div>
  );
}

export function RateVsCompChart({ data, hotelLabel }: RateVsCompChartProps) {
  const chartData = useMemo(
    () =>
      data.map((point) => ({
        date: point.date,
        dateLabel: formatShortDate(point.date),
        "Your rate": point.yourRateCents,
        "Comp median": point.compMedianCents,
      })),
    [data]
  );

  const hasData = chartData.some(
    (p) => p["Your rate"] != null || p["Comp median"] != null
  );

  return (
    <div className={`${troskySurfaces.card} min-w-0 p-4 sm:p-5`}>
      <div className="mb-3 min-w-0">
        <h3 className="text-sm font-semibold text-trosky-ink">Rate vs comp median</h3>
        <p className="text-xs text-trosky-muted">
          {hotelLabel
            ? `14-day view — ${hotelLabel}`
            : "14-day weighted comp median vs your rate"}
        </p>
      </div>
      {!hasData ? (
        <p className="rounded-xl border border-dashed border-border bg-muted/40 px-4 py-10 text-center text-sm leading-relaxed text-muted-foreground">
          No rate comparison data yet. Once scrapes or recommendations run, Trosky
          will show your rate against the comp median here.
        </p>
      ) : (
        <div className="h-[220px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="dateLabel"
                tick={{ fill: chartColors.axis, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: chartColors.axis, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${Math.round(v / 100)}`}
                width={44}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line
                type="monotone"
                dataKey="Your rate"
                stroke={chartColors.primary}
                strokeWidth={2}
                dot={false}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="Comp median"
                stroke={chartColors.comparison}
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
