"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { TroskyPageHeader } from "@/components/trosky/trosky-page-header";
import { TroskyMetricCard } from "@/components/trosky/trosky-metric-card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { chartColors } from "@/lib/chart-colors";
import { formatCurrency } from "@hotel-pricing/shared";
import { Building2, DollarSign, Scale, TrendingUp } from "lucide-react";

interface PaceData {
  date: string;
  otbRooms: number | null;
  otbLyRooms: number | null;
  occPercent: number | null;
  occLyPercent: number | null;
}

interface PaceDashboardProps {
  hotels: { id: string; name: string; roomCount: number }[];
  initialHotelId: string | null;
  occupancy: PaceData[];
  ourRate: number | null;
  compAvgRate: number | null;
}

export function PaceDashboard({ hotels, initialHotelId, occupancy, ourRate, compAvgRate }: PaceDashboardProps) {
  const router = useRouter();
  const hotelId = initialHotelId || "";
  const hotelName = hotels.find((h) => h.id === hotelId)?.name;

  function handleHotelChange(id: string) {
    if (id !== hotelId) router.push(`/pace?hotelId=${id}`);
  }

  const chartData = useMemo(
    () =>
      occupancy.map((o) => {
        const pace = o.otbRooms !== null && o.otbLyRooms !== null
          ? ((o.otbRooms - o.otbLyRooms) / Math.max(o.otbLyRooms, 1)) * 100
          : null;
        const d = new Date(o.date + "T12:00:00Z");
        return {
          date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
          otbRooms: o.otbRooms,
          otbLyRooms: o.otbLyRooms,
          pace: pace ? Math.round(pace * 10) / 10 : null,
        };
      }),
    [occupancy]
  );

  const adrIndex = ourRate && compAvgRate ? Math.round((ourRate / compAvgRate) * 100) : null;

  return (
    <div className="space-y-6">
      <TroskyPageHeader
        eyebrow="Booking pace"
        title="Pace / OTB"
        description={
          hotelName
            ? `On-the-books rooms versus last year for ${hotelName}.`
            : "Track booking pace against last year."
        }
        actions={
          <Select value={hotelId} onValueChange={handleHotelChange}>
            <SelectTrigger className="w-full sm:w-[260px]" aria-label="Select hotel">
              <SelectValue placeholder="Select hotel" />
            </SelectTrigger>
            <SelectContent>
              {hotels.map((h) => (
                <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {hotels.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No active hotels available"
          description="Pace data will appear once an active hotel is assigned."
        />
      ) : (
        <>

      <div className="grid gap-4 md:grid-cols-3">
        <TroskyMetricCard
          label="Our ADR"
          icon={DollarSign}
          value={ourRate ? formatCurrency(ourRate) : "—"}
          hint="Today's scraped rate"
        />
        <TroskyMetricCard
          label="Comp Avg ADR"
          icon={Scale}
          value={compAvgRate ? formatCurrency(compAvgRate) : "—"}
          hint="Weighted across your comp set"
        />
        <TroskyMetricCard
          label="ADR Index"
          icon={TrendingUp}
          value={adrIndex ?? "—"}
          hint={adrIndex ? "Our rate as % of comp average" : "Needs today's rates"}
          badge={
            adrIndex
              ? {
                  text: adrIndex >= 100 ? "Above market" : "Below market",
                  variant: adrIndex >= 100 ? "success" : "warning",
                }
              : undefined
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>OTB Rooms: This Year vs Last Year</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: chartColors.axis }} />
                <YAxis tick={{ fontSize: 11, fill: chartColors.axis }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0]?.payload;
                    return (
                      <div className="bg-popover text-popover-foreground border rounded-lg shadow-lg p-3 text-xs space-y-1">
                        <p className="font-semibold">{label}</p>
                        <p className="text-trosky-red">OTB: {data?.otbRooms ?? "—"} rooms</p>
                        <p className="text-muted-foreground">OTB LY: {data?.otbLyRooms ?? "—"} rooms</p>
                        {data?.pace !== null && (
                          <p className={data.pace >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}>
                            Pace: {data.pace >= 0 ? "+" : ""}{data.pace}%
                          </p>
                        )}
                      </div>
                    );
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="otbRooms" fill={chartColors.primary} name="OTB Rooms" barSize={12} />
                <Bar dataKey="otbLyRooms" fill={chartColors.comparison} name="OTB LY Rooms" barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              className="border-0 bg-transparent py-12"
              title="No OTB data available"
              description="Enter occupancy data first — the pace chart builds from rooms on books."
            />
          )}
        </CardContent>
      </Card>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pace Detail</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-right">OTB Rooms</th>
                    <th className="px-4 py-2 text-right">OTB LY</th>
                    <th className="px-4 py-2 text-right">Pace %</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((d) => (
                    <tr key={d.date} className="border-b">
                      <td className="px-4 py-2">{d.date}</td>
                      <td className="px-4 py-2 text-right font-medium">{d.otbRooms ?? "—"}</td>
                      <td className="px-4 py-2 text-right text-muted-foreground">{d.otbLyRooms ?? "—"}</td>
                      <td className={`px-4 py-2 text-right font-medium ${d.pace !== null ? (d.pace >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive") : ""}`}>
                        {d.pace !== null ? `${d.pace >= 0 ? "+" : ""}${d.pace}%` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
        </>
      )}
    </div>
  );
}
