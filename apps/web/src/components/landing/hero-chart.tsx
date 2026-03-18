"use client";

import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";

/**
 * Static mock data matching the app's Competitive Rate Comparison.
 * Prices in cents; occupancy 0–100.
 * Uses exact app colors from overview-graph.tsx: #2563eb, #16a34a, #64748b, #e2e8f0.
 */
const MOCK_CHART_DATA = [
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

const APP_COLORS = {
  yourHotel: "#2563eb",
  compAvg: "#64748b",
  recommended: "#16a34a",
  occupancyFill: "#e2e8f0",
};

export function HeroChart() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Competitive Rate Comparison</h3>
        <div className="flex rounded-md border border-slate-200 bg-slate-50 p-0.5">
          <span className="px-2 py-1 text-xs text-slate-500">7 Days</span>
          <span className="rounded bg-white px-2 py-1 text-xs font-medium text-slate-900 shadow-sm">14 Days</span>
          <span className="px-2 py-1 text-xs text-slate-500">30 Days</span>
        </div>
      </div>
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={MOCK_CHART_DATA}
            margin={{ top: 5, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 10, fill: "#64748b" }}
              tickLine={false}
            />
            <YAxis
              yAxisId="price"
              tick={{ fontSize: 10, fill: "#64748b" }}
              tickLine={false}
              tickFormatter={(v) => `$${Math.round(v / 100)}`}
              width={42}
            />
            <YAxis
              yAxisId="occ"
              orientation="right"
              tick={{ fontSize: 10, fill: "#64748b" }}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
              width={32}
              domain={[0, 100]}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} iconSize={6} />
            <Bar
              yAxisId="occ"
              dataKey="Occupancy"
              fill={APP_COLORS.occupancyFill}
              opacity={0.5}
              radius={[2, 2, 0, 0]}
              barSize={10}
              name="Occupancy"
            />
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="Your Hotel"
              stroke={APP_COLORS.yourHotel}
              strokeWidth={2}
              dot={{ r: 2.5, fill: APP_COLORS.yourHotel }}
              connectNulls
              name="Your Hotel"
            />
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="Comp Avg"
              stroke={APP_COLORS.compAvg}
              strokeWidth={1.25}
              strokeDasharray="4 4"
              dot={false}
              connectNulls
              name="Comp Avg"
            />
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="Recommended"
              stroke={APP_COLORS.recommended}
              strokeWidth={1.5}
              strokeDasharray="6 3"
              dot={false}
              connectNulls
              name="AI Recommended"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-center text-[10px] text-slate-500">
        Same chart you get in the dashboard · AI Recommended rate in green
      </p>
    </div>
  );
}
