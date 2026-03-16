"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

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
  const [hotelId, setHotelId] = useState(initialHotelId || "");

  const chartData = occupancy.map((o) => {
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
  });

  const ourADR = ourRate ? ourRate / 100 : null;
  const compADR = compAvgRate ? compAvgRate / 100 : null;
  const adrIndex = ourADR && compADR ? Math.round((ourADR / compADR) * 100) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pace / OTB Dashboard</h1>
          <p className="text-muted-foreground">Track booking pace against last year</p>
        </div>
        <Select value={hotelId} onValueChange={setHotelId}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select hotel" />
          </SelectTrigger>
          <SelectContent>
            {hotels.map((h) => (
              <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Our ADR</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{ourADR ? `$${ourADR.toFixed(0)}` : "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Comp Avg ADR</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{compADR ? `$${compADR.toFixed(0)}` : "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">ADR Index</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{adrIndex ?? "—"}</p>
            {adrIndex && (
              <Badge variant={adrIndex >= 100 ? "success" : "warning"} className="mt-1">
                {adrIndex >= 100 ? "Above market" : "Below market"}
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>OTB Rooms: This Year vs Last Year</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0]?.payload;
                    return (
                      <div className="bg-white border rounded-lg shadow-lg p-3 text-xs space-y-1">
                        <p className="font-semibold">{label}</p>
                        <p className="text-blue-600">OTB: {data?.otbRooms ?? "—"} rooms</p>
                        <p className="text-slate-500">OTB LY: {data?.otbLyRooms ?? "—"} rooms</p>
                        {data?.pace !== null && (
                          <p className={data.pace >= 0 ? "text-emerald-600" : "text-red-500"}>
                            Pace: {data.pace >= 0 ? "+" : ""}{data.pace}%
                          </p>
                        )}
                      </div>
                    );
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="otbRooms" fill="#2563eb" name="OTB Rooms" barSize={12} />
                <Bar dataKey="otbLyRooms" fill="#94a3b8" name="OTB LY Rooms" barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No OTB data available. Enter occupancy data first.
            </div>
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
                      <td className={`px-4 py-2 text-right font-medium ${d.pace !== null ? (d.pace >= 0 ? "text-emerald-600" : "text-red-500") : ""}`}>
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
    </div>
  );
}
