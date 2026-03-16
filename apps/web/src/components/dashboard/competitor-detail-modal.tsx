"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Star, ExternalLink, Clock } from "lucide-react";
import { updateHotelCompetitor, removeHotelCompetitor } from "@/actions/hotels";
import { toast } from "@/hooks/use-toast";
import { weightToLabel, labelToWeight } from "@hotel-pricing/shared";
import type { CompetitorCard, OverviewGraphData, WeightLabel } from "@hotel-pricing/shared";

interface CompetitorDetailModalProps {
  competitorId: string;
  hotelId: string;
  competitor: CompetitorCard | null;
  graphData: OverviewGraphData;
  isAnalyst: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function CompetitorDetailModal({
  competitorId,
  hotelId,
  competitor,
  graphData,
  isAnalyst,
  onClose,
  onRefresh,
}: CompetitorDetailModalProps) {
  const [saving, setSaving] = useState(false);
  const [weight, setWeight] = useState<WeightLabel>(
    competitor ? weightToLabel(competitor.weight) : "Medium"
  );

  if (!competitor) return null;

  const compSeries = graphData.competitors.find(
    (c) => c.id === competitorId
  );
  const sparkData = compSeries
    ? graphData.dates.slice(0, 14).map((date, i) => ({
        date: new Date(date + "T12:00:00").toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        rate: compSeries.data[i],
        yourHotel: graphData.yourHotel[i],
      }))
    : [];

  async function handleWeightChange(label: WeightLabel) {
    setWeight(label);
    setSaving(true);
    try {
      await updateHotelCompetitor({
        hotelId,
        competitorId,
        weight: labelToWeight(label),
      });
      toast({ title: "Weight updated" });
      onRefresh();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    setSaving(true);
    try {
      await removeHotelCompetitor(hotelId, competitorId);
      toast({ title: "Competitor removed" });
      onClose();
      onRefresh();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{competitor.name}</DialogTitle>
          <DialogDescription>Competitor details and rate trend</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Rating */}
          {competitor.rating !== null && (
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.round(competitor.rating!)
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium">
                {competitor.rating.toFixed(1)}
              </span>
              {competitor.reviewCount !== null && (
                <span className="text-xs text-muted-foreground">
                  ({competitor.reviewCount} reviews)
                </span>
              )}
            </div>
          )}

          {/* Current rate */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Current Rate</p>
              <p className="text-xl font-bold">
                {competitor.currentRate
                  ? `$${Math.round(competitor.currentRate / 100)}`
                  : "—"}
              </p>
              {competitor.priceDiffPct !== null && (
                <Badge
                  variant={
                    competitor.priceDiffPct > 0 ? "destructive" : "success"
                  }
                  className="text-[10px] mt-1"
                >
                  {competitor.priceDiffPct > 0 ? "+" : ""}
                  {competitor.priceDiffPct.toFixed(1)}% vs your hotel
                </Badge>
              )}
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Source</p>
              <p className="text-sm font-medium">{competitor.source}</p>
              {competitor.listingUrl && (
                <a
                  href={competitor.listingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary flex items-center gap-1 mt-1 hover:underline"
                >
                  View listing <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {competitor.lastUpdated && (
                <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="h-2.5 w-2.5" />
                  {timeAgo(competitor.lastUpdated)}
                </p>
              )}
            </div>
          </div>

          {/* Sparkline */}
          {sparkData.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-2">Rate Trend (14 days)</p>
              <div className="h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparkData}>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 9 }}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 9 }}
                      tickLine={false}
                      tickFormatter={(v) =>
                        v ? `$${Math.round(v / 100)}` : ""
                      }
                      width={40}
                    />
                    <Tooltip
                      formatter={(val: any) =>
                        val ? `$${Math.round(val / 100)}` : "—"
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      stroke="#64748b"
                      strokeWidth={2}
                      dot={false}
                      name={competitor.name}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="yourHotel"
                      stroke="#2563eb"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={false}
                      name="Your Hotel"
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <Separator />

          {/* Analyst controls */}
          {isAnalyst && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">
                  Competitor Weight
                </label>
                <Select
                  value={weight}
                  onValueChange={(v) =>
                    handleWeightChange(v as WeightLabel)
                  }
                  disabled={saving}
                >
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={handleRemove}
                disabled={saving}
              >
                Remove Competitor
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
