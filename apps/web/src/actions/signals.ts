"use server";

import { prisma } from "@hotel-pricing/db";
import { requireAnalyst, requireHotelAccess } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

function toDateObj(date: string): Date {
  return new Date(date + "T00:00:00.000Z");
}

export async function getImportedSignals(hotelId?: string, days = 30) {
  const session = await requireAnalyst();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setDate(end.getDate() + days - 1);

  const impacts = await prisma.hotelSignalImpact.findMany({
    where: {
      ...(hotelId ? { hotelId } : {}),
      date: { gte: today, lte: end },
    },
    include: {
      hotel: { select: { id: true, name: true } },
      externalSignal: {
        select: {
          id: true,
          title: true,
          category: true,
          direction: true,
        },
      },
    },
    orderBy: [{ date: "asc" }, { impactBps: "desc" }],
  });

  return impacts.map((impact) => ({
    id: impact.id,
    hotelId: impact.hotelId,
    hotelName: impact.hotel.name,
    externalSignalId: impact.externalSignalId,
    date: impact.date.toISOString().split("T")[0],
    title: impact.externalSignal.title,
    category: impact.externalSignal.category,
    direction: impact.direction,
    impactBps: impact.impactBps,
    relevanceScore: impact.relevanceScore,
    isSuppressed: impact.isSuppressed,
  }));
}

export async function getSignalsForDate(hotelId: string, date: string) {
  await requireHotelAccess(hotelId);
  const dateObj = toDateObj(date);
  return prisma.hotelSignalImpact.findMany({
    where: {
      hotelId,
      date: dateObj,
      isSuppressed: false,
    },
    include: {
      externalSignal: {
        select: {
          title: true,
          category: true,
          direction: true,
        },
      },
    },
    orderBy: { impactBps: "desc" },
  });
}

export async function suppressSignalImpact(data: {
  hotelId: string;
  externalSignalId: string;
  date: string;
  reason:
    | "IRRELEVANT"
    | "DUPLICATE"
    | "LOW_CONFIDENCE"
    | "MANUAL_OVERRIDE"
    | "OTHER";
  note?: string;
}) {
  const session = await requireAnalyst();
  const dateObj = toDateObj(data.date);
  await prisma.hotelSignalImpact.update({
    where: {
      hotelId_externalSignalId_date: {
        hotelId: data.hotelId,
        externalSignalId: data.externalSignalId,
        date: dateObj,
      },
    },
    data: {
      isSuppressed: true,
      suppressedByUserId: session.sub,
      suppressedAt: new Date(),
      suppressionReason: data.reason,
      suppressionNote: data.note,
    },
  });

  revalidatePath("/events");
  revalidatePath(`/hotels/${data.hotelId}`);
}

export async function unsuppressSignalImpact(data: {
  hotelId: string;
  externalSignalId: string;
  date: string;
}) {
  await requireAnalyst();
  const dateObj = toDateObj(data.date);
  await prisma.hotelSignalImpact.update({
    where: {
      hotelId_externalSignalId_date: {
        hotelId: data.hotelId,
        externalSignalId: data.externalSignalId,
        date: dateObj,
      },
    },
    data: {
      isSuppressed: false,
      suppressedByUserId: null,
      suppressedAt: null,
      suppressionReason: null,
      suppressionNote: null,
    },
  });

  revalidatePath("/events");
  revalidatePath(`/hotels/${data.hotelId}`);
}
