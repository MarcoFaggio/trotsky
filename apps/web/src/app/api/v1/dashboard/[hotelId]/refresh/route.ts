import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import Redis from "ioredis";
import { Queue } from "bullmq";

export async function POST(
  _request: NextRequest,
  { params }: { params: { hotelId: string } }
) {
  const session = await getSession();
  if (!session || session.role !== "ANALYST") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    return NextResponse.json(
      {
        error:
          "Refresh is not configured. Set REDIS_URL in Vercel and run the worker elsewhere (e.g. Railway, Render).",
      },
      { status: 503 }
    );
  }

  try {
    const connection = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
    });
    const queue = new Queue("scrape-queue", { connection });

    const job = await queue.add("hotel-refresh", {
      hotelId: params.hotelId,
      trigger: "manual",
      triggeredBy: session.email,
    });

    await connection.quit();

    return NextResponse.json({
      jobId: job.id,
      message: "Refresh job queued for hotel",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
