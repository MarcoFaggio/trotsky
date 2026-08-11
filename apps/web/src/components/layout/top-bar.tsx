"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HotelSearch } from "./hotel-search";
import { Plus, RefreshCw, User, LogOut, Clock, Compass } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { useOnboarding } from "./onboarding-context";

interface TopBarProps {
  user: { email: string; role: string; name?: string };
  hotels: { id: string; name: string }[];
  selectedHotelId: string | null;
  onHotelChange: (id: string) => void;
  lastUpdated?: string | null;
  isRefreshing?: boolean;
  onRefresh?: () => void;
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

export function TopBar({
  user,
  hotels,
  selectedHotelId,
  onHotelChange,
  lastUpdated,
  isRefreshing,
  onRefresh,
}: TopBarProps) {
  const isAnalyst = user.role === "ANALYST";
  const { startTour } = useOnboarding();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-secondary bg-primary/90 px-3 backdrop-blur-md sm:px-4 lg:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
        {isAnalyst ? (
          <HotelSearch onSelect={onHotelChange} />
        ) : hotels.length > 1 ? (
          <Select
            value={selectedHotelId ?? undefined}
            onValueChange={onHotelChange}
          >
            <SelectTrigger
              data-tour="hotel-name"
              aria-label="Select your hotel"
              className="h-9 w-[220px] max-w-full rounded-full"
            >
              <SelectValue placeholder="Select your hotel" />
            </SelectTrigger>
            <SelectContent>
              {hotels.map((h) => (
                <SelectItem key={h.id} value={h.id}>
                  {h.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div
            data-tour="hotel-name"
            className="truncate text-sm font-medium text-primary"
          >
            {hotels.find((h) => h.id === selectedHotelId)?.name ||
              "Your Hotel"}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {lastUpdated && (
          <div className="hidden items-center gap-1.5 text-xs text-tertiary sm:flex">
            <Clock className="h-3 w-3" />
            <span>Updated {timeAgo(lastUpdated)}</span>
          </div>
        )}

        {isAnalyst && onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            data-tour="top-bar-refresh"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-9 gap-1.5 rounded-full text-xs"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        )}

        {isAnalyst && (
          <Button
            size="sm"
            data-tour="top-bar-add-hotel"
            className="h-9 gap-1.5 rounded-full"
            asChild
          >
            <Link href="/hotels/new">
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Add Hotel</span>
            </Link>
          </Button>
        )}

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Open user menu"
              data-tour="user-menu"
              className="h-9 gap-2 rounded-full pl-1.5 pr-2 sm:pr-3"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary ring-1 ring-secondary">
                <User className="h-3.5 w-3.5 text-fg-quaternary" />
              </div>
              <Badge
                variant="secondary"
                className="max-w-[5.5rem] truncate px-1.5 py-0 text-[10px] font-medium"
              >
                {user.role}
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium text-primary">
                {user.name || user.email}
              </p>
              <p className="text-xs text-tertiary">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                startTour();
              }}
            >
              <Compass className="mr-2 h-4 w-4" />
              Product tour
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-error-primary">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
