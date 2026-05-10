"use server";

import { prisma } from "@hotel-pricing/db";
import { requireAuth, requireAnalyst, requireHotelAccess } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { queueRecommendationRecompute } from "@/lib/recommendation-queue";

export async function getEvents(hotelId?: string) {
  const session = await requireAuth();

  if (hotelId) {
    await requireHotelAccess(hotelId);
    return prisma.event.findMany({
      where: { hotelId },
      include: { hotel: { select: { name: true } } },
      orderBy: { date: "asc" },
    });
  }

  if (session.role === "ANALYST") {
    return prisma.event.findMany({
      include: { hotel: { select: { name: true } } },
      orderBy: { date: "asc" },
    });
  }

  return prisma.event.findMany({
    where: {
      hotel: { access: { some: { userId: session.sub } } },
    },
    include: { hotel: { select: { name: true } } },
    orderBy: { date: "asc" },
  });
}

export async function deleteEvent(id: string) {
  await requireAnalyst();
  const event = await prisma.event.delete({ where: { id } });
  revalidatePath("/events");
  revalidatePath(`/hotels/${event.hotelId}`);
  await queueRecommendationRecompute(event.hotelId, "event-deleted");
}

export async function updateEvent(data: {
  id: string;
  title?: string;
  notes?: string;
}) {
  await requireAnalyst();
  const event = await prisma.event.update({
    where: { id: data.id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
  });
  revalidatePath("/events");
  revalidatePath(`/hotels/${event.hotelId}`);
  await queueRecommendationRecompute(event.hotelId, "event-updated");
  return event;
}

export async function getUpcomingEventCount(): Promise<number> {
  const session = await requireAuth();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekFromNow = new Date(today);
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  const where =
    session.role === "ANALYST"
      ? { date: { gte: today, lte: weekFromNow } }
      : {
          date: { gte: today, lte: weekFromNow },
          hotel: { access: { some: { userId: session.sub } } },
        };

  return prisma.event.count({ where });
}
