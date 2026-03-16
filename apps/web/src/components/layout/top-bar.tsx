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
import { HotelSearch } from "./hotel-search";
import { Plus, RefreshCw, User, LogOut, Clock } from "lucide-react";
import Link from "next/link";

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

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b bg-white px-4 lg:px-6">
      {/* Left section */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {isAnalyst ? (
          <HotelSearch onSelect={onHotelChange} />
        ) : (
          <div className="text-sm font-medium text-foreground truncate">
            {hotels.find((h) => h.id === selectedHotelId)?.name ||
              "Your Hotel"}
          </div>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Last updated + refresh */}
        {lastUpdated && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Updated {timeAgo(lastUpdated)}</span>
          </div>
        )}

        {isAnalyst && onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-8 gap-1.5 text-xs"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        )}

        {/* Add Hotel */}
        {isAnalyst && (
          <Button variant="outline" size="sm" className="h-8 gap-1.5" asChild>
            <Link href="/hotels/new">
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Add Hotel</span>
            </Link>
          </Button>
        )}

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-2 pl-2 pr-3"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                <User className="h-3.5 w-3.5 text-primary" />
              </div>
              <Badge
                variant={isAnalyst ? "default" : "secondary"}
                className="text-[10px] px-1.5 py-0"
              >
                {user.role}
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">
                {user.name || user.email}
              </p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
