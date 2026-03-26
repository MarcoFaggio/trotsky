-- Hotel geo enrichment columns
ALTER TABLE "Hotel"
ADD COLUMN "countryCode" TEXT,
ADD COLUMN "regionCode" TEXT,
ADD COLUMN "market" TEXT,
ADD COLUMN "submarket" TEXT,
ADD COLUMN "latitude" DOUBLE PRECISION,
ADD COLUMN "longitude" DOUBLE PRECISION,
ADD COLUMN "geoConfidence" DOUBLE PRECISION,
ADD COLUMN "geoSource" TEXT,
ADD COLUMN "geoUpdatedAt" TIMESTAMP(3);

-- Enums for imported signals
CREATE TYPE "ExternalSignalCategory" AS ENUM (
  'CONCERT',
  'SPORTS',
  'FESTIVAL',
  'CONVENTION',
  'SEVERE_WEATHER',
  'TRANSPORT_DISRUPTION',
  'CALAMITY',
  'OTHER'
);

CREATE TYPE "ExternalSignalDirection" AS ENUM (
  'POSITIVE_DEMAND',
  'NEGATIVE_DISRUPTION',
  'NEUTRAL'
);

CREATE TYPE "ExternalSignalStatus" AS ENUM (
  'ACTIVE',
  'CANCELLED',
  'SUPERSEDED'
);

CREATE TYPE "SignalSuppressionReason" AS ENUM (
  'IRRELEVANT',
  'DUPLICATE',
  'LOW_CONFIDENCE',
  'MANUAL_OVERRIDE',
  'OTHER'
);

-- Canonical imported signal store
CREATE TABLE "ExternalSignal" (
  "id" TEXT NOT NULL,
  "sourceName" TEXT NOT NULL,
  "sourceSignalId" TEXT NOT NULL,
  "sourceUrl" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "category" "ExternalSignalCategory" NOT NULL,
  "direction" "ExternalSignalDirection" NOT NULL,
  "severity" INTEGER NOT NULL,
  "sourceConfidence" DOUBLE PRECISION,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "timezone" TEXT,
  "venueName" TEXT,
  "city" TEXT,
  "countryCode" TEXT,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "status" "ExternalSignalStatus" NOT NULL DEFAULT 'ACTIVE',
  "rawHash" TEXT NOT NULL,
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExternalSignal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExternalSignal_sourceName_sourceSignalId_key"
ON "ExternalSignal"("sourceName", "sourceSignalId");
CREATE INDEX "ExternalSignal_category_direction_idx"
ON "ExternalSignal"("category", "direction");
CREATE INDEX "ExternalSignal_startsAt_endsAt_idx"
ON "ExternalSignal"("startsAt", "endsAt");
CREATE INDEX "ExternalSignal_city_countryCode_idx"
ON "ExternalSignal"("city", "countryCode");
CREATE INDEX "ExternalSignal_status_idx"
ON "ExternalSignal"("status");
CREATE INDEX "ExternalSignal_rawHash_idx"
ON "ExternalSignal"("rawHash");

-- Date-level mapped impact consumed by recommendation logic
CREATE TABLE "HotelSignalImpact" (
  "id" TEXT NOT NULL,
  "hotelId" TEXT NOT NULL,
  "externalSignalId" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "direction" "ExternalSignalDirection" NOT NULL,
  "relevanceScore" DOUBLE PRECISION NOT NULL,
  "impactBps" INTEGER NOT NULL,
  "distanceKm" DOUBLE PRECISION,
  "matchReason" TEXT NOT NULL,
  "isSuppressed" BOOLEAN NOT NULL DEFAULT false,
  "suppressedByUserId" TEXT,
  "suppressedAt" TIMESTAMP(3),
  "suppressionReason" "SignalSuppressionReason",
  "suppressionNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HotelSignalImpact_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HotelSignalImpact_hotelId_externalSignalId_date_key"
ON "HotelSignalImpact"("hotelId", "externalSignalId", "date");
CREATE INDEX "HotelSignalImpact_hotelId_date_idx"
ON "HotelSignalImpact"("hotelId", "date");
CREATE INDEX "HotelSignalImpact_externalSignalId_idx"
ON "HotelSignalImpact"("externalSignalId");
CREATE INDEX "HotelSignalImpact_isSuppressed_idx"
ON "HotelSignalImpact"("isSuppressed");

ALTER TABLE "HotelSignalImpact"
ADD CONSTRAINT "HotelSignalImpact_hotelId_fkey"
FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HotelSignalImpact"
ADD CONSTRAINT "HotelSignalImpact_externalSignalId_fkey"
FOREIGN KEY ("externalSignalId") REFERENCES "ExternalSignal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HotelSignalImpact"
ADD CONSTRAINT "HotelSignalImpact_suppressedByUserId_fkey"
FOREIGN KEY ("suppressedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
