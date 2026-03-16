"use server";

import { prisma } from "@hotel-pricing/db";
import { requireHotelAccess } from "@/lib/rbac";
import { getSession } from "@/lib/auth";
import { computeWeightedAvg, toDateString } from "@hotel-pricing/shared";
import type {
  OverviewData,
  OverviewHotel,
  SevenDayRate,
  OverviewGraphData,
  CompetitorCard,
  OverviewAlerts,
  MessagingSummary,
} from "@hotel-pricing/shared";

const STALE_THRESHOLD_MS = 4 * 60 * 60 * 1000; // 4 hours

export async function getOverviewData(
  hotelId: string,
  graphRange: number = 14
): Promise<OverviewData> {
  const session = await requireHotelAccess(hotelId);
  const isAnalyst = session.role === "ANALYST";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toDateString(today);

  const sevenDaysEnd = new Date(today);
  sevenDaysEnd.setDate(sevenDaysEnd.getDate() + 6);

  const graphEnd = new Date(today);
  graphEnd.setDate(graphEnd.getDate() + graphRange - 1);

  const [
    hotel,
    hotelRates,
    competitorLinks,
    occupancyEntries,
    recommendations,
    overrides,
    events,
    promotions,
    latestScrapedRate,
    unreadMessages,
  ] = await Promise.all([
    prisma.hotel.findUniqueOrThrow({
      where: { id: hotelId },
      select: {
        id: true,
        name: true,
        city: true,
        pmsName: true,
        roomCount: true,
        minRate: true,
        maxRate: true,
        occTarget: true,
        thumbnailUrl: true,
      },
    }),
    prisma.dailyRate.findMany({
      where: {
        hotelId,
        listingType: "HOTEL",
        date: { gte: today, lte: graphEnd },
      },
      orderBy: { date: "asc" },
    }),
    prisma.hotelCompetitor.findMany({
      where: { hotelId, active: true },
      include: {
        competitor: {
          include: {
            dailyRates: {
              where: { date: { gte: today, lte: graphEnd } },
              orderBy: { date: "asc" },
            },
            listings: { where: { active: true }, take: 1 },
            reviews: { orderBy: { scrapedAt: "desc" }, take: 1 },
          },
        },
      },
    }),
    prisma.occupancyEntry.findMany({
      where: { hotelId, date: { gte: today, lte: graphEnd } },
    }),
    prisma.recommendation.findMany({
      where: { hotelId, date: { gte: today, lte: graphEnd } },
    }),
    prisma.priceOverride.findMany({
      where: { hotelId, date: { gte: today, lte: graphEnd } },
    }),
    prisma.event.findMany({
      where: { hotelId, date: { gte: today, lte: graphEnd } },
    }),
    prisma.promotion.findMany({
      where: {
        hotelId,
        startDate: { lte: graphEnd },
        endDate: { gte: today },
      },
    }),
    prisma.dailyRate.findFirst({
      where: { hotelId, listingType: "HOTEL" },
      orderBy: { scrapedAt: "desc" },
      select: { scrapedAt: true },
    }),
    prisma.message.count({
      where: {
        readAt: null,
        thread: { hotelId },
        NOT: { senderUserId: session.sub },
      },
    }),
  ]);

  const lastUpdated = latestScrapedRate?.scrapedAt ?? null;
  const isStale =
    !lastUpdated ||
    Date.now() - lastUpdated.getTime() > STALE_THRESHOLD_MS;

  const overviewHotel: OverviewHotel = {
    id: hotel.id,
    name: hotel.name,
    city: hotel.city,
    pmsName: hotel.pmsName,
    roomCount: hotel.roomCount,
    minRate: hotel.minRate,
    maxRate: hotel.maxRate,
    occTarget: hotel.occTarget,
    thumbnailUrl: hotel.thumbnailUrl,
    lastUpdated: lastUpdated?.toISOString() ?? null,
    isStale,
  };

  // Build seven-day rate cards
  const sevenDayRates: SevenDayRate[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateStr = toDateString(d);

    const override = overrides.find(
      (o) => toDateString(o.date) === dateStr
    );
    const rate = hotelRates.find(
      (r) => toDateString(r.date) === dateStr
    );
    const rateCents = override?.overridePriceCents ?? rate?.priceCents ?? null;

    // Previous day rate for change calculation
    let changePct: number | null = null;
    if (i > 0 && rateCents !== null) {
      const prevDay = sevenDayRates[i - 1];
      if (prevDay?.rateCents) {
        changePct =
          ((rateCents - prevDay.rateCents) / prevDay.rateCents) * 100;
      }
    }

    const occ = occupancyEntries.find(
      (o) => toDateString(o.date) === dateStr
    );

    sevenDayRates.push({
      date: dateStr,
      rateCents,
      changePct: changePct !== null ? Math.round(changePct * 10) / 10 : null,
      occPercent: occ?.occPercent ?? null,
      isToday: dateStr === todayStr,
    });
  }

  // Build graph data for the full range
  const graphDates: string[] = [];
  const yourHotelData: (number | null)[] = [];
  const compAvgData: (number | null)[] = [];
  const recommendedData: (number | null)[] = [];
  const occupancyData: (number | null)[] = [];
  const compSeries: {
    id: string;
    name: string;
    data: (number | null)[];
  }[] = competitorLinks.map((cl) => ({
    id: cl.competitor.id,
    name: cl.competitor.name,
    data: [],
  }));

  for (let i = 0; i < graphRange; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateStr = toDateString(d);
    graphDates.push(dateStr);

    const override = overrides.find(
      (o) => toDateString(o.date) === dateStr
    );
    const rate = hotelRates.find(
      (r) => toDateString(r.date) === dateStr
    );
    const ourRate =
      override?.overridePriceCents ?? rate?.priceCents ?? null;
    yourHotelData.push(ourRate);

    const rec = recommendations.find(
      (r) => toDateString(r.date) === dateStr
    );
    recommendedData.push(rec?.recommendedPriceCents ?? null);

    const occ = occupancyEntries.find(
      (o) => toDateString(o.date) === dateStr
    );
    occupancyData.push(occ?.occPercent ?? null);

    const compRatesForAvg: { rate: number; weight: number }[] = [];
    for (let ci = 0; ci < competitorLinks.length; ci++) {
      const cl = competitorLinks[ci];
      const compRate = cl.competitor.dailyRates.find(
        (r) => toDateString(r.date) === dateStr
      );
      const cents = compRate?.priceCents ?? null;
      compSeries[ci].data.push(cents);
      if (cents !== null) {
        compRatesForAvg.push({ rate: cents, weight: cl.weight });
      }
    }
    const avg = computeWeightedAvg(compRatesForAvg);
    compAvgData.push(avg > 0 ? Math.round(avg) : null);
  }

  const graphData: OverviewGraphData = {
    dates: graphDates,
    yourHotel: yourHotelData,
    competitors: compSeries,
    compAvg: compAvgData,
    recommended: recommendedData,
    occupancy: occupancyData,
  };

  // Build competitor cards
  const todayRate = sevenDayRates[0]?.rateCents ?? null;
  const competitorCards: CompetitorCard[] = competitorLinks.map((cl) => {
    const comp = cl.competitor;
    const todayCompRate = comp.dailyRates.find(
      (r) => toDateString(r.date) === todayStr
    );
    const review = comp.reviews[0];
    const listing = comp.listings[0];
    const currentRate = todayCompRate?.priceCents ?? null;

    let priceDiffPct: number | null = null;
    if (currentRate !== null && todayRate !== null && todayRate > 0) {
      priceDiffPct =
        Math.round(((currentRate - todayRate) / todayRate) * 1000) / 10;
    }

    const compLastScraped = todayCompRate?.scrapedAt ?? null;

    return {
      id: comp.id,
      name: comp.name,
      currentRate,
      rating: review?.ratingValue ?? null,
      reviewCount: review?.reviewCount ?? null,
      priceDiffPct,
      source: listing?.ota ?? "EXPEDIA",
      lastUpdated: compLastScraped?.toISOString() ?? null,
      listingUrl: listing?.url ?? null,
      dataPending: currentRate === null,
      weight: cl.weight,
    };
  });

  // Build alerts
  const activePromotions = promotions.filter((p) => {
    const start = toDateString(p.startDate);
    const end = toDateString(p.endDate);
    return start <= todayStr && end >= todayStr;
  }).length;

  const alerts: OverviewAlerts = {
    eventCount: events.filter((e) => toDateString(e.date) === todayStr)
      .length,
    activePromotions,
    discountWarning: false,
    staleData: isStale,
  };

  // Messaging summary
  const latestMsg = await prisma.message.findFirst({
    where: { thread: { hotelId } },
    orderBy: { createdAt: "desc" },
    select: { body: true },
  });

  const messagingSummary: MessagingSummary = {
    unreadCount: unreadMessages,
    latestSnippet: latestMsg
      ? latestMsg.body.length > 80
        ? latestMsg.body.slice(0, 80) + "..."
        : latestMsg.body
      : null,
  };

  return {
    hotel: overviewHotel,
    sevenDayRates,
    graphData,
    competitorCards,
    alerts,
    messagingSummary,
    roleFlags: {
      showSearch: isAnalyst,
      showAddHotel: isAnalyst,
      showEdit: isAnalyst,
      showClientBadge: !isAnalyst,
    },
  };
}
