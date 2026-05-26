# Revenue Action System

Trosky’s **action-first MVP** surfaces prioritized revenue work as **RevenueActions**: pricing changes, event-driven pricing, demand watches, and (seed) demo items. This document covers product behavior, demo/production separation, and where filtering is enforced.

Related: [DASHBOARD-GUIDE.md](./DASHBOARD-GUIDE.md), [TECH-UX-HARDENING.md](./TECH-UX-HARDENING.md), [DEPLOY.md](./DEPLOY.md).

---

## Product surfaces

| Surface | Route | Purpose |
|---------|-------|---------|
| **Command centre** | `/dashboard` | Highest-priority actions, metrics, rate vs comp chart, explanation panel |
| **Revenue actions** | `/actions` | Full triage queue: filter, accept/reject/snooze/complete (analyst) |
| **Rate calendar** | `/rate-calendar` | Day-level status (urgent / watch / opportunity / healthy) tied to actions |
| **Evidence drawer** | Opened from any action card | Structured evidence, explanation, workflow controls |

**Clients** can view evidence and scoped queues; **workflow mutations** (accept, reject, snooze, complete) are **analyst-only**.

---

## Action types and sources

| Type | Typical source | Notes |
|------|----------------|-------|
| `PRICE_CHANGE` | `RECOMMENDATION` (worker) | Live when not demo |
| `EVENT_PRICING` | `EVENT_DEMAND` (worker) | Live when not demo |
| `WATCH_DEMAND` | Worker / evaluation | Live when not demo |
| `PARITY_FIX`, `INQUIRY_REVIEW`, `STRATEGY_REVIEW` | Seed / future | Often demo-labelled |

**Live** actions: `source` is `RECOMMENDATION` or `EVENT_DEMAND`, and the row is **not** classified as demo.

**Demo** actions: detected server-side via `isActionDemo()` in `apps/web/src/lib/revenue-action-display.ts`:

- `source === "SEED"` or legacy `source === "seed-demo"`
- `evidenceJson.source === "seed-demo"`
- `evidenceJson.demoBeta === true`
- Other evidence/source markers that clearly indicate seed or demo (see helper)

Seed script (`packages/db/prisma/seed.ts`) uses `source: "SEED"` and `evidenceJson.source: "seed-demo"`. Older rows with `source: "seed-demo"` remain supported without a destructive migration.

---

## Demo mode (`TROSKY_DEMO_MODE`)

**Rule:** Live/system-generated actions always show. Demo/seed actions must never silently mix into a production hotel’s live queue.

| Environment | `TROSKY_DEMO_MODE` | Demo actions visible? |
|-------------|-------------------|------------------------|
| Production | unset or `false` | **No** |
| Production demo tenant | `true` | Yes (labelled) |
| Local dev | unset | **Yes** (default) |
| Local dev | `false` | **No** (production-like test) |
| Any | `true` | Yes (labelled) |

Implementation: `apps/web/src/lib/demo-mode.ts` (`isDemoModeEnabled`, `shouldShowDemoActions`). **Server-side only** — do not use `NEXT_PUBLIC_` for this flag.

Central filter: `filterActionsForDemoMode()` in `apps/web/src/services/revenue-action-query-utils.ts`.

### Where filtering is applied

| Layer | File | Behavior |
|-------|------|----------|
| Command centre | `revenue-command-centre-service.ts` | Filters before metrics/sort/limit; exposes `demoModeEnabled`, `hiddenDemoActionCount`, `hasLiveActions` |
| Actions list | `actions/revenue-actions.ts` → `getRevenueActions` | Returns filtered list |
| Rate calendar | `rate-calendar-service.ts` | Demo actions do not affect day status or “View evidence” when demo off |
| Evidence drawer | `revenue-action-insight-service.ts` | Demo + demo off → **`not_found`** (no inference that hidden rows exist) |
| Workflow mutations | `requireRevenueActionAccess` in `revenue-actions.ts` | Demo + demo off → `NOT_FOUND` |

When demo mode is on, live actions are still **prioritized above** demo actions in command centre and list sorting (`prioritizeLiveActions`).

### UI copy

- **Analyst, demo on:** `/actions` — “Demo mode is enabled. Demo actions are visible and labelled.”
- **Analyst, demo off, hidden seeds exist:** Command centre — “Demo actions are hidden because demo mode is disabled.”
- **Clients:** Normal empty states only (no “hidden demo” messaging).

`/actions`: **Demo / beta** filter is hidden when demo mode is disabled.

---

## Workflow (analyst)

Statuses include `PENDING`, `ACCEPTED`, `REJECTED`, `SNOOZED`, `COMPLETED`, `EXPIRED`. Accept records **intent only** — Trosky does not push rates to a PMS.

Mutations revalidate `/actions`, `/dashboard`, and related paths.

---

## Local verification

```bash
# Default local — demo actions visible
pnpm dev

# Production-like — demo hidden
TROSKY_DEMO_MODE=false pnpm dev

# Explicit demo tenant behaviour
TROSKY_DEMO_MODE=true pnpm dev
```

After seed: `analyst@example.com` / `client@example.com`, password `Password123!`.

```bash
pnpm --filter @hotel-pricing/web exec tsc --noEmit
pnpm build
```

---

## What this PR does *not* change

- Worker thresholds, recommendation math, or action generation logic
- RBAC permission model
- Removal of seed data or demo labels on visible rows
