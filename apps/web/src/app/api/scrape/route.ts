import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import Redis from "ioredis";
import { Queue } from "bullmq";

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "ANALYST") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
      maxRetriesPerRequest: null,
    });
    const queue = new Queue("scrape-queue", { connection });
    
    const job = await queue.add("manual-scrape", { trigger: "manual", triggeredBy: session.email });
    
    await connection.quit();
    
    return NextResponse.json({ jobId: job.id, message: "Scrape job queued" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
