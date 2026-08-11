/**
 * Response security headers, applied in middleware to every response.
 *
 * Edge-safe: Web Crypto + process.env only.
 */

/** Per-request nonce so the CSP can allow Next's inline bootstrap without `unsafe-inline`. */
export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/**
 * `strict-dynamic` lets the nonced bootstrap load Next's chunks, and makes the
 * `https:`/`unsafe-inline` fallbacks inert in browsers that support it — they
 * are there only so older browsers degrade to something workable.
 *
 * `style-src` keeps `unsafe-inline`: React inline styles and Next's injected
 * critical CSS are not nonced, so removing it breaks rendering.
 */
/** Google Fonts, loaded from the root layout. Drop these if fonts are self-hosted. */
const FONT_STYLE_ORIGIN = "https://fonts.googleapis.com";
const FONT_FILE_ORIGIN = "https://fonts.gstatic.com";

export function buildCsp(nonce: string, isDev: boolean): string {
  const scriptSrc = isDev
    ? // Dev needs eval for React Refresh / webpack HMR.
      `'self' 'unsafe-eval' 'unsafe-inline'`
    : `'self' 'nonce-${nonce}' 'strict-dynamic' https:`;

  return [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    `style-src 'self' 'unsafe-inline' ${FONT_STYLE_ORIGIN}`,
    `img-src 'self' data: blob: https:`,
    `font-src 'self' data: ${FONT_FILE_ORIGIN}`,
    // No third-party API surface today; widen deliberately if that changes.
    `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `frame-src 'none'`,
    `manifest-src 'self'`,
    ...(isDev ? [] : [`upgrade-insecure-requests`]),
  ].join("; ");
}

/**
 * Enforce the CSP, or only report it.
 *
 * Enforcing by default: the policy was verified against a production build with
 * every script on every route carrying the nonce, so it is not a guess. Set
 * `CSP_MODE=report-only` to downgrade to console warnings if a future
 * third-party embed needs the policy widened — see docs/DEPLOY.md.
 */
export function cspHeaderName(): string {
  return process.env.CSP_MODE === "report-only"
    ? "Content-Security-Policy-Report-Only"
    : "Content-Security-Policy";
}

export function applySecurityHeaders(
  headers: Headers,
  csp: string,
  { isDev }: { isDev: boolean }
): void {
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()"
  );
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("X-DNS-Prefetch-Control", "off");
  headers.set(cspHeaderName(), csp);

  if (!isDev) {
    headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }
}
