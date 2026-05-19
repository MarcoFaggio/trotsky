import { getSession } from "@/lib/auth";
import { prisma } from "@hotel-pricing/db";
import { redirect } from "next/navigation";
import { PromotionsList } from "@/components/dashboard/promotions-list";

export default async function PromotionsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const isAnalyst = session.role === "ANALYST";

  const hotelWhere = isAnalyst
    ? {}
    : { hotel: { access: { some: { userId: session.sub } } } };

  const promotions = await prisma.promotion.findMany({
    where: hotelWhere,
    include: { hotel: { select: { name: true } } },
    orderBy: { startDate: "desc" },
  });

  const hotels = isAnalyst
    ? await prisma.hotel.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <PromotionsList
      promotions={promotions}
      hotels={hotels}
      isAnalyst={isAnalyst}
    />
  );
}
