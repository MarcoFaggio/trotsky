import { prisma } from "@hotel-pricing/db";
import { addUtcDays, startOfTodayUtc, toDateString } from "@hotel-pricing/shared";
import pino from "pino";

const logger = pino({ name: "horizon-refresh" });

function mockOcc(dayOffset: number, roomCount: number) {
  const baseOcc = 72 + Math.sin(dayOffset * 0.5) * 15;
  const lyOcc = 68 + Math.sin(dayOffset * 0.5) * 12;
  const otb = Math.round((baseOcc / 100) * roomCount);
  const otbLy = Math.round((lyOcc / 100) * roomCount);
  const forecastOcc = baseOcc + ((dayOffset * 17) % 5) - 2;
  return {
    occPercent: Math.round(baseOcc * 10) / 10,
    roomsOnBooks: otb,
    occLyPercent: Math.round(lyOcc * 10) / 10,
    otbLyRooms: otbLy,
    availableRooms: Math.max(0, roomCount - otb),
    forecastRooms: Math.round((forecastOcc / 100) * roomCount),
    forecastPercent: Math.round(forecastOcc * 10) / 10,
    arrivals: Math.max(0, Math.round(12 + Math.sin(dayOffset * 0.7) * 8)),
    departures: Math.max(0, Math.round(10 + Math.sin(dayOffset * 0.7 + 1) * 7)),
    overbookingLimit: dayOffset % 7 >= 5 ? 95 : 93,
  };
}

export async function refreshStaleOccupancyAndEvents(): Promise<{
  hotelsTouched: number;
  occupancyUpserted: number;
  eventsShifted: number;
}> {
  const today = startOfTodayUtc();
  const hotels = await prisma.hotel.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, roomCount: true },
  });

  let occupancyUpserted = 0;
  let eventsShifted = 0;

  for (const hotel of hotels) {
    const latestOcc = await prisma.occupancyEntry.findFirst({
      where: { hotelId: hotel.id },
      orderBy: { date: "desc" },
      select: { date: true },
    });

    if (!latestOcc || toDateString(latestOcc.date) < toDateString(today)) {
      const roomCount = hotel.roomCount || 92;
      for (let i = 0; i < 15; i++) {
        const date = addUtcDays(today, i);
        const values = mockOcc(i, roomCount);
        await prisma.occupancyEntry.upsert({
          where: { hotelId_date: { hotelId: hotel.id, date } },
          create: { hotelId: hotel.id, date, ...values },
          update: values,
        });
        occupancyUpserted += 1;
      }
      logger.info({ hotelId: hotel.id }, "Refreshed stale occupancy horizon");
    }

    const latestEvent = await prisma.event.findFirst({
      where: { hotelId: hotel.id },
      orderBy: { date: "desc" },
      select: { date: true },
    });

    if (latestEvent && toDateString(latestEvent.date) < toDateString(today)) {
      const shiftDays =
        Math.floor(
          (today.getTime() - latestEvent.date.getTime()) / 86_400_000
        ) + 7;
      const events = await prisma.event.findMany({
        where: { hotelId: hotel.id },
        select: { id: true, date: true },
      });
      for (const event of events) {
        await prisma.event.update({
          where: { id: event.id },
          data: { date: addUtcDays(event.date, shiftDays) },
        });
        eventsShifted += 1;
      }
      logger.info(
        { hotelId: hotel.id, shiftDays, eventsShifted: events.length },
        "Shifted stale events into the current horizon"
      );
    }
  }

  return {
    hotelsTouched: hotels.length,
    occupancyUpserted,
    eventsShifted,
  };
}
