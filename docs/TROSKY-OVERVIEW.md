# Trosky — Overview

This document describes **what Trosky is**, **who it is for**, how the **system is structured**, and **what has shipped recently**. Use it as the high-level entry point; deeper behavior lives in [PRODUCT-DOCUMENTATION.md](./PRODUCT-DOCUMENTATION.md), [AI-INQUIRY-LAYER.md](./AI-INQUIRY-LAYER.md), and [USER-GUIDE-ANALYST-AND-CLIENT.md](./USER-GUIDE-ANALYST-AND-CLIENT.md).

For production readiness and experience standards, use [TECH-UX-HARDENING.md](./TECH-UX-HARDENING.md) as the quality gate before demos, releases, and larger feature work.

---

## What Trosky is

**Trosky** is hotel revenue intelligence software: a web application that helps revenue teams and hotel stakeholders **track competitor rates**, **monitor occupancy and pace**, **layer events and promotions**, and receive **AI-assisted rate recommendations** grounded in scraped OTA data and operational inputs.

At a glance:

| Layer | Purpose |
|--------|---------|
| **Data** | PostgreSQL stores hotels, competitors, daily rates (scraped or mock), occupancy, events, promotions, recommendations, and (optionally) Redis-backed jobs for scraping and recomputation. |
| **Apps** | **Next.js 14** (`apps/web`) — landing site, authenticated dashboard, APIs, server actions. **Worker** (`apps/worker`) — BullMQ jobs for scrapes and recommendation recompute. |
| **Packages** | **Prisma** schema (`packages/db`), shared **Zod types** and helpers (`packages/shared`). |

Trosky is **not** a PMS or channel manager in the current scope: rates enter via **scraping** (mock or Playwright “real” mode) and **manual overrides**; occupancy is **entered manually** (bulk entry for analysts).

---

## Who uses it

### Analyst (revenue / Trosky team)

- Sees **all active hotels** in the portfolio.
- Manages **hotels, competitors, listings**, runs **scrapes**, edits **occupancy**, **events**, **promotions**, **rate plans**, **price overrides**.
- Uses **Inquiries** to see **every hotel’s** booking leads and run qualification workflows.

### Client (hotel stakeholder)

- Sees **only hotels** granted via **HotelAccess** (typically one hotel in demos).
- **Read-only** on pricing intelligence: dashboard, matrix, calendar, day detail, pace — **no** scrape admin, **no** bulk occupancy, **no** hotel settings.
- Uses **Inquiries** for **their** hotel(s) only: triage leads, add staff messages, update status, optional **Analyze** (heuristic extraction).

Both roles share the **same app shell** (sidebar, hotel selector where applicable). Permissions differ by **role** and **hotel access** on every server action and API.

---

## Product surfaces (URLs)

| Surface | Who | URL |
|---------|-----|-----|
| Marketing / landing | Public | `/` (logged-out users; logged-in users with valid session redirect to `/dashboard`) |
| Login | Public | `/login` |
| Public inquiry form | Public (guests / planners) | `/inquire` → `POST /api/inquiries/public` |
| Command centre | Authenticated | `/dashboard` — prioritized **RevenueActions**, metrics, rate chart |
| Revenue actions | Authenticated | `/actions` — full triage queue (analyst workflow; client read-only) |
| Rate calendar | Authenticated | `/rate-calendar` — day-level urgency from actions + rates |
| Hotel cockpit (matrix/calendar) | Authenticated | `/hotels/[id]`, `/pace`, `/events`, `/promotions`, … |
| Inquiry inbox | Authenticated | `/inquiries` (same route; **scope** differs by role) |

**Action-first flow:** Analysts and clients land on the command centre, open **evidence** from an action card, and use **Revenue actions** for full filtering. See [REVENUE-ACTION-SYSTEM.md](./REVENUE-ACTION-SYSTEM.md).

---

## Inquiry layer (first slice)

The **AI inquiry layer** captures demand (web form today), stores **Inquiry** + **InquiryMessage**, and runs a **deterministic “heuristic” analyzer** (`INQUIRY_AI_PROVIDER=heuristic`) that fills **`aiExtractedJson`**, **`aiConfidence`**, intent/status suggestions, and **missing fields** — shaped like future LLM output.

- **Product / domain:** [AI-INQUIRY-LAYER.md](./AI-INQUIRY-LAYER.md)
- **Implementation:** `apps/web/src/lib/inquiry-ai.ts`, `apps/web/src/actions/inquiries.ts`, `apps/web/src/app/(app)/inquiries/page.tsx`, `apps/web/src/app/inquire/page.tsx`, `apps/web/src/app/api/inquiries/public/route.ts`

