import type { ScraperAdapter, ScrapeResult } from "./adapter";
import pino from "pino";

const logger = pino({ name: "booking-stub" });

// TODO: Implement real Booking.com scraper
// This stub falls back to mock data for now
export const bookingStub: ScraperAdapter = {
  async scrape(url: string, dates: Date[], propertyName?: string): Promise<ScrapeResult[]> {
    logger.info({ url }, "Booking.com scraper not implemented. Using mock data.");
    const { mockScraper } = await import("./mock");
    return mockScraper.scrape(url, dates, propertyName);
  },
};
