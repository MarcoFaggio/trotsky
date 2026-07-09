import { getSession } from "@/lib/auth";
import { prisma } from "@hotel-pricing/db";
import { redirect } from "next/navigation";
import { OverviewDashboard } from "@/components/dashboard/overview-dashboard";
import { RevenueCommandCentre } from "@/components/trosky/revenue-command-centre";
import { getRevenueCommandCentreView } from "@/services/revenue-command-centre-service";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { hotelId?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, name: true, role: true },
  });
  if (!user) redirect("/login");

  let detailHotelId: string | null = searchParams.hotelId || null;
  let commandCentreHotelId: string | undefined =
    searchParams.hotelId || undefined;

  if (user.role === "CLIENT") {
    const accesses = await prisma.hotelAccess.findMany({
      where: { userId: user.id },
      select: { hotelId: true },
    });
    if (accesses.length === 0) redirect("/login");
    // Multi-hotel clients may switch via the top-bar selector; the URL param
    // is honored only when it points at a hotel they actually have access to.
    const requested = searchParams.hotelId;
    const granted =
      requested && accesses.some((a) => a.hotelId === requested)
        ? requested
        : accesses[0].hotelId;
    detailHotelId = granted;
    commandCentreHotelId = granted;
  }

  let commandView;
  try {
    commandView = await getRevenueCommandCentreView({
      userId: user.id,
      role: user.role,
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
      where:
        user.role === "ANALYST"
          ? { status: "ACTIVE" }
          : {
              status: "ACTIVE",
              access: { some: { userId: user.id } },
            },
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

  if (user.role === "CLIENT") {
    const access = await prisma.hotelAccess.findFirst({
      where: { userId: user.id, hotelId: hotel.id },
    });
    if (!access) {
      await prisma.securityEvent.create({
        data: {
          userId: user.id,
          hotelId: hotel.id,
          type: "UNAUTHORIZED_HOTEL_ACCESS",
          metadataJson: { attempted: hotel.id },
        },
      });
      const clientAccess = await prisma.hotelAccess.findFirst({
        where: { userId: user.id },
      });
      if (clientAccess) redirect(`/dashboard?hotelId=${clientAccess.hotelId}`);
      redirect("/login");
    }
  }

  return (
    <div className="min-w-0 space-y-8">
      <RevenueCommandCentre
        view={commandView}
        userDisplayName={user.name}
        canManageActions={user.role === "ANALYST"}
      />

      <div className="min-w-0 space-y-4" data-tour="detailed-dashboard">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Detailed dashboard</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Rate matrix, competitors, and calendar for{" "}
            <span className="font-medium text-foreground">{hotel.name}</span>.
            {user.role === "ANALYST" && !searchParams.hotelId ? (
              <span>
                {" "}
                Use the hotel selector in the top bar to change property context.
              </span>
            ) : user.role === "CLIENT" ? (
              <span> Read-only charts for your assigned hotel.</span>
            ) : null}
          </p>
        </div>
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
      </div>
    </div>
  );
}
