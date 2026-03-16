"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Plus, Calendar, TrendingUp, DollarSign, Users } from "lucide-react";
import { setPriceOverride, createEvent, upsertOccupancy } from "@/actions/occupancy";
import { getEventsForDate, getPromotionsForDate } from "@/actions/occupancy";
import { getDiscountMix } from "@/actions/rate-plans";
import { toast } from "@/hooks/use-toast";
import type { DashboardDay } from "@hotel-pricing/shared";
import { formatDateFull, weightToLabel, checkDiscountWarning } from "@hotel-pricing/shared";

interface DayDetailModalProps {
  hotelId: string;
  date: string;
  data: DashboardDay | null;
  hotel: {
    id: string;
    roomCount: number;
    minRate: number | null;
    maxRate: number | null;
    occTarget: number | null;
  };
  isAnalyst: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

function fmt(cents: number | null): string {
  if (cents === null) return "—";
  return `$${Math.round(cents / 100)}`;
}

export function DayDetailModal({
  hotelId,
  date,
  data,
  hotel,
  isAnalyst,
  onClose,
  onRefresh,
}: DayDetailModalProps) {
  const [events, setEvents] = useState<{ id: string; title: string; notes: string | null }[]>([]);
  const [promotions, setPromos] = useState<{ id: string; title: string; description: string | null }[]>([]);
  const [overridePrice, setOverridePrice] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventNotes, setEventNotes] = useState("");
  const [occEdit, setOccEdit] = useState(data?.occPercent?.toString() || "");
  const [otbEdit, setOtbEdit] = useState(data?.otbRooms?.toString() || "");
  const [availableRoomsEdit, setAvailableRoomsEdit] = useState(data?.availableRooms?.toString() || "");
  const [forecastRoomsEdit, setForecastRoomsEdit] = useState(data?.forecastRooms?.toString() || "");
  const [arrivalsEdit, setArrivalsEdit] = useState(data?.arrivals?.toString() || "");
  const [departuresEdit, setDeparturesEdit] = useState(data?.departures?.toString() || "");
  const [overbookingEdit, setOverbookingEdit] = useState(data?.overbookingLimit?.toString() || "");
  const [saving, setSaving] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [discountWarning, setDiscountWarning] = useState<{ warning: boolean; reasons: string[] }>({ warning: false, reasons: [] });

  useEffect(() => {
    getEventsForDate(hotelId, date).then(setEvents).catch(() => {});
    getPromotionsForDate(hotelId, date).then(setPromos).catch(() => {});
    getDiscountMix(hotelId, date).then((mixes) => {
      if (mixes.length > 0 && data?.ourRate) {
        const barRate = data.ourRate;
        const totalDiscountShare = mixes
          .filter((m) => m.plan.discountPercent > 0)
          .reduce((s, m) => s + m.sharePercent, 0);
        const adr = mixes.reduce((s, m) => {
          const planRate = barRate * (1 - m.plan.discountPercent / 100);
          return s + planRate * (m.sharePercent / 100);
        }, 0);
        setDiscountWarning(
          checkDiscountWarning(
            adr,
            barRate,
            totalDiscountShare,
            Number(process.env.NEXT_PUBLIC_DISCOUNT_ADR_THRESHOLD) || 12,
            Number(process.env.NEXT_PUBLIC_DISCOUNT_SHARE_THRESHOLD) || 35
          )
        );
      }
    }).catch(() => {});
  }, [hotelId, date, data?.ourRate]);

