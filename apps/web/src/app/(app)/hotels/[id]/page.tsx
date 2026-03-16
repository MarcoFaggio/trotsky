import { notFound, redirect } from "next/navigation";
import { prisma } from "@hotel-pricing/db";
import { getSession } from "@/lib/auth";
import { OverviewDashboard } from "@/components/dashboard/overview-dashboard";

export default async function HotelPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  if (session.role === "CLIENT") {
    const access = await prisma.hotelAccess.findFirst({
      where: { userId: session.sub, hotelId: params.id },
    });
    if (!access) {
      await prisma.securityEvent.create({
        data: {
          userId: session.sub,
          hotelId: params.id,
          type: "UNAUTHORIZED_HOTEL_ACCESS",
          metadataJson: { attempted: params.id, route: "/hotels/[id]" },
        },
      });
      redirect("/dashboard");
    }
  }

  const hotel = await prisma.hotel.findUnique({
    where: { id: params.id },
    include: {
      competitors: {
        where: { active: true },
        include: { competitor: true },
      },
    },
  });

  if (!hotel) notFound();

  return (
    <OverviewDashboard
      hotel={{
        id: hotel.id,
        name: hotel.name,
        roomCount: hotel.roomCount,
        minRate: hotel.minRate,
        maxRate: hotel.maxRate,
        occTarget: hotel.occTarget,
      }}
      competitors={hotel.competitors.map((hc) => ({
        id: hc.competitor.id,
        name: hc.competitor.name,
        weight: hc.weight,
      }))}
      isAnalyst={session.role === "ANALYST"}
    />
  );
}
