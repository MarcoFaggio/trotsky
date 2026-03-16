"use server";

import { prisma } from "@hotel-pricing/db";
import { requireHotelAccess } from "@/lib/rbac";
import type { DashboardDay } from "@hotel-pricing/shared";

export async function getDashboardData(
  hotelId: string,
  startDate: string,
  endDate: string
): Promise<DashboardDay[]> {
  await requireHotelAccess(hotelId);

  const start = new Date(startDate + "T00:00:00.000Z");
  const end = new Date(endDate + "T00:00:00.000Z");

  const [hotel, hotelRates, competitors, occupancy, recommendations, events, promotions, overrides] = await Promise.all([
    prisma.hotel.findUnique({ where: { id: hotelId } }),
    prisma.dailyRate.findMany({
      where: { hotelId, listingType: "HOTEL", date: { gte: start, lte: end } },
      orderBy: { date: "asc" },
    }),
    prisma.hotelCompetitor.findMany({
      where: { hotelId, active: true },
      include: {
        competitor: {
          include: {
            dailyRates: {
              where: { date: { gte: start, lte: end } },
              orderBy: { date: "asc" },
            },
          },
        },
      },
    }),
    prisma.occupancyEntry.findMany({
      where: { hotelId, date: { gte: start, lte: end } },
    }),
    prisma.recommendation.findMany({
      where: { hotelId, date: { gte: start, lte: end } },
    }),
    prisma.event.findMany({
      where: { hotelId, date: { gte: start, lte: end } },
    }),
    prisma.promotion.findMany({
      where: {
        hotelId,
        startDate: { lte: end },
        endDate: { gte: start },
      },
    }),
    prisma.priceOverride.findMany({
      where: { hotelId, date: { gte: start, lte: end } },
    }),
  ]);

  const days: DashboardDay[] = [];
  const current = new Date(start);

  while (current <= end) {
    const dateStr = current.toISOString().split("T")[0];
    const dateStart = new Date(dateStr + "T00:00:00.000Z");

    const hotelRate = hotelRates.find(
      (r) => r.date.toISOString().split("T")[0] === dateStr
    );
    const occ = occupancy.find(
      (o) => o.date.toISOString().split("T")[0] === dateStr
    );
    const rec = recommendations.find(
      (r) => r.date.toISOString().split("T")[0] === dateStr
    );
    const override = overrides.find(
      (o) => o.date.toISOString().split("T")[0] === dateStr
    );
    const hasEvent = events.some(
      (e) => e.date.toISOString().split("T")[0] === dateStr
    );
    const hasPromotion = promotions.some(
      (p) =>
        p.startDate.toISOString().split("T")[0] <= dateStr &&
        p.endDate.toISOString().split("T")[0] >= dateStr
    );

    const compData = competitors.map((hc) => {
      const rate = hc.competitor.dailyRates.find(
        (r) => r.date.toISOString().split("T")[0] === dateStr
      );
      return {
        id: hc.competitor.id,
        name: hc.competitor.name,
        weight: hc.weight,
        rate: rate ? rate.priceCents : null,
      };
    });

    const validCompRates = compData.filter((c) => c.rate !== null);
    const totalWeight = validCompRates.reduce((sum, c) => sum + c.weight, 0);
    const compAvg =
      totalWeight > 0
        ? validCompRates.reduce(
            (sum, c) => sum + (c.rate || 0) * c.weight,
            0
          ) / totalWeight
        : null;

    days.push({
      date: dateStr,
      ourRate: override ? override.overridePriceCents : (hotelRate?.priceCents || null),
      recommendedRate: rec?.recommendedPriceCents || null,
      compAvgRate: compAvg ? Math.round(compAvg) : null,
      occPercent: occ?.occPercent || null,
      occLyPercent: occ?.occLyPercent || null,
      otbRooms: occ?.roomsOnBooks || null,
      otbLyRooms: occ?.otbLyRooms || null,
      hasEvent,
      hasPromotion,
      overrideRate: override?.overridePriceCents || null,
      confidence: rec?.confidence || null,
      availableRooms: occ?.availableRooms ?? null,
      forecastRooms: occ?.forecastRooms ?? null,
      forecastPercent: occ?.forecastPercent ?? null,
      arrivals: occ?.arrivals ?? null,
      departures: occ?.departures ?? null,
      overbookingLimit: occ?.overbookingLimit ?? null,
      competitors: compData,
    });

    current.setDate(current.getDate() + 1);
  }

  return days;
}

export async function getHotelSummary(hotelId: string) {
  await requireHotelAccess(hotelId);
  return prisma.hotel.findUnique({
    where: { id: hotelId },
    include: {
      listings: true,
      _count: {
        select: { competitors: { where: { active: true } } },
      },
    },
  });
}
