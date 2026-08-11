import type { NextRequest } from "next/server";

/**
 * Best-effort client IP for rate-limit keys.
 *
 * Order matters. `request.ip` and `x-real-ip` are set by the platform edge and
 * cannot be forged by the caller. `x-forwarded-for` is only a fallback, and we
 * read its LAST entry: the leading entries are client-supplied and trivially
 * spoofable, so they must never key a security control.
 *
 * Returns `null` when nothing trustworthy is available — callers decide how to
 * treat that rather than sharing one "unknown" bucket across every caller.
 */
export function clientIp(request: NextRequest): string | null {
  const platformIp = request.ip?.trim();
  if (platformIp) return platformIp;

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded
      .split(",")
      .map((hop) => hop.trim())
      .filter(Boolean);
    if (hops.length > 0) return hops[hops.length - 1];
  }

  return null;
}

/**
 * Rate-limit key for the caller's IP.
 *
 * When no IP can be established, everything collapses into a single shared
 * bucket. That is intentional and fails closed: one anonymous caller can
 * exhaust it for the others, which is the safe direction for an auth endpoint.
 */
export function clientIpKey(request: NextRequest): string {
  return clientIp(request) ?? "unknown-ip";
}
