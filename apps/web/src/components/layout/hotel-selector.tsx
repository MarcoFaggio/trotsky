"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface HotelOption {
  id: string;
  name: string;
}

interface HotelSelectorProps {
  hotels: HotelOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function HotelSelector({ hotels, selectedId, onSelect }: HotelSelectorProps) {
  if (hotels.length <= 1 && selectedId) {
    return (
      <div className="text-sm font-medium text-foreground">
        {hotels.find((h) => h.id === selectedId)?.name || "Hotel"}
      </div>
    );
  }

  return (
    <Select value={selectedId || undefined} onValueChange={onSelect}>
      <SelectTrigger className="w-[320px]">
        <SelectValue placeholder="Select a hotel" />
      </SelectTrigger>
      <SelectContent>
        {hotels.map((h) => (
          <SelectItem key={h.id} value={h.id}>
            {h.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
