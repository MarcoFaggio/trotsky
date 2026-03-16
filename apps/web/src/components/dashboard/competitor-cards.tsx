"use client";

import { Star, ExternalLink, MoreVertical, Plus, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { weightToLabel } from "@hotel-pricing/shared";
import type { CompetitorCard } from "@hotel-pricing/shared";
import Link from "next/link";

interface CompetitorCardsProps {
  competitors: CompetitorCard[];
  loading?: boolean;
  isAnalyst: boolean;
  hotelId: string;
  onCompetitorClick?: (competitorId: string) => void;
  onRemove?: (competitorId: string) => void;
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

function StarRating({ value }: { value: number }) {
  const stars = [];
  const rounded = Math.round(value * 2) / 2;
  for (let i = 1; i <= 5; i++) {
    if (i <= rounded) {
      stars.push(
        <Star
          key={i}
          className="h-3 w-3 fill-amber-400 text-amber-400"
        />
      );
    } else if (i - 0.5 <= rounded) {
      stars.push(
        <Star key={i} className="h-3 w-3 fill-amber-400/50 text-amber-400" />
      );
    } else {
      stars.push(
        <Star key={i} className="h-3 w-3 text-muted-foreground/30" />
      );
    }
  }
  return <div className="flex gap-0.5">{stars}</div>;
}

export function CompetitorCards({
  competitors,
  loading,
  isAnalyst,
  hotelId,
  onCompetitorClick,
  onRemove,
}: CompetitorCardsProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Competitor Set</h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-52 shrink-0 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Competitor Set</h3>
        {isAnalyst && (
          <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
            <Link href={`/hotels/${hotelId}/settings`}>
              <Plus className="mr-1 h-3 w-3" />
              Manage
            </Link>
          </Button>
        )}
      </div>

      {competitors.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No competitors configured yet.
          </p>
          {isAnalyst && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              asChild
            >
              <Link href={`/hotels/${hotelId}/settings`}>
                <Plus className="mr-1 h-3 w-3" />
                Add Competitor
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
          {competitors.map((comp) => (
            <Card
              key={comp.id}
              className={cn(
                "shrink-0 w-52 cursor-pointer transition-all hover:shadow-md",
                comp.dataPending && "opacity-70"
              )}
              onClick={() => onCompetitorClick?.(comp.id)}
            >
              <CardContent className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {comp.name}
                    </p>
                    <Badge
                      variant="outline"
                      className="text-[9px] mt-0.5"
                    >
                      {weightToLabel(comp.weight)}
                    </Badge>
                  </div>
                  {isAnalyst && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/hotels/${hotelId}/settings`}>
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemove?.(comp.id);
                          }}
                        >
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {comp.rating !== null && (
                  <div className="flex items-center gap-1.5">
                    <StarRating value={comp.rating} />
                    <span className="text-xs font-medium">
                      {comp.rating.toFixed(1)}
                    </span>
                    {comp.reviewCount !== null && (
                      <span className="text-[10px] text-muted-foreground">
                        ({comp.reviewCount})
                      </span>
                    )}
                  </div>
                )}

                <div className="pt-1">
                  {comp.dataPending ? (
                    <p className="text-xs text-muted-foreground italic">
                      Data pending...
                    </p>
                  ) : (
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-bold">
                        ${Math.round((comp.currentRate || 0) / 100)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        per night
                      </span>
                    </div>
                  )}

                  {comp.priceDiffPct !== null && !comp.dataPending && (
                    <Badge
                      variant={
                        comp.priceDiffPct > 0 ? "destructive" : "success"
                      }
                      className="text-[10px] mt-1"
                    >
                      {comp.priceDiffPct > 0 ? "+" : ""}
                      {comp.priceDiffPct.toFixed(1)}% vs you
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 border-t">
                  <span className="text-[10px] text-muted-foreground">
                    via {comp.source}
                  </span>
                  {comp.listingUrl && (
                    <a
                      href={comp.listingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                {comp.lastUpdated && (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="h-2.5 w-2.5" />
                    {timeAgo(comp.lastUpdated)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
