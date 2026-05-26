# Trosky Tech & UX Hardening Guide

Use this document as the release-quality checklist for Trosky. It turns the product docs into operational guardrails: what must stay true for security, reliability, data quality, AI behavior, and user experience.

## 1. Current Strengths To Preserve

- **Role-aware product model:** Analysts manage the portfolio; clients are scoped through `HotelAccess`.
- **Server-side access control:** Critical mutations use RBAC helpers rather than relying on hidden UI controls.
- **Public capture with abuse controls:** `/inquire` uses validation, honeypot, active-hotel lookup, and rate limiting.
- **Graceful AI posture:** Inquiry analysis is deterministic by default and shaped like future model output.
- **Queue isolation:** The web app can run without the worker; Redis-backed jobs power scrapes and recomputation when available.
- **Structured data foundation:** Prisma models capture rates, occupancy, events, promotions, signals, messages, inquiries, RFPs, and proposals.
- **Action-first revenue MVP:** Command centre, `/actions`, `/rate-calendar`, and evidence drawer around `RevenueAction` rows (live worker output + labelled seed demo).
- **Production/demo separation:** Seed actions hidden in production unless `TROSKY_DEMO_MODE=true`; server-side filtering on all user-facing action surfaces (see [REVENUE-ACTION-SYSTEM.md](./REVENUE-ACTION-SYSTEM.md)).

## 2. Security Hardening

### 2.1 Auth and sessions

- Production must set `JWT_SECRET` and `JWT_REFRESH_SECRET` to separate long random values.
- Auth cookies must remain `httpOnly`, `sameSite=lax`, path `/`, and `secure` in production.
- Protected API routes should return 401/403 JSON; protected pages should redirect to `/login` or a safe role-appropriate page.
- Token refresh should be exercised in smoke tests so users do not hit confusing idle failures.

### 2.2 RBAC invariants

- Every mutation that changes hotel configuration, pricing, occupancy, events, promotions, scraping, or discount mix must require `ANALYST`.
- Every read for clients must be constrained by `HotelAccess`.
- If a page appears in the client sidebar, it must provide scoped client value instead of redirecting unexpectedly.
- Hidden controls are only UX polish; server actions remain the source of truth.

### 2.3 Public surface protection

- Keep public routes minimal: `/`, `/login`, `/inquire`, auth endpoints, health, and public inquiry capture.
- Keep request validation in shared Zod schemas where possible.
- Public inquiry errors should be user-safe and generic.
- Use Redis-backed rate limiting in production by setting `REDIS_URL`; in-memory fallback is acceptable only for local/dev or low-risk demos.
- Log notable public capture events as `SecurityEvent` without storing unnecessary sensitive details.

## 3. Reliability And Operations

### 3.1 Web app behavior

- The web app must remain useful when Redis or the worker is unavailable.
- Queue-dependent buttons must fail with clear messages, not silent no-ops.
- Data-changing actions should revalidate affected routes and queue recommendation recompute when recommendation inputs change.
- Loading, empty, and error states should distinguish missing data from missing permission.

### 3.2 Database and migrations

- Production schema changes should use Prisma migrations and `pnpm db:migrate:deploy`.
- Avoid `prisma db push` in production except for a deliberate emergency recovery.
- Seed data is useful for demos, but production demo credentials should be rotated or disabled before real customer use.
- **RevenueAction demo rows** must not appear on production dashboards unless `TROSKY_DEMO_MODE=true`. Treat demo metrics and calendar urgency as non-authoritative when demo mode is on.
- Backups and restore drills should exist before storing real hotel/client inquiry data.

### 3.3 Worker and queues

- Worker deployments need `DATABASE_URL` and `REDIS_URL`.
- Schedule env defaults:
  - `SCRAPE_CRON=0 */2 * * *`
  - `SIGNAL_CRON=15 */6 * * *`
  - `HOTEL_GEO_CRON=45 2 * * *`
- Worker health should be checked separately from Vercel web health.
- Failed jobs should be inspected through logs and Scrape Admin before rerunning broad scrapes.

## 4. AI And Inquiry Hardening

- Inquiry AI is assistive, not authoritative.
- `INQUIRY_AI_PROVIDER=openai` currently falls back to heuristic analysis; do not document it as live AI until provider calls are implemented.
- Keep `INQUIRY_PUBLIC_AI_ANALYSIS=false` available as a safety switch for public capture.
- Keep `INQUIRY_UI_ANALYZE=false` available as a safety switch for staff-facing analysis.
- Store AI output as structured JSON with provider, confidence, rationale, extracted fields, missing fields, recommended next action, and timestamp.
- Staff edits should override AI-suggested fields.
- Future reply drafting must remain staff-reviewed until explicit send controls, audit logs, and failure modes are designed.
- Test prompt-injection attempts inside guest messages before enabling live model calls.

