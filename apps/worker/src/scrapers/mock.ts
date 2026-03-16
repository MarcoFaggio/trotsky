import type { ScraperAdapter, ScrapeResult } from "./adapter";

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export const mockScraper: ScraperAdapter = {
  async scrape(url: string, dates: Date[], propertyName?: string): Promise<ScrapeResult[]> {
    const seed = hashCode(url);
    const basePriceCents = 9000 + (seed % 8000); // $90 - $170 base

    return dates.map((date, i) => {
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
      const sinWave = Math.sin((i + seed) * 0.3) * 1500;
      const weekendBump = isWeekend ? 2500 : 0;
      const variation = ((seed * 7 + i * 13) % 1000) - 500;
      const priceCents = Math.max(5000, Math.round(basePriceCents + sinWave + weekendBump + variation));

      return {
        date,
        priceCents,
        currency: "USD",
        ratingValue: 3.5 + (seed % 15) / 10,
        ratingScale: 5,
      };
    });
  },
};
