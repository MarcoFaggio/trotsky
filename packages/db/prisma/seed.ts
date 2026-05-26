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
  await prisma.revenueAction.deleteMany();
  await prisma.inquiryMessage.deleteMany();
  await prisma.inquiryProposal.deleteMany();
  await prisma.groupRfp.deleteMany();
  await prisma.inquiry.deleteMany();
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
      countryCode: "US",
      regionCode: "GA",
      market: "Atlanta",
      submarket: "Downtown",
      latitude: 33.7612,
      longitude: -84.3877,
      geoConfidence: 0.92,
      geoSource: "seed",
      geoUpdatedAt: new Date(),
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
      skipDuplicates: true,
    });
  }

  // Recommendations for 14 days
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

  // Demo inquiry for INQUIRY_REVIEW action
  const demoInquiry = await prisma.inquiry.create({
    data: {
      hotelId: hotel.id,
      source: "WEB_CHAT",
      intent: "GROUP_ROOMS",
      status: "NEW",
      priority: "HIGH",
      guestName: "Jordan Lee",
      guestEmail: "jordan.lee@example.com",
      organizationName: "Summit Events LLC",
      summary: "40-room block for a corporate offsite, flexible on shoulder nights.",
      checkIn: toDateOnly(addDays(today, 21)),
      checkOut: toDateOnly(addDays(today, 24)),
      guestCount: 85,
      roomCount: 40,
      budgetCents: 520000,
      eventSpaceNeeded: true,
      assignedToUserId: analyst.id,
    },
  });

  const satDate = toDateOnly(addDays(today, 10));
  const friDate = toDateOnly(addDays(today, 5));
  const eventWeekendDate = toDateOnly(addDays(today, 7));
  const concertDate = toDateOnly(addDays(today, 4));
  const sportsDate = toDateOnly(addDays(today, 10));
  const parityDate = toDateOnly(addDays(today, 3));

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
      summary: "Tech Conference at Georgia World Congress in 10 days — build ladder now.",
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
      summary: "Weighted comp median +6% WoW while your BAR is flat on 4 key dates.",
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
      summary: "OTB for next weekend is 8 pts behind LY with only 5 days to recover.",
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
    {
      actionKey: `parity-fix:${parityDate.toISOString().slice(0, 10)}-tripadvisor`,
      type: "PARITY_FIX" as const,
      title: "Review Tripadvisor rate display (demo)",
      summary: "Tripadvisor metasearch $138 vs BAR $145 — watch for tax/fee presentation (demo).",
      urgency: "LOW" as const,
      confidence: "LOW" as const,
      stayDate: parityDate,
      evidenceJson: {
        channelRates: [{ channel: "Tripadvisor", rateCents: 13800, status: "watch" }],
        demoBeta: true,
        source: "seed-demo",
      },
      source: "SEED",
    },
    {
      actionKey: "strategy-review:discount-mix",
      type: "STRATEGY_REVIEW" as const,
      title: "Review discount mix vs ADR target",
      summary: "Mobile + AAA share at 35% on peak night; ADR risk vs BAR.",
      reason: "Discount share above warning threshold on upcoming Saturday.",
      urgency: "MEDIUM" as const,
      confidence: "MEDIUM" as const,
      evidenceJson: {
        discountSharePercent: 35,
        adrWarningThresholdPercent: 12,
        source: "seed-demo",
      },
      source: "SEED",
    },
    {
      actionKey: `inquiry-review:${demoInquiry.id}`,
      type: "INQUIRY_REVIEW" as const,
      title: "Qualify group inquiry — Summit Events",
      summary: "40-room corporate offsite; high priority, RFP fields partially complete.",
      reason: "New inquiry assigned; respond within 24h.",
      urgency: "HIGH" as const,
      confidence: "HIGH" as const,
      source: "SEED",
      sourceEntityId: demoInquiry.id,
      evidenceJson: {
        inquiryId: demoInquiry.id,
        intent: "GROUP_ROOMS",
        roomCount: 40,
        source: "seed-demo",
      },
    },
  ];

  const evaluatedAt = new Date();
  const expiresAt = addDays(today, 14);

  for (const action of revenueActions) {
    await prisma.revenueAction.create({
      data: {
        hotelId: hotel.id,
        ...action,
        status: "PENDING",
        lastEvaluatedAt: evaluatedAt,
        expiresAt,
      },
    });
  }

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
  console.log(`  Revenue actions: ${revenueActions.length}`);
  console.log(`  Demo inquiry: ${demoInquiry.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
