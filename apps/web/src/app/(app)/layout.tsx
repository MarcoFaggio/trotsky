import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@hotel-pricing/db";
import { startOfTodayUtc, addUtcDays } from "@hotel-pricing/shared";
import { TroskyShell } from "@/components/trosky";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // getSession() already re-reads the User row (and is memoised per request),
  // so there is no separate user lookup here.
  const user = await getSession();
  if (!user) redirect("/login");

  const isAnalyst = user.role === "ANALYST";
  const ownHotels = { access: { some: { userId: user.sub } } };
  const today = startOfTodayUtc();
  const weekOut = addUtcDays(today, 7);

  // Independent counts — one round trip instead of three sequential ones.
  const [hotels, unreadMessages, upcomingEvents] = await Promise.all([
    prisma.hotel.findMany({
      where: { status: "ACTIVE", ...(isAnalyst ? {} : ownHotels) },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.message.count({
      where: {
        readAt: null,
        NOT: { senderUserId: user.sub },
        thread: isAnalyst ? {} : { hotel: ownHotels },
      },
    }),
    prisma.event.count({
      where: {
        date: { gte: today, lte: weekOut },
        ...(isAnalyst ? {} : { hotel: ownHotels }),
      },
    }),
  ]);

  return (
    <TroskyShell
      user={{
        email: user.email,
        role: user.role,
        name: user.name || undefined,
      }}
      hotels={hotels}
      unreadMessages={unreadMessages}
      upcomingEvents={upcomingEvents}
    >
      {children}
    </TroskyShell>
  );
}
