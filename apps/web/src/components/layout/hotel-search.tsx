"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  name: string;
  city: string | null;
  pmsName: string | null;
  thumbnailUrl: string | null;
}

interface HotelSearchProps {
  onSelect?: (hotelId: string) => void;
}

export function HotelSearch({ onSelect }: HotelSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/v1/hotels/search?query=${encodeURIComponent(q)}`
      );
      const data = await res.json();
      setResults(data.results || []);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleInputChange(value: string) {
    setQuery(value);
    setActiveIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  }

  function handleSelect(hotel: SearchResult) {
    setQuery("");
    setOpen(false);
    setResults([]);
    try {
      sessionStorage.setItem(
        "trotsky:lastHotelId",
        JSON.stringify(hotel.id)
      );
    } catch {}
    if (onSelect) {
      onSelect(hotel.id);
    }
    router.push(`/dashboard?hotelId=${hotel.id}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search hotels..."
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          className="pl-9 h-9 text-sm"
          aria-label="Search hotels"
          aria-expanded={open}
          role="combobox"
          aria-autocomplete="list"
        />
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border bg-popover shadow-lg overflow-hidden">
          {loading && (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              Searching...
            </div>
          )}
          {!loading && results.length === 0 && query.length >= 2 && (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              No hotels found for &ldquo;{query}&rdquo;
            </div>
          )}
          {!loading &&
            results.map((hotel, i) => (
              <button
                key={hotel.id}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-accent",
                  i === activeIndex && "bg-accent"
                )}
                onClick={() => handleSelect(hotel)}
                onMouseEnter={() => setActiveIndex(i)}
                role="option"
                aria-selected={i === activeIndex}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{hotel.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {[hotel.city, hotel.pmsName]
                      .filter(Boolean)
                      .join(" • ") || "No location"}
                  </p>
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
