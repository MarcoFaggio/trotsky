/**
 * User-facing copy for demo-mode / seed-action visibility gaps.
 * Analyst-facing only — do not surface env var guidance to clients.
 */

export function demoActionsHiddenMessage(count: number): string {
  const subject =
    count === 1
      ? "1 seeded demo action is"
      : `${count} seeded demo actions are`;
  return (
    `${subject} hidden because demo mode is off. ` +
    "Set TROSKY_DEMO_MODE=true and redeploy for a demo tenant, " +
    "or configure REDIS_URL and run the worker to generate live actions."
  );
}
