import { describe, expect, it } from "vitest";
import { isPublicPath } from "./public-paths";

describe("isPublicPath", () => {
  it("allows the documented public surfaces", () => {
    for (const path of [
      "/",
      "/login",
      "/inquire",
      "/api/auth/login",
      "/api/auth/refresh",
      "/api/auth/logout",
      "/api/health",
      "/api/inquiries/public",
    ]) {
      expect(isPublicPath(path), path).toBe(true);
    }
  });

  it("protects every authenticated surface", () => {
    for (const path of [
      "/dashboard",
      "/actions",
      "/rate-calendar",
      "/hotels",
      "/hotels/abc123",
      "/hotels/abc123/settings",
      "/portfolio",
      "/occupancy",
      "/pace",
      "/events",
      "/promotions",
      "/messages",
      "/admin/scrapes",
      "/api/scrape",
      "/api/auth/me",
      "/api/v1/hotels/search",
      "/api/v1/dashboard/abc123",
    ]) {
      expect(isPublicPath(path), path).toBe(false);
    }
  });

  it("does not leak access to routes that merely share a prefix", () => {
    // `/inquiries` is the authenticated inbox and must not match `/inquire`.
    expect(isPublicPath("/inquiries")).toBe(false);
    expect(isPublicPath("/inquiries/abc")).toBe(false);
    // A bare startsWith would make all of these public.
    expect(isPublicPath("/logins")).toBe(false);
    expect(isPublicPath("/login-admin")).toBe(false);
    expect(isPublicPath("/api/healthz")).toBe(false);
    expect(isPublicPath("/api/auth/login-as")).toBe(false);
    expect(isPublicPath("/api/inquiries/public-export")).toBe(false);
  });

  it("only treats the site root as an exact match", () => {
    expect(isPublicPath("/")).toBe(true);
    expect(isPublicPath("/anything")).toBe(false);
  });

  it("matches API namespaces on a path boundary", () => {
    expect(isPublicPath("/api/health")).toBe(true);
    expect(isPublicPath("/api/health/deep")).toBe(true);
    expect(isPublicPath("/api/healthcheck")).toBe(false);
  });
});
