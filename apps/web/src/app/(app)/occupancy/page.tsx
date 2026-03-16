import { getSession } from "@/lib/auth";
import { prisma } from "@hotel-pricing/db";
import { redirect } from "next/navigation";
import { OccupancyEditor } from "@/components/dashboard/occupancy-editor";

export default async function OccupancyPage({
  searchParams,
}: {
  searchParams: { hotelId?: string };
}) {
  const session = await getSession();
  if (!session || session.role !== "ANALYST") redirect("/dashboard");

  const hotels = await prisma.hotel.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true, roomCount: true },
    orderBy: { name: "asc" },
  });

  const hotelId = searchParams.hotelId || hotels[0]?.id;
  
  let occupancyData: any[] = [];
  if (hotelId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setDate(end.getDate() + 30);
    
    occupancyData = await prisma.occupancyEntry.findMany({
      where: {
        hotelId,
        date: { gte: today, lte: end },
      },
      orderBy: { date: "asc" },
    });
  }

  return (
    <OccupancyEditor
      hotels={hotels}
      initialHotelId={hotelId || null}
      initialData={occupancyData.map((o) => ({
        date: o.date.toISOString().split("T")[0],
        occPercent: o.occPercent,
        roomsOnBooks: o.roomsOnBooks,
        occLyPercent: o.occLyPercent,
        otbLyRooms: o.otbLyRooms,
      }))}
    />
  );
}
