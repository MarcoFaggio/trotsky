import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getEvents } from "@/actions/events";
import { getImportedSignals } from "@/actions/signals";
import { prisma } from "@hotel-pricing/db";
import { EventsList } from "@/components/dashboard/events-list";

export default async function EventsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const isAnalyst = session.role === "ANALYST";

  let hotelId: string | undefined;
  if (!isAnalyst) {
    const access = await prisma.hotelAccess.findFirst({
      where: { userId: session.sub },
    });
    if (access) hotelId = access.hotelId;
  }

  const events = await getEvents(hotelId);
  const importedSignals = isAnalyst ? await getImportedSignals(hotelId) : [];
  const hotels = isAnalyst
    ? await prisma.hotel.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <EventsList
      events={events.map((e) => ({
        id: e.id,
        hotelId: e.hotelId,
        hotelName: (e as any).hotel?.name || "",
        date: e.date.toISOString().split("T")[0],
        title: e.title,
        notes: e.notes,
      }))}
      importedSignals={importedSignals}
      hotels={hotels}
      isAnalyst={isAnalyst}
    />
  );
}