## 5. UX Acceptance Criteria

### 5.1 Role clarity

- Analysts should see creation, editing, delete, scrape, and settings controls where they have authority.
- Clients should see useful scoped read-only or collaboration views without dead-end controls.
- Error messages should say what the user can do next, not expose internal implementation details.
- Status and priority should be communicated with labels, not color alone.

### 5.2 Navigation and layout

- Mobile bottom navigation must keep primary sections reachable.
- Desktop sidebar collapse must preserve tooltips and badges.
- Top-bar hotel search/selector must never expose inaccessible hotels.
- Page headings should describe the current workflow, not marketing copy.
- Tables/cards should maintain stable dimensions so data updates do not shift controls.

### 5.3 Forms

- Keep visible labels on all fields.
- Use native date, number, email, and telephone inputs where appropriate.
- Disable submit controls during pending states.
- Preserve user input on recoverable errors.
- Empty states should differ by role: analysts can be invited to create; clients should be told when nothing has been configured yet.

### 5.4 Data-heavy screens

- Dashboard metrics should include units and clear fallback text for missing values.
- Recommendation and AI labels should avoid implying certainty; use "recommended" or "suggested," not "correct."
- Calendar and matrix cues should have text/badges in addition to color.
- Export actions should be visible only where allowed and should export the current scoped data.

### 5.5 Action-first surfaces (command centre, actions, rate calendar)

- **Command centre** (`/dashboard`): Shows scoped active actions, metrics (prefer live-only when both live and demo exist), freshness line, highest-priority block, and rate vs comp chart. Empty state must not imply fake urgency when only hidden demo rows exist.
- **Revenue actions** (`/actions`): Category filters (Active, Pricing, Events, Watch, Archived); **Demo / beta** only when `TROSKY_DEMO_MODE` allows. Demo rows show **Demo data** badges via `getRevenueActionSourceMeta`.
- **Rate calendar** (`/rate-calendar`): Day status (urgent / watch / opportunity / healthy) must reflect **live** actions only when demo mode is off.
- **Evidence drawer:** Demo callouts when visible; `not_found` when demo is hidden (including for analysts). Clients remain read-only with clear footer copy.
- **Dark mode:** Authenticated shell uses semantic tokens (`bg-card`, `border-border`, Trosky primitives) — avoid hardcoded `bg-white` on operational surfaces.

### 5.6 Onboarding tour

- Product tour (Joyride) covers sidebar, command centre, revenue actions, rate calendar, and theme toggle. Version stored in `localStorage` (`trosky:onboardingComplete:version`). Re-run after major navigation changes by bumping tour version in code.

## 6. Release Checklist

Before a demo or production release:

- [ ] `pnpm build` passes.
- [ ] Analyst login smoke test passes.
- [ ] Client login smoke test passes.
- [ ] Client cannot access analyst-only routes or mutate analyst-only data.
- [ ] `/promotions`, `/events`, `/inquiries`, `/messages`, `/pace`, and hotel dashboards are useful for clients.
- [ ] `/inquire` succeeds with valid input, rejects invalid input, and rate-limits repeat submissions.
- [ ] Redis-missing states are clear for scrape/refresh features.
- [ ] Worker is either deployed and healthy or explicitly out of scope for the release.
- [ ] Production env includes required secrets and database URL.
- [ ] Public demo credentials are hidden unless intentionally enabled.
- [ ] `TROSKY_DEMO_MODE` is unset or `false` in production (unless this deploy is an intentional demo tenant).
- [ ] Command centre, `/actions`, and `/rate-calendar` show live worker actions after scrape + recompute; no seed-only urgency in production.
- [ ] Direct URL to a seed action evidence drawer returns not found when demo mode is off.
- [ ] `pnpm cleanup:appledouble` run on external-disk checkouts before release builds (macOS T7/USB).

## 7. Priority Backlog

| Priority | Work | Why it matters |
|----------|------|----------------|
| P0 | Keep RBAC checks in every server action/API route | Prevent cross-hotel or client-to-analyst privilege leaks |
| P0 | Add production backup/restore plan before real data | Prevent permanent customer data loss |
| P1 | Add automated analyst/client smoke tests | Catch role-based UX regressions early |
| P1 | Add inquiry AI fixture tests | Make future model integration safer |
| P1 | Add worker health visibility | Distinguish stale data from app failure |
| P2 | Add proposal PDF/shareable proposal flow | Turns inquiry capture into sales workflow |
| P2 | Add structured observability for scrape/recommendation jobs | Makes pricing data quality easier to diagnose |
