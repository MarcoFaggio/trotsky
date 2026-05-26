-- CreateEnum
CREATE TYPE "RevenueActionType" AS ENUM ('PRICE_CHANGE', 'EVENT_PRICING', 'WATCH_DEMAND', 'PARITY_FIX', 'STRATEGY_REVIEW', 'INQUIRY_REVIEW');

-- CreateEnum
CREATE TYPE "RevenueActionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'SNOOZED', 'COMPLETED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ActionUrgency" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ActionConfidence" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "RevenueAction" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "actionKey" TEXT NOT NULL,
    "type" "RevenueActionType" NOT NULL,
    "status" "RevenueActionStatus" NOT NULL DEFAULT 'PENDING',
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "reason" TEXT,
    "urgency" "ActionUrgency" NOT NULL,
    "confidence" "ActionConfidence" NOT NULL,
    "stayDate" DATE,
    "currentValueCents" INTEGER,
    "recommendedValueCents" INTEGER,
    "estimatedUpsideLowCents" INTEGER,
    "estimatedUpsideHighCents" INTEGER,
    "evidenceJson" JSONB,
    "source" TEXT,
    "sourceEntityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastEvaluatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decisionNote" TEXT,
    "snoozedUntil" TIMESTAMP(3),

    CONSTRAINT "RevenueAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RevenueAction_hotelId_status_idx" ON "RevenueAction"("hotelId", "status");

-- CreateIndex
CREATE INDEX "RevenueAction_hotelId_stayDate_idx" ON "RevenueAction"("hotelId", "stayDate");

-- CreateIndex
CREATE INDEX "RevenueAction_hotelId_type_idx" ON "RevenueAction"("hotelId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "RevenueAction_hotelId_actionKey_key" ON "RevenueAction"("hotelId", "actionKey");

-- AddForeignKey
ALTER TABLE "RevenueAction" ADD CONSTRAINT "RevenueAction_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueAction" ADD CONSTRAINT "RevenueAction_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
