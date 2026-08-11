"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Trash2, Plus, Radar } from "lucide-react";
import { createEvent } from "@/actions/occupancy";
import { deleteEvent } from "@/actions/events";
import { suppressSignalImpact, unsuppressSignalImpact } from "@/actions/signals";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { TroskyPageHeader } from "@/components/trosky/trosky-page-header";
import { EmptyState } from "@/components/ui/empty-state";

interface EventItem {
  id: string;
  hotelId: string;
  hotelName: string;
  date: string;
  title: string;
  notes: string | null;
}

interface EventsListProps {
  events: EventItem[];
  importedSignals: {
    id: string;
    hotelId: string;
    hotelName: string;
    externalSignalId: string;
    date: string;
    title: string;
    category: string;
    direction: "POSITIVE_DEMAND" | "NEGATIVE_DISRUPTION" | "NEUTRAL";
    impactBps: number;
    relevanceScore: number;
    isSuppressed: boolean;
  }[];
  hotels: { id: string; name: string }[];
  isAnalyst: boolean;
}

export function EventsList({
  events: initialEvents,
  importedSignals: initialSignals,
  hotels,
  isAnalyst,
}: EventsListProps) {
  const [events, setEvents] = useState(initialEvents);
  const [signals, setSignals] = useState(initialSignals);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    hotelId: hotels[0]?.id || "",
    date: "",
    title: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const upcoming = events.filter((e) => e.date >= today);
  const past = events.filter((e) => e.date < today);

  async function handleCreate() {
    if (!form.title || !form.date || !form.hotelId) return;
    setSaving(true);
    try {
      const event = await createEvent({
        hotelId: form.hotelId,
        date: form.date,
        title: form.title,
        notes: form.notes || undefined,
      });
      const hotelName =
        hotels.find((hotel) => hotel.id === form.hotelId)?.name || "";
      setEvents((prev) =>
        [
          ...prev,
          {
            id: event.id,
            hotelId: form.hotelId,
            hotelName,
            date: form.date,
            title: form.title,
            notes: form.notes || null,
          },
        ].sort((a, b) => a.date.localeCompare(b.date))
      );
      toast({ title: "Event created" });
      setShowAdd(false);
      setForm({ hotelId: hotels[0]?.id || "", date: "", title: "", notes: "" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      toast({ title: "Event deleted" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  async function handleSuppressSignal(signal: (typeof initialSignals)[number]) {
    try {
      await suppressSignalImpact({
        hotelId: signal.hotelId,
        externalSignalId: signal.externalSignalId,
        date: signal.date,
        reason: "IRRELEVANT",
      });
      setSignals((prev) =>
        prev.map((s) => (s.id === signal.id ? { ...s, isSuppressed: true } : s))
      );
      toast({ title: "Signal suppressed" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  }

  async function handleUnsuppressSignal(signal: (typeof initialSignals)[number]) {
    try {
      await unsuppressSignalImpact({
        hotelId: signal.hotelId,
        externalSignalId: signal.externalSignalId,
        date: signal.date,
      });
      setSignals((prev) =>
        prev.map((s) => (s.id === signal.id ? { ...s, isSuppressed: false } : s))
      );
      toast({ title: "Signal restored" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <TroskyPageHeader
        eyebrow="Demand signals"
        title="Events"
        description="Manage events that impact hotel pricing"
        actions={
          isAnalyst ? (
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => setShowAdd(true)}
            >
              <Plus className="h-4 w-4" />
              Add Event
            </Button>
          ) : undefined
        }
      />

      <Tabs defaultValue="manual" className="space-y-4">
        <TabsList>
          <TabsTrigger value="manual">Manual Events</TabsTrigger>
          {isAnalyst && <TabsTrigger value="imported">Imported Signals</TabsTrigger>}
        </TabsList>

        <TabsContent value="manual" className="space-y-6">
      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Upcoming Events</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((event) => (
              <Card key={event.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-amber-500 shrink-0" aria-hidden />
                        <span className="text-sm font-medium truncate">
                          {event.title}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(event.date)}
                      </p>
                      <Badge variant="secondary" className="text-[10px] mt-1">
                        {event.hotelName}
                      </Badge>
                      {event.notes && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {event.notes}
                        </p>
                      )}
                    </div>
                    {isAnalyst && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 shrink-0"
                        aria-label={`Delete event: ${event.title}`}
                        onClick={() => handleDelete(event.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Past Events
          </h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {past.map((event) => (
              <Card key={event.id} className="opacity-60">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(event.date)}
                      </p>
                      <Badge
                        variant="secondary"
                        className="text-[10px] mt-1"
                      >
                        {event.hotelName}
                      </Badge>
                    </div>
                    {isAnalyst && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        aria-label={`Delete event: ${event.title}`}
                        onClick={() => handleDelete(event.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {events.length === 0 && (
        <EmptyState
          icon={Calendar}
          title="No events yet"
          description="Events that impact hotel pricing will appear here."
          action={
            isAnalyst ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdd(true)}
              >
                Create your first event
              </Button>
            ) : undefined
          }
        />
      )}
        </TabsContent>
        {isAnalyst && (
          <TabsContent value="imported" className="space-y-3">
            {signals.length === 0 ? (
              <EmptyState
                icon={Radar}
                title="No imported signals found"
                description="External demand signals will appear here once imported."
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {signals.map((signal) => (
                  <Card key={signal.id} className={signal.isSuppressed ? "opacity-60" : ""}>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant={signal.direction === "NEGATIVE_DISRUPTION" ? "destructive" : "secondary"}>
                            {signal.direction === "NEGATIVE_DISRUPTION" ? "Disruption" : "Demand up"}
                          </Badge>
                          <span
                            className={
                              signal.impactBps < 0
                                ? "text-xs font-semibold text-destructive"
                                : signal.impactBps > 0
                                ? "text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                                : "text-xs font-semibold text-muted-foreground"
                            }
                          >
                            {signal.impactBps >= 0 ? "+" : ""}
                            {(signal.impactBps / 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Radar className="h-4 w-4 text-teal-600 shrink-0" aria-hidden />
                          <p className="text-sm font-medium">{signal.title}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(signal.date)} · {signal.category} · {signal.hotelName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Relevance {(signal.relevanceScore * 100).toFixed(0)}%
                        </p>
                        {!signal.isSuppressed ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleSuppressSignal(signal)}
                          >
                            Suppress
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleUnsuppressSignal(signal)}
                          >
                            Undo suppression
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Add Event Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {hotels.length > 1 && (
              <div className="space-y-2">
                <Label htmlFor="event-hotel">Hotel</Label>
                <Select
                  value={form.hotelId}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, hotelId: v }))
                  }
                >
                  <SelectTrigger id="event-hotel">
                    <SelectValue placeholder="Select hotel" />
                  </SelectTrigger>
                  <SelectContent>
                    {hotels.map((h) => (
                      <SelectItem key={h.id} value={h.id}>
                        {h.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="event-date">Date</Label>
              <Input
                id="event-date"
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((p) => ({ ...p, date: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-title">Title</Label>
              <Input
                id="event-title"
                placeholder="Event title"
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-notes">Notes</Label>
              <Input
                id="event-notes"
                placeholder="Notes (optional)"
                value={form.notes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, notes: e.target.value }))
                }
              />
            </div>
            <Button
              onClick={handleCreate}
              disabled={saving || !form.title || !form.date}
              className="w-full"
            >
              {saving ? "Creating..." : "Create Event"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
