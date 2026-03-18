import { NextResponse } from "next/server";
import { prisma } from "@hotel-pricing/db";

/**
 * GET /api/health - Check env and DB without exposing secrets.
 * Use this to verify DATABASE_URL is set and the DB is reachable.
 */
export async function GET() {
  const hasDbUrl = Boolean(process.env.DATABASE_URL);
  let db: "ok" | "error" = "error";
  let dbMessage: string | undefined;

  if (hasDbUrl) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      db = "ok";
    } catch (e) {
      dbMessage = e instanceof Error ? e.message : String(e);
    }
  }

  const status = hasDbUrl && db === "ok" ? 200 : 503;
  return NextResponse.json(
    {
      env: { DATABASE_URL: hasDbUrl },
      db,
      ...(dbMessage && { dbMessage }),
    },
    { status }
  );
}
