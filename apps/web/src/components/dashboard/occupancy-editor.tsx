"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { TroskyPageHeader } from "@/components/trosky/trosky-page-header";
import { Building2, Download, Save } from "lucide-react";
import { bulkUpsertOccupancy } from "@/actions/occupancy";
import { toast } from "@/hooks/use-toast";

interface OccEntry {
  date: string;
  occPercent: number | null;
  roomsOnBooks: number | null;
  occLyPercent: number | null;
  otbLyRooms: number | null;
}

interface OccupancyEditorProps {
  hotels: { id: string; name: string; roomCount: number }[];
  initialHotelId: string | null;
  initialData: OccEntry[];
}

function generateDates(days: number): string[] {
  const dates: string[] = [];
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  for (let i = 0; i < days; i++) {
    dates.push(new Date(todayUtc + i * 86400000).toISOString().split("T")[0]);
  }
  return dates;
}

export function OccupancyEditor({ hotels, initialHotelId, initialData }: OccupancyEditorProps) {
  const router = useRouter();
  const hotelId = initialHotelId || "";
  const dates = generateDates(30);
  const [entries, setEntries] = useState<Map<string, OccEntry>>(() => {
    const map = new Map<string, OccEntry>();
    for (const d of dates) {
      const existing = initialData.find((e) => e.date === d);
      map.set(d, existing || { date: d, occPercent: null, roomsOnBooks: null, occLyPercent: null, otbLyRooms: null });
    }
    return map;
  });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const hasHotels = hotels.length > 0;
  const hotelName = hotels.find((h) => h.id === hotelId)?.name;

  function handleHotelChange(id: string) {
    if (id === hotelId) return;
    if (
      dirty &&
      !window.confirm("You have unsaved occupancy changes. Switch hotel and discard them?")
    ) {
      return;
    }
    router.push(`/occupancy?hotelId=${id}`);
  }

  function updateEntry(date: string, field: keyof OccEntry, value: string) {
    setEntries((prev) => {
      const next = new Map(prev);
      const entry = { ...next.get(date)! };
      const parsed = parseFloat(value);
      (entry as any)[field] = value === "" || Number.isNaN(parsed) ? null : parsed;
      next.set(date, entry);
      return next;
    });
    setDirty(true);
  }

  async function handleSave() {
    if (!hotelId) return;
    setSaving(true);
    try {
      const data = Array.from(entries.values())
        .filter((e) => e.occPercent !== null || e.roomsOnBooks !== null)
        .map((e) => ({ hotelId, ...e }));
      await bulkUpsertOccupancy(data);
      setDirty(false);
      toast({ title: "Occupancy data saved", description: hotelName ? `Saved for ${hotelName}.` : undefined });
    } catch (e: any) {
      toast({ title: "Error saving", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  function handleExportCSV() {
    const headers = ["Date", "Occ %", "Rooms On Books", "Occ LY %", "OTB LY Rooms"];
    const rows = dates.map((d) => {
      const e = entries.get(d)!;
      return [d, e.occPercent ?? "", e.roomsOnBooks ?? "", e.occLyPercent ?? "", e.otbLyRooms ?? ""].join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `occupancy-${hotelId}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <TroskyPageHeader
        eyebrow="Demand inputs"
        title="Occupancy Management"
        description={
          hotelName
            ? `Enter and manage the next 30 days of occupancy for ${hotelName}.`
            : "Enter and manage occupancy data for the next 30 days."
        }
        badge={dirty ? { text: "Unsaved changes", variant: "warning" } : undefined}
        actions={
          <>
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
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!hasHotels}>
              <Download className="mr-2 h-4 w-4" />CSV
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !hasHotels}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save All"}
            </Button>
          </>
        }
      />

      {!hasHotels ? (
        <EmptyState
          icon={Building2}
          title="No active hotels available"
          description="Occupancy entries can be added once an active hotel exists."
        />
      ) : (
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="sticky left-0 bg-muted/50 px-4 py-3 text-left min-w-[140px]">Date</th>
                  <th className="px-3 py-3 text-center min-w-[100px]">Occ %</th>
                  <th className="px-3 py-3 text-center min-w-[100px]">Rooms OTB</th>
                  <th className="px-3 py-3 text-center min-w-[100px]">Occ LY %</th>
                  <th className="px-3 py-3 text-center min-w-[100px]">OTB LY Rooms</th>
                </tr>
              </thead>
              <tbody>
                {dates.map((date) => {
                  const entry = entries.get(date)!;
                  const d = new Date(date + "T12:00:00Z");
                  const label = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
                  const isWeekend = d.getUTCDay() === 0 || d.getUTCDay() === 6;
                  return (
                    <tr key={date} className={`border-b ${isWeekend ? "bg-trosky-red/5" : ""}`}>
                      <th scope="row" className="sticky left-0 bg-background px-4 py-2 text-left text-xs font-medium">
                        <time dateTime={date}>{label}</time>
                      </th>
                      <td className="px-3 py-1">
                        <Input type="number" aria-label={`Occupancy percent for ${label}`} className="h-8 text-center text-xs w-20 mx-auto" value={entry.occPercent ?? ""} onChange={(e) => updateEntry(date, "occPercent", e.target.value)} min={0} max={100} />
                      </td>
                      <td className="px-3 py-1">
                        <Input type="number" aria-label={`Rooms on books for ${label}`} className="h-8 text-center text-xs w-20 mx-auto" value={entry.roomsOnBooks ?? ""} onChange={(e) => updateEntry(date, "roomsOnBooks", e.target.value)} min={0} />
                      </td>
                      <td className="px-3 py-1">
                        <Input type="number" aria-label={`Last year occupancy percent for ${label}`} className="h-8 text-center text-xs w-20 mx-auto" value={entry.occLyPercent ?? ""} onChange={(e) => updateEntry(date, "occLyPercent", e.target.value)} min={0} max={100} />
                      </td>
                      <td className="px-3 py-1">
                        <Input type="number" aria-label={`Last year on-the-books rooms for ${label}`} className="h-8 text-center text-xs w-20 mx-auto" value={entry.otbLyRooms ?? ""} onChange={(e) => updateEntry(date, "otbLyRooms", e.target.value)} min={0} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
}
