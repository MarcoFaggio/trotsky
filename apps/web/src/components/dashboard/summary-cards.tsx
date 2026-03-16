"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  Target,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import type { DashboardDay } from "@hotel-pricing/shared";

interface SummaryCardsProps {
  data: DashboardDay | null;
  roomCount: number;
}

function fmt(cents: number | null): string {
  if (cents === null) return "—";
  return `$${Math.round(cents / 100)}`;
}

export function SummaryCards({ data, roomCount }: SummaryCardsProps) {
  if (!data) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No data available for today
      </div>
    );
  }

  const occupiedRooms = data.occPercent
    ? Math.round((data.occPercent / 100) * roomCount)
    : null;
  const revenue =
    data.ourRate && occupiedRooms
      ? Math.round((data.ourRate / 100) * occupiedRooms)
      : null;

  const cards = [
    {
      title: "Today's Rate",
      value: fmt(data.ourRate),
      icon: DollarSign,
      badge: data.overrideRate ? "Override" : null,
    },
    {
      title: "Recommended",
      value: fmt(data.recommendedRate),
      icon: Target,
      sub: data.confidence ? `${Math.round(data.confidence * 100)}% conf` : undefined,
    },
    {
      title: "Occupancy",
      value: data.occPercent ? `${data.occPercent.toFixed(0)}%` : "—",
      icon: Users,
      sub: occupiedRooms ? `${occupiedRooms} rooms` : undefined,
    },
    {
      title: "LY Occupancy",
      value: data.occLyPercent ? `${data.occLyPercent.toFixed(0)}%` : "—",
      icon: Calendar,
    },
    {
      title: "Comp Avg",
      value: fmt(data.compAvgRate),
      icon: BarChart3,
    },
    {
      title: "Est. ADR",
      value: fmt(data.ourRate),
      icon: TrendingUp,
    },
    {
      title: "Est. Revenue",
      value: revenue ? `$${revenue.toLocaleString()}` : "—",
      icon: DollarSign,
    },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-7">
      {cards.map((card) => (
        <Card key={card.title} className="relative">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl font-bold">{card.value}</div>
            {card.sub && (
              <p className="text-xs text-muted-foreground">{card.sub}</p>
            )}
            {card.badge && (
              <Badge variant="warning" className="absolute top-2 right-2 text-[10px]">
                {card.badge}
              </Badge>
            )}
          </CardContent>
        </Card>
      ))}
      {(data.hasEvent || data.hasPromotion) && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-amber-700">Alerts</CardTitle>
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-1">
              {data.hasEvent && (
                <Badge variant="warning" className="text-xs">Event</Badge>
              )}
              {data.hasPromotion && (
                <Badge variant="secondary" className="text-xs ml-1">Promo</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
