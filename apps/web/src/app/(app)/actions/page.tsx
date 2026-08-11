import { redirect } from "next/navigation";
import { getRevenueActionsPageData } from "@/actions/revenue-actions";
import { RevenueActionsDemo } from "@/components/trosky/revenue-actions-demo";
import { getSession } from "@/lib/auth";
import { shouldShowDemoActions } from "@/lib/demo-mode";
import { prisma } from "@hotel-pricing/db";

export default async function RevenueActionsPage({
  searchParams,
}: {
  searchParams: { hotelId?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  let hotels;
  if (session.role === "ANALYST") {
    hotels = await prisma.hotel.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  } else {
    hotels = await prisma.hotel.findMany({
      where: {
        status: "ACTIVE",
        access: { some: { userId: session.sub } },
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }

  if (hotels.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        {session.role === "CLIENT"
          ? "You do not have access to any hotel revenue actions yet."
          : "No hotels available. Add a hotel or run the seed to use Revenue Actions."}
      </div>
    );
  }

  const hotelId = searchParams.hotelId || hotels[0].id;
  const hotel = hotels.find((h) => h.id === hotelId) ?? hotels[0];
  const { actions, hiddenDemoActionCount } = await getRevenueActionsPageData(
    hotel.id
  );

  return (
    <RevenueActionsDemo
      hotelId={hotel.id}
      hotelName={hotel.name}
      hotels={hotels}
      initialActions={actions}
      isAnalyst={session.role === "ANALYST"}
      demoModeEnabled={shouldShowDemoActions()}
      hiddenDemoActionCount={hiddenDemoActionCount}
    />
  );
}
