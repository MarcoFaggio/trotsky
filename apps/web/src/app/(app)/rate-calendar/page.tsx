import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@hotel-pricing/db";
import { getRateCalendarView } from "@/services/rate-calendar-service";
import { RateCalendarViewPanel } from "@/components/trosky/rate-calendar-view";

export default async function RateCalendarPage({
  searchParams,
}: {
  searchParams: { hotelId?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, role: true },
  });
  if (!user) redirect("/login");

  let hotels: { id: string; name: string }[];
  if (user.role === "ANALYST") {
    hotels = await prisma.hotel.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  } else {
    hotels = await prisma.hotel.findMany({
      where: {
        status: "ACTIVE",
        access: { some: { userId: user.id } },
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }

  if (hotels.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        No hotels available for the rate calendar.
      </div>
    );
  }

  let calendarHotelId: string | undefined = searchParams.hotelId;

  if (user.role === "CLIENT") {
    const access = await prisma.hotelAccess.findFirst({
      where: { userId: user.id },
      select: { hotelId: true },
    });
    if (!access) redirect("/login");
    calendarHotelId = access.hotelId;
  }

  const resolvedHotelId = calendarHotelId ?? hotels[0].id;

  let view;
  try {
    view = await getRateCalendarView({
      userId: user.id,
      role: user.role,
      hotelId: resolvedHotelId,
    });
  } catch {
    redirect("/login");
  }

  return (
    <RateCalendarViewPanel
      view={view}
      hotels={hotels}
      hotelId={view.scope.hotelId}
      isAnalyst={user.role === "ANALYST"}
    />
  );
}
