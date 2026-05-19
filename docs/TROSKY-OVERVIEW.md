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
| Dashboard & hotel cockpit | Authenticated | `/dashboard`, `/hotels/[id]`, `/pace`, `/events`, `/promotions`, … |
| Inquiry inbox | Authenticated | `/inquiries` (same route; **scope** differs by role) |

---

## Inquiry layer (first slice)

The **AI inquiry layer** captures demand (web form today), stores **Inquiry** + **InquiryMessage**, and runs a **deterministic “heuristic” analyzer** (`INQUIRY_AI_PROVIDER=heuristic`) that fills **`aiExtractedJson`**, **`aiConfidence`**, intent/status suggestions, and **missing fields** — shaped like future LLM output.

- **Product / domain:** [AI-INQUIRY-LAYER.md](./AI-INQUIRY-LAYER.md)
- **Implementation:** `apps/web/src/lib/inquiry-ai.ts`, `apps/web/src/actions/inquiries.ts`, `apps/web/src/app/(app)/inquiries/page.tsx`, `apps/web/src/app/inquire/page.tsx`, `apps/web/src/app/api/inquiries/public/route.ts`

Live OpenAI (or similar) calls are **placeholders** until explicitly wired; the UI and DB are **model-ready**.

---

## Recent engineering work (summary)

This section records major themes shipped in the Trosky repo (landing, auth, data, tooling). For file-level history, use `git log`.

### Revenue cockpit & data

- Prisma migrations including **daily rate uniqueness** and **inquiry / AI inquiry layer** tables.
- Shared schemas/types extended for inquiries and analysis payloads.
- Worker jobs aligned with scrapes and recommendation recompute where touched.

### Web app — marketing & UX

- **Landing page** refresh: hero with competitive-rate **chart preview** (theme-aware colors, gradient bars, solid grid/lines, motion), **comparison** section (“efficiency divide”) with animated underlines, **CTAs** and **mobile** layout polish, **dark mode** tuning.
- Chart colors resolved from CSS variables (`use-chart-theme-colors`) so SVG matches light/dark theme.
- **Middleware** allows Next.js internals under `/_next/` early so dev assets are not accidentally gated.

### Inquiry feature (frontend + backend)

- **`/inquire`** public page and form; **`/inquiries`** authenticated inbox for **analysts** (all hotels) and **clients** (assigned hotels only).
- Server actions: list, detail, create, update status, messages, RFP/proposal shells, **analyzeInquiry**.
- Public API **`POST /api/inquiries/public`** with validation and rate limiting.

### Tooling & ops

- Root **`pnpm`** scripts use **`pnpm exec dotenv -e .env`** so `db:migrate:deploy`, `db:seed`, etc. load `.env` reliably across environments.
- **`scripts/dev-local.sh`** — macOS-friendly dev (ulimit, Docker, Next).
- **`scripts/cleanup-macos-appledouble.py`** — removes `._*` AppleDouble files on external volumes.

### Documentation

- This overview, **USER-GUIDE-ANALYST-AND-CLIENT**, README updates, PRODUCT-DOCUMENTATION and API updates for inquiries and public routes.

---

## Where to read next

| Document | Audience |
|----------|----------|
| [README.md](../README.md) | Clone, env, commands, quick links |
| [USER-GUIDE-ANALYST-AND-CLIENT.md](./USER-GUIDE-ANALYST-AND-CLIENT.md) | Day-to-day usage by role |
| [PRODUCT-DOCUMENTATION.md](./PRODUCT-DOCUMENTATION.md) | Full product spec |
| [AI-INQUIRY-LAYER.md](./AI-INQUIRY-LAYER.md) | Inquiry product & technical design |
| [TECH-UX-HARDENING.md](./TECH-UX-HARDENING.md) | Production hardening, security, reliability, and UX standards |
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
