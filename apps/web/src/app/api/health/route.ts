import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@hotel-pricing/db";
import { isDemoModeEnabled } from "@/lib/demo-mode";

/**
 * Whether to include the config breakdown.
 *
 * The detail is genuinely useful for ops but it also tells an anonymous caller
 * which secrets are unset and whether a queue exists. Set `HEALTH_DETAIL_TOKEN`
 * and pass it as `x-health-token` (or `?token=`) to see it in production;
 * without a token configured, detail stays on outside production only.
 */
function detailAuthorized(request: NextRequest): boolean {
  const expected = process.env.HEALTH_DETAIL_TOKEN;
  if (!expected) return process.env.NODE_ENV !== "production";

  const provided =
    request.headers.get("x-health-token") ??
    request.nextUrl.searchParams.get("token");
  return provided === expected;
}

/**
 * Never prerender or cache this route.
 *
 * Without these, Next statically evaluates the handler at build time and ships
 * the result as a fixed file: the endpoint then reports the *build machine's*
 * database as healthy forever, including while production is down. A health
 * check that cannot fail is worse than none.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/health - Check env and DB without exposing secrets.
 * Fail-closed when required auth/DB config is missing.
 */
export async function GET(request: NextRequest) {
  const hasDbUrl = Boolean(process.env.DATABASE_URL);
  const hasJwtSecret = Boolean(process.env.JWT_SECRET);
  const hasJwtRefreshSecret = Boolean(process.env.JWT_REFRESH_SECRET);
  const hasRedisUrl = Boolean(process.env.REDIS_URL);
  const demoMode = isDemoModeEnabled();
  const demoTenant = process.env.TROSKY_DEMO_MODE === "true";

  let db: "ok" | "error" = "error";
  let dbMessage: string | undefined;

  if (hasDbUrl) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      db = "ok";
    } catch (e) {
      console.error("Health check DB error:", e instanceof Error ? e.message : e);
      dbMessage = "Database connection failed";
    }
  }

  const ready =
    hasDbUrl &&
    db === "ok" &&
    hasJwtSecret &&
    hasJwtRefreshSecret;

  const hints: string[] = [];
  if (!hasJwtSecret || !hasJwtRefreshSecret) {
    hints.push("Set JWT_SECRET and JWT_REFRESH_SECRET, then redeploy.");
  }
  if (!hasRedisUrl) {
    hints.push(
      "REDIS_URL is unset — scrape/refresh queues are unavailable until Redis is configured and a worker is running."
    );
  }
  // Only nudge demo-mode when this deploy is explicitly a demo tenant flag,
  // or when demo mode is off but the operator set nothing (legacy empty demos).
  if (demoTenant === false && process.env.TROSKY_DEMO_MODE === undefined) {
    hints.push(
      "TROSKY_DEMO_MODE is unset — seeded RevenueActions stay hidden in production. Set true for demo tenants only."
    );
  }

  const status = ready ? 200 : 503;
  const noStore = { "Cache-Control": "no-store, max-age=0" };

  // Enough for an uptime monitor, nothing an attacker can use to fingerprint
  // which parts of the stack are unconfigured.
  if (!detailAuthorized(request)) {
    return NextResponse.json(
      { status: ready ? "ok" : "degraded", ready },
      { status, headers: noStore }
    );
  }

  let lastCompletedScrapeAt: string | null = null;
  let liveActionCount: number | null = null;
  if (db === "ok") {
    try {
      const [lastScrape, liveCount] = await Promise.all([
        prisma.scrapeRun.findFirst({
          where: { status: "COMPLETED" },
          orderBy: { finishedAt: "desc" },
          select: { finishedAt: true },
        }),
        prisma.revenueAction.count({
          where: {
            source: { in: ["RECOMMENDATION", "EVENT_DEMAND"] },
            status: { in: ["PENDING", "SNOOZED"] },
          },
        }),
      ]);
      lastCompletedScrapeAt = lastScrape?.finishedAt?.toISOString() ?? null;
      liveActionCount = liveCount;
    } catch (e) {
      console.error(
        "Health pipeline stats error:",
        e instanceof Error ? e.message : e
      );
    }
  }

  return NextResponse.json(
    {
      status: ready ? "ok" : "degraded",
      ready,
      env: {
        DATABASE_URL: hasDbUrl,
        JWT_SECRET: hasJwtSecret,
        JWT_REFRESH_SECRET: hasJwtRefreshSecret,
        REDIS_URL: hasRedisUrl,
      },
      db,
      demoMode,
      scrapeJobs: hasRedisUrl ? "configured" : "unavailable",
      pipeline: {
        lastCompletedScrapeAt,
        liveActionCount,
      },
      ...(dbMessage && { dbMessage }),
      hints,
    },
    { status, headers: noStore }
  );
}
