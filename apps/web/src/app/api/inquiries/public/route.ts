import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@hotel-pricing/db";
import type { Prisma } from "@hotel-pricing/db";
import { publicInquirySchema } from "@hotel-pricing/shared";
import { analyzeInquiry } from "@/lib/inquiry-ai";
import { checkRateLimitAsync } from "@/lib/rate-limiter";
import { clientIpKey } from "@/lib/client-ip";

function summarizeGuestMessage(message: string): string | null {
  const cleaned = message.replace(/\s+/g, " ").trim();
  if (!cleaned) return null;
  return cleaned.length > 220 ? `${cleaned.slice(0, 217)}...` : cleaned;
}

function publicAiAnalysisEnabled(): boolean {
  return process.env.INQUIRY_PUBLIC_AI_ANALYSIS !== "false";
}

export async function POST(request: NextRequest) {
  const rateLimit = await checkRateLimitAsync(
    `public-inquiry:${clientIpKey(request)}`
  );
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many inquiry submissions. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = publicInquirySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid inquiry payload" }, { status: 400 });
    }

    const hotel = await prisma.hotel.findFirst({
      where: { id: parsed.data.hotelId, status: "ACTIVE" },
      select: { id: true },
    });
    if (!hotel) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    }

    const runAnalysis = publicAiAnalysisEnabled();

    if (!runAnalysis) {
      const summary = summarizeGuestMessage(parsed.data.message);
      const inquiry = await prisma.inquiry.create({
        data: {
          hotelId: parsed.data.hotelId,
          source: parsed.data.source,
          intent: "UNKNOWN",
          status: "NEW",
          priority: "NORMAL",
          guestName: parsed.data.name || null,
          guestEmail: parsed.data.email || null,
          guestPhone: parsed.data.phone || null,
          organizationName: parsed.data.organizationName || null,
          summary,
          messages: {
            create: [
              { senderType: "GUEST", body: parsed.data.message },
              {
                senderType: "SYSTEM",
                body: `Inquiry captured from ${parsed.data.source}. Automatic analysis is disabled.`,
              },
            ],
          },
        },
        select: { id: true, status: true, intent: true },
      });

      await prisma.securityEvent
        .create({
          data: {
            type: "PUBLIC_INQUIRY_CREATED",
            hotelId: parsed.data.hotelId,
            metadataJson: {
              inquiryId: inquiry.id,
              analysis: "skipped",
            },
          },
        })
        .catch(() => {});

      return NextResponse.json({ inquiry });
    }

    const analysis = await analyzeInquiry({
      messages: [parsed.data.message],
      organizationName: parsed.data.organizationName || null,
    });

    const inquiry = await prisma.inquiry.create({
      data: {
        hotelId: parsed.data.hotelId,
        source: parsed.data.source,
        intent: analysis.confidence >= 0.5 ? analysis.intent : "UNKNOWN",
        status: analysis.suggestedStatus === "RFP_READY" ? "QUALIFYING" : analysis.suggestedStatus,
        priority: analysis.priority,
        guestName: parsed.data.name || null,
        guestEmail: parsed.data.email || null,
        guestPhone: parsed.data.phone || null,
        organizationName: parsed.data.organizationName || null,
        summary: analysis.summary,
        checkIn: analysis.extracted.checkIn
          ? new Date(`${analysis.extracted.checkIn}T00:00:00.000Z`)
          : null,
        checkOut: analysis.extracted.checkOut
          ? new Date(`${analysis.extracted.checkOut}T00:00:00.000Z`)
          : null,
        guestCount: analysis.extracted.guestCount,
        roomCount: analysis.extracted.roomCount,
        budgetCents: analysis.extracted.budgetCents,
        eventSpaceNeeded: analysis.extracted.eventSpaceNeeded,
        cateringNeeded: analysis.extracted.cateringNeeded,
        aiConfidence: analysis.confidence,
        aiExtractedJson: analysis as unknown as Prisma.InputJsonValue,
        messages: {
          create: [
            {
              senderType: "GUEST",
              body: parsed.data.message,
            },
            {
              senderType: "SYSTEM",
              body: `Inquiry captured from ${parsed.data.source}. Intent: ${analysis.intent}.`,
              metadataJson: analysis as unknown as Prisma.InputJsonValue,
            },
          ],
        },
      },
      select: { id: true, status: true, intent: true },
    });

    await prisma.securityEvent
      .create({
        data: {
          type: "PUBLIC_INQUIRY_CREATED",
          hotelId: parsed.data.hotelId,
          metadataJson: {
            inquiryId: inquiry.id,
            analysis: "heuristic",
          },
        },
      })
      .catch(() => {});

    return NextResponse.json({ inquiry });
  } catch (error) {
    // This endpoint is unauthenticated: a raw error message would hand out
    // Prisma schema and column detail. Log it, return something opaque.
    console.error("Public inquiry error:", error);
    return NextResponse.json(
      { error: "Could not submit your inquiry. Please try again." },
      { status: 500 }
    );
  }
}
