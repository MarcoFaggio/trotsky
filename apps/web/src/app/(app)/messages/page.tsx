import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getThreadsForUser } from "@/actions/messages";
import { prisma } from "@hotel-pricing/db";
import { MessageInbox } from "@/components/messaging/message-inbox";

export default async function MessagesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const threads = await getThreadsForUser();

  let hotelId: string | undefined;
  if (session.role === "CLIENT") {
    const access = await prisma.hotelAccess.findFirst({
      where: { userId: session.sub },
    });
    if (access) hotelId = access.hotelId;
  }

  const hotels =
    session.role === "ANALYST"
      ? await prisma.hotel.findMany({
          where: { status: "ACTIVE" },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : hotelId
      ? await prisma.hotel.findMany({
          where: { id: hotelId },
          select: { id: true, name: true },
        })
      : [];

  return (
    <MessageInbox
      threads={threads}
      hotels={hotels}
      currentUserId={session.sub}
      isAnalyst={session.role === "ANALYST"}
    />
  );
}
