import { createHash } from "node:crypto";
import { prisma } from "@hotel-pricing/db";
import pino from "pino";

const logger = pino({ name: "fetch-normalize-signals" });

type SeedSignal = {
  sourceName: string;
  sourceSignalId: string;
  title: string;
  description?: string;
  category:
    | "CONCERT"
    | "SPORTS"
    | "FESTIVAL"
    | "CONVENTION"
    | "SEVERE_WEATHER"
    | "TRANSPORT_DISRUPTION"
    | "CALAMITY"
    | "OTHER";
  direction: "POSITIVE_DEMAND" | "NEGATIVE_DISRUPTION" | "NEUTRAL";
  severity: number;
  sourceConfidence?: number;
  startsAt: Date;
  endsAt: Date;
  city?: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
};

function getMockSignals(now: Date): SeedSignal[] {
  const base = new Date(now);
  base.setHours(18, 0, 0, 0);
  const tomorrow = new Date(base);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekend = new Date(base);
  weekend.setDate(weekend.getDate() + 3);
  const weekendEnd = new Date(weekend);
  weekendEnd.setDate(weekendEnd.getDate() + 1);

  return [
    {
      sourceName: "mvp-seed",
      sourceSignalId: `concert-${tomorrow.toISOString().slice(0, 10)}`,
      title: "Downtown Arena Concert",
      description: "Major touring artist expected to increase city demand.",
      category: "CONCERT",
      direction: "POSITIVE_DEMAND",
      severity: 3,
      sourceConfidence: 0.9,
      startsAt: tomorrow,
      endsAt: tomorrow,
      city: "Atlanta",
      countryCode: "US",
      latitude: 33.7573,
      longitude: -84.3963,
    },
    {
      sourceName: "mvp-seed",
      sourceSignalId: `weather-${weekend.toISOString().slice(0, 10)}`,
      title: "Severe Weather Watch",
      description: "Potential disruption from severe storm system.",
      category: "SEVERE_WEATHER",
      direction: "NEGATIVE_DISRUPTION",
      severity: 4,
      sourceConfidence: 0.8,
      startsAt: weekend,
      endsAt: weekendEnd,
      city: "Atlanta",
      countryCode: "US",
      latitude: 33.749,
      longitude: -84.388,
    },
  ];
}

export async function fetchNormalizeSignalsProcessor(): Promise<{ upserted: number }> {
  const now = new Date();
  const signals = getMockSignals(now);
  let upserted = 0;

  for (const signal of signals) {
    const rawHash = createHash("sha256")
      .update(JSON.stringify(signal))
      .digest("hex");

    await prisma.externalSignal.upsert({
      where: {
        sourceName_sourceSignalId: {
          sourceName: signal.sourceName,
          sourceSignalId: signal.sourceSignalId,
        },
      },
      create: {
        sourceName: signal.sourceName,
        sourceSignalId: signal.sourceSignalId,
        title: signal.title,
        description: signal.description,
        category: signal.category,
        direction: signal.direction,
        severity: signal.severity,
        sourceConfidence: signal.sourceConfidence,
        startsAt: signal.startsAt,
        endsAt: signal.endsAt,
        city: signal.city,
        countryCode: signal.countryCode,
        latitude: signal.latitude,
        longitude: signal.longitude,
        rawHash,
      },
      update: {
        title: signal.title,
        description: signal.description,
        category: signal.category,
        direction: signal.direction,
        severity: signal.severity,
        sourceConfidence: signal.sourceConfidence,
        startsAt: signal.startsAt,
        endsAt: signal.endsAt,
        city: signal.city,
        countryCode: signal.countryCode,
        latitude: signal.latitude,
        longitude: signal.longitude,
        rawHash,
        lastSeenAt: now,
      },
    });
    upserted++;
  }

  logger.info({ upserted }, "External signals normalized");
  return { upserted };
}
