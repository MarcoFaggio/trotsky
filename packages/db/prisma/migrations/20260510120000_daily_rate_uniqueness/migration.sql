-- Keep the newest scrape for any duplicate hotel/competitor daily rate rows,
-- then enforce one rate per listing type, entity, OTA, and stay date.
WITH ranked AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "listingType", "hotelId", "ota", "date"
      ORDER BY "scrapedAt" DESC, "id" DESC
    ) AS rn
  FROM "DailyRate"
  WHERE "hotelId" IS NOT NULL
)
DELETE FROM "DailyRate"
WHERE "id" IN (SELECT "id" FROM ranked WHERE rn > 1);

WITH ranked AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "listingType", "competitorId", "ota", "date"
      ORDER BY "scrapedAt" DESC, "id" DESC
    ) AS rn
  FROM "DailyRate"
  WHERE "competitorId" IS NOT NULL
)
DELETE FROM "DailyRate"
WHERE "id" IN (SELECT "id" FROM ranked WHERE rn > 1);

CREATE UNIQUE INDEX "DailyRate_daily_rate_hotel_listing_date_key"
ON "DailyRate"("listingType", "hotelId", "ota", "date");

CREATE UNIQUE INDEX "DailyRate_daily_rate_competitor_listing_date_key"
ON "DailyRate"("listingType", "competitorId", "ota", "date");
