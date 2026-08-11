/**
 * Paths reachable without a session.
 *
 * Extracted from the middleware so the matching rules are unit-testable: this
 * is the kind of logic where a quiet regression (a protected route accidentally
 * matching a public prefix) is invisible until someone exploits it.
 */

export const PUBLIC_PAGES: ReadonlySet<string> = new Set([
  "/",
  "/login",
  "/inquire",
]);

export const PUBLIC_API_PREFIXES: readonly string[] = [
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/auth/logout",
  "/api/health",
  "/api/inquiries/public",
];

/**
 * Pages match exactly; API namespaces match on a `/` boundary.
 *
 * Bare `startsWith` is deliberately avoided — `"/logins".startsWith("/login")`
 * is true, so a future route sharing a prefix with a public one would silently
 * become public.
 */
export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PAGES.has(pathname)) return true;
  return PUBLIC_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
