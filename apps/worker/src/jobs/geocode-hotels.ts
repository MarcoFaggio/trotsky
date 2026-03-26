import { prisma } from "@hotel-pricing/db";
import pino from "pino";

const logger = pino({ name: "geocode-hotels" });

const CITY_COORDINATES: Record<
  string,
  { latitude: number; longitude: number; countryCode: string; market: string; submarket: string }
> = {
  "atlanta, ga": {
    latitude: 33.749,
    longitude: -84.388,
    countryCode: "US",
    market: "Atlanta",
    submarket: "Downtown",
  },
  "new york, ny": {
    latitude: 40.7128,
    longitude: -74.006,
    countryCode: "US",
    market: "New York",
    submarket: "Midtown",
  },
};

function normalizeCity(city?: string | null): string {
  return (city ?? "").trim().toLowerCase();
}

export async function geocodeHotelsProcessor(data?: { hotelId?: string }): Promise<{ updated: number }> {
  const hotels = await prisma.hotel.findMany({
    where: data?.hotelId ? { id: data.hotelId } : { status: "ACTIVE" },
    select: { id: true, city: true },
  });

  let updated = 0;
  for (const hotel of hotels) {
    const normalized = normalizeCity(hotel.city);
    const mapped = CITY_COORDINATES[normalized];
    if (!mapped) {
      continue;
    }

    await prisma.hotel.update({
      where: { id: hotel.id },
      data: {
        latitude: mapped.latitude,
        longitude: mapped.longitude,
        countryCode: mapped.countryCode,
        market: mapped.market,
        submarket: mapped.submarket,
        geoConfidence: 0.7,
        geoSource: "seed-city-map",
        geoUpdatedAt: new Date(),
      },
    });
    updated++;
  }

  logger.info({ updated }, "Hotel geocoding complete");
  return { updated };
}
