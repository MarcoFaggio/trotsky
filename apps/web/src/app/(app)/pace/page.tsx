import { getSession } from "@/lib/auth";
import { prisma } from "@hotel-pricing/db";
import { computeWeightedAvg } from "@hotel-pricing/shared";
import { redirect } from "next/navigation";
import { PaceDashboard } from "@/components/dashboard/pace-dashboard";

export default async function PacePage({
  searchParams,
}: {
  searchParams: { hotelId?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  let hotels;
  if (session.role === "ANALYST") {
    hotels = await prisma.hotel.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, roomCount: true },
      orderBy: { name: "asc" },
    });
  } else {
    hotels = await prisma.hotel.findMany({
      where: { access: { some: { userId: session.sub } }, status: "ACTIVE" },
      select: { id: true, name: true, roomCount: true },
      orderBy: { name: "asc" },
    });
  }

  const requestedHotelId = searchParams.hotelId;
  const hotelId =
    (requestedHotelId && hotels.some((h) => h.id === requestedHotelId)
      ? requestedHotelId
      : hotels[0]?.id) || undefined;

  let occupancy: Awaited<ReturnType<typeof prisma.occupancyEntry.findMany>> = [];
  let compAvgRate: number | null = null;
  let ourRate: number | null = null;

  if (hotelId) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setUTCDate(end.getUTCDate() + 30);

    occupancy = await prisma.occupancyEntry.findMany({
      where: { hotelId, date: { gte: today, lte: end } },
      orderBy: { date: "asc" },
    });

    const todayRate = await prisma.dailyRate.findFirst({
      where: { hotelId, listingType: "HOTEL", date: today },
      orderBy: { scrapedAt: "desc" },
    });
    ourRate = todayRate?.priceCents ?? null;

    const competitors = await prisma.hotelCompetitor.findMany({
      where: { hotelId, active: true },
      include: {
        competitor: {
          include: {
            dailyRates: {
              where: { date: today },
              orderBy: { scrapedAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    const weightedRates = competitors
      .filter((c) => c.competitor.dailyRates[0]?.priceCents != null)
      .map((c) => ({
        rate: c.competitor.dailyRates[0]!.priceCents,
        weight: c.weight,
      }));

    if (weightedRates.length > 0) {
      compAvgRate = computeWeightedAvg(weightedRates);
    }
  }

  return (
    <PaceDashboard
      key={hotelId ?? "none"}
      hotels={hotels}
      initialHotelId={hotelId || null}
      occupancy={occupancy.map((o) => ({
        date: o.date.toISOString().split("T")[0],
        otbRooms: o.roomsOnBooks,
        otbLyRooms: o.otbLyRooms,
        occPercent: o.occPercent,
        occLyPercent: o.occLyPercent,
      }))}
      ourRate={ourRate}
      compAvgRate={compAvgRate}
    />
  );
}
