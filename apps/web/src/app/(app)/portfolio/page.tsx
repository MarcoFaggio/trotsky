import { getSession } from "@/lib/auth";
import { prisma } from "@hotel-pricing/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, TrendingUp, Users, DollarSign } from "lucide-react";

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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayRates = await prisma.dailyRate.findMany({
    where: {
      listingType: "HOTEL",
      date: today,
      hotelId: { in: hotels.map((h) => h.id) },
    },
  });

  const todayOcc = await prisma.occupancyEntry.findMany({
    where: {
      date: today,
      hotelId: { in: hotels.map((h) => h.id) },
    },
  });

  const todayRecs = await prisma.recommendation.findMany({
    where: {
      date: today,
      hotelId: { in: hotels.map((h) => h.id) },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Portfolio Overview</h1>
        <p className="text-muted-foreground">All properties at a glance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Hotels</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hotels.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Today Rate
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {todayRates.length > 0
                ? `$${Math.round(todayRates.reduce((s, r) => s + r.priceCents, 0) / todayRates.length / 100)}`
                : "—"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Occupancy
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {todayOcc.length > 0
                ? `${Math.round(todayOcc.reduce((s, o) => s + (o.occPercent || 0), 0) / todayOcc.length)}%`
                : "—"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Recommendations
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayRecs.length}</div>
            <p className="text-xs text-muted-foreground">active today</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {hotels.map((hotel) => {
          const rate = todayRates.find((r) => r.hotelId === hotel.id);
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
                      <p className="text-lg font-semibold">
                        {rate
                          ? `$${Math.round(rate.priceCents / 100)}`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Occ</p>
                      <p className="text-lg font-semibold">
                        {occ?.occPercent
                          ? `${Math.round(occ.occPercent)}%`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Rec</p>
                      <p className="text-lg font-semibold text-primary">
                        {rec
                          ? `$${Math.round(rec.recommendedPriceCents / 100)}`
                          : "—"}
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
    </div>
  );
}
