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
  // Memoised with the layout's call — this does not re-query.
  const user = await getSession();
  if (!user) redirect("/login");

  const hotels = await prisma.hotel.findMany({
    where: {
      status: "ACTIVE",
      ...(user.role === "ANALYST"
        ? {}
        : { access: { some: { userId: user.sub } } }),
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  if (hotels.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        No hotels available for the rate calendar.
      </div>
    );
  }

  // `hotels` is already scoped to what this user may see, so honouring the URL
  // param just means checking it against that list — no extra access query.
  const requested = searchParams.hotelId;
  const resolvedHotelId =
    hotels.find((h) => h.id === requested)?.id ?? hotels[0].id;

  let view;
  try {
    view = await getRateCalendarView({ hotelId: resolvedHotelId });
  } catch (error) {
    // Only auth failures belong at /login — data errors go to the error boundary.
    const message = error instanceof Error ? error.message : "";
    if (message === "UNAUTHORIZED" || message === "FORBIDDEN") {
      redirect("/login");
    }
    throw error;
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
