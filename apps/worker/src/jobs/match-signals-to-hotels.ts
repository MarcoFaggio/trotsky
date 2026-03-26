import { prisma } from "@hotel-pricing/db";
import pino from "pino";

const logger = pino({ name: "match-signals-to-hotels" });

function kmBetween(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function scoreDistance(distanceKm: number): number {
  if (distanceKm <= 2) return 1;
  if (distanceKm <= 5) return 0.85;
  if (distanceKm <= 10) return 0.65;
  if (distanceKm <= 25) return 0.35;
  return 0.1;
}

function categoryBase(
  category:
    | "CONCERT"
    | "SPORTS"
    | "FESTIVAL"
    | "CONVENTION"
    | "SEVERE_WEATHER"
    | "TRANSPORT_DISRUPTION"
    | "CALAMITY"
    | "OTHER"
): number {
  switch (category) {
    case "CONCERT":
      return 0.7;
    case "SPORTS":
      return 0.75;
    case "FESTIVAL":
      return 0.8;
    case "CONVENTION":
      return 0.9;
    case "SEVERE_WEATHER":
      return 0.85;
    case "TRANSPORT_DISRUPTION":
      return 0.8;
    case "CALAMITY":
      return 1.0;
    default:
      return 0.5;
  }
}

function categoryCapBps(
  category:
    | "CONCERT"
    | "SPORTS"
    | "FESTIVAL"
    | "CONVENTION"
    | "SEVERE_WEATHER"
    | "TRANSPORT_DISRUPTION"
    | "CALAMITY"
    | "OTHER"
): number {
  switch (category) {
    case "CONCERT":
      return 300;
    case "SPORTS":
      return 350;
    case "FESTIVAL":
      return 450;
    case "CONVENTION":
      return 500;
    case "SEVERE_WEATHER":
      return 600;
    case "TRANSPORT_DISRUPTION":
      return 450;
    case "CALAMITY":
      return 800;
    default:
      return 200;
  }
}

function* dateRangeInclusive(start: Date, end: Date): Generator<Date> {
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const final = new Date(end);
  final.setHours(0, 0, 0, 0);
  while (current <= final) {
    yield new Date(current);
    current.setDate(current.getDate() + 1);
  }
}

export async function matchSignalsToHotelsProcessor(): Promise<{
  impactsUpserted: number;
  affectedHotelIds: string[];
}> {
  const signals = await prisma.externalSignal.findMany({
    where: { status: "ACTIVE" },
  });
  const hotels = await prisma.hotel.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      city: true,
      countryCode: true,
      latitude: true,
      longitude: true,
    },
  });

  let impactsUpserted = 0;
  const affectedHotelIds = new Set<string>();

  for (const signal of signals) {
    for (const hotel of hotels) {
      let distanceKm: number | null = null;
      let distanceScore = 0;

      if (
        signal.latitude !== null &&
        signal.longitude !== null &&
        hotel.latitude !== null &&
        hotel.longitude !== null
      ) {
        distanceKm = kmBetween(
          signal.latitude,
          signal.longitude,
          hotel.latitude,
          hotel.longitude
        );
        distanceScore = scoreDistance(distanceKm);
      } else if (
        signal.city &&
        signal.countryCode &&
        hotel.city &&
        hotel.countryCode &&
        signal.city.toLowerCase() === hotel.city.toLowerCase() &&
        signal.countryCode.toUpperCase() === hotel.countryCode.toUpperCase()
      ) {
        distanceScore = 0.6;
      } else {
        continue;
      }

      const severityFactor = Math.max(0.6, Math.min(1, 0.5 + signal.severity * 0.1));
      const confidenceFactor = Math.max(0.4, Math.min(signal.sourceConfidence ?? 0.7, 1));
      const relevanceScore = Math.max(
        0,
        Math.min(1, distanceScore * categoryBase(signal.category) * severityFactor * confidenceFactor)
      );

      if (relevanceScore <= 0.05) {
        continue;
      }

      const sign =
        signal.direction === "NEGATIVE_DISRUPTION"
          ? -1
          : signal.direction === "POSITIVE_DEMAND"
          ? 1
          : 0;
      const impactBps = Math.round(categoryCapBps(signal.category) * relevanceScore * sign);
      if (impactBps === 0) {
        continue;
      }

      for (const date of dateRangeInclusive(signal.startsAt, signal.endsAt)) {
        await prisma.hotelSignalImpact.upsert({
          where: {
            hotelId_externalSignalId_date: {
              hotelId: hotel.id,
              externalSignalId: signal.id,
              date,
            },
          },
          create: {
            hotelId: hotel.id,
            externalSignalId: signal.id,
            date,
            direction: signal.direction,
            relevanceScore,
            impactBps,
            distanceKm,
            matchReason:
              distanceKm === null
                ? "Matched by city/country fallback"
                : `Matched by ${distanceKm.toFixed(1)}km radius`,
          },
          update: {
            direction: signal.direction,
            relevanceScore,
            impactBps,
            distanceKm,
            matchReason:
              distanceKm === null
                ? "Matched by city/country fallback"
                : `Matched by ${distanceKm.toFixed(1)}km radius`,
          },
        });
        impactsUpserted++;
        affectedHotelIds.add(hotel.id);
      }
    }
  }

  logger.info(
    { impactsUpserted, affectedHotels: affectedHotelIds.size },
    "Signal matching complete"
  );

  return { impactsUpserted, affectedHotelIds: Array.from(affectedHotelIds) };
}
