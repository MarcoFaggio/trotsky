"use server";

import { prisma } from "@hotel-pricing/db";
import { requireAnalyst, requireHotelAccess } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function getRatePlans(hotelId: string) {
  await requireHotelAccess(hotelId);
  return prisma.ratePlan.findMany({
    where: { hotelId },
    orderBy: { code: "asc" },
  });
}

export async function createRatePlan(data: {
  hotelId: string;
  code: string;
  name: string;
  discountPercent: number;
}) {
  await requireAnalyst();
  const plan = await prisma.ratePlan.create({
    data: {
      hotelId: data.hotelId,
      code: data.code,
      name: data.name,
      discountPercent: data.discountPercent,
    },
  });
  revalidatePath(`/hotels/${data.hotelId}`);
  return plan;
}

export async function updateRatePlan(data: {
  id: string;
  name?: string;
  discountPercent?: number;
  active?: boolean;
}) {
  await requireAnalyst();
  const plan = await prisma.ratePlan.update({
    where: { id: data.id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.discountPercent !== undefined && { discountPercent: data.discountPercent }),
      ...(data.active !== undefined && { active: data.active }),
    },
  });
  revalidatePath(`/hotels/${plan.hotelId}`);
  return plan;
}

export async function getDiscountMix(hotelId: string, date: string) {
  await requireHotelAccess(hotelId);
  const dateObj = new Date(date + "T00:00:00.000Z");
  return prisma.discountMix.findMany({
    where: { hotelId, date: dateObj },
    include: { plan: true },
  });
}

export async function saveDiscountMix(data: {
  hotelId: string;
  date: string;
  mixes: { planId: string; sharePercent: number }[];
}) {
  await requireAnalyst();
  const dateObj = new Date(data.date + "T00:00:00.000Z");

  await prisma.discountMix.deleteMany({
    where: { hotelId: data.hotelId, date: dateObj },
  });

  if (data.mixes.length > 0) {
    await prisma.discountMix.createMany({
      data: data.mixes.map((m) => ({
        hotelId: data.hotelId,
        date: dateObj,
        planId: m.planId,
        sharePercent: m.sharePercent,
      })),
    });
  }

  revalidatePath(`/hotels/${data.hotelId}`);
}
