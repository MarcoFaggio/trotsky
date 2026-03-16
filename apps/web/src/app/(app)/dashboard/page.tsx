import { getSession } from "@/lib/auth";
import { prisma } from "@hotel-pricing/db";
import { redirect } from "next/navigation";
import { OverviewDashboard } from "@/components/dashboard/overview-dashboard";
import { cookies } from "next/headers";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { hotelId?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  let hotelId: string | null = searchParams.hotelId || null;

  if (session.role === "CLIENT") {
    const access = await prisma.hotelAccess.findFirst({
      where: { userId: session.sub },
    });
    if (!access) redirect("/login");
    hotelId = access.hotelId;
  }

  if (!hotelId) {
    const firstHotel = await prisma.hotel.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true },
    });
    if (!firstHotel) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <h2 className="text-xl font-semibold mb-2">No Hotels Found</h2>
          <p className="text-muted-foreground text-sm">
            Create your first hotel to get started.
          </p>
        </div>
      );
    }
    hotelId = firstHotel.id;
  }

  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    include: {
      competitors: {
        where: { active: true },
        include: { competitor: true },
      },
    },
  });

  if (!hotel) {
    const fallback = await prisma.hotel.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true },
    });
    if (fallback) redirect(`/dashboard?hotelId=${fallback.id}`);
    redirect("/login");
  }

  if (session.role === "CLIENT") {
    const access = await prisma.hotelAccess.findFirst({
      where: { userId: session.sub, hotelId: hotel.id },
    });
    if (!access) {
      await prisma.securityEvent.create({
        data: {
          userId: session.sub,
          hotelId: hotel.id,
          type: "UNAUTHORIZED_HOTEL_ACCESS",
          metadataJson: { attempted: hotel.id },
        },
      });
      const clientAccess = await prisma.hotelAccess.findFirst({
        where: { userId: session.sub },
      });
      if (clientAccess) redirect(`/dashboard?hotelId=${clientAccess.hotelId}`);
      redirect("/login");
    }
  }

  return (
    <OverviewDashboard
      hotel={{
        id: hotel.id,
        name: hotel.name,
        roomCount: hotel.roomCount,
        minRate: hotel.minRate,
        maxRate: hotel.maxRate,
        occTarget: hotel.occTarget,
      }}
      competitors={hotel.competitors.map((hc) => ({
        id: hc.competitor.id,
        name: hc.competitor.name,
        weight: hc.weight,
      }))}
      isAnalyst={session.role === "ANALYST"}
    />
  );
}
