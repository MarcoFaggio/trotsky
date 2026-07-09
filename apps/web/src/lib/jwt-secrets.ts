/**
 * JWT signing keys shared by Edge middleware and Node route handlers.
 * Edge-safe: only TextEncoder + process.env (no Node-only APIs).
 *
 * Fail-closed: if a secret is not configured, token signing/verification
 * throws instead of silently falling back to a publicly-known constant.
 * The only exception is `next build` (NEXT_PHASE set), where a placeholder
 * keeps static analysis working — build output never verifies real traffic.
 */

function secretBytes(envName: "JWT_SECRET" | "JWT_REFRESH_SECRET"): Uint8Array {
  const value = process.env[envName];
  if (!value) {
    if (process.env.NEXT_PHASE) {
      return new TextEncoder().encode(`build-placeholder-${envName}`);
    }
    throw new Error(
      `Missing required environment variable: ${envName}. ` +
        `Copy .env.example to .env and set it (openssl rand -hex 32).`
    );
  }
  return new TextEncoder().encode(value);
}

/** Access token: must match middleware verification and landing-page token checks. */
export function jwtAccessSecretBytes(): Uint8Array {
  return secretBytes("JWT_SECRET");
}

/** Refresh token (API routes only; not used in middleware). */
export function jwtRefreshSecretBytes(): Uint8Array {
  return secretBytes("JWT_REFRESH_SECRET");
}
