import type { ScraperAdapter, ScrapeResult } from "./adapter";
import pino from "pino";

const logger = pino({ name: "expedia-scraper" });

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
];

function randomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export const expediaScraper: ScraperAdapter = {
  async scrape(url: string, dates: Date[], propertyName?: string): Promise<ScrapeResult[]> {
    let playwright;
    try {
      playwright = await import("playwright");
    } catch {
      logger.warn("Playwright not available. Falling back to mock data.");
      const { mockScraper } = await import("./mock");
      return mockScraper.scrape(url, dates, propertyName);
    }

    const results: ScrapeResult[] = [];
    const maxRetries = 3;
    const browser = await playwright.chromium.launch({ headless: true });

    try {
      for (const date of dates) {
        const checkIn = date.toISOString().split("T")[0];
        const checkOut = new Date(date);
        checkOut.setDate(checkOut.getDate() + 1);
        const checkOutStr = checkOut.toISOString().split("T")[0];

        let success = false;
        for (let attempt = 0; attempt < maxRetries && !success; attempt++) {
          try {
            const context = await browser.newContext({
              userAgent: randomUA(),
              viewport: { width: 1366, height: 768 },
            });
            const page = await context.newPage();
            page.setDefaultTimeout(30000);

            const scrapeUrl = `${url}?chkin=${checkIn}&chkout=${checkOutStr}&x_pwa=1&rfrr=HSR&pwa_ts=1`;
            logger.info({ url: scrapeUrl, attempt: attempt + 1 }, "Navigating to Expedia listing");

            await page.goto(scrapeUrl, { waitUntil: "domcontentloaded" });
            await sleep(2000 + Math.random() * 3000);

            // Try to extract price
            const priceText = await page
              .locator('[data-stid="content-hotel-lead-price"] .uitk-text')
              .first()
              .textContent()
              .catch(() => null);

            if (priceText) {
              const priceMatch = priceText.match(/\$?([\d,]+)/);
              if (priceMatch) {
                const price = parseInt(priceMatch[1].replace(/,/g, ""));
                results.push({
                  date,
                  priceCents: price * 100,
                  currency: "USD",
                });
                success = true;
              }
            }

            // Try to extract rating
            const ratingText = await page
              .locator('[data-stid="content-hotel-review-rating"]')
              .first()
              .textContent()
              .catch(() => null);

            if (ratingText && results.length > 0) {
              const ratingMatch = ratingText.match(/([\d.]+)/);
              if (ratingMatch) {
                const lastResult = results[results.length - 1];
                lastResult.ratingValue = parseFloat(ratingMatch[1]);
                lastResult.ratingScale = 10;
              }
            }

            await context.close();

            if (!success) {
              logger.warn({ url, date: checkIn, attempt: attempt + 1 }, "Could not extract price");
              if (attempt < maxRetries - 1) {
                await sleep(5000 * Math.pow(2, attempt));
              }
            }
          } catch (err: any) {
            logger.error({ error: err.message, attempt: attempt + 1 }, "Scrape attempt failed");
            if (attempt < maxRetries - 1) {
              await sleep(5000 * Math.pow(2, attempt));
            }
          }
        }

        // Respectful delay between dates
        await sleep(2000 + Math.random() * 3000);
      }
    } finally {
      await browser.close();
    }

    if (results.length === 0) {
      logger.warn({ url }, "No results from Expedia scraper. Returning empty.");
    }

    return results;
  },
};
