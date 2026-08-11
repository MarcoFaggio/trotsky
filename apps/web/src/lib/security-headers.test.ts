import { afterEach, describe, expect, it } from "vitest";
import {
  applySecurityHeaders,
  buildCsp,
  cspHeaderName,
  generateNonce,
} from "./security-headers";

describe("generateNonce", () => {
  it("returns a fresh base64 value each call", () => {
    const a = generateNonce();
    const b = generateNonce();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
    // 16 random bytes -> 24 base64 chars.
    expect(a).toHaveLength(24);
  });
});

describe("buildCsp", () => {
  it("locks down the dangerous directives in production", () => {
    const csp = buildCsp("abc123", false);
    expect(csp).toContain("'nonce-abc123'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("upgrade-insecure-requests");
  });

  it("never allows unsafe-eval or an inline script fallback in production", () => {
    const csp = buildCsp("abc123", false);
    const scriptSrc = csp
      .split("; ")
      .find((directive) => directive.startsWith("script-src"));
    expect(scriptSrc).toBeDefined();
    expect(scriptSrc).not.toContain("unsafe-eval");
    expect(scriptSrc).not.toContain("unsafe-inline");
  });

  it("relaxes only what the dev server needs", () => {
    const csp = buildCsp("abc123", true);
    expect(csp).toContain("'unsafe-eval'");
    expect(csp).toContain("ws:");
    expect(csp).not.toContain("upgrade-insecure-requests");
  });
});

describe("cspHeaderName", () => {
  const original = process.env.CSP_MODE;
  afterEach(() => {
    if (original === undefined) delete process.env.CSP_MODE;
    else process.env.CSP_MODE = original;
  });

  it("enforces by default", () => {
    delete process.env.CSP_MODE;
    expect(cspHeaderName()).toBe("Content-Security-Policy");
  });

  it("downgrades to report-only on explicit opt-out", () => {
    process.env.CSP_MODE = "report-only";
    expect(cspHeaderName()).toBe("Content-Security-Policy-Report-Only");
  });
});

describe("applySecurityHeaders", () => {
  it("sets the full header set and HSTS only outside dev", () => {
    const prod = new Headers();
    applySecurityHeaders(prod, buildCsp("nonce", false), { isDev: false });
    expect(prod.get("X-Content-Type-Options")).toBe("nosniff");
    expect(prod.get("X-Frame-Options")).toBe("DENY");
    expect(prod.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(prod.get("Permissions-Policy")).toContain("geolocation=()");
    expect(prod.get("Cross-Origin-Opener-Policy")).toBe("same-origin");
    expect(prod.get("Strict-Transport-Security")).toContain("max-age=63072000");

    const dev = new Headers();
    applySecurityHeaders(dev, buildCsp("nonce", true), { isDev: true });
    // HSTS over plain-HTTP localhost would pin the browser to https://localhost.
    expect(dev.get("Strict-Transport-Security")).toBeNull();
  });
});
