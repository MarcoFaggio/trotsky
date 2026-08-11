import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  QUEUE_UNAVAILABLE_MESSAGE,
  getScrapeQueue,
} from "@/lib/job-queue";

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "ANALYST") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const queue = getScrapeQueue();
  if (!queue) {
    return NextResponse.json(
      { error: QUEUE_UNAVAILABLE_MESSAGE },
      { status: 503 }
    );
  }

  try {
    const job = await queue.add("manual-scrape", {
      trigger: "manual",
      triggeredBy: session.email,
    });
    return NextResponse.json({ jobId: job.id, message: "Scrape job queued" });
  } catch (err) {
    console.error("Failed to queue scrape job:", err);
    return NextResponse.json(
      { error: "Could not queue the scrape job. Check the Redis connection and try again." },
      { status: 503 }
    );
  }
}
