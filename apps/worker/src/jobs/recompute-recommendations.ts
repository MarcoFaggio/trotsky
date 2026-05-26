import { prisma } from "@hotel-pricing/db";
import {
  computeRecommendation,
  computeSignalPressure,
  toDateString,
} from "@hotel-pricing/shared";
import pino from "pino";
import { upsertDemandAndEventActionsForHotel } from "../services/demand-action-builder";
import { upsertPriceChangeActionsForHotel } from "../services/revenue-action-builder";

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
    const endDate = dates[dates.length - 1];

    const [
      competitors,
      hotelRates,
      overrides,
      occupancyEntries,
      events,
      signalImpacts,
    ] = await Promise.all([
      prisma.hotelCompetitor.findMany({
        where: { hotelId: hotel.id, active: true },
        include: { competitor: true },
      }),
      prisma.dailyRate.findMany({
        where: {
          hotelId: hotel.id,
          listingType: "HOTEL",
          date: { gte: today, lte: endDate },
        },
        orderBy: { scrapedAt: "desc" },
      }),
      prisma.priceOverride.findMany({
        where: { hotelId: hotel.id, date: { gte: today, lte: endDate } },
      }),
      prisma.occupancyEntry.findMany({
        where: { hotelId: hotel.id, date: { gte: today, lte: endDate } },
      }),
      prisma.event.findMany({
        where: { hotelId: hotel.id, date: { gte: today, lte: endDate } },
      }),
      prisma.hotelSignalImpact.findMany({
        where: { hotelId: hotel.id, date: { gte: today, lte: endDate } },
        select: { date: true, impactBps: true, isSuppressed: true },
      }),
    ]);

    const competitorIds = competitors.map((hc) => hc.competitor.id);
    const competitorRates = competitorIds.length
      ? await prisma.dailyRate.findMany({
          where: {
            competitorId: { in: competitorIds },
            listingType: "COMPETITOR",
            date: { gte: today, lte: endDate },
          },
          orderBy: { scrapedAt: "desc" },
        })
      : [];

    const hotelRateByDate = new Map<string, (typeof hotelRates)[number]>();
    for (const rate of hotelRates) {
      const key = toDateString(rate.date);
      if (!hotelRateByDate.has(key)) {
        hotelRateByDate.set(key, rate);
      }
    }

    const overrideByDate = new Map(
      overrides.map((override) => [toDateString(override.date), override])
    );
    const occupancyByDate = new Map(
      occupancyEntries.map((entry) => [toDateString(entry.date), entry])
    );

    const eventCountByDate = new Map<string, number>();
    for (const event of events) {
      const key = toDateString(event.date);
      eventCountByDate.set(key, (eventCountByDate.get(key) ?? 0) + 1);
    }

    const signalImpactsByDate = new Map<
      string,
      { impactBps: number; isSuppressed?: boolean }[]
    >();
    for (const impact of signalImpacts) {
      const key = toDateString(impact.date);
      const list = signalImpactsByDate.get(key) ?? [];
      list.push(impact);
      signalImpactsByDate.set(key, list);
    }

    const compRateByCompetitorDate = new Map<
      string,
      (typeof competitorRates)[number]
    >();
    for (const rate of competitorRates) {
      if (!rate.competitorId) continue;
      const key = `${rate.competitorId}:${toDateString(rate.date)}`;
      if (!compRateByCompetitorDate.has(key)) {
        compRateByCompetitorDate.set(key, rate);
      }
    }

    for (const date of dates) {
      try {
        const dateStr = toDateString(date);
        const hotelRate = hotelRateByDate.get(dateStr);
        const override = overrideByDate.get(dateStr);
        const occ = occupancyByDate.get(dateStr);
        const eventCount = eventCountByDate.get(dateStr) ?? 0;
        const daySignalImpacts = signalImpactsByDate.get(dateStr) ?? [];

        const compRates: { rate: number; weight: number }[] = [];
        for (const hc of competitors) {
          const rate = compRateByCompetitorDate.get(
            `${hc.competitor.id}:${dateStr}`
          );
          if (rate) {
            compRates.push({ rate: rate.priceCents, weight: hc.weight });
          }
        }

        const ourRate = override?.overridePriceCents || hotelRate?.priceCents || 0;
        if (ourRate === 0 && compRates.length === 0) continue;

        const signalPressure = computeSignalPressure(daySignalImpacts);
        const result = computeRecommendation({
          ourRate,
          competitorRates: compRates,
          occPercent: occ?.occPercent || null,
          occTarget: hotel.occTarget || 75,
          occLyPercent: occ?.occLyPercent || null,
          otbRooms: occ?.roomsOnBooks || null,
          otbLyRooms: occ?.otbLyRooms || null,
          hasEvent: eventCount > 0,
          manualEventCount: eventCount,
          signalNetBps: signalPressure.netBps,
          signalPositiveBps: signalPressure.positiveBps,
          signalNegativeBps: signalPressure.negativeBps,
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

    try {
      await upsertPriceChangeActionsForHotel({
        hotelId: hotel.id,
        recomputeWindowStart: today,
        recomputeWindowEnd: endDate,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(
        { error: message, hotelId: hotel.id },
        "Failed to upsert price change actions from recommendations"
      );
    }

    try {
      await upsertDemandAndEventActionsForHotel({
        hotelId: hotel.id,
        recomputeWindowStart: today,
        recomputeWindowEnd: endDate,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(
        { error: message, hotelId: hotel.id },
        "Failed to upsert event and demand actions"
      );
    }

    logger.info({ hotelId: hotel.id }, "Recommendations recomputed");
  }
}
