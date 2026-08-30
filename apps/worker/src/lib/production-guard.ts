const LOCAL_HOSTS = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "host.docker.internal",
  "postgres",
  "db",
];

/**
 * Refuse hosted / production databases unless SEED_FORCE=true.
 * Same safety model as prisma seed and refresh-demo.
 */
export function assertHostedWriteIsSafe(action: string): void {
  if (process.env.SEED_FORCE === "true") {
    console.warn(`SEED_FORCE=true — ${action} on this database.`);
    return;
  }

  const problems: string[] = [];
  if (process.env.NODE_ENV === "production") {
    problems.push(`NODE_ENV is "production"`);
  }

  const dbUrl = process.env.DATABASE_URL ?? "";
  try {
    const host = new URL(dbUrl).hostname;
    if (host && !LOCAL_HOSTS.includes(host)) {
      problems.push(`DATABASE_URL points at non-local host "${host}"`);
    }
  } catch {
    // Unparseable URL — let Prisma surface the real error later.
  }

  if (problems.length > 0) {
    console.error(
      [
        `Refusing to ${action} on a non-local database.`,
        ...problems.map((p) => `  - ${p}`),
        "Re-run with SEED_FORCE=true if you intend to write rates and live actions here.",
      ].join("\n")
    );
    process.exit(1);
  }
}
