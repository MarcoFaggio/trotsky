import { prisma } from "@hotel-pricing/db";
import { mockScraper } from "../scrapers/mock";
import { expediaScraper } from "../scrapers/expedia";
import { bookingStub } from "../scrapers/booking-stub";
import pino from "pino";

const logger = pino({ name: "daily-scrape" });
const SCRAPE_MODE = process.env.SCRAPE_MODE || "mock";

export async function dailyScrapeProcessor(
  data: any
): Promise<{ affectedHotelIds: string[] }> {
  const targetHotelId = data?.hotelId as string | undefined;
  logger.info({ mode: SCRAPE_MODE, hotelId: targetHotelId || "all" }, "Starting scrape");

  const run = await prisma.scrapeRun.create({
    data: {
      status: "RUNNING",
      mode: SCRAPE_MODE === "real" ? "REAL" : "MOCK",
    },
  });

  let listingsScraped = 0;
  let ratesStored = 0;
  let failures = 0;
  const affectedHotelIds = new Set<string>();

  try {
    const hotelWhere: any = { status: "ACTIVE" };
    if (targetHotelId) hotelWhere.id = targetHotelId;

    const hotels = await prisma.hotel.findMany({
      where: hotelWhere,
      include: {
        listings: { where: { active: true } },
        competitors: {
          where: { active: true },
          include: {
            competitor: {
              include: { listings: { where: { active: true } } },
            },
          },
        },
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates: Date[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }

    for (const hotel of hotels) {
      affectedHotelIds.add(hotel.id);
      // Scrape hotel listings
      for (const listing of hotel.listings) {
        try {
          const adapter = SCRAPE_MODE === "real" && listing.ota === "EXPEDIA"
            ? expediaScraper
            : SCRAPE_MODE === "real" && listing.ota === "BOOKING"
              ? bookingStub
              : mockScraper;

          const results = await adapter.scrape(listing.url, dates, hotel.name);
          listingsScraped++;

          for (const result of results) {
            await prisma.dailyRate.upsert({
              where: {
                daily_rate_hotel_listing_date: {
                  listingType: "HOTEL",
                  hotelId: hotel.id,
                  ota: listing.ota,
                  date: result.date,
                },
              },
              create: {
                listingType: "HOTEL",
                hotelId: hotel.id,
                ota: listing.ota,
                date: result.date,
                priceCents: result.priceCents,
                currency: result.currency,
                sourceRunId: run.id,
              },
              update: {
                priceCents: result.priceCents,
                currency: result.currency,
                scrapedAt: new Date(),
                sourceRunId: run.id,
              },
            });
            ratesStored++;
          }

          // Store review if available
          if (results[0]?.ratingValue) {
            await prisma.reviewSnapshot.create({
              data: {
                listingType: "HOTEL",
                hotelId: hotel.id,
                ota: listing.ota,
                ratingValue: results[0].ratingValue,
                ratingScale: results[0].ratingScale || 5,
                sourceRunId: run.id,
              },
            });
          }
        } catch (err: any) {
          failures++;
          logger.error({ error: err.message, hotelId: hotel.id, listing: listing.url }, "Failed to scrape hotel listing");
          await prisma.scrapeError.create({
            data: {
              runId: run.id,
              contextJson: { hotelId: hotel.id, url: listing.url, type: "hotel" },
              message: err.message,
            },
          });
        }
      }

      // Scrape competitor listings
      for (const hc of hotel.competitors) {
        for (const listing of hc.competitor.listings) {
          try {
            const adapter = SCRAPE_MODE === "real" && listing.ota === "EXPEDIA"
              ? expediaScraper
              : mockScraper;

            const results = await adapter.scrape(listing.url, dates, hc.competitor.name);
            listingsScraped++;

            for (const result of results) {
              await prisma.dailyRate.upsert({
                where: {
                  daily_rate_competitor_listing_date: {
                    listingType: "COMPETITOR",
                    competitorId: hc.competitor.id,
                    ota: listing.ota,
                    date: result.date,
                  },
                },
                create: {
                  listingType: "COMPETITOR",
                  competitorId: hc.competitor.id,
                  ota: listing.ota,
                  date: result.date,
                  priceCents: result.priceCents,
                  currency: result.currency,
                  sourceRunId: run.id,
                },
                update: {
                  priceCents: result.priceCents,
                  currency: result.currency,
                  scrapedAt: new Date(),
                  sourceRunId: run.id,
                },
              });
              ratesStored++;
            }

            if (results[0]?.ratingValue) {
              await prisma.reviewSnapshot.create({
                data: {
                  listingType: "COMPETITOR",
                  competitorId: hc.competitor.id,
                  ota: listing.ota,
                  ratingValue: results[0].ratingValue,
                  ratingScale: results[0].ratingScale || 5,
                  sourceRunId: run.id,
                },
              });
            }
          } catch (err: any) {
            failures++;
            logger.error({ error: err.message, competitorId: hc.competitor.id }, "Failed to scrape competitor");
            await prisma.scrapeError.create({
              data: {
                runId: run.id,
                contextJson: { competitorId: hc.competitor.id, url: listing.url, type: "competitor" },
                message: err.message,
              },
            });
          }
        }
      }
    }

    await prisma.scrapeRun.update({
      where: { id: run.id },
      data: {
        status: "COMPLETED",
        finishedAt: new Date(),
        summaryJson: { listingsScraped, ratesStored, failures },
      },
    });

    logger.info({ runId: run.id, listingsScraped, ratesStored, failures }, "Scrape complete");
    return { affectedHotelIds: Array.from(affectedHotelIds) };
  } catch (err: any) {
    await prisma.scrapeRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        summaryJson: { listingsScraped, ratesStored, failures, error: err.message },
      },
    });
    throw err;
  }
}
