"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@hotel-pricing/db";
import type { Prisma } from "@hotel-pricing/db";
import {
  createInquirySchema,
  groupRfpSchema,
  inquiryMessageSchema,
  inquiryProposalSchema,
  updateInquiryStatusSchema,
} from "@hotel-pricing/shared";
import type {
  InquiryAiAnalysis,
  InquiryDetail,
  InquirySummary,
} from "@hotel-pricing/shared";
import { requireAuth, requireHotelAccess } from "@/lib/rbac";
import { analyzeInquiry as analyzeInquiryText } from "@/lib/inquiry-ai";

type InquiryListRow = Prisma.InquiryGetPayload<{
  include: {
    hotel: { select: { name: true } };
    _count: { select: { messages: true; proposals: true } };
  };
}>;

function optionalString(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function optionalNumber(value: FormDataEntryValue | null): number | undefined {
  const raw = optionalString(value);
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function optionalCents(value: FormDataEntryValue | null): number | undefined {
  const parsed = optionalNumber(value);
  return parsed === undefined ? undefined : Math.round(parsed * 100);
}

function optionalDate(value?: string | null): Date | undefined {
  if (!value) return undefined;
  return new Date(`${value}T00:00:00.000Z`);
}

function toDateString(date: Date | null | undefined): string | null {
  return date ? date.toISOString().split("T")[0] : null;
}

async function getAccessibleHotelWhere(userId: string, role: "ANALYST" | "CLIENT") {
  return role === "ANALYST"
    ? {}
    : { access: { some: { userId } } };
}

async function requireInquiryAccess(inquiryId: string) {
  const inquiry = await prisma.inquiry.findUniqueOrThrow({
    where: { id: inquiryId },
    select: { id: true, hotelId: true },
  });
  await requireHotelAccess(inquiry.hotelId);
  return inquiry;
}

function mapInquirySummary(inquiry: InquiryListRow): InquirySummary {
  return {
    id: inquiry.id,
    hotelId: inquiry.hotelId,
    hotelName: inquiry.hotel.name,
    source: inquiry.source,
    intent: inquiry.intent,
    status: inquiry.status,
    priority: inquiry.priority,
    guestName: inquiry.guestName,
    guestEmail: inquiry.guestEmail,
    organizationName: inquiry.organizationName,
    summary: inquiry.summary,
    checkIn: toDateString(inquiry.checkIn),
    checkOut: toDateString(inquiry.checkOut),
    guestCount: inquiry.guestCount,
    roomCount: inquiry.roomCount,
    budgetCents: inquiry.budgetCents,
    eventSpaceNeeded: inquiry.eventSpaceNeeded,
    cateringNeeded: inquiry.cateringNeeded,
    aiConfidence: inquiry.aiConfidence,
    createdAt: inquiry.createdAt.toISOString(),
    updatedAt: inquiry.updatedAt.toISOString(),
    messageCount: inquiry._count.messages,
    proposalCount: inquiry._count.proposals,
  };
}

export async function getInquiries(hotelId?: string): Promise<InquirySummary[]> {
  const session = await requireAuth();
  if (hotelId) {
    await requireHotelAccess(hotelId);
  }

  const accessibleHotelWhere = await getAccessibleHotelWhere(
    session.sub,
    session.role
  );

  const inquiries = await prisma.inquiry.findMany({
    where: {
      ...(hotelId ? { hotelId } : {}),
      hotel: accessibleHotelWhere,
    },
    include: {
      hotel: { select: { name: true } },
      _count: { select: { messages: true, proposals: true } },
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  });

  return inquiries.map(mapInquirySummary);
}

export async function getInquiryDetail(
  inquiryId: string
): Promise<InquiryDetail> {
  await requireInquiryAccess(inquiryId);

  const inquiry = await prisma.inquiry.findUniqueOrThrow({
    where: { id: inquiryId },
    include: {
      hotel: { select: { name: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { name: true, email: true } } },
      },
      groupRfp: true,
      proposals: {
        orderBy: { createdAt: "desc" },
        include: { createdBy: { select: { name: true, email: true } } },
      },
      _count: { select: { messages: true, proposals: true } },
    },
  });

  return {
    ...mapInquirySummary(inquiry),
    guestPhone: inquiry.guestPhone,
    aiAnalysis: inquiry.aiExtractedJson as InquiryAiAnalysis | null,
    messages: inquiry.messages.map((message) => ({
      id: message.id,
      senderType: message.senderType,
      senderName: message.sender?.name ?? message.sender?.email ?? null,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
    })),
    groupRfp: inquiry.groupRfp
      ? {
          id: inquiry.groupRfp.id,
          eventType: inquiry.groupRfp.eventType,
          flexibleDates: inquiry.groupRfp.flexibleDates,
          roomsPerNight: inquiry.groupRfp.roomsPerNight,
          attendeeCount: inquiry.groupRfp.attendeeCount,
          meetingRoomSetup: inquiry.groupRfp.meetingRoomSetup,
          foodAndBeverage: inquiry.groupRfp.foodAndBeverage,
          decisionDate: toDateString(inquiry.groupRfp.decisionDate),
          notes: inquiry.groupRfp.notes,
        }
      : null,
    proposals: inquiry.proposals.map((proposal) => ({
      id: proposal.id,
      roomRateCents: proposal.roomRateCents,
      totalEstimateCents: proposal.totalEstimateCents,
      currency: proposal.currency,
      roomBlock: proposal.roomBlock,
      cutoffDate: toDateString(proposal.cutoffDate),
      cancellationTerms: proposal.cancellationTerms,
      notes: proposal.notes,
      status: proposal.status,
      createdByName: proposal.createdBy.name ?? proposal.createdBy.email,
      sentAt: proposal.sentAt?.toISOString() ?? null,
      expiresAt: proposal.expiresAt?.toISOString() ?? null,
      createdAt: proposal.createdAt.toISOString(),
    })),
  };
}

export async function createManualInquiry(formData: FormData): Promise<void> {
  const hotelId = String(formData.get("hotelId") ?? "");
  await requireHotelAccess(hotelId);

  const parsed = createInquirySchema.parse({
    hotelId,
    source: formData.get("source") || "MANUAL",
    intent: formData.get("intent") || "UNKNOWN",
    priority: formData.get("priority") || "NORMAL",
    guestName: optionalString(formData.get("guestName")),
    guestEmail: optionalString(formData.get("guestEmail")),
    guestPhone: optionalString(formData.get("guestPhone")),
    organizationName: optionalString(formData.get("organizationName")),
    summary: optionalString(formData.get("summary")),
    checkIn: optionalString(formData.get("checkIn")),
    checkOut: optionalString(formData.get("checkOut")),
    guestCount: optionalNumber(formData.get("guestCount")),
    roomCount: optionalNumber(formData.get("roomCount")),
    budgetCents: optionalCents(formData.get("budget")),
    eventSpaceNeeded: formData.get("eventSpaceNeeded") === "on",
    cateringNeeded: formData.get("cateringNeeded") === "on",
    initialMessage: optionalString(formData.get("initialMessage")),
  });

  const inquiry = await prisma.inquiry.create({
    data: {
      hotelId: parsed.hotelId,
      source: parsed.source,
      intent: parsed.intent,
      priority: parsed.priority,
      guestName: parsed.guestName || null,
      guestEmail: parsed.guestEmail || null,
      guestPhone: parsed.guestPhone || null,
      organizationName: parsed.organizationName || null,
      summary: parsed.summary || null,
      checkIn: optionalDate(parsed.checkIn) || null,
      checkOut: optionalDate(parsed.checkOut) || null,
      guestCount: parsed.guestCount,
      roomCount: parsed.roomCount,
      budgetCents: parsed.budgetCents,
      eventSpaceNeeded: parsed.eventSpaceNeeded,
      cateringNeeded: parsed.cateringNeeded,
    },
  });

  if (parsed.initialMessage) {
    await prisma.inquiryMessage.create({
      data: {
        inquiryId: inquiry.id,
        senderType: "GUEST",
        body: parsed.initialMessage,
      },
    });
  }

  revalidatePath("/inquiries");
}

export async function analyzeInquiry(formData: FormData): Promise<void> {
  if (process.env.INQUIRY_UI_ANALYZE === "false") {
    return;
  }

  const inquiryId = String(formData.get("inquiryId") ?? "");
  await requireInquiryAccess(inquiryId);

  const inquiry = await prisma.inquiry.findUniqueOrThrow({
    where: { id: inquiryId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        select: { body: true },
      },
    },
  });

  const existingCheckIn = toDateString(inquiry.checkIn);
  const existingCheckOut = toDateString(inquiry.checkOut);
  const analysis = await analyzeInquiryText({
    summary: inquiry.summary,
    messages: inquiry.messages.map((message) => message.body),
    organizationName: inquiry.organizationName,
    checkIn: existingCheckIn,
    checkOut: existingCheckOut,
    roomCount: inquiry.roomCount,
    guestCount: inquiry.guestCount,
    budgetCents: inquiry.budgetCents,
    eventSpaceNeeded: inquiry.eventSpaceNeeded,
    cateringNeeded: inquiry.cateringNeeded,
  });

  await prisma.$transaction([
    prisma.inquiry.update({
      where: { id: inquiryId },
      data: {
        aiConfidence: analysis.confidence,
        aiExtractedJson: analysis as unknown as Prisma.InputJsonValue,
        intent:
          inquiry.intent === "UNKNOWN" && analysis.confidence >= 0.5
            ? analysis.intent
            : inquiry.intent,
        priority:
          inquiry.priority === "NORMAL" && analysis.priority !== "NORMAL"
            ? analysis.priority
            : inquiry.priority,
        status:
          inquiry.status === "NEW" && analysis.suggestedStatus !== "NEW"
            ? analysis.suggestedStatus
            : inquiry.status,
        summary: inquiry.summary ?? analysis.summary,
        checkIn: inquiry.checkIn ?? optionalDate(analysis.extracted.checkIn) ?? null,
        checkOut: inquiry.checkOut ?? optionalDate(analysis.extracted.checkOut) ?? null,
        roomCount: inquiry.roomCount ?? analysis.extracted.roomCount,
        guestCount: inquiry.guestCount ?? analysis.extracted.guestCount,
        budgetCents: inquiry.budgetCents ?? analysis.extracted.budgetCents,
        eventSpaceNeeded: inquiry.eventSpaceNeeded || analysis.extracted.eventSpaceNeeded,
        cateringNeeded: inquiry.cateringNeeded || analysis.extracted.cateringNeeded,
        organizationName: inquiry.organizationName ?? analysis.extracted.organizationName,
      },
    }),
    prisma.inquiryMessage.create({
      data: {
        inquiryId,
        senderType: "SYSTEM",
        body: `AI analysis completed. Intent: ${analysis.intent}. Next action: ${analysis.recommendedNextAction}`,
        metadataJson: analysis as unknown as Prisma.InputJsonValue,
      },
    }),
  ]);

  revalidatePath("/inquiries");
}

export async function updateInquiryStatus(formData: FormData): Promise<void> {
  const parsed = updateInquiryStatusSchema.parse({
    inquiryId: String(formData.get("inquiryId") ?? ""),
    status: formData.get("status"),
    priority: formData.get("priority") || undefined,
    intent: formData.get("intent") || undefined,
  });
  await requireInquiryAccess(parsed.inquiryId);

  await prisma.inquiry.update({
    where: { id: parsed.inquiryId },
    data: {
      status: parsed.status,
      ...(parsed.priority && { priority: parsed.priority }),
      ...(parsed.intent && { intent: parsed.intent }),
    },
  });

  revalidatePath("/inquiries");
}

export async function addInquiryMessage(formData: FormData): Promise<void> {
  const session = await requireAuth();
  const parsed = inquiryMessageSchema.parse({
    inquiryId: String(formData.get("inquiryId") ?? ""),
    body: optionalString(formData.get("body")),
  });
  await requireInquiryAccess(parsed.inquiryId);

  await prisma.$transaction([
    prisma.inquiryMessage.create({
      data: {
        inquiryId: parsed.inquiryId,
        senderType: "STAFF",
        senderUserId: session.sub,
        body: parsed.body,
      },
    }),
    prisma.inquiry.update({
      where: { id: parsed.inquiryId },
      data: { updatedAt: new Date() },
    }),
  ]);

  revalidatePath("/inquiries");
}

export async function upsertGroupRfp(formData: FormData): Promise<void> {
  const parsed = groupRfpSchema.parse({
    inquiryId: String(formData.get("inquiryId") ?? ""),
    eventType: optionalString(formData.get("eventType")),
    flexibleDates: formData.get("flexibleDates") === "on",
    roomsPerNight: optionalNumber(formData.get("roomsPerNight")),
    attendeeCount: optionalNumber(formData.get("attendeeCount")),
    meetingRoomSetup: optionalString(formData.get("meetingRoomSetup")),
    foodAndBeverage: optionalString(formData.get("foodAndBeverage")),
    decisionDate: optionalString(formData.get("decisionDate")),
    notes: optionalString(formData.get("notes")),
  });
  await requireInquiryAccess(parsed.inquiryId);

  await prisma.groupRfp.upsert({
    where: { inquiryId: parsed.inquiryId },
    create: {
      inquiryId: parsed.inquiryId,
      eventType: parsed.eventType || null,
      flexibleDates: parsed.flexibleDates,
      roomsPerNight: parsed.roomsPerNight,
      attendeeCount: parsed.attendeeCount,
      meetingRoomSetup: parsed.meetingRoomSetup || null,
      foodAndBeverage: parsed.foodAndBeverage || null,
      decisionDate: optionalDate(parsed.decisionDate) || null,
      notes: parsed.notes || null,
    },
    update: {
      eventType: parsed.eventType || null,
      flexibleDates: parsed.flexibleDates,
      roomsPerNight: parsed.roomsPerNight,
      attendeeCount: parsed.attendeeCount,
      meetingRoomSetup: parsed.meetingRoomSetup || null,
      foodAndBeverage: parsed.foodAndBeverage || null,
      decisionDate: optionalDate(parsed.decisionDate) || null,
      notes: parsed.notes || null,
    },
  });

  await prisma.inquiry.update({
    where: { id: parsed.inquiryId },
    data: { status: "RFP_READY" },
  });

  revalidatePath("/inquiries");
}

export async function createInquiryProposal(formData: FormData): Promise<void> {
  const session = await requireAuth();
  const parsed = inquiryProposalSchema.parse({
    inquiryId: String(formData.get("inquiryId") ?? ""),
    roomRateCents: optionalCents(formData.get("roomRate")),
    totalEstimateCents: optionalCents(formData.get("totalEstimate")),
    roomBlock: optionalNumber(formData.get("roomBlock")),
    cutoffDate: optionalString(formData.get("cutoffDate")),
    cancellationTerms: optionalString(formData.get("cancellationTerms")),
    notes: optionalString(formData.get("notes")),
    expiresAt: optionalString(formData.get("expiresAt")),
  });
  const inquiry = await requireInquiryAccess(parsed.inquiryId);

  await prisma.$transaction([
    prisma.inquiryProposal.create({
      data: {
        inquiryId: parsed.inquiryId,
        hotelId: inquiry.hotelId,
        roomRateCents: parsed.roomRateCents,
        totalEstimateCents: parsed.totalEstimateCents,
        roomBlock: parsed.roomBlock,
        cutoffDate: optionalDate(parsed.cutoffDate) || null,
        cancellationTerms: parsed.cancellationTerms || null,
        notes: parsed.notes || null,
        status: "SENT",
        sentAt: new Date(),
        expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
        createdByUserId: session.sub,
      },
    }),
    prisma.inquiry.update({
      where: { id: parsed.inquiryId },
      data: { status: "PROPOSAL_SENT" },
    }),
  ]);

  revalidatePath("/inquiries");
}
