import { notFound, redirect } from "next/navigation";
import { prisma } from "@hotel-pricing/db";
import { getSession } from "@/lib/auth";
import { HotelSettings } from "@/components/hotels/hotel-settings";

export default async function HotelSettingsPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  if (!session || session.role !== "ANALYST") redirect("/dashboard");

  const hotel = await prisma.hotel.findUnique({
    where: { id: params.id },
    include: {
      listings: true,
      competitors: {
        include: {
          competitor: { include: { listings: true } },
        },
      },
      ratePlans: { orderBy: { code: "asc" } },
    },
  });

  if (!hotel) notFound();

  return <HotelSettings hotel={hotel} />;
}
