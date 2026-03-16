import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function toDateOnly(d: Date): Date {
  return new Date(d.toISOString().split("T")[0] + "T00:00:00.000Z");
}

// Deterministic price generator
function mockPrice(base: number, dayOffset: number, seed: number): number {
  const sinWave = Math.sin((dayOffset + seed) * 0.3) * 1500;
  const dowFactor = dayOffset % 7 >= 5 ? 2000 : 0; // Weekend bump
  const variation = ((seed * 7 + dayOffset * 13) % 1000) - 500;
  return Math.max(5000, Math.round(base + sinWave + dowFactor + variation));
}

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.message.deleteMany();
  await prisma.messageThread.deleteMany();
  await prisma.securityEvent.deleteMany();
  await prisma.scrapeError.deleteMany();
  await prisma.scrapeRun.deleteMany();
  await prisma.discountMix.deleteMany();
  await prisma.ratePlan.deleteMany();
  await prisma.recommendation.deleteMany();
  await prisma.priceOverride.deleteMany();
  await prisma.event.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.occupancyEntry.deleteMany();
  await prisma.reviewSnapshot.deleteMany();
  await prisma.dailyRate.deleteMany();
  await prisma.hotelListing.deleteMany();
  await prisma.competitorListing.deleteMany();
  await prisma.hotelCompetitor.deleteMany();
  await prisma.hotelAccess.deleteMany();
  await prisma.competitor.deleteMany();
  await prisma.hotel.deleteMany();
  await prisma.user.deleteMany();

  // Users
  const analystHash = await bcrypt.hash("Password123!", 12);
  const clientHash = await bcrypt.hash("Password123!", 12);

  const analyst = await prisma.user.create({
    data: {
      email: "analyst@example.com",
      passwordHash: analystHash,
      role: "ANALYST",
      name: "Demo Analyst",
    },
  });

  const client = await prisma.user.create({
    data: {
      email: "client@example.com",
      passwordHash: clientHash,
      role: "CLIENT",
      name: "Demo Client",
    },
  });

  // Hotel
  const hotel = await prisma.hotel.create({
    data: {
      name: "GA381 Comfort Inn Atlanta Downtown South",
      pmsName: "Comfort Inn ATL South",
      phone: "+1-404-555-0123",
      email: "gm@comfortinnatl.example.com",
      address: "381 Peachtree St, Atlanta, GA 30308",
      city: "Atlanta, GA",
      timezone: "America/New_York",
      roomCount: 92,
      status: "ACTIVE",
      minRate: 6500, // $65
      maxRate: 25000, // $250
      occTarget: 75,
    },
  });

  // Hotel listing
  await prisma.hotelListing.create({
    data: {
      hotelId: hotel.id,
      ota: "EXPEDIA",
      url: "https://www.expedia.com/Atlanta-Hotels-Comfort-Inn-Downtown-South.h12345.Hotel-Information",
      active: true,
    },
  });

  // Client access
  await prisma.hotelAccess.create({
    data: { userId: client.id, hotelId: hotel.id },
  });

  // Competitors
  const competitorData = [
    { name: "Holiday Inn Express Atlanta Downtown", weight: 0.85, seed: 1 },
    { name: "La Quinta Inn & Suites Atlanta Midtown", weight: 0.5, seed: 2 },
    { name: "Quality Inn Downtown Atlanta", weight: 0.85, seed: 3 },
    { name: "Days Inn by Wyndham Atlanta Downtown", weight: 0.25, seed: 4 },
    { name: "Red Roof Inn Atlanta Midtown", weight: 0.5, seed: 5 },
  ];

  const competitors = [];
  for (const cd of competitorData) {
    const comp = await prisma.competitor.create({
      data: { name: cd.name },
    });

    await prisma.competitorListing.create({
      data: {
        competitorId: comp.id,
        ota: "EXPEDIA",
        url: `https://www.expedia.com/Atlanta-Hotels-${cd.name.replace(/[^a-zA-Z0-9]/g, "-")}.h${10000 + cd.seed}.Hotel-Information`,
        active: true,
      },
    });

    await prisma.hotelCompetitor.create({
      data: {
        hotelId: hotel.id,
        competitorId: comp.id,
        weight: cd.weight,
        active: true,
      },
    });

    competitors.push({ ...comp, weight: cd.weight, seed: cd.seed });
  }

  // Scrape run for mock data (recent timestamp for realistic "last updated")
  const recentScrapeTime = new Date();
  recentScrapeTime.setHours(recentScrapeTime.getHours() - 1);
  const scrapeRun = await prisma.scrapeRun.create({
    data: {
      status: "COMPLETED",
      mode: "MOCK",
      startedAt: recentScrapeTime,
      finishedAt: new Date(),
      summaryJson: { listingsScraped: 6, ratesStored: 180, failures: 0 },
    },
  });

  // Daily rates for 30 days
  const today = toDateOnly(new Date());
  const hotelBasePrice = 11900; // $119

  for (let i = 0; i < 30; i++) {
    const date = toDateOnly(addDays(today, i));

    // Our hotel rate
    await prisma.dailyRate.create({
      data: {
        listingType: "HOTEL",
        hotelId: hotel.id,
        ota: "EXPEDIA",
        date,
        priceCents: mockPrice(hotelBasePrice, i, 0),
        currency: "USD",
        scrapedAt: recentScrapeTime,
        sourceRunId: scrapeRun.id,
      },
    });

    // Competitor rates
    for (const comp of competitors) {
      const compBase = hotelBasePrice + (comp.seed - 3) * 1500;
      await prisma.dailyRate.create({
        data: {
          listingType: "COMPETITOR",
          competitorId: comp.id,
          ota: "EXPEDIA",
          date,
          priceCents: mockPrice(compBase, i, comp.seed),
          currency: "USD",
          scrapedAt: recentScrapeTime,
          sourceRunId: scrapeRun.id,
        },
      });
    }
  }

  // Review snapshots with reviewCount
  await prisma.reviewSnapshot.create({
    data: {
      listingType: "HOTEL",
      hotelId: hotel.id,
      ota: "EXPEDIA",
      ratingValue: 4.2,
      ratingScale: 5,
      reviewCount: 234,
      sourceRunId: scrapeRun.id,
    },
  });

  const compReviewCounts = [189, 156, 312, 87, 143];
  for (let i = 0; i < competitors.length; i++) {
    const comp = competitors[i];
    await prisma.reviewSnapshot.create({
      data: {
        listingType: "COMPETITOR",
        competitorId: comp.id,
        ota: "EXPEDIA",
        ratingValue: 3.5 + comp.seed * 0.2,
        ratingScale: 5,
        reviewCount: compReviewCounts[i],
        sourceRunId: scrapeRun.id,
      },
    });
  }

  // Occupancy entries (15 days) with operational fields
  for (let i = 0; i < 15; i++) {
    const date = toDateOnly(addDays(today, i));
    const baseOcc = 72 + Math.sin(i * 0.5) * 15;
    const lyOcc = 68 + Math.sin(i * 0.5) * 12;
    const otb = Math.round((baseOcc / 100) * 92);
    const otbLy = Math.round((lyOcc / 100) * 92);
    const available = 92 - otb;
    const forecastOcc = baseOcc + (Math.random() * 4 - 2);
    const forecastRooms = Math.round((forecastOcc / 100) * 92);
    const arrivals = Math.round(12 + Math.sin(i * 0.7) * 8);
    const departures = Math.round(10 + Math.sin(i * 0.7 + 1) * 7);

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
        arrivals: Math.max(0, arrivals),
        departures: Math.max(0, departures),
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
        arrivals: Math.max(0, arrivals),
        departures: Math.max(0, departures),
        overbookingLimit: i % 7 >= 5 ? 95 : 93,
      },
    });
  }

  // Promotion
  await prisma.promotion.create({
    data: {
      hotelId: hotel.id,
      title: "Spring Weekend Special",
      description: "15% off standard room rates for weekend stays.",
      startDate: toDateOnly(addDays(today, 3)),
      endDate: toDateOnly(addDays(today, 17)),
      terms: "Valid for Fri-Sun stays. Non-refundable. Subject to availability.",
    },
  });

  // Events
  await prisma.event.create({
    data: {
      hotelId: hotel.id,
      date: toDateOnly(addDays(today, 7)),
      title: "Atlanta Music Festival",
      notes: "Major music event downtown. Expect high demand.",
    },
  });

  await prisma.event.create({
    data: {
      hotelId: hotel.id,
      date: toDateOnly(addDays(today, 14)),
      title: "Tech Conference at Georgia World Congress",
      notes: "3-day tech conference nearby.",
    },
  });

  // Rate Plans
  const barPlan = await prisma.ratePlan.create({
    data: {
      hotelId: hotel.id,
      code: "BAR",
      name: "Best Available Rate",
      discountPercent: 0,
      active: true,
    },
  });

  const aaaPlan = await prisma.ratePlan.create({
    data: {
      hotelId: hotel.id,
      code: "AAA",
      name: "AAA Member Rate",
      discountPercent: 10,
      active: true,
    },
  });

  const seniorPlan = await prisma.ratePlan.create({
    data: {
      hotelId: hotel.id,
      code: "SENIOR",
      name: "Senior Discount",
      discountPercent: 15,
      active: true,
    },
  });

  const mobilePlan = await prisma.ratePlan.create({
    data: {
      hotelId: hotel.id,
      code: "MOBILE",
      name: "Mobile Exclusive",
      discountPercent: 12,
      active: true,
    },
  });

  // Discount mix for a few days
  for (let i = 0; i < 7; i++) {
    const date = toDateOnly(addDays(today, i));
    await prisma.discountMix.createMany({
      data: [
        { hotelId: hotel.id, date, planId: barPlan.id, sharePercent: 55 },
        { hotelId: hotel.id, date, planId: aaaPlan.id, sharePercent: 20 },
        { hotelId: hotel.id, date, planId: seniorPlan.id, sharePercent: 10 },
        { hotelId: hotel.id, date, planId: mobilePlan.id, sharePercent: 15 },
      ],
    });
  }

  // Recommendations for 14 days
  for (let i = 0; i < 14; i++) {
    const date = toDateOnly(addDays(today, i));
    const recPrice = mockPrice(12200, i, 99);
    await prisma.recommendation.create({
      data: {
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
    });
  }

  // Message threads
  const activeThread = await prisma.messageThread.create({
    data: { hotelId: hotel.id },
  });

  await prisma.message.create({
    data: {
      threadId: activeThread.id,
      senderUserId: client.id,
      body: "Hi, I noticed the rates for next weekend seem higher than usual. Is there an event driving demand?",
      createdAt: addDays(today, -2),
    },
  });

  await prisma.message.create({
    data: {
      threadId: activeThread.id,
      senderUserId: analyst.id,
      body: "Yes, the Atlanta Music Festival is driving higher demand. We've adjusted rates accordingly to maximize RevPAR.",
      createdAt: addDays(today, -1),
      readAt: addDays(today, -1),
    },
  });

  await prisma.message.create({
    data: {
      threadId: activeThread.id,
      senderUserId: client.id,
      body: "Makes sense. Should we add any promotions for mid-week to offset?",
      createdAt: new Date(),
    },
  });

  const resolvedThread = await prisma.messageThread.create({
    data: {
      hotelId: hotel.id,
      resolvedAt: addDays(today, -5),
      resolvedByUserId: analyst.id,
    },
  });

  await prisma.message.create({
    data: {
      threadId: resolvedThread.id,
      senderUserId: client.id,
      body: "Can you update the competitor set? I think we should add the new Marriott that opened nearby.",
      createdAt: addDays(today, -7),
      readAt: addDays(today, -6),
    },
  });

  await prisma.message.create({
    data: {
      threadId: resolvedThread.id,
      senderUserId: analyst.id,
      body: "Done! I've added Marriott Courtyard Atlanta to your competitor set with a Medium weight. We'll start seeing their rates in the next scrape.",
      createdAt: addDays(today, -5),
      readAt: addDays(today, -5),
    },
  });

  // Security event
  await prisma.securityEvent.create({
    data: {
      userId: client.id,
      hotelId: hotel.id,
      type: "UNAUTHORIZED_HOTEL_ACCESS",
      metadataJson: {
        attempted: "nonexistent-hotel-id",
        route: "/hotels/[id]",
        ip: "192.168.1.100",
      },
      createdAt: addDays(today, -3),
    },
  });

  console.log("Seed complete!");
  console.log(`  Hotel: ${hotel.name} (${hotel.id})`);
  console.log(`  Analyst: analyst@example.com / Password123!`);
  console.log(`  Client: client@example.com / Password123!`);
  console.log(`  Competitors: ${competitors.length}`);
  console.log(`  Daily rates: ${30 * 6} records`);
  console.log(`  Message threads: 2 (1 active, 1 resolved)`);
  console.log(`  Security events: 1`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
