"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { OnboardingTour } from "@/components/layout/onboarding-tour";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Toaster } from "@/components/ui/toaster";
import { useSessionStorage } from "@/hooks/use-session-storage";
import { cn } from "@/lib/utils";

export interface TroskyShellProps {
  user: { email: string; role: string; name?: string };
  hotels: { id: string; name: string }[];
  unreadMessages: number;
  upcomingEvents: number;
  children: React.ReactNode;
}

/**
 * Authenticated app chrome — red-and-white revenue cockpit shell.
 * Preserves sidebar, top bar, hotel selection, and onboarding behaviour.
 */
export function TroskyShell({
  user,
  hotels,
  unreadMessages,
  upcomingEvents,
  children,
}: TroskyShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [collapsed, setCollapsed] = useSessionStorage(
    "trosky:sidebarCollapsed",
    false
  );
  const [lastHotelId, setLastHotelId] = useSessionStorage<string | null>(
    "trosky:lastHotelId",
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
    <OnboardingTour
      role={user.role as "ANALYST" | "CLIENT"}
      hotelId={selectedHotelId}
    >
      <div
        className={cn(
          "trosky-app font-trosky flex h-screen min-h-0 flex-col overflow-hidden lg:flex-row",
          "trosky-cockpit-bg text-foreground"
        )}
      >
        <Sidebar
          role={user.role as "ANALYST" | "CLIENT"}
          collapsed={collapsed}
          onToggle={() => setCollapsed((prev) => !prev)}
          unreadMessages={unreadMessages}
          upcomingEvents={upcomingEvents}
        />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <TopBar
            user={user}
            hotels={hotels}
            selectedHotelId={selectedHotelId}
            onHotelChange={handleHotelChange}
          />
          <main
            data-tour="main-content"
            className="trosky-main-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3 pb-24 sm:p-4 sm:pb-24 lg:p-6"
          >
            <div className="mx-auto w-full min-w-0 max-w-[1500px]">{children}</div>
          </main>
        </div>
        <Toaster />
      </div>
    </OnboardingTour>
  );
}