  async function handleSaveOverride() {
    if (!overridePrice) return;
    setSaving(true);
    try {
      await setPriceOverride({
        hotelId,
        date,
        overridePriceCents: Math.round(parseFloat(overridePrice) * 100),
        reason: overrideReason || undefined,
      });
      toast({ title: "Price override saved" });
      onRefresh();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveEvent() {
    if (!eventTitle) return;
    setSaving(true);
    try {
      await createEvent({ hotelId, date, title: eventTitle, notes: eventNotes || undefined });
      toast({ title: "Event created" });
      setShowAddEvent(false);
      setEventTitle("");
      setEventNotes("");
      getEventsForDate(hotelId, date).then(setEvents);
      onRefresh();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveOccupancy() {
    setSaving(true);
    try {
      await upsertOccupancy({
        hotelId,
        date,
        occPercent: occEdit ? parseFloat(occEdit) : null,
        roomsOnBooks: otbEdit ? parseInt(otbEdit) : null,
        availableRooms: availableRoomsEdit ? parseInt(availableRoomsEdit) : null,
        forecastRooms: forecastRoomsEdit ? parseInt(forecastRoomsEdit) : null,
        arrivals: arrivalsEdit ? parseInt(arrivalsEdit) : null,
        departures: departuresEdit ? parseInt(departuresEdit) : null,
        overbookingLimit: overbookingEdit ? parseInt(overbookingEdit) : null,
      });
      toast({ title: "Occupancy updated" });
      onRefresh();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const occupiedRooms = data?.occPercent
    ? Math.round((data.occPercent / 100) * hotel.roomCount)
    : null;
  const revenue = data?.ourRate && occupiedRooms ? Math.round((data.ourRate / 100) * occupiedRooms) : null;
  const lyOccRooms = data?.occLyPercent
    ? Math.round((data.occLyPercent / 100) * hotel.roomCount)
    : null;
  const stlyRevenue = data?.ourRate && lyOccRooms ? Math.round((data.ourRate / 100) * lyOccRooms) : null;

  const pacePercent = data?.otbRooms !== null && data?.otbLyRooms !== null && data?.otbLyRooms
    ? ((data.otbRooms! - data.otbLyRooms) / Math.max(data.otbLyRooms, 1)) * 100
    : null;

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{formatDateFull(date)}</DialogTitle>
          <DialogDescription>
            Day detail view for {hotel.roomCount} room property
          </DialogDescription>
        </DialogHeader>

        {discountWarning.warning && (
          <div className="flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Discount Warning</p>
              {discountWarning.reasons.map((r, i) => (
                <p key={i} className="text-xs">{r}</p>
              ))}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Panel */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4" />
                Room Pricing
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Current Rate</p>
                  <p className="text-lg font-bold">{fmt(data?.ourRate ?? null)}</p>
                  {data?.overrideRate && (
                    <Badge variant="warning" className="text-[10px]">Override active</Badge>
                  )}
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">AI Recommended</p>
                  <p className="text-lg font-bold text-emerald-600">{fmt(data?.recommendedRate ?? null)}</p>
                  {data?.confidence !== null && (
                    <p className="text-xs text-muted-foreground">{Math.round((data?.confidence || 0) * 100)}% confidence</p>
                  )}
                </div>
              </div>
            </div>

            {isAnalyst && (
              <div className="rounded-md border p-3 space-y-2">
                <h5 className="text-xs font-medium">Price Override</h5>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Price ($)"
                    value={overridePrice}
                    onChange={(e) => setOverridePrice(e.target.value)}
                    className="w-24"
                  />
                  <Input
                    placeholder="Reason (optional)"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={handleSaveOverride} disabled={saving}>
                    Set
                  </Button>
                </div>
              </div>
            )}

            <Separator />

            <div>
              <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4" />
                Competitor Set
              </h4>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="text-left px-3 py-2">Weight</th>
                      <th className="text-left px-3 py-2">Competitor</th>
                      <th className="text-right px-3 py-2">Rate</th>
                      <th className="text-right px-3 py-2">Diff</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.competitors.map((c) => {
                      const diff = c.rate && data.ourRate
                        ? ((c.rate - data.ourRate) / data.ourRate) * 100
                        : null;
                      return (
                        <tr key={c.id} className="border-b last:border-0">
                          <td className="px-3 py-1.5">
                            <Badge variant="outline" className="text-[10px]">
                              {weightToLabel(c.weight)}
                            </Badge>
                          </td>
                          <td className="px-3 py-1.5 truncate max-w-[150px]">{c.name}</td>
                          <td className="px-3 py-1.5 text-right font-medium">{fmt(c.rate)}</td>
                          <td className={`px-3 py-1.5 text-right ${diff && diff > 0 ? "text-red-500" : diff && diff < 0 ? "text-emerald-600" : ""}`}>
                            {diff !== null ? `${diff > 0 ? "+" : ""}${diff.toFixed(0)}%` : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/30">
                      <td colSpan={2} className="px-3 py-1.5 font-medium">Average</td>
                      <td className="px-3 py-1.5 text-right font-bold">{fmt(data?.compAvgRate ?? null)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                <Users className="h-4 w-4" />
                Occupancy & Forecast
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">OTB Rooms</p>
                  <p className="text-lg font-bold">{data?.otbRooms ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">
                    {data?.occPercent ? `${data.occPercent.toFixed(1)}%` : "—"} occ
                  </p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">LY OTB</p>
                  <p className="text-lg font-bold">{data?.otbLyRooms ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">
                    {data?.occLyPercent ? `${data.occLyPercent.toFixed(1)}%` : "—"} occ LY
                  </p>
                </div>
              </div>
              {pacePercent !== null && (
                <div className={`mt-2 text-sm font-medium ${pacePercent >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  Pace: {pacePercent >= 0 ? "+" : ""}{pacePercent.toFixed(1)}% vs LY
                </div>
              )}

              {/* Operational Data */}
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="rounded-md border p-2 text-center">
                  <p className="text-[10px] text-muted-foreground">Available</p>
                  <p className="text-sm font-semibold">{data?.availableRooms ?? "—"}</p>
                </div>
                <div className="rounded-md border p-2 text-center">
                  <p className="text-[10px] text-muted-foreground">Forecast</p>
                  <p className="text-sm font-semibold">
                    {data?.forecastRooms ?? "—"}
                    {data?.forecastPercent != null && (
                      <span className="text-[10px] text-muted-foreground ml-0.5">
                        ({data.forecastPercent.toFixed(0)}%)
                      </span>
                    )}
                  </p>
                </div>
                <div className="rounded-md border p-2 text-center">
                  <p className="text-[10px] text-muted-foreground">Overbook</p>
                  <p className="text-sm font-semibold">{data?.overbookingLimit ?? "—"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="rounded-md border p-2 text-center">
                  <p className="text-[10px] text-muted-foreground">Arrivals</p>
                  <p className="text-sm font-semibold">{data?.arrivals ?? "—"}</p>
                </div>
                <div className="rounded-md border p-2 text-center">
                  <p className="text-[10px] text-muted-foreground">Departures</p>
                  <p className="text-sm font-semibold">{data?.departures ?? "—"}</p>
                </div>
              </div>

              {isAnalyst && (
                <div className="mt-3 rounded-md border p-3 space-y-2">
                  <h5 className="text-xs font-medium">Edit Occupancy & Operations</h5>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Occ %</Label>
                      <Input
                        type="number"
                        value={occEdit}
                        onChange={(e) => setOccEdit(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">OTB Rooms</Label>
                      <Input
                        type="number"
                        value={otbEdit}
                        onChange={(e) => setOtbEdit(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Available</Label>
                      <Input
                        type="number"
                        value={availableRoomsEdit}
                        onChange={(e) => setAvailableRoomsEdit(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Forecast</Label>
                      <Input
                        type="number"
                        value={forecastRoomsEdit}
                        onChange={(e) => setForecastRoomsEdit(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Arrivals</Label>
                      <Input
                        type="number"
                        value={arrivalsEdit}
                        onChange={(e) => setArrivalsEdit(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Departures</Label>
                      <Input
                        type="number"
                        value={departuresEdit}
                        onChange={(e) => setDeparturesEdit(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Overbook Lim</Label>
                      <Input
                        type="number"
                        value={overbookingEdit}
                        onChange={(e) => setOverbookingEdit(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button size="sm" className="h-8 w-full" onClick={handleSaveOccupancy} disabled={saving}>
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4" />
                ADR & Revenue
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Est. ADR</p>
                  <p className="font-bold">{fmt(data?.ourRate ?? null)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Est. Revenue</p>
                  <p className="font-bold">{revenue ? `$${revenue.toLocaleString()}` : "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">STLY ADR</p>
                  <p className="font-medium">{fmt(data?.ourRate ?? null)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">STLY Revenue</p>
                  <p className="font-medium">{stlyRevenue ? `$${stlyRevenue.toLocaleString()}` : "—"}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4" />
                Events & Promotions
              </h4>

              {events.length === 0 && promotions.length === 0 && (
                <p className="text-xs text-muted-foreground">No events or promotions on this date.</p>
              )}

              {events.map((e) => (
                <div key={e.id} className="rounded-md border p-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="warning" className="text-[10px]">Event</Badge>
                    <span className="text-sm font-medium">{e.title}</span>
                  </div>
                  {e.notes && <p className="text-xs text-muted-foreground mt-1">{e.notes}</p>}
                </div>
              ))}

              {promotions.map((p) => (
                <div key={p.id} className="rounded-md border p-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">Promo</Badge>
                    <span className="text-sm font-medium">{p.title}</span>
                  </div>
                  {p.description && <p className="text-xs text-muted-foreground mt-1">{p.description}</p>}
                </div>
              ))}

              {isAnalyst && (
                <div className="mt-3">
                  {!showAddEvent ? (
                    <Button variant="outline" size="sm" onClick={() => setShowAddEvent(true)}>
                      <Plus className="mr-1 h-3 w-3" />
                      Add Event
                    </Button>
                  ) : (
                    <div className="space-y-2 border rounded-md p-3">
                      <Input
                        placeholder="Event title"
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        className="h-8 text-xs"
                      />
                      <Input
                        placeholder="Notes (optional)"
                        value={eventNotes}
                        onChange={(e) => setEventNotes(e.target.value)}
                        className="h-8 text-xs"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" className="h-7 text-xs" onClick={handleSaveEvent} disabled={saving}>
                          Save Event
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowAddEvent(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