Live OpenAI (or similar) calls are **placeholders** until explicitly wired; the UI and DB are **model-ready**.

---

## Recent engineering work (summary)

This section records major themes shipped in the Trosky repo. For file-level history, use `git log`.

### Action-first revenue MVP

- **`RevenueAction`** model and workflow: `PRICE_CHANGE`, `EVENT_PRICING`, `WATCH_DEMAND`, plus seed types for demos.
- **Command centre** (`/dashboard`), **Revenue actions** (`/actions`), **Rate calendar** (`/rate-calendar`), **evidence drawer** (insight panel).
- Worker-generated live actions (`RECOMMENDATION`, `EVENT_DEMAND`); seed rows labelled **Demo data**.
- **Production/demo separation:** `TROSKY_DEMO_MODE` + server-side `filterActionsForDemoMode()` — see [REVENUE-ACTION-SYSTEM.md](./REVENUE-ACTION-SYSTEM.md).

### UX polish & theming

- Command centre: scope/freshness header, live vs demo strip, role-specific empties, mutation error copy.
- Action cards: human urgency/confidence labels, client read-only notes, evidence-first CTAs.
- **Dark mode** across authenticated app: semantic surfaces in `globals.css` and `trosky-primitives` (`bg-card`, `border-border`).
- **Product tour** (~40 steps): sidebar, command centre, actions, calendar, theme toggle; versioned in `localStorage`.

### Revenue cockpit & data (legacy + ongoing)

- Prisma migrations including **daily rate uniqueness**, **inquiry layer**, and **RevenueAction** tables.
- Hotel dashboard matrix/calendar/day detail remain the deep-dive pricing cockpit at `/hotels/[id]`.

### Inquiry feature

- **`/inquire`** public form; **`/inquiries`** inbox (analyst: all hotels; client: assigned only).
- Heuristic analysis (`INQUIRY_AI_PROVIDER=heuristic`); model-ready JSON shape.

### Tooling & ops

- Web dev on **port 3030**; `pnpm dev` with polling for external drives.
- **`pnpm cleanup:appledouble`** / `scripts/cleanup-macos-appledouble.py` — remove macOS `._*` files (important on T7/USB before `next dev` / `next build`).
- Root **`pnpm exec dotenv -e .env`** for migrate/seed; **`scripts/dev-local.sh`** for macOS ulimit + Docker.

### Documentation

- [REVENUE-ACTION-SYSTEM.md](./REVENUE-ACTION-SYSTEM.md), [TECH-UX-HARDENING.md](./TECH-UX-HARDENING.md), deploy/demo env notes in [DEPLOY.md](./DEPLOY.md) and `.env.example`.

---

## Where to read next

| Document | Audience |
|----------|----------|
| [README.md](../README.md) | Clone, env, commands, quick links |
| [USER-GUIDE-ANALYST-AND-CLIENT.md](./USER-GUIDE-ANALYST-AND-CLIENT.md) | Day-to-day usage by role |
| [PRODUCT-DOCUMENTATION.md](./PRODUCT-DOCUMENTATION.md) | Full product spec |
| [AI-INQUIRY-LAYER.md](./AI-INQUIRY-LAYER.md) | Inquiry product & technical design |
| [REVENUE-ACTION-SYSTEM.md](./REVENUE-ACTION-SYSTEM.md) | RevenueActions, demo mode, surfaces, filtering |
| [TECH-UX-HARDENING.md](./TECH-UX-HARDENING.md) | Production hardening, security, reliability, and UX standards |
| [FEATURE-UX-AUDIT.md](./FEATURE-UX-AUDIT.md) | Unique feature inventory and prioritized frontend strengthening backlog |
| [API.md](./API.md) | HTTP routes and server actions index |
| [DEPLOY.md](./DEPLOY.md) | Production deployment |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Common failures (DB, EMFILE, etc.) |

---

## Tech stack (short)

- **Frontend:** Next.js 14 App Router, TypeScript, Tailwind, shadcn/ui, Recharts, Framer Motion  
- **Auth:** JWT (jose), httpOnly cookies, middleware  
- **DB:** PostgreSQL, Prisma  
- **Queue:** Redis + BullMQ (worker)  
- **Monorepo:** Turborepo, pnpm workspaces  

---

*Trosky — automated comps, recommendations, and inquiry capture on one platform.*
