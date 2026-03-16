import { prisma } from "@hotel-pricing/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2 } from "lucide-react";

export default async function HotelsPage() {
  const session = await getSession();
  if (!session || session.role !== "ANALYST") redirect("/dashboard");

  const hotels = await prisma.hotel.findMany({
    include: {
      _count: { select: { competitors: { where: { active: true } } } },
      listings: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hotels</h1>
          <p className="text-muted-foreground">Manage your hotel portfolio</p>
        </div>
        <Link href="/hotels/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Hotel
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {hotels.map((hotel) => (
          <Link key={hotel.id} href={`/hotels/${hotel.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{hotel.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">{hotel.pmsName || hotel.address || "No address"}</p>
                    </div>
                  </div>
                  <Badge variant={hotel.status === "ACTIVE" ? "success" : "secondary"}>
                    {hotel.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{hotel.roomCount} rooms</span>
                  <span>{hotel._count.competitors} competitors</span>
                  <span>{hotel.listings.length} listing(s)</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {hotels.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No hotels yet. Create your first hotel to get started.
          </div>
        )}
      </div>
    </div>
  );
}
