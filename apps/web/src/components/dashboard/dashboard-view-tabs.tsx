"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type DashboardViewTab = "operate" | "market";

interface DashboardViewTabsProps {
  operate: React.ReactNode;
  market: React.ReactNode;
  hotelName: string;
  marketHint?: string | null;
}

export function DashboardViewTabs({
  operate,
  market,
  hotelName,
  marketHint,
}: DashboardViewTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab: DashboardViewTab = useMemo(() => {
    return searchParams.get("view") === "market" ? "market" : "operate";
  }, [searchParams]);

  const setTab = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "market") {
        params.set("view", "market");
      } else {
        params.delete("view");
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  return (
    <Tabs
      value={activeTab}
      onValueChange={setTab}
      className="min-w-0 space-y-6"
    >
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <TabsList aria-label="Dashboard view" className="w-fit">
          <TabsTrigger value="operate" data-tour="dashboard-tab-operate">
            Operate
          </TabsTrigger>
          <TabsTrigger value="market" data-tour="dashboard-tab-market">
            Market
          </TabsTrigger>
        </TabsList>
        {activeTab === "market" ? (
          <p className="max-w-xl text-sm text-muted-foreground">
            Rate matrix, competitors, and calendar for{" "}
            <span className="font-medium text-foreground">{hotelName}</span>
            {marketHint ? <> {marketHint}</> : null}.
          </p>
        ) : null}
      </div>

      <TabsContent value="operate" className="mt-0 min-w-0 focus-visible:outline-none">
        {operate}
      </TabsContent>
      <TabsContent
        value="market"
        className="mt-0 min-w-0 focus-visible:outline-none"
        data-tour="detailed-dashboard"
      >
        {market}
      </TabsContent>
    </Tabs>
  );
}
