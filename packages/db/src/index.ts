import { PrismaClient } from "@prisma/client";

/**
 * Process-wide Prisma singleton.
 *
 * The global cache is NOT dev-only. Next.js can evaluate a shared module more
 * than once in a single server process (separate route/middleware bundles, and
 * again on each HMR pass), and every extra `new PrismaClient()` opens its own
 * connection pool. Against a serverless Postgres like Neon — where each
 * concurrent lambda already holds a pool — that is how you exhaust connections
 * under load. One client per process, always.
 *
 * On Vercel, also point DATABASE_URL at the pooled (pgbouncer) endpoint and
 * cap the per-instance pool, e.g.
 *   ...-pooler.neon.tech/db?sslmode=require&pgbouncer=true&connection_limit=1
 * See docs/DEPLOY.md.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    // Errors and warnings always; queries only when explicitly requested, so a
    // debug flag never turns into an accidental firehose of PII in prod logs.
    log:
      process.env.PRISMA_LOG_QUERIES === "true"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;

export * from "@prisma/client";
