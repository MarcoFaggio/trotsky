"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Toaster } from "@/components/ui/toaster";
import { useSessionStorage } from "@/hooks/use-session-storage";

interface AppShellProps {
  user: { email: string; role: string; name?: string };
  hotels: { id: string; name: string }[];
  unreadMessages: number;
  upcomingEvents: number;
  children: React.ReactNode;
}

export function AppShell({
  user,
  hotels,
  unreadMessages,
  upcomingEvents,
  children,
}: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [collapsed, setCollapsed] = useSessionStorage(
    "trotsky:sidebarCollapsed",
    false
  );
  const [lastHotelId, setLastHotelId] = useSessionStorage<string | null>(
    "trotsky:lastHotelId",
    null
  );

  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(
    searchParams.get("hotelId") || lastHotelId || hotels[0]?.id || null
  );

  useEffect(() => {
    const hotelIdParam = searchParams.get("hotelId");
    if (hotelIdParam && hotelIdParam !== selectedHotelId) {
      setSelectedHotelId(hotelIdParam);
      setLastHotelId(hotelIdParam);
    }
  }, [searchParams, selectedHotelId, setLastHotelId]);

  const handleHotelChange = useCallback(
    (id: string) => {
      setSelectedHotelId(id);
      setLastHotelId(id);
      const params = new URLSearchParams(searchParams.toString());
      params.set("hotelId", id);
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams, setLastHotelId]
  );

  // Auto-collapse on smaller screens
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      }
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setCollapsed]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        role={user.role as "ANALYST" | "CLIENT"}
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
        unreadMessages={unreadMessages}
        upcomingEvents={upcomingEvents}
      />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <TopBar
          user={user}
          hotels={hotels}
          selectedHotelId={selectedHotelId}
          onHotelChange={handleHotelChange}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50/30">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
