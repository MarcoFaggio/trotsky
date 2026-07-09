-- Hot-path indexes: dashboards and the recommendation worker query by
-- hotel/competitor first, then a date range. The old date-leading DailyRate
-- indexes served neither pattern well and are replaced.

-- DropIndex
DROP INDEX "DailyRate_date_hotelId_idx";

-- DropIndex
DROP INDEX "DailyRate_date_competitorId_idx";

-- CreateIndex
CREATE INDEX "DailyRate_hotelId_date_idx" ON "DailyRate"("hotelId", "date");

-- CreateIndex
CREATE INDEX "DailyRate_competitorId_date_idx" ON "DailyRate"("competitorId", "date");

-- CreateIndex
CREATE INDEX "ReviewSnapshot_hotelId_scrapedAt_idx" ON "ReviewSnapshot"("hotelId", "scrapedAt");

-- CreateIndex
CREATE INDEX "ReviewSnapshot_competitorId_scrapedAt_idx" ON "ReviewSnapshot"("competitorId", "scrapedAt");

-- CreateIndex
CREATE INDEX "Promotion_hotelId_startDate_endDate_idx" ON "Promotion"("hotelId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "Message_threadId_createdAt_idx" ON "Message"("threadId", "createdAt");
