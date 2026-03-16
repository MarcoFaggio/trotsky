"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Trash2, Plus } from "lucide-react";
import { createEvent } from "@/actions/occupancy";
import { deleteEvent } from "@/actions/events";
import { toast } from "@/hooks/use-toast";

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
  hotels: { id: string; name: string }[];
  isAnalyst: boolean;
}

export function EventsList({
  events: initialEvents,
  hotels,
  isAnalyst,
}: EventsListProps) {
  const [events, setEvents] = useState(initialEvents);
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
      await createEvent({
        hotelId: form.hotelId,
        date: form.date,
        title: form.title,
        notes: form.notes || undefined,
      });
      toast({ title: "Event created" });
      setShowAdd(false);
      setForm({ hotelId: hotels[0]?.id || "", date: "", title: "", notes: "" });
      window.location.reload();
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Events</h1>
          <p className="text-muted-foreground text-sm">
            Manage events that impact hotel pricing
          </p>
        </div>
        {isAnalyst && (
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setShowAdd(true)}
          >
            <Plus className="h-4 w-4" />
            Add Event
          </Button>
        )}
      </div>

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
                        <Calendar className="h-4 w-4 text-primary shrink-0" />
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
        <div className="rounded-lg border-2 border-dashed p-12 text-center">
          <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No events yet.</p>
          {isAnalyst && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setShowAdd(true)}
            >
              Create your first event
            </Button>
          )}
        </div>
      )}

      {/* Add Event Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {hotels.length > 1 && (
              <Select
                value={form.hotelId}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, hotelId: v }))
                }
              >
                <SelectTrigger>
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
            )}
            <Input
              type="date"
              value={form.date}
              onChange={(e) =>
                setForm((p) => ({ ...p, date: e.target.value }))
              }
            />
            <Input
              placeholder="Event title"
              value={form.title}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
            />
            <Input
              placeholder="Notes (optional)"
              value={form.notes}
              onChange={(e) =>
                setForm((p) => ({ ...p, notes: e.target.value }))
              }
            />
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
