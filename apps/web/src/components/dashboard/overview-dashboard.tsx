"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Settings,
  Download,
  RefreshCw,
  MapPin,
  Clock,
  Pencil,
  Lock,
  AlertTriangle,
  Calendar as CalendarIcon,
  Megaphone,
} from "lucide-react";
import Link from "next/link";
import { getOverviewData } from "@/services/dashboard-service";
import { getDashboardData } from "@/actions/dashboard";
import { SevenDayCards } from "./seven-day-cards";
import { OverviewGraph } from "./overview-graph";
import { CompetitorCards } from "./competitor-cards";
import { CompetitorDetailModal } from "./competitor-detail-modal";
import { RateMatrix } from "./rate-matrix";
import { MatrixChart } from "./matrix-chart";
import { CalendarView } from "./calendar-view";
import { DayDetailModal } from "./day-detail-modal";
import { SummaryCards } from "./summary-cards";
import { toast } from "@/hooks/use-toast";
import { useSessionStorage } from "@/hooks/use-session-storage";
import type { OverviewData, DashboardDay } from "@hotel-pricing/shared";
import { formatCurrency } from "@hotel-pricing/shared";

interface OverviewDashboardProps {
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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function toDateString(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function OverviewDashboard({
  hotel,
  competitors,
  isAnalyst,
}: OverviewDashboardProps) {
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [advancedDays, setAdvancedDays] = useState<DashboardDay[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [advancedLoading, setAdvancedLoading] = useState(false);
  const [graphRange, setGraphRange] = useSessionStorage(
    "trosky:graphRange",
    14
  );
  const [advancedRange, setAdvancedRange] = useSessionStorage(
    "trosky:advancedRange",
    "14"
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(
    null
  );
  const [view, setView] = useState<string>("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadOverviewData = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const data = await getOverviewData(hotel.id, graphRange);
      setOverviewData(data);
    } catch (e) {
      console.error("Failed to load overview:", e);
    } finally {
      setOverviewLoading(false);
    }
  }, [hotel.id, graphRange]);

  const loadAdvancedData = useCallback(async () => {
    setAdvancedLoading(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setDate(end.getDate() + parseInt(advancedRange) - 1);
    try {
      const data = await getDashboardData(
        hotel.id,
        toDateString(today),
        toDateString(end)
      );
      setAdvancedDays(data);
    } catch (e) {
      console.error("Failed to load advanced data:", e);
    } finally {
      setAdvancedLoading(false);
    }
  }, [hotel.id, advancedRange]);

  useEffect(() => {
    loadOverviewData();
  }, [loadOverviewData]);

  useEffect(() => {
    if (view === "matrix" || view === "calendar") {
      loadAdvancedData();
    }
  }, [view, loadAdvancedData]);

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      const res = await fetch(
        `/api/v1/dashboard/${hotel.id}/refresh`,
        { method: "POST" }
      );
      if (res.ok) {
        toast({ title: "Refresh started", description: "Data will update shortly." });
        setTimeout(() => loadOverviewData(), 3000);
      } else {
        toast({
          title: "Refresh failed",
          description: "Could not start data refresh. Showing last available data.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Refresh failed",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  }

  function handleExportCSV() {
    if (advancedDays.length === 0) return;
    const headers = [
      "Date",
      "Our Rate",
      "Recommended",
      "Comp Avg",
      "Occupancy %",
      "Occ LY %",
      ...competitors.map((c) => c.name),
    ];
    const rows = advancedDays.map((d) => [
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
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join(
      "\n"
    );
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rate-matrix-${hotel.name.replace(/\s+/g, "-")}-${toDateString(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const todayData = advancedDays[0] || null;

  return (
    <div className="space-y-6">
      {/* Hotel Identity Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          {!isAnalyst && (
            <p className="text-xs text-muted-foreground mb-1">
              Welcome to your property dashboard
            </p>
          )}
          <h1 className="text-2xl font-bold">{hotel.name}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {overviewData?.hotel.city && (
              <Badge variant="secondary" className="text-xs gap-1">
                <MapPin className="h-3 w-3" />
                {overviewData.hotel.city}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {hotel.roomCount} rooms
            </span>
            {overviewData?.hotel.lastUpdated && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Updated {timeAgo(overviewData.hotel.lastUpdated)}
              </span>
            )}
            {overviewData?.hotel.isStale && (
              <Badge variant="destructive" className="text-[10px] gap-1">
                <AlertTriangle className="h-3 w-3" />
                Stale
              </Badge>
            )}
            {!isAnalyst && (
              <Badge variant="outline" className="text-[10px] gap-1">
                <Lock className="h-3 w-3" />
                Read Only
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isAnalyst && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                asChild
              >
                <Link href={`/hotels/${hotel.id}/settings`}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Alerts */}
      {overviewData?.alerts && (
        <div className="flex gap-2 flex-wrap">
          {overviewData.alerts.eventCount > 0 && (
            <Badge variant="warning" className="text-xs gap-1">
              <CalendarIcon className="h-3 w-3" />
              {overviewData.alerts.eventCount} event
              {overviewData.alerts.eventCount > 1 ? "s" : ""} today
            </Badge>
          )}
          {overviewData.alerts.activePromotions > 0 && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Megaphone className="h-3 w-3" />
              {overviewData.alerts.activePromotions} active promotion
              {overviewData.alerts.activePromotions > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      )}

      {/* Tabbed Views */}
      <Tabs value={view} onValueChange={setView}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="matrix">Matrix</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
          </TabsList>

          {(view === "matrix" || view === "calendar") && (
            <div className="flex items-center gap-2">
              <select
                value={advancedRange}
                onChange={(e) => setAdvancedRange(e.target.value)}
                className="h-8 rounded-md border bg-background px-2 text-xs"
              >
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
              </select>
              {isAnalyst && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={handleExportCSV}
                >
                  <Download className="h-3.5 w-3.5" />
                  CSV
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          <SevenDayCards
            rates={overviewData?.sevenDayRates || []}
            loading={overviewLoading}
            onDateClick={setSelectedDate}
          />

          <OverviewGraph
            graphData={
              overviewData?.graphData || {
                dates: [],
                yourHotel: [],
                competitors: [],
                compAvg: [],
                recommended: [],
                occupancy: [],
              }
            }
            loading={overviewLoading}
            graphRange={graphRange}
            onRangeChange={setGraphRange}
            onDateClick={setSelectedDate}
          />

          <CompetitorCards
            competitors={overviewData?.competitorCards || []}
            loading={overviewLoading}
            isAnalyst={isAnalyst}
            hotelId={hotel.id}
            onCompetitorClick={setSelectedCompetitor}
          />
        </TabsContent>

        {/* Matrix Tab */}
        <TabsContent value="matrix" className="space-y-6 mt-4">
          {advancedLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : (
            <>
              <SummaryCards data={todayData} roomCount={hotel.roomCount} />
              <RateMatrix
                days={advancedDays}
                competitors={competitors}
                onCellClick={setSelectedDate}
              />
              <MatrixChart days={advancedDays} />
            </>
          )}
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-6 mt-4">
          {advancedLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
          ) : (
            <>
              <SummaryCards data={todayData} roomCount={hotel.roomCount} />
              <CalendarView
                days={advancedDays}
                onDayClick={setSelectedDate}
              />
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Day Detail Modal */}
      {selectedDate && (
        <DayDetailModal
          hotelId={hotel.id}
          date={selectedDate}
          data={
            advancedDays.find((d) => d.date === selectedDate) ||
            null
          }
          hotel={hotel}
          isAnalyst={isAnalyst}
          onClose={() => setSelectedDate(null)}
          onRefresh={() => {
            loadOverviewData();
            if (view !== "overview") loadAdvancedData();
          }}
        />
      )}

      {/* Competitor Detail Modal */}
      {selectedCompetitor && overviewData && (
        <CompetitorDetailModal
          competitorId={selectedCompetitor}
          hotelId={hotel.id}
          competitor={
            overviewData.competitorCards.find(
              (c) => c.id === selectedCompetitor
            ) || null
          }
          graphData={overviewData.graphData}
          isAnalyst={isAnalyst}
          onClose={() => setSelectedCompetitor(null)}
          onRefresh={loadOverviewData}
        />
      )}
    </div>
  );
}
