CREATE TYPE "InquirySource" AS ENUM (
  'WEB_CHAT',
  'WHATSAPP',
  'INSTAGRAM',
  'FACEBOOK',
  'EMAIL',
  'PHONE',
  'MANUAL',
  'OTHER'
);

CREATE TYPE "InquiryIntent" AS ENUM (
  'INDIVIDUAL_BOOKING',
  'GROUP_ROOMS',
  'MEETING_EVENT',
  'WEDDING',
  'SCHOOL_TRIP',
  'CORPORATE_OFFSITE',
  'GENERAL',
  'UNKNOWN'
);

CREATE TYPE "InquiryStatus" AS ENUM (
  'NEW',
  'QUALIFYING',
  'RFP_READY',
  'PROPOSAL_SENT',
  'WON',
  'LOST',
  'SPAM'
);

CREATE TYPE "InquiryPriority" AS ENUM (
  'LOW',
  'NORMAL',
  'HIGH',
  'URGENT'
);

CREATE TYPE "InquiryMessageSenderType" AS ENUM (
  'GUEST',
  'AI',
  'STAFF',
  'SYSTEM'
);

CREATE TYPE "InquiryProposalStatus" AS ENUM (
  'DRAFT',
  'SENT',
  'ACCEPTED',
  'DECLINED',
  'EXPIRED'
);

CREATE TABLE "Inquiry" (
  "id" TEXT NOT NULL,
  "hotelId" TEXT NOT NULL,
  "source" "InquirySource" NOT NULL DEFAULT 'MANUAL',
  "intent" "InquiryIntent" NOT NULL DEFAULT 'UNKNOWN',
  "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
  "priority" "InquiryPriority" NOT NULL DEFAULT 'NORMAL',
  "guestName" TEXT,
  "guestEmail" TEXT,
  "guestPhone" TEXT,
  "organizationName" TEXT,
  "summary" TEXT,
  "checkIn" DATE,
  "checkOut" DATE,
  "guestCount" INTEGER,
  "roomCount" INTEGER,
  "budgetCents" INTEGER,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "eventSpaceNeeded" BOOLEAN NOT NULL DEFAULT false,
  "cateringNeeded" BOOLEAN NOT NULL DEFAULT false,
  "aiConfidence" DOUBLE PRECISION,
  "aiExtractedJson" JSONB,
  "assignedToUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InquiryMessage" (
  "id" TEXT NOT NULL,
  "inquiryId" TEXT NOT NULL,
  "senderType" "InquiryMessageSenderType" NOT NULL,
  "senderUserId" TEXT,
  "body" TEXT NOT NULL,
  "channelMessageId" TEXT,
  "metadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InquiryMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GroupRfp" (
  "id" TEXT NOT NULL,
  "inquiryId" TEXT NOT NULL,
  "eventType" TEXT,
  "flexibleDates" BOOLEAN NOT NULL DEFAULT false,
  "roomsPerNight" INTEGER,
  "attendeeCount" INTEGER,
  "meetingRoomSetup" TEXT,
  "foodAndBeverage" TEXT,
  "decisionDate" DATE,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GroupRfp_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InquiryProposal" (
  "id" TEXT NOT NULL,
  "inquiryId" TEXT NOT NULL,
  "hotelId" TEXT NOT NULL,
  "roomRateCents" INTEGER,
  "totalEstimateCents" INTEGER,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "roomBlock" INTEGER,
  "cutoffDate" DATE,
  "cancellationTerms" TEXT,
  "notes" TEXT,
  "status" "InquiryProposalStatus" NOT NULL DEFAULT 'DRAFT',
  "createdByUserId" TEXT NOT NULL,
  "sentAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InquiryProposal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Inquiry_hotelId_status_idx" ON "Inquiry"("hotelId", "status");
CREATE INDEX "Inquiry_hotelId_createdAt_idx" ON "Inquiry"("hotelId", "createdAt");
CREATE INDEX "Inquiry_intent_idx" ON "Inquiry"("intent");
CREATE INDEX "Inquiry_source_idx" ON "Inquiry"("source");

CREATE INDEX "InquiryMessage_inquiryId_createdAt_idx" ON "InquiryMessage"("inquiryId", "createdAt");
CREATE INDEX "InquiryMessage_senderUserId_idx" ON "InquiryMessage"("senderUserId");

CREATE UNIQUE INDEX "GroupRfp_inquiryId_key" ON "GroupRfp"("inquiryId");

CREATE INDEX "InquiryProposal_inquiryId_idx" ON "InquiryProposal"("inquiryId");
CREATE INDEX "InquiryProposal_hotelId_status_idx" ON "InquiryProposal"("hotelId", "status");

ALTER TABLE "Inquiry"
ADD CONSTRAINT "Inquiry_hotelId_fkey"
FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Inquiry"
ADD CONSTRAINT "Inquiry_assignedToUserId_fkey"
FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InquiryMessage"
ADD CONSTRAINT "InquiryMessage_inquiryId_fkey"
FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InquiryMessage"
ADD CONSTRAINT "InquiryMessage_senderUserId_fkey"
FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "GroupRfp"
ADD CONSTRAINT "GroupRfp_inquiryId_fkey"
FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InquiryProposal"
ADD CONSTRAINT "InquiryProposal_inquiryId_fkey"
FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InquiryProposal"
ADD CONSTRAINT "InquiryProposal_hotelId_fkey"
FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InquiryProposal"
ADD CONSTRAINT "InquiryProposal_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
