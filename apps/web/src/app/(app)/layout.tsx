import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@hotel-pricing/db";
import { AppShell } from "./app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, email: true, role: true, name: true },
  });
  if (!user) redirect("/login");

  let hotels;
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

  // Unread message count
  const unreadMessages = await prisma.message.count({
    where: {
      readAt: null,
      NOT: { senderUserId: user.id },
      thread:
        user.role === "ANALYST"
          ? {}
          : { hotel: { access: { some: { userId: user.id } } } },
    },
  });

  // Upcoming events in next 7 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekOut = new Date(today);
  weekOut.setDate(weekOut.getDate() + 7);
  const upcomingEvents = await prisma.event.count({
    where: {
      date: { gte: today, lte: weekOut },
      ...(user.role === "CLIENT"
        ? { hotel: { access: { some: { userId: user.id } } } }
        : {}),
    },
  });

  return (
    <AppShell
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
    </AppShell>
  );
}
