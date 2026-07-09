import type { NextRequest } from "next/server";

/**
 * Best-effort client IP for rate-limit keys.
 *
 * Prefers `x-real-ip` (set by the trusted reverse proxy / platform). Falls back
 * to the LAST entry of `x-forwarded-for` — the hop appended by the proxy
 * closest to us. The first entry is client-supplied and trivially spoofable,
 * so it must never key a security control.
 */
export function clientIpKey(request: NextRequest): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded.split(",").map((h) => h.trim()).filter(Boolean);
    if (hops.length > 0) return hops[hops.length - 1];
  }

  return "unknown";
}
