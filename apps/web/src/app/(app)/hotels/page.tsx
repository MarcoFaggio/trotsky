import { prisma } from "@hotel-pricing/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TroskyPageHeader } from "@/components/trosky/trosky-page-header";
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
      <TroskyPageHeader
        eyebrow="Portfolio"
        title="Hotels"
        description="Manage your hotel portfolio"
        actions={
          <Button asChild size="sm" className="gap-1.5">
            <Link href="/hotels/new">
              <Plus className="h-4 w-4" aria-hidden />
              Add Hotel
            </Link>
          </Button>
        }
      />

      {hotels.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No hotels yet"
          description="Create your first hotel to get started."
          action={
            <Button asChild size="sm" className="gap-1.5">
              <Link href="/hotels/new">
                <Plus className="h-4 w-4" aria-hidden />
                Add Hotel
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {hotels.map((hotel) => (
            <Link key={hotel.id} href={`/hotels/${hotel.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-trosky-red/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-trosky-red" aria-hidden />
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
        </div>
      )}
    </div>
  );
}
