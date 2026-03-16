-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ANALYST', 'CLIENT');

-- CreateEnum
CREATE TYPE "OTA" AS ENUM ('EXPEDIA', 'BOOKING');

-- CreateEnum
CREATE TYPE "HotelStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ScrapeStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ScrapeMode" AS ENUM ('REAL', 'MOCK');

-- CreateEnum
CREATE TYPE "ListingType" AS ENUM ('HOTEL', 'COMPETITOR');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hotel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pmsName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "roomCount" INTEGER NOT NULL DEFAULT 100,
    "status" "HotelStatus" NOT NULL DEFAULT 'ACTIVE',
    "minRate" INTEGER,
    "maxRate" INTEGER,
    "occTarget" DOUBLE PRECISION DEFAULT 75,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hotel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HotelAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,

    CONSTRAINT "HotelAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competitor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Competitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitorListing" (
    "id" TEXT NOT NULL,
    "competitorId" TEXT NOT NULL,
    "ota" "OTA" NOT NULL,
    "url" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CompetitorListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HotelCompetitor" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "competitorId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "HotelCompetitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HotelListing" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "ota" "OTA" NOT NULL,
    "url" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "HotelListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyRate" (
    "id" TEXT NOT NULL,
    "listingType" "ListingType" NOT NULL,
    "hotelId" TEXT,
    "competitorId" TEXT,
    "ota" "OTA" NOT NULL,
    "date" DATE NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceRunId" TEXT,

    CONSTRAINT "DailyRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewSnapshot" (
    "id" TEXT NOT NULL,
    "listingType" "ListingType" NOT NULL,
    "hotelId" TEXT,
    "competitorId" TEXT,
    "ota" "OTA" NOT NULL,
    "ratingValue" DOUBLE PRECISION NOT NULL,
    "ratingScale" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceRunId" TEXT,

    CONSTRAINT "ReviewSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OccupancyEntry" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "occPercent" DOUBLE PRECISION,
    "roomsOnBooks" INTEGER,
    "occLyPercent" DOUBLE PRECISION,
    "otbLyRooms" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OccupancyEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "terms" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceOverride" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "overridePriceCents" INTEGER NOT NULL,
    "reason" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "recommendedPriceCents" INTEGER NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "rationaleJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RatePlan" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "discountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RatePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscountMix" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "planId" TEXT NOT NULL,
    "sharePercent" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "DiscountMix_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrapeRun" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" "ScrapeStatus" NOT NULL DEFAULT 'PENDING',
    "mode" "ScrapeMode" NOT NULL DEFAULT 'MOCK',
    "summaryJson" JSONB,

    CONSTRAINT "ScrapeRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrapeError" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "contextJson" JSONB,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScrapeError_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "HotelAccess_userId_hotelId_key" ON "HotelAccess"("userId", "hotelId");

-- CreateIndex
CREATE UNIQUE INDEX "HotelCompetitor_hotelId_competitorId_key" ON "HotelCompetitor"("hotelId", "competitorId");

-- CreateIndex
CREATE UNIQUE INDEX "HotelListing_hotelId_ota_key" ON "HotelListing"("hotelId", "ota");

-- CreateIndex
CREATE INDEX "DailyRate_date_hotelId_idx" ON "DailyRate"("date", "hotelId");

-- CreateIndex
CREATE INDEX "DailyRate_date_competitorId_idx" ON "DailyRate"("date", "competitorId");

-- CreateIndex
CREATE UNIQUE INDEX "OccupancyEntry_hotelId_date_key" ON "OccupancyEntry"("hotelId", "date");

-- CreateIndex
CREATE INDEX "Event_hotelId_date_idx" ON "Event"("hotelId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "PriceOverride_hotelId_date_key" ON "PriceOverride"("hotelId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Recommendation_hotelId_date_key" ON "Recommendation"("hotelId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "RatePlan_hotelId_code_key" ON "RatePlan"("hotelId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "DiscountMix_hotelId_date_planId_key" ON "DiscountMix"("hotelId", "date", "planId");

-- AddForeignKey
ALTER TABLE "HotelAccess" ADD CONSTRAINT "HotelAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelAccess" ADD CONSTRAINT "HotelAccess_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorListing" ADD CONSTRAINT "CompetitorListing_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Competitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelCompetitor" ADD CONSTRAINT "HotelCompetitor_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelCompetitor" ADD CONSTRAINT "HotelCompetitor_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Competitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelListing" ADD CONSTRAINT "HotelListing_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyRate" ADD CONSTRAINT "DailyRate_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyRate" ADD CONSTRAINT "DailyRate_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Competitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyRate" ADD CONSTRAINT "DailyRate_sourceRunId_fkey" FOREIGN KEY ("sourceRunId") REFERENCES "ScrapeRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewSnapshot" ADD CONSTRAINT "ReviewSnapshot_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewSnapshot" ADD CONSTRAINT "ReviewSnapshot_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Competitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewSnapshot" ADD CONSTRAINT "ReviewSnapshot_sourceRunId_fkey" FOREIGN KEY ("sourceRunId") REFERENCES "ScrapeRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OccupancyEntry" ADD CONSTRAINT "OccupancyEntry_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceOverride" ADD CONSTRAINT "PriceOverride_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceOverride" ADD CONSTRAINT "PriceOverride_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RatePlan" ADD CONSTRAINT "RatePlan_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountMix" ADD CONSTRAINT "DiscountMix_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountMix" ADD CONSTRAINT "DiscountMix_planId_fkey" FOREIGN KEY ("planId") REFERENCES "RatePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScrapeError" ADD CONSTRAINT "ScrapeError_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ScrapeRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
