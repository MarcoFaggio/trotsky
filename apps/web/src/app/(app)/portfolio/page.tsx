import { getSession } from "@/lib/auth";
import { prisma } from "@hotel-pricing/db";
import { formatCurrency, startOfTodayUtc } from "@hotel-pricing/shared";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TroskyPageHeader } from "@/components/trosky/trosky-page-header";
import { TroskyMetricCard } from "@/components/trosky/trosky-metric-card";
import { Building2, TrendingUp, Users, DollarSign, Plus } from "lucide-react";

export default async function PortfolioPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ANALYST") redirect("/dashboard");

  const hotels = await prisma.hotel.findMany({
    where: { status: "ACTIVE" },
    include: {
      _count: { select: { competitors: { where: { active: true } } } },
    },
    orderBy: { name: "asc" },
  });

  const today = startOfTodayUtc();
  const hotelIds = hotels.map((h) => h.id);

  const [todayRateRows, todayOcc, todayRecs] = await Promise.all([
    prisma.dailyRate.findMany({
      where: { listingType: "HOTEL", date: today, hotelId: { in: hotelIds } },
      orderBy: { scrapedAt: "desc" },
    }),
    prisma.occupancyEntry.findMany({
      where: { date: today, hotelId: { in: hotelIds } },
    }),
    prisma.recommendation.findMany({
      where: { date: today, hotelId: { in: hotelIds } },
    }),
  ]);

  // One rate per hotel — the freshest scrape — so multi-OTA hotels aren't double-counted.
  const latestRateByHotel = new Map<string, (typeof todayRateRows)[number]>();
  for (const row of todayRateRows) {
    if (row.hotelId && !latestRateByHotel.has(row.hotelId)) {
      latestRateByHotel.set(row.hotelId, row);
    }
  }
  const todayRates = Array.from(latestRateByHotel.values());

  return (
    <div className="space-y-6">
      <TroskyPageHeader
        eyebrow="Portfolio"
        title="Portfolio Overview"
        description="All properties at a glance — today's rates, occupancy, and live recommendations."
        actions={
          <Button asChild size="sm" className="gap-1.5">
            <Link href="/hotels/new">
              <Plus className="h-4 w-4" />
              Add Hotel
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <TroskyMetricCard label="Total Hotels" icon={Building2} value={hotels.length} />
        <TroskyMetricCard
          label="Avg Today Rate"
          icon={DollarSign}
          value={
            todayRates.length > 0
              ? formatCurrency(
                  Math.round(
                    todayRates.reduce((s, r) => s + r.priceCents, 0) /
                      todayRates.length
                  )
                )
              : "—"
          }
          hint={todayRates.length > 0 ? `Across ${todayRates.length} scraped ${todayRates.length === 1 ? "property" : "properties"}` : "No scraped rates today"}
        />
        <TroskyMetricCard
          label="Avg Occupancy"
          icon={Users}
          value={
            todayOcc.length > 0
              ? `${Math.round(todayOcc.reduce((s, o) => s + (o.occPercent || 0), 0) / todayOcc.length)}%`
              : "—"
          }
          hint={todayOcc.length > 0 ? "Today, where entered" : "No occupancy entered today"}
        />
        <TroskyMetricCard
          label="Recommendations"
          icon={TrendingUp}
          value={todayRecs.length}
          hint="active today"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {hotels.map((hotel) => {
          const rate = latestRateByHotel.get(hotel.id);
          const occ = todayOcc.find((o) => o.hotelId === hotel.id);
          const rec = todayRecs.find((r) => r.hotelId === hotel.id);

          return (
            <Link key={hotel.id} href={`/dashboard?hotelId=${hotel.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{hotel.name}</CardTitle>
                    <Badge variant="success">Active</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Rate</p>
                      <p className="text-lg font-semibold tabular-nums">
                        {rate ? formatCurrency(rate.priceCents) : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Occ</p>
                      <p className="text-lg font-semibold tabular-nums">
                        {occ?.occPercent != null
                          ? `${Math.round(occ.occPercent)}%`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Rec</p>
                      <p className="text-lg font-semibold tabular-nums text-trosky-red">
                        {rec ? formatCurrency(rec.recommendedPriceCents) : "—"}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    {hotel.roomCount} rooms / {hotel._count.competitors}{" "}
                    competitors
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
      {hotels.length === 0 && (
        <EmptyState
          icon={Building2}
          title="No active hotels yet"
          description="Active pilot properties will appear here once they are added to the portfolio."
          action={
            <Button asChild size="sm" className="gap-1.5">
              <Link href="/hotels/new">
                <Plus className="h-4 w-4" />
                Add Hotel
              </Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
