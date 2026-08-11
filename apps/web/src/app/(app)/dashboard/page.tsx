import { getSession } from "@/lib/auth";
import { prisma } from "@hotel-pricing/db";
import { redirect } from "next/navigation";
import { OverviewDashboard } from "@/components/dashboard/overview-dashboard";
import { DashboardViewTabs } from "@/components/dashboard/dashboard-view-tabs";
import { RevenueCommandCentre } from "@/components/trosky/revenue-command-centre";
import { getRevenueCommandCentreView } from "@/services/revenue-command-centre-service";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { hotelId?: string; view?: string };
}) {
  // Memoised with the layout's call — this does not re-query.
  const user = await getSession();
  if (!user) redirect("/login");

  let detailHotelId: string | null = searchParams.hotelId || null;
  let commandCentreHotelId: string | undefined =
    searchParams.hotelId || undefined;

  if (user.role === "CLIENT") {
    // Resolve the client's hotel once, from ACTIVE hotels they can reach. The
    // result is authoritative for the rest of the page, so no later re-check
    // of the same id is needed.
    const accessible = await prisma.hotel.findMany({
      where: { status: "ACTIVE", access: { some: { userId: user.sub } } },
      select: { id: true },
      orderBy: { name: "asc" },
    });
    if (accessible.length === 0) redirect("/login");

    // Multi-hotel clients switch via the top-bar selector; the URL param is
    // honoured only when it points at a hotel they actually have access to.
    const requested = searchParams.hotelId;
    const granted = accessible.find((h) => h.id === requested)?.id;

    if (requested && !granted) {
      await prisma.securityEvent
        .create({
          data: {
            userId: user.sub,
            hotelId: null,
            type: "UNAUTHORIZED_HOTEL_ACCESS",
            metadataJson: { attempted: requested, surface: "dashboard" },
          },
        })
        .catch(() => {});
      redirect(`/dashboard?hotelId=${accessible[0].id}`);
    }

    detailHotelId = granted ?? accessible[0].id;
    commandCentreHotelId = detailHotelId;
  }

  let commandView;
  try {
    commandView = await getRevenueCommandCentreView({
      hotelId: commandCentreHotelId,
    });
  } catch (error) {
    // Only auth failures belong at /login — data errors go to the error boundary.
    const message = error instanceof Error ? error.message : "";
    if (message === "UNAUTHORIZED" || message === "FORBIDDEN") {
      redirect("/login");
    }
    throw error;
  }

  if (!detailHotelId) {
    const firstHotel = await prisma.hotel.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true },
    });
    if (!firstHotel) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
          <h2 className="text-xl font-semibold text-foreground">No hotels found</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {user.role === "CLIENT"
              ? "Your account is not linked to a hotel yet. Ask your analyst to grant access."
              : "Create your first hotel or run the database seed to explore the command centre."}
          </p>
        </div>
      );
    }
    detailHotelId = firstHotel.id;
  }

  const hotel = await prisma.hotel.findUnique({
    where: { id: detailHotelId },
    include: {
      competitors: {
        where: { active: true },
        include: { competitor: true },
      },
    },
  });

  if (!hotel) {
    const fallback = await prisma.hotel.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true },
    });
    if (fallback) redirect(`/dashboard?hotelId=${fallback.id}`);
    redirect("/login");
  }

  const marketHint =
    user.role === "ANALYST" && !searchParams.hotelId
      ? "Use the hotel selector in the top bar to change property context."
      : user.role === "CLIENT"
        ? "Read-only charts for your assigned hotel."
        : null;

  return (
    <div className="min-w-0">
      <DashboardViewTabs
        hotelName={hotel.name}
        marketHint={marketHint}
        operate={
          <RevenueCommandCentre
            view={commandView}
            userDisplayName={user.name}
            canManageActions={user.role === "ANALYST"}
          />
        }
        market={
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
            isAnalyst={user.role === "ANALYST"}
          />
        }
      />
    </div>
  );
}
