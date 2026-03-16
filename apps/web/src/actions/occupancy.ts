"use server";

import { prisma } from "@hotel-pricing/db";
import { requireAnalyst, requireHotelAccess } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function upsertOccupancy(data: {
  hotelId: string;
  date: string;
  occPercent?: number | null;
  roomsOnBooks?: number | null;
  occLyPercent?: number | null;
  otbLyRooms?: number | null;
  availableRooms?: number | null;
  forecastRooms?: number | null;
  forecastPercent?: number | null;
  arrivals?: number | null;
  departures?: number | null;
  overbookingLimit?: number | null;
}) {
  await requireAnalyst();
  const dateObj = new Date(data.date + "T00:00:00.000Z");

  await prisma.occupancyEntry.upsert({
    where: { hotelId_date: { hotelId: data.hotelId, date: dateObj } },
    create: {
      hotelId: data.hotelId,
      date: dateObj,
      occPercent: data.occPercent,
      roomsOnBooks: data.roomsOnBooks,
      occLyPercent: data.occLyPercent,
      otbLyRooms: data.otbLyRooms,
      availableRooms: data.availableRooms,
      forecastRooms: data.forecastRooms,
      forecastPercent: data.forecastPercent,
      arrivals: data.arrivals,
      departures: data.departures,
      overbookingLimit: data.overbookingLimit,
    },
    update: {
      ...(data.occPercent !== undefined && { occPercent: data.occPercent }),
      ...(data.roomsOnBooks !== undefined && { roomsOnBooks: data.roomsOnBooks }),
      ...(data.occLyPercent !== undefined && { occLyPercent: data.occLyPercent }),
      ...(data.otbLyRooms !== undefined && { otbLyRooms: data.otbLyRooms }),
      ...(data.availableRooms !== undefined && { availableRooms: data.availableRooms }),
      ...(data.forecastRooms !== undefined && { forecastRooms: data.forecastRooms }),
      ...(data.forecastPercent !== undefined && { forecastPercent: data.forecastPercent }),
      ...(data.arrivals !== undefined && { arrivals: data.arrivals }),
      ...(data.departures !== undefined && { departures: data.departures }),
      ...(data.overbookingLimit !== undefined && { overbookingLimit: data.overbookingLimit }),
    },
  });

  revalidatePath(`/hotels/${data.hotelId}`);
  revalidatePath("/dashboard");
  revalidatePath("/occupancy");
}

export async function bulkUpsertOccupancy(
  entries: {
    hotelId: string;
    date: string;
    occPercent?: number | null;
    roomsOnBooks?: number | null;
    occLyPercent?: number | null;
    otbLyRooms?: number | null;
  }[]
) {
  await requireAnalyst();
  
  for (const entry of entries) {
    const dateObj = new Date(entry.date + "T00:00:00.000Z");
    await prisma.occupancyEntry.upsert({
      where: { hotelId_date: { hotelId: entry.hotelId, date: dateObj } },
      create: {
        hotelId: entry.hotelId,
        date: dateObj,
        occPercent: entry.occPercent,
        roomsOnBooks: entry.roomsOnBooks,
        occLyPercent: entry.occLyPercent,
        otbLyRooms: entry.otbLyRooms,
      },
      update: {
        ...(entry.occPercent !== undefined && { occPercent: entry.occPercent }),
        ...(entry.roomsOnBooks !== undefined && { roomsOnBooks: entry.roomsOnBooks }),
        ...(entry.occLyPercent !== undefined && { occLyPercent: entry.occLyPercent }),
        ...(entry.otbLyRooms !== undefined && { otbLyRooms: entry.otbLyRooms }),
      },
    });
  }

  revalidatePath("/occupancy");
}

export async function getOccupancyData(hotelId: string, days: number = 30) {
  await requireHotelAccess(hotelId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setDate(end.getDate() + days);

  return prisma.occupancyEntry.findMany({
    where: {
      hotelId,
      date: { gte: today, lte: end },
    },
    orderBy: { date: "asc" },
  });
}

export async function setPriceOverride(data: {
  hotelId: string;
  date: string;
  overridePriceCents: number;
  reason?: string;
}) {
  const session = await requireAnalyst();
  const dateObj = new Date(data.date + "T00:00:00.000Z");

  await prisma.priceOverride.upsert({
    where: { hotelId_date: { hotelId: data.hotelId, date: dateObj } },
    create: {
      hotelId: data.hotelId,
      date: dateObj,
      overridePriceCents: data.overridePriceCents,
      reason: data.reason,
      createdByUserId: session.sub,
    },
    update: {
      overridePriceCents: data.overridePriceCents,
      reason: data.reason,
    },
  });

  revalidatePath(`/hotels/${data.hotelId}`);
}

export async function createEvent(data: {
  hotelId: string;
  date: string;
  title: string;
  notes?: string;
}) {
  await requireAnalyst();
  const dateObj = new Date(data.date + "T00:00:00.000Z");
  
  const event = await prisma.event.create({
    data: {
      hotelId: data.hotelId,
      date: dateObj,
      title: data.title,
      notes: data.notes,
    },
  });

  revalidatePath(`/hotels/${data.hotelId}`);
  return event;
}

export async function createPromotion(data: {
  hotelId: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  terms?: string;
}) {
  await requireAnalyst();
  
  const promo = await prisma.promotion.create({
    data: {
      hotelId: data.hotelId,
      title: data.title,
      description: data.description,
      startDate: new Date(data.startDate + "T00:00:00.000Z"),
      endDate: new Date(data.endDate + "T00:00:00.000Z"),
      terms: data.terms,
    },
  });

  revalidatePath(`/hotels/${data.hotelId}`);
  revalidatePath("/promotions");
  return promo;
}

export async function getPromotions(hotelId?: string) {
  if (hotelId) {
    await requireHotelAccess(hotelId);
    return prisma.promotion.findMany({
      where: { hotelId },
      include: { hotel: { select: { name: true } } },
      orderBy: { startDate: "desc" },
    });
  }
  await requireAnalyst();
  return prisma.promotion.findMany({
    include: { hotel: { select: { name: true } } },
    orderBy: { startDate: "desc" },
  });
}

export async function deletePromotion(id: string) {
  await requireAnalyst();
  await prisma.promotion.delete({ where: { id } });
  revalidatePath("/promotions");
}

export async function getEventsForDate(hotelId: string, date: string) {
  await requireHotelAccess(hotelId);
  const dateObj = new Date(date + "T00:00:00.000Z");
  return prisma.event.findMany({
    where: { hotelId, date: dateObj },
  });
}

export async function getPromotionsForDate(hotelId: string, date: string) {
  await requireHotelAccess(hotelId);
  const dateObj = new Date(date + "T00:00:00.000Z");
  return prisma.promotion.findMany({
    where: {
      hotelId,
      startDate: { lte: dateObj },
      endDate: { gte: dateObj },
    },
  });
}
