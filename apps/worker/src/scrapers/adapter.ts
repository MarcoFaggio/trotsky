export interface ScrapeResult {
  date: Date;
  priceCents: number;
  currency: string;
  ratingValue?: number;
  ratingScale?: number;
}

export interface ScraperAdapter {
  scrape(url: string, dates: Date[], propertyName?: string): Promise<ScrapeResult[]>;
}
