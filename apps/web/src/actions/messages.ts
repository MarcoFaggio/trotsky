"use server";

import { prisma } from "@hotel-pricing/db";
import { requireAuth, requireAnalyst, requireHotelAccess } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import type { MessageThreadSummary, MessageItem } from "@hotel-pricing/shared";

export async function getThreadsForUser(): Promise<MessageThreadSummary[]> {
  const session = await requireAuth();
  const isAnalyst = session.role === "ANALYST";

  const whereClause = isAnalyst
    ? {}
    : {
        hotel: { access: { some: { userId: session.sub } } },
      };

  const threads = await prisma.messageThread.findMany({
    where: whereClause,
    include: {
      hotel: { select: { name: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          sender: { select: { name: true, role: true } },
        },
      },
      _count: {
        select: {
          messages: {
            where: {
              readAt: null,
              NOT: { senderUserId: session.sub },
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return threads.map((t) => ({
    id: t.id,
    hotelId: t.hotelId,
    hotelName: t.hotel.name,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    resolvedAt: t.resolvedAt?.toISOString() ?? null,
    lastMessage: t.messages[0]
      ? {
          body: t.messages[0].body,
          senderName: t.messages[0].sender.name || "Unknown",
          createdAt: t.messages[0].createdAt.toISOString(),
        }
      : null,
    unreadCount: t._count.messages,
  }));
}

export async function getThread(
  threadId: string
): Promise<{ thread: MessageThreadSummary; messages: MessageItem[] }> {
  const session = await requireAuth();

  const thread = await prisma.messageThread.findUniqueOrThrow({
    where: { id: threadId },
    include: {
      hotel: { select: { name: true, id: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          sender: { select: { name: true, role: true, id: true } },
        },
      },
    },
  });

  if (session.role === "CLIENT") {
    const access = await prisma.hotelAccess.findFirst({
      where: { userId: session.sub, hotelId: thread.hotelId },
    });
    if (!access) {
      await prisma.securityEvent.create({
        data: {
          userId: session.sub,
          hotelId: thread.hotelId,
          type: "UNAUTHORIZED_THREAD_ACCESS",
          metadataJson: { threadId },
        },
      });
      throw new Error("FORBIDDEN");
    }
  }

  // Mark unread messages as read
  await prisma.message.updateMany({
    where: {
      threadId,
      readAt: null,
      NOT: { senderUserId: session.sub },
    },
    data: { readAt: new Date() },
  });

  return {
    thread: {
      id: thread.id,
      hotelId: thread.hotelId,
      hotelName: thread.hotel.name,
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
      resolvedAt: thread.resolvedAt?.toISOString() ?? null,
      lastMessage: null,
      unreadCount: 0,
    },
    messages: thread.messages.map((m) => ({
      id: m.id,
      body: m.body,
      senderUserId: m.sender.id,
      senderName: m.sender.name || "Unknown",
      senderRole: m.sender.role as "ANALYST" | "CLIENT",
      createdAt: m.createdAt.toISOString(),
      readAt: m.readAt?.toISOString() ?? null,
    })),
  };
}

export async function sendMessage(data: {
  threadId?: string;
  hotelId: string;
  body: string;
}): Promise<{ threadId: string }> {
  const session = await requireAuth();
  await requireHotelAccess(data.hotelId);

  let threadId = data.threadId;

  if (!threadId) {
    const thread = await prisma.messageThread.create({
      data: { hotelId: data.hotelId },
    });
    threadId = thread.id;
  }

  await prisma.message.create({
    data: {
      threadId,
      senderUserId: session.sub,
      body: data.body,
    },
  });

  await prisma.messageThread.update({
    where: { id: threadId },
    data: { updatedAt: new Date() },
  });

  revalidatePath("/messages");
  return { threadId };
}

export async function resolveThread(threadId: string): Promise<void> {
  const session = await requireAnalyst();
  await prisma.messageThread.update({
    where: { id: threadId },
    data: { resolvedAt: new Date(), resolvedByUserId: session.sub },
  });
  revalidatePath("/messages");
}

export async function reopenThread(threadId: string): Promise<void> {
  await requireAnalyst();
  await prisma.messageThread.update({
    where: { id: threadId },
    data: { resolvedAt: null, resolvedByUserId: null },
  });
  revalidatePath("/messages");
}

export async function getUnreadCount(): Promise<number> {
  const session = await requireAuth();
  return prisma.message.count({
    where: {
      readAt: null,
      NOT: { senderUserId: session.sub },
      thread: session.role === "ANALYST"
        ? {}
        : { hotel: { access: { some: { userId: session.sub } } } },
    },
  });
}
