/**
 * Trosky demo-mode gate for seed/demo RevenueActions.
 *
 * Product rule:
 * - Live/system-generated actions always show.
 * - Demo/seed actions show in local development by default.
 * - Demo/seed actions are hidden in production unless TROSKY_DEMO_MODE=true.
 * - Set TROSKY_DEMO_MODE=false locally to test production-like behaviour.
 *
 * Server-side only — do not expose via NEXT_PUBLIC_.
 */

export function isDemoModeEnabled(): boolean {
  const flag = process.env.TROSKY_DEMO_MODE;
  if (flag === "true") return true;
  if (flag === "false") return false;
  return process.env.NODE_ENV !== "production";
}

/** Whether seed/demo RevenueActions may appear on user-facing surfaces. */
export function shouldShowDemoActions(): boolean {
  return isDemoModeEnabled();
}
