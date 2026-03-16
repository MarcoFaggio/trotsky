import { getSession } from "@/lib/auth";
import { prisma } from "@hotel-pricing/db";
import { redirect } from "next/navigation";
import { PromotionsList } from "@/components/dashboard/promotions-list";

export default async function PromotionsPage() {
  const session = await getSession();
  if (!session || session.role !== "ANALYST") redirect("/dashboard");

  const promotions = await prisma.promotion.findMany({
    include: { hotel: { select: { name: true } } },
    orderBy: { startDate: "desc" },
  });

  const hotels = await prisma.hotel.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return <PromotionsList promotions={promotions} hotels={hotels} />;
}
