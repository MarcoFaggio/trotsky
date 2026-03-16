import { prisma } from "@hotel-pricing/db";
import { computeRecommendation } from "@hotel-pricing/shared";
import pino from "pino";

const logger = pino({ name: "recommendations" });

export async function recomputeRecommendationsProcessor(data: { hotelId?: string }) {
  const hotels = data.hotelId
    ? await prisma.hotel.findMany({ where: { id: data.hotelId, status: "ACTIVE" } })
    : await prisma.hotel.findMany({ where: { status: "ACTIVE" } });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const hotel of hotels) {
    const dates: Date[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }

    const competitors = await prisma.hotelCompetitor.findMany({
      where: { hotelId: hotel.id, active: true },
      include: { competitor: true },
    });

    for (const date of dates) {
      try {
        const hotelRate = await prisma.dailyRate.findFirst({
          where: { hotelId: hotel.id, listingType: "HOTEL", date },
          orderBy: { scrapedAt: "desc" },
        });

        const override = await prisma.priceOverride.findUnique({
          where: { hotelId_date: { hotelId: hotel.id, date } },
        });

        const occ = await prisma.occupancyEntry.findUnique({
          where: { hotelId_date: { hotelId: hotel.id, date } },
        });

        const events = await prisma.event.findMany({
          where: { hotelId: hotel.id, date },
        });

        const compRates: { rate: number; weight: number }[] = [];
        for (const hc of competitors) {
          const rate = await prisma.dailyRate.findFirst({
            where: { competitorId: hc.competitor.id, listingType: "COMPETITOR", date },
            orderBy: { scrapedAt: "desc" },
          });
          if (rate) {
            compRates.push({ rate: rate.priceCents, weight: hc.weight });
          }
        }

        const ourRate = override?.overridePriceCents || hotelRate?.priceCents || 0;
        if (ourRate === 0 && compRates.length === 0) continue;

        const result = computeRecommendation({
          ourRate,
          competitorRates: compRates,
          occPercent: occ?.occPercent || null,
          occTarget: hotel.occTarget || 75,
          occLyPercent: occ?.occLyPercent || null,
          otbRooms: occ?.roomsOnBooks || null,
          otbLyRooms: occ?.otbLyRooms || null,
          hasEvent: events.length > 0,
          minRate: hotel.minRate,
          maxRate: hotel.maxRate,
          discountWarning: false,
        });

        await prisma.recommendation.upsert({
          where: { hotelId_date: { hotelId: hotel.id, date } },
          create: {
            hotelId: hotel.id,
            date,
            recommendedPriceCents: result.recommendedPriceCents,
            confidence: result.confidence,
            rationaleJson: result.rationale,
          },
          update: {
            recommendedPriceCents: result.recommendedPriceCents,
            confidence: result.confidence,
            rationaleJson: result.rationale,
          },
        });
      } catch (err: any) {
        logger.error({ error: err.message, hotelId: hotel.id, date: date.toISOString() }, "Failed to compute recommendation");
      }
    }

    logger.info({ hotelId: hotel.id }, "Recommendations recomputed");
  }
}
