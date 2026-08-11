import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@hotel-pricing/db";
import { getSession } from "@/lib/auth";
import { QUEUE_UNAVAILABLE_MESSAGE, getScrapeQueue } from "@/lib/job-queue";

export async function POST(
  _request: NextRequest,
  { params }: { params: { hotelId: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "ANALYST") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { hotelId } = params;
  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    select: { id: true },
  });
  if (!hotel) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
  }

  const queue = getScrapeQueue();
  if (!queue) {
    return NextResponse.json(
      { error: QUEUE_UNAVAILABLE_MESSAGE },
      { status: 503 }
    );
  }

  try {
    const job = await queue.add("hotel-refresh", {
      hotelId,
      trigger: "manual",
      triggeredBy: session.email,
    });
    return NextResponse.json({
      jobId: job.id,
      message: "Refresh job queued for hotel",
    });
  } catch (err) {
    // Never echo the driver error back to the caller — it can carry host,
    // port, and auth detail for the Redis instance.
    console.error("Failed to queue hotel refresh:", err);
    return NextResponse.json(
      { error: "Could not queue the refresh job. Try again shortly." },
      { status: 503 }
    );
  }
}
