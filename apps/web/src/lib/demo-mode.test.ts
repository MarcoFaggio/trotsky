import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isDemoModeEnabled, shouldShowDemoActions } from "./demo-mode";

/**
 * The product rule this guards: seeded RevenueActions must never surface as
 * live hotel intelligence in production unless the deploy is explicitly a demo
 * tenant. Getting this backwards shows fabricated pricing advice to a customer.
 */
describe("demo mode gate", () => {
  beforeEach(() => {
    vi.stubEnv("TROSKY_DEMO_MODE", "");
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("hides demo actions in production when the flag is unset", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(isDemoModeEnabled()).toBe(false);
    expect(shouldShowDemoActions()).toBe(false);
  });

  it("shows demo actions in production only for an explicit demo tenant", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TROSKY_DEMO_MODE", "true");
    expect(isDemoModeEnabled()).toBe(true);
    expect(shouldShowDemoActions()).toBe(true);
  });

  it("shows demo actions outside production by default", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(isDemoModeEnabled()).toBe(true);
  });

  it("lets developers opt into production-like behaviour locally", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("TROSKY_DEMO_MODE", "false");
    expect(isDemoModeEnabled()).toBe(false);
  });

  it("treats any value other than the exact strings as unset", () => {
    vi.stubEnv("NODE_ENV", "production");
    for (const value of ["TRUE", "1", "yes"]) {
      vi.stubEnv("TROSKY_DEMO_MODE", value);
      expect(isDemoModeEnabled(), value).toBe(false);
    }
  });
});
