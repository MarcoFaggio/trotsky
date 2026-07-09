"use server";

import { prisma } from "@hotel-pricing/db";
import { createHotelSchema, updateHotelSchema } from "@hotel-pricing/shared";
import { requireAnalyst, requireHotelAccess } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

function assertRateBounds(minRate?: number | null, maxRate?: number | null) {
  if (minRate !== null && minRate !== undefined && minRate <= 0) {
    throw new Error("Minimum rate must be greater than 0.");
  }
  if (maxRate !== null && maxRate !== undefined && maxRate <= 0) {
    throw new Error("Maximum rate must be greater than 0.");
  }
  if (
    minRate !== null &&
    minRate !== undefined &&
    maxRate !== null &&
    maxRate !== undefined &&
    minRate > maxRate
  ) {
    throw new Error("Maximum rate must be higher than the minimum rate.");
  }
}

export async function getHotels() {
  const { getSession } = await import("@/lib/auth");
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  if (session.role === "ANALYST") {
    return prisma.hotel.findMany({ orderBy: { name: "asc" } });
  }
  return prisma.hotel.findMany({
    where: {
      status: "ACTIVE",
      access: { some: { userId: session.sub } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getHotelById(id: string) {
  await requireHotelAccess(id);
  return prisma.hotel.findUnique({
    where: { id },
    include: {
      listings: true,
      competitors: {
        include: {
          competitor: { include: { listings: true } },
        },
      },
      ratePlans: { where: { active: true }, orderBy: { code: "asc" } },
    },
  });
}

export async function createHotel(formData: FormData) {
  await requireAnalyst();
  const raw = Object.fromEntries(formData);
  const data = createHotelSchema.parse({
    ...raw,
    roomCount: Number(raw.roomCount) || 100,
    minRate: raw.minRate ? Number(raw.minRate) : undefined,
    maxRate: raw.maxRate ? Number(raw.maxRate) : undefined,
    occTarget: raw.occTarget ? Number(raw.occTarget) : undefined,
  });
  assertRateBounds(data.minRate, data.maxRate);

  const hotel = await prisma.hotel.create({
    data: {
      name: data.name,
      pmsName: data.pmsName || null,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      timezone: data.timezone,
      roomCount: data.roomCount,
      minRate: data.minRate ? data.minRate * 100 : null,
      maxRate: data.maxRate ? data.maxRate * 100 : null,
      occTarget: data.occTarget,
    },
  });

  if (data.expediaUrl) {
    await prisma.hotelListing.create({
      data: { hotelId: hotel.id, ota: "EXPEDIA", url: data.expediaUrl },
    });
  }
  if (data.bookingUrl) {
    await prisma.hotelListing.create({
      data: { hotelId: hotel.id, ota: "BOOKING", url: data.bookingUrl },
    });
  }

  revalidatePath("/hotels");
  return hotel;
}

export async function updateHotel(input: {
  id: string;
  name?: string;
  pmsName?: string;
  phone?: string;
  email?: string;
  address?: string;
  timezone?: string;
  roomCount?: number;
  status?: "ACTIVE" | "INACTIVE";
  minRate?: number | null;
  maxRate?: number | null;
  occTarget?: number | null;
}) {
  await requireAnalyst();
  const data = updateHotelSchema.parse(input);
  assertRateBounds(data.minRate, data.maxRate);
  if (data.roomCount !== undefined && (!Number.isInteger(data.roomCount) || data.roomCount <= 0)) {
    throw new Error("Room count must be a whole number greater than 0.");
  }
  if (data.occTarget !== undefined && data.occTarget !== null && (data.occTarget < 0 || data.occTarget > 100)) {
    throw new Error("Occupancy target must be between 0 and 100.");
  }
  const hotel = await prisma.hotel.update({
    where: { id: data.id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.pmsName !== undefined && { pmsName: data.pmsName }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.timezone && { timezone: data.timezone }),
      ...(data.roomCount && { roomCount: data.roomCount }),
      ...(data.status && { status: data.status }),
      ...(data.minRate !== undefined && { minRate: data.minRate }),
      ...(data.maxRate !== undefined && { maxRate: data.maxRate }),
      ...(data.occTarget !== undefined && { occTarget: data.occTarget }),
    },
  });
  revalidatePath(`/hotels/${data.id}`);
  revalidatePath("/hotels");
  return hotel;
}

export async function addCompetitorToHotel(data: {
  hotelId: string;
  name: string;
  expediaUrl: string;
  bookingUrl?: string;
  weight: number;
}) {
  await requireAnalyst();
  
  let competitor = await prisma.competitor.findFirst({ where: { name: data.name } });
  if (!competitor) {
    competitor = await prisma.competitor.create({ data: { name: data.name } });
  }

  const existingListing = await prisma.competitorListing.findFirst({
    where: { competitorId: competitor.id, ota: "EXPEDIA" },
  });
  if (existingListing) {
    await prisma.competitorListing.update({
      where: { id: existingListing.id },
      data: { url: data.expediaUrl },
    });
  } else {
    await prisma.competitorListing.create({
      data: { competitorId: competitor.id, ota: "EXPEDIA", url: data.expediaUrl },
    });
  }

  if (data.bookingUrl) {
    const existingBooking = await prisma.competitorListing.findFirst({
      where: { competitorId: competitor.id, ota: "BOOKING" },
    });
    if (existingBooking) {
      await prisma.competitorListing.update({
        where: { id: existingBooking.id },
        data: { url: data.bookingUrl },
      });
    } else {
      await prisma.competitorListing.create({
        data: { competitorId: competitor.id, ota: "BOOKING", url: data.bookingUrl },
      });
    }
  }

  await prisma.hotelCompetitor.upsert({
    where: { hotelId_competitorId: { hotelId: data.hotelId, competitorId: competitor.id } },
    create: { hotelId: data.hotelId, competitorId: competitor.id, weight: data.weight },
    update: { weight: data.weight, active: true },
  });

  revalidatePath(`/hotels/${data.hotelId}`);
  return competitor;
}

export async function updateHotelCompetitor(data: {
  hotelId: string;
  competitorId: string;
  weight?: number;
  active?: boolean;
}) {
  await requireAnalyst();
  await prisma.hotelCompetitor.update({
    where: { hotelId_competitorId: { hotelId: data.hotelId, competitorId: data.competitorId } },
    data: {
      ...(data.weight !== undefined && { weight: data.weight }),
      ...(data.active !== undefined && { active: data.active }),
    },
  });
  revalidatePath(`/hotels/${data.hotelId}`);
}

export async function removeHotelCompetitor(hotelId: string, competitorId: string) {
  await requireAnalyst();
  await prisma.hotelCompetitor.delete({
    where: { hotelId_competitorId: { hotelId, competitorId } },
  });
  revalidatePath(`/hotels/${hotelId}`);
}
