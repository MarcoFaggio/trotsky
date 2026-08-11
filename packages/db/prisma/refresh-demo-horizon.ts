/**
 * Refresh time-bound demo data (rates, occupancy, recommendations, seed actions)
 * without wiping users/hotels. Use when a demo DB was seeded weeks ago and the
 * rolling 7/14-day UI windows show empty/null rates.
 *
 * Usage (from repo root, with DATABASE_URL set):
 *   SEED_FORCE=true pnpm db:refresh-demo
 *
 * Requires SEED_FORCE=true for non-local databases (same safety model as seed).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function toDateOnly(d: Date): Date {
  return new Date(d.toISOString().split("T")[0] + "T00:00:00.000Z");
}

function mockPrice(base: number, dayOffset: number, seed: number): number {
  const sinWave = Math.sin((dayOffset + seed) * 0.3) * 1500;
  const dowFactor = dayOffset % 7 >= 5 ? 2000 : 0;
  const variation = ((seed * 7 + dayOffset * 13) % 1000) - 500;
  return Math.max(5000, Math.round(base + sinWave + dowFactor + variation));
}

function assertRefreshIsSafe(): void {
  if (process.env.SEED_FORCE === "true") {
    console.warn("SEED_FORCE=true — refreshing demo horizon on this database.");
    return;
  }

  const problems: string[] = [];
  if (process.env.NODE_ENV === "production") {
    problems.push(`NODE_ENV is "production"`);
  }

  const dbUrl = process.env.DATABASE_URL ?? "";
  const localHosts = [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "host.docker.internal",
    "postgres",
    "db",
  ];
  try {
    const host = new URL(dbUrl).hostname;
    if (host && !localHosts.includes(host)) {
      problems.push(`DATABASE_URL points at non-local host "${host}"`);
    }
  } catch {
    // Unparseable URL — let Prisma surface the real error.
  }

  if (problems.length > 0) {
    console.error(
      [
        "Refusing to refresh demo horizon on a non-local database.",
        ...problems.map((p) => `  - ${p}`),
        "Re-run with SEED_FORCE=true if you intend to rewrite demo rates/actions.",
      ].join("\n")
    );
    process.exit(1);
  }
}

async function refreshHotelHorizon(hotelId: string): Promise<void> {
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
    throw new Error(`Hotel not found: ${hotelId}`);
  }

  const competitors = hotel.competitors.map((link, index) => ({
    id: link.competitor.id,
    seed: index + 1,
  }));

  const recentScrapeTime = new Date();
  recentScrapeTime.setHours(recentScrapeTime.getHours() - 1);
  const scrapeRun = await prisma.scrapeRun.create({
    data: {
      status: "COMPLETED",
      mode: "MOCK",
      startedAt: recentScrapeTime,
      finishedAt: new Date(),
      summaryJson: {
        listingsScraped: 1 + competitors.length,
        ratesStored: 30 * (1 + competitors.length),
        failures: 0,
        trigger: "refresh-demo-horizon",
      },
    },
  });

  const today = toDateOnly(new Date());
  const hotelBasePrice = hotel.minRate
    ? Math.max(hotel.minRate + 2000, 11900)
    : 11900;

  for (let i = 0; i < 30; i++) {
    const date = toDateOnly(addDays(today, i));

    await prisma.dailyRate.upsert({
      where: {
        daily_rate_hotel_listing_date: {
          listingType: "HOTEL",
          hotelId: hotel.id,
          ota: "EXPEDIA",
          date,
        },
      },
      create: {
        listingType: "HOTEL",
        hotelId: hotel.id,
        ota: "EXPEDIA",
        date,
        priceCents: mockPrice(hotelBasePrice, i, 0),
        currency: "USD",
        scrapedAt: recentScrapeTime,
        sourceRunId: scrapeRun.id,
      },
      update: {
        priceCents: mockPrice(hotelBasePrice, i, 0),
        scrapedAt: recentScrapeTime,
        sourceRunId: scrapeRun.id,
      },
    });

    for (const comp of competitors) {
      const compBase = hotelBasePrice + (comp.seed - 3) * 1500;
      await prisma.dailyRate.upsert({
        where: {
          daily_rate_competitor_listing_date: {
            listingType: "COMPETITOR",
            competitorId: comp.id,
            ota: "EXPEDIA",
            date,
          },
        },
        create: {
          listingType: "COMPETITOR",
          competitorId: comp.id,
          ota: "EXPEDIA",
          date,
          priceCents: mockPrice(compBase, i, comp.seed),
          currency: "USD",
          scrapedAt: recentScrapeTime,
          sourceRunId: scrapeRun.id,
        },
        update: {
          priceCents: mockPrice(compBase, i, comp.seed),
          scrapedAt: recentScrapeTime,
          sourceRunId: scrapeRun.id,
        },
      });
    }
  }

  const roomCount = hotel.roomCount || 92;
  for (let i = 0; i < 15; i++) {
    const date = toDateOnly(addDays(today, i));
    const baseOcc = 72 + Math.sin(i * 0.5) * 15;
    const lyOcc = 68 + Math.sin(i * 0.5) * 12;
    const otb = Math.round((baseOcc / 100) * roomCount);
    const otbLy = Math.round((lyOcc / 100) * roomCount);
    const available = roomCount - otb;
    const forecastOcc = baseOcc + ((i * 17) % 5) - 2;
    const forecastRooms = Math.round((forecastOcc / 100) * roomCount);

    await prisma.occupancyEntry.upsert({
      where: { hotelId_date: { hotelId: hotel.id, date } },
      create: {
        hotelId: hotel.id,
        date,
        occPercent: Math.round(baseOcc * 10) / 10,
        roomsOnBooks: otb,
        occLyPercent: Math.round(lyOcc * 10) / 10,
        otbLyRooms: otbLy,
        availableRooms: Math.max(0, available),
        forecastRooms,
        forecastPercent: Math.round(forecastOcc * 10) / 10,
        arrivals: Math.max(0, Math.round(12 + Math.sin(i * 0.7) * 8)),
        departures: Math.max(0, Math.round(10 + Math.sin(i * 0.7 + 1) * 7)),
        overbookingLimit: i % 7 >= 5 ? 95 : 93,
      },
      update: {
        occPercent: Math.round(baseOcc * 10) / 10,
        roomsOnBooks: otb,
        occLyPercent: Math.round(lyOcc * 10) / 10,
        otbLyRooms: otbLy,
        availableRooms: Math.max(0, available),
        forecastRooms,
        forecastPercent: Math.round(forecastOcc * 10) / 10,
      },
    });
  }

  for (let i = 0; i < 14; i++) {
    const date = toDateOnly(addDays(today, i));
    const recPrice = mockPrice(12200, i, 99);
    await prisma.recommendation.upsert({
      where: { hotelId_date: { hotelId: hotel.id, date } },
      create: {
        hotelId: hotel.id,
        date,
        recommendedPriceCents: recPrice,
        confidence: 0.65 + Math.sin(i) * 0.15,
        rationaleJson: [
          `Comp anchor: $${(mockPrice(11500, i, 50) / 100).toFixed(0)}`,
          i % 7 >= 5 ? "Weekend demand boost: +5%" : "Midweek rate",
          "Occupancy near target: neutral adjustment",
        ],
      },
      update: {
        recommendedPriceCents: recPrice,
        confidence: 0.65 + Math.sin(i) * 0.15,
      },
    });
  }

  const satDate = toDateOnly(addDays(today, 10));
  const friDate = toDateOnly(addDays(today, 5));
  const eventWeekendDate = toDateOnly(addDays(today, 7));
  const concertDate = toDateOnly(addDays(today, 4));
  const sportsDate = toDateOnly(addDays(today, 10));
  const parityDate = toDateOnly(addDays(today, 3));
  const expiresAt = addDays(today, 14);

  const revenueActions = [
    {
      actionKey: `price-change:${satDate.toISOString().slice(0, 10)}`,
      type: "PRICE_CHANGE" as const,
      title: "Raise Saturday rate to $169",
      summary:
        "You are $33 below comp median with strong weekend demand and three competitors sold out.",
      reason:
        "Comp anchor $178, occupancy trending above target, event weekend in 7 days.",
      urgency: "HIGH" as const,
      confidence: "HIGH" as const,
      stayDate: satDate,
      currentValueCents: 14500,
      recommendedValueCents: 16900,
      estimatedUpsideLowCents: 18000,
      estimatedUpsideHighCents: 42000,
      evidenceJson: {
        compMedianCents: 17800,
        rateGapCents: -3300,
        competitorsSoldOut: 3,
        competitorCount: 5,
        demandLevel: "HIGH",
        source: "seed-demo",
      },
      source: "SEED",
    },
    {
      actionKey: `price-change:${friDate.toISOString().slice(0, 10)}-watch`,
      type: "WATCH_DEMAND" as const,
      title: "Watch Friday demand spike",
      summary:
        "Pickup accelerated 12% vs LY; comp median up 8% in the last 48 hours.",
      reason: "Monitor before committing to a floor increase.",
      urgency: "MEDIUM" as const,
      confidence: "MEDIUM" as const,
      stayDate: friDate,
      currentValueCents: 13200,
      recommendedValueCents: 14500,
      estimatedUpsideLowCents: 4000,
      estimatedUpsideHighCents: 12000,
      evidenceJson: {
        compMedianCents: 15100,
        rateGapCents: -1900,
        competitorsSoldOut: 1,
        demandLevel: "MEDIUM",
        pickupVsLyPercent: 12,
        source: "seed-demo",
      },
      source: "SEED",
    },
    {
      actionKey: `price-change:${eventWeekendDate.toISOString().slice(0, 10)}-event-weekend`,
      type: "PRICE_CHANGE" as const,
      title: "Raise event weekend BAR",
      summary:
        "Atlanta Music Festival weekend: comp set tightening, recommend +$18 on BAR.",
      reason: "Event on calendar with positive demand signals.",
      urgency: "HIGH" as const,
      confidence: "MEDIUM" as const,
      stayDate: eventWeekendDate,
      currentValueCents: 13800,
      recommendedValueCents: 15600,
      estimatedUpsideLowCents: 8000,
      estimatedUpsideHighCents: 22000,
      evidenceJson: {
        eventName: "Atlanta Music Festival",
        eventDaysAway: 7,
        compMedianCents: 16200,
        demandLevel: "HIGH",
        source: "seed-demo",
      },
      source: "SEED",
    },
    {
      actionKey: `event-pricing:${concertDate.toISOString().slice(0, 10)}-concert`,
      type: "EVENT_PRICING" as const,
      title: "Add event pricing for downtown concert",
      summary:
        "Concert in 4 days; comp median up 18%, three competitors sold out on shoulder night.",
      reason: "Layer event BAR or min-stay before compression day.",
      urgency: "HIGH" as const,
      confidence: "HIGH" as const,
      stayDate: concertDate,
      currentValueCents: 12900,
      recommendedValueCents: 15500,
      evidenceJson: {
        eventName: "City Concert",
        eventDaysAway: 4,
        compMedianCents: 17800,
        competitorsSoldOut: 3,
        demandLevel: "HIGH",
        source: "seed-demo",
      },
      source: "SEED",
    },
    {
      actionKey: `event-pricing:${sportsDate.toISOString().slice(0, 10)}-sports`,
      type: "EVENT_PRICING" as const,
      title: "Prepare pricing for sports event",
      summary:
        "Tech Conference at Georgia World Congress in 10 days — build ladder now.",
      reason: "Longer booking window; set BAR floors before compression.",
      urgency: "MEDIUM" as const,
      confidence: "MEDIUM" as const,
      stayDate: sportsDate,
      evidenceJson: {
        eventName: "Tech Conference at Georgia World Congress",
        eventDaysAway: 10,
        demandLevel: "MEDIUM",
        source: "seed-demo",
      },
      source: "SEED",
    },
    {
      actionKey: "watch-demand:comp-median-rising",
      type: "WATCH_DEMAND" as const,
      title: "Competitor median rising across next 7 days",
      summary:
        "Weighted comp median +6% WoW while your BAR is flat on 4 key dates.",
      reason: "Review parity and pace before competitors capture share.",
      urgency: "MEDIUM" as const,
      confidence: "MEDIUM" as const,
      evidenceJson: {
        compMedianMovementPercent: 6,
        datesAffected: 4,
        demandLevel: "MEDIUM",
        source: "seed-demo",
      },
      source: "SEED",
    },
    {
      actionKey: "watch-demand:weekend-pickup",
      type: "WATCH_DEMAND" as const,
      title: "Weekend pickup warning",
      summary:
        "OTB for next weekend is 8 pts behind LY with only 5 days to recover.",
      reason: "Consider tactical promotion or BAR adjustment on Thu–Sat.",
      urgency: "CRITICAL" as const,
      confidence: "HIGH" as const,
      evidenceJson: {
        occPercent: 64,
        occLyPercent: 72,
        paceGapPoints: -8,
        demandLevel: "HIGH",
        source: "seed-demo",
      },
      source: "SEED",
    },
    {
      actionKey: `parity-fix:${parityDate.toISOString().slice(0, 10)}-expedia-mobile`,
      type: "PARITY_FIX" as const,
      title: "Fix Expedia mobile parity (demo)",
      summary:
        "Expedia mobile shows $127 vs Booking $145 and direct — likely mobile/member promo (beta evidence).",
      reason: "Demo parity row; real parity engine not enabled in this build.",
      urgency: "HIGH" as const,
      confidence: "MEDIUM" as const,
      stayDate: parityDate,
      currentValueCents: 14500,
      recommendedValueCents: 14500,
      evidenceJson: {
        channelRates: [
          { channel: "Booking.com", rateCents: 14500, status: "aligned" },
          { channel: "Expedia mobile", rateCents: 12700, status: "issue" },
          { channel: "Direct", rateCents: 14500, status: "aligned" },
        ],
        parityGapCents: -1800,
        demoBeta: true,
        source: "seed-demo",
      },
      source: "SEED",
    },
  ];

  // Replace dated seed actions atomically so a mid-loop failure cannot leave
  // the hotel with zero/partial demo actions.
  await prisma.$transaction([
    prisma.revenueAction.deleteMany({
      where: { hotelId: hotel.id, source: "SEED" },
    }),
    ...revenueActions.map((action) =>
      prisma.revenueAction.create({
        data: {
          hotelId: hotel.id,
          ...action,
          status: "PENDING",
          lastEvaluatedAt: new Date(),
          expiresAt,
        },
      })
    ),
  ]);

  console.log(
    `  ✓ ${hotel.name}: 30d rates, 15d occupancy, 14d recommendations, ${revenueActions.length} seed actions`
  );
}

async function main() {
  assertRefreshIsSafe();
  console.log("Refreshing demo horizon (rates / occupancy / seed actions)...");

  const hotels = await prisma.hotel.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  if (hotels.length === 0) {
    console.error("No ACTIVE hotels found. Run a full seed first:");
    console.error("  SEED_FORCE=true pnpm db:seed");
    process.exit(1);
  }

  for (const hotel of hotels) {
    await refreshHotelHorizon(hotel.id);
  }

  console.log("Done. Set TROSKY_DEMO_MODE=true on Vercel so seed actions are visible.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
