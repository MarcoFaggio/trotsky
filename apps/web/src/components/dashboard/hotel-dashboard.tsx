"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Download } from "lucide-react";
import Link from "next/link";
import { getDashboardData } from "@/actions/dashboard";
import { SummaryCards } from "./summary-cards";
import { RateMatrix } from "./rate-matrix";
import { MatrixChart } from "./matrix-chart";
import { CalendarView } from "./calendar-view";
import { DayDetailModal } from "./day-detail-modal";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardDay } from "@hotel-pricing/shared";
import { formatCurrency } from "@hotel-pricing/shared";

interface HotelDashboardProps {
  hotel: {
    id: string;
    name: string;
    roomCount: number;
    minRate: number | null;
    maxRate: number | null;
    occTarget: number | null;
  };
  competitors: { id: string; name: string; weight: number }[];
  isAnalyst: boolean;
}

function toDateString(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function HotelDashboard({ hotel, competitors, isAnalyst }: HotelDashboardProps) {
  const [days, setDays] = useState<DashboardDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("14");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [view, setView] = useState<"matrix" | "calendar">("matrix");

  const loadData = useCallback(async () => {
    setLoading(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setDate(end.getDate() + parseInt(range) - 1);
    try {
      const data = await getDashboardData(hotel.id, toDateString(today), toDateString(end));
      setDays(data);
    } catch (e) {
      console.error("Failed to load dashboard data:", e);
    } finally {
      setLoading(false);
    }
  }, [hotel.id, range]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleExportCSV() {
    if (days.length === 0) return;
    const headers = ["Date", "Our Rate", "Recommended", "Comp Avg", "Occupancy %", "Occ LY %", ...competitors.map((c) => c.name)];
    const rows = days.map((d) => [
      d.date,
      d.ourRate ? (d.ourRate / 100).toFixed(0) : "",
      d.recommendedRate ? (d.recommendedRate / 100).toFixed(0) : "",
      d.compAvgRate ? (d.compAvgRate / 100).toFixed(0) : "",
      d.occPercent?.toFixed(1) ?? "",
      d.occLyPercent?.toFixed(1) ?? "",
      ...competitors.map((c) => {
        const comp = d.competitors.find((dc) => dc.id === c.id);
        return comp?.rate ? (comp.rate / 100).toFixed(0) : "";
      }),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rate-matrix-${hotel.name.replace(/\s+/g, "-")}-${toDateString(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const todayData = days[0] || null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{hotel.name}</h1>
          <p className="text-muted-foreground">{hotel.roomCount} rooms</p>
        </div>
        <div className="flex items-center gap-2">
          {isAnalyst && (
            <Link href={`/hotels/${hotel.id}/settings`}>
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </Link>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <SummaryCards data={todayData} roomCount={hotel.roomCount} />
      )}

      <div className="flex items-center justify-between">
        <Tabs value={view} onValueChange={(v) => setView(v as "matrix" | "calendar")}>
          <TabsList>
            <TabsTrigger value="matrix">Rate Matrix</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Next 7 days</SelectItem>
              <SelectItem value="14">Next 14 days</SelectItem>
              <SelectItem value="30">Next 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-96" />
      ) : view === "matrix" ? (
        <div className="space-y-4">
          <RateMatrix
            days={days}
            competitors={competitors}
            onCellClick={(date) => setSelectedDate(date)}
          />
          <MatrixChart days={days} />
        </div>
      ) : (
        <CalendarView
          days={days}
          onDayClick={(date) => setSelectedDate(date)}
        />
      )}

      {selectedDate && (
        <DayDetailModal
          hotelId={hotel.id}
          date={selectedDate}
          data={days.find((d) => d.date === selectedDate) || null}
          hotel={hotel}
          isAnalyst={isAnalyst}
          onClose={() => setSelectedDate(null)}
          onRefresh={loadData}
        />
      )}
    </div>
  );
}
