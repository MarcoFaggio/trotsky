# Trotsky

**Trotsky** is an AI-powered hotel revenue management SaaS application for competitive rate analysis, occupancy tracking, and pricing recommendations.

---

## What Was Built

This is an end-to-end POC with:

- **Auth & RBAC** — Email/password login, JWT (15 min access + 7d refresh), rate-limited login (5/15 min), roles: **ANALYST** (full access) and **CLIENT** (read-only, assigned hotel only). Passwords hashed with bcrypt.
- **Hotel management** — Create/edit hotels (name, PMS name, contact, address, timezone, room count, min/max rate, occupancy target). Expedia URL required, Booking URL optional. Competitor set (3–8) with name, Expedia/Booking URLs, weight (Low/Medium/High stored as numeric), active flag. Hotel status active/inactive.
- **Data model** — PostgreSQL via Prisma: 18 models (User, Hotel, HotelAccess, Competitor, CompetitorListing, HotelCompetitor, HotelListing, DailyRate, ReviewSnapshot, OccupancyEntry, Promotion, Event, PriceOverride, Recommendation, RatePlan, DiscountMix, ScrapeRun, ScrapeError). Indexes on date/hotelId, date/competitorId, unique (hotelId, date) for occupancy and recommendations.
- **Scraping** — Adapter-based: **Expedia** (Playwright, real mode) with retries, timeouts, delays, user-agent rotation; **Booking.com** stubbed with mock fallback. **Mock mode** (default) uses deterministic price generation so the demo works without Playwright. `SCRAPE_MODE=real|mock` controls behavior. Daily job at 04:00 UTC + “Run scrape now” (analyst only).
- **Dashboards** — Two main views on the hotel dashboard:
  1. **Rate Matrix** (Predictive Minds style): hotel selector, date range (7/14/30 days), sort by weight, export CSV. Columns = dates, rows = our hotel (pinned) + competitors with weights. Embedded Recharts overlay: our rate, comp avg, recommended rate, occupancy on secondary axis, event markers, hover tooltips. Clicking a cell opens the Day Detail Modal.
  2. **Calendar** (ChoiceMAX style): month grid, prev/next, tiles show our rate, recommended, occupancy; color cues vs comp avg. Click tile → Day Detail Modal.
- **Day Detail Modal** — Room summary (current + previous price), price override (analyst), competitor table (weight, name, price, diff). Occupancy block (OTB, forecast placeholder, LY, overbooking placeholder). Operational forecast (arrivals/departures placeholders). ADR/revenue + STLY. Events/promotions list; Add Event / Add Promotion (analyst). Discount warning banner when ADR is >N% below BAR or discount share above threshold.
- **Summary cards** — Today’s rate, recommended rate, occupancy, LY occupancy, comp avg, ADR estimate, revenue estimate, discount warning badge.
- **Pace / OTB** — Bulk occupancy entry (occ %, rooms on books, LY occ, OTB LY). Pace % = (OTB - OTB_LY) / max(OTB_LY,1). Chart: OTB vs LY OTB for next 30 days. STR-like: comp avg ADR vs our ADR, index = our ADR / comp avg ADR × 100.
- **Discount control** — Rate plans (BAR, AAA, Senior, Mobile, etc.) per hotel. Discount mix per date (share % per plan). ADR = Σ(plan_rate × share%). Warnings in Day Detail Modal and dashboard when ADR &gt;12% below BAR or discount share &gt;35% (configurable).
- **AI recommendations** — Deterministic engine: comp_anchor = weighted_avg(competitor_rates), demand adjustments (occupancy vs target, pace vs LY, events), clamp to min/max, round to dollar. Returns recommended_rate, confidence, rationale bullets. Stored per (hotelId, date). Optional LLM explanation if API keys set (never invents numbers).
- **Exports** — Rate matrix CSV and occupancy/OTB CSV.
- **Admin** — Scrape runs table (id, started, duration, status, mode, rates stored, errors). Run Scrape Now button. ScrapeError records per run.

Tech: Next.js 14 (App Router), TypeScript, Tailwind, shadcn/ui, Recharts, Prisma, PostgreSQL, Redis, BullMQ, Playwright (real scrape), Zod, custom JWT + bcrypt. Monorepo: `apps/web`, `apps/worker`, `packages/db`, `packages/shared`.

---

## Architecture

- **apps/web** — Next.js 14 App Router, Tailwind + shadcn/ui, server actions, API routes (auth, scrape).
- **apps/worker** — BullMQ worker: `scrape-queue` (daily + manual), `recommendation-queue`; mock + Expedia + Booking stub adapters; recompute-recommendations job.
- **packages/db** — Prisma schema, migrations, seed, singleton client.
- **packages/shared** — Zod schemas, TypeScript types, recommendation math, ADR/discount warning helpers.

Local infra: **Docker Compose** — PostgreSQL 16 (port 5432), Redis 7 (port 6379).

---

## Prerequisites

- **Node.js 18+**
- **pnpm 10+** (or npm/yarn; commands below use pnpm)
- **Docker Desktop** (for Postgres + Redis). If you don’t use Docker, you need a running PostgreSQL and Redis and must set `DATABASE_URL` and `REDIS_URL` accordingly.

---

## How to Run It

**Don’t have Docker?** Use **Option B** below (free hosted Postgres + Redis). You can run the app and see the full UI without installing Docker.

### Option A: With Docker

1. [Install Docker Desktop](https://www.docker.com/products/docker-desktop/) and start it.
2. Run: `docker compose up -d`
3. Continue from “Environment” and “Database” steps below.

### Option B: Without Docker (free hosted DB + Redis)

1. **Postgres** — Sign up at [Neon](https://neon.tech), create a project, copy the connection string.
2. **Redis** — Sign up at [Upstash](https://upstash.com), create a Redis DB, copy the Redis URL.
3. In the project: `cp .env.example .env` then edit `.env` and set:
   - `DATABASE_URL` = your Neon connection string
   - `REDIS_URL` = your Upstash Redis URL
   - `JWT_SECRET` and `JWT_REFRESH_SECRET` = any long random strings (e.g. run `openssl rand -hex 32` twice)
4. Run:

```bash
pnpm install
pnpm --filter @hotel-pricing/db exec prisma generate
pnpm --filter @hotel-pricing/db exec prisma migrate dev --name init
pnpm db:seed
pnpm --filter @hotel-pricing/web dev
```

5. Open **http://localhost:3000** and log in with **analyst@example.com** / **Password123!**

---

### 1. Clone / open the repo

```bash
cd "/Volumes/T7/Dev/AI HOTEL PRICING"
```

### 2. Environment

Copy `.env.example` to `.env` and set at least:

- `DATABASE_URL` — e.g. `postgresql://postgres:postgres@localhost:5432/hotel_pricing`
- `REDIS_URL` — e.g. `redis://localhost:6379`
- `JWT_SECRET` and `JWT_REFRESH_SECRET` — long random strings for production

Optional: `SCRAPE_MODE=mock` (default) or `real`, `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`, `DISCOUNT_ADR_THRESHOLD`, `DISCOUNT_SHARE_THRESHOLD`.

### 3. Start infrastructure (if using Docker)

```bash
docker compose up -d
```

Wait until Postgres and Redis are up (e.g. `docker compose ps`).

### 4. Install dependencies

```bash
pnpm install
```

### 5. Database: generate client, migrate, seed

```bash
# Generate Prisma client
pnpm --filter @hotel-pricing/db exec prisma generate

# Create DB and run migrations (from repo root)
pnpm --filter @hotel-pricing/db exec prisma migrate dev --name init

# Seed demo data (1 hotel, 5 competitors, 30 days rates, occupancy, events, promotions, 2 users)
pnpm db:seed
```

Or from `packages/db`:

```bash
cd packages/db && npx prisma generate && npx prisma migrate dev --name init && npx tsx prisma/seed.ts && cd ../..
```

### 6. Run the app

**Web app (required):**

```bash
pnpm --filter @hotel-pricing/web dev
```

Open **http://localhost:3000**.

**Worker (optional, for scraping and recommendation jobs):**

```bash
pnpm --filter @hotel-pricing/worker dev
```

Run this in a second terminal if you want “Run scrape now” and scheduled scrapes to execute.

### 7. Log in

Use the seeded users:

| Role    | Email               | Password     |
|---------|---------------------|--------------|
| Analyst | analyst@example.com | Password123! |
| Client  | client@example.com  | Password123! |

Analyst sees all hotels and full UI; client sees only the assigned demo hotel (read-only).

---

## Deploy to Vercel

1. **Import the repo** at [vercel.com](https://vercel.com) → Add New → Project → import `MarcoFaggio/Trotsky`.

2. **Root Directory** (critical):  
   Settings → General → Root Directory → set to **`apps/web`** and Save.

3. **Build & Development Settings** (override so the monorepo builds correctly):  
   Settings → Build & Development Settings → override:
   - **Install Command:** `cd ../.. && pnpm install`
   - **Build Command:** `cd ../.. && pnpm --filter @hotel-pricing/db exec prisma generate && pnpm --filter @hotel-pricing/web build`  
   Leave Output Directory empty. Save.

4. **Environment variables:**  
   Settings → Environment Variables → add:
   - `DATABASE_URL` — your Neon (or other Postgres) connection string
   - `JWT_SECRET` — long random string (e.g. `openssl rand -hex 32`)
   - `JWT_REFRESH_SECRET` — another long random string  
   Optional: `REDIS_URL` (e.g. Upstash) so “Refresh” doesn’t error; without it the rest of the app works.

5. **Deploy** (Redeploy from Deployments tab or push a commit).

6. **Seed the database once** (same `DATABASE_URL` as on Vercel):  
   From your machine: `pnpm db:seed`. Then open the Vercel URL and log in with **analyst@example.com** / **Password123!**.

---

## Key Commands Reference

| Command | Description |
|--------|-------------|
| `docker compose up -d` | Start Postgres + Redis |
| `pnpm install` | Install all workspace dependencies |
| `pnpm --filter @hotel-pricing/db exec prisma generate` | Generate Prisma client |
| `pnpm --filter @hotel-pricing/db exec prisma migrate dev` | Run migrations |
| `pnpm db:seed` | Seed demo data |
| `pnpm --filter @hotel-pricing/web dev` | Start Next.js dev server |
| `pnpm --filter @hotel-pricing/worker dev` | Start BullMQ worker |
| `pnpm build` | Build all packages (e.g. `next build` for web) |
| `pnpm --filter @hotel-pricing/db exec prisma studio` | Open Prisma Studio on DB |

---

## Pages & Routes

| Route | Who | Description |
|-------|-----|-------------|
| `/login` | Public | Email/password login |
| `/dashboard` | All | Analyst: multi-hotel overview; Client: redirect to assigned hotel |
| `/hotels` | Analyst | Hotel list |
| `/hotels/new` | Analyst | Create hotel |
| `/hotels/[id]` | All* | Hotel dashboard (matrix + calendar + summary cards) |
| `/hotels/[id]/settings` | Analyst | General, competitors, rate plans |
| `/occupancy` | Analyst | Bulk occupancy/OTB entry (next 30 days) |
| `/pace` | All* | Pace/OTB chart and STR-like ADR index |
| `/promotions` | Analyst | Promotions CRUD |
| `/admin/scrapes` | Analyst | Scrape runs + “Run scrape now” |

\* Client only for their assigned hotel.

---

## Manual Smoke Test Checklist

- [ ] Login as analyst@example.com / Password123!
- [ ] Dashboard shows hotel cards (rate, occ, recommendation).
- [ ] Open a hotel → Rate Matrix with date columns, our row, competitor rows, chart below.
- [ ] Switch to Calendar, click a day → Day Detail Modal (pricing, competitors, occupancy, ADR/revenue, events/promotions).
- [ ] Set a price override and add an event (analyst).
- [ ] Occupancy page: edit cells, Save All, export CSV.
- [ ] Pace page: chart and ADR index.
- [ ] Promotions: create and delete.
- [ ] Hotel Settings: edit competitor weights, add rate plan.
- [ ] Export CSV from hotel dashboard (rate matrix).
- [ ] Scrape Admin: Run Scrape Now (with worker running).
- [ ] Logout, login as client@example.com; only one hotel, read-only; no /hotels, /occupancy, /admin.

---

## File Tree Summary

```
/
├── docker-compose.yml
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── .env.example
├── .gitignore
├── README.md
├── apps/
│   ├── web/                    # Next.js 14
│   │   ├── src/
│   │   │   ├── app/            # (auth)/login, (app)/dashboard|hotels|occupancy|pace|promotions|admin, api/auth|scrape
│   │   │   ├── components/     # ui (shadcn), dashboard, hotels, layout
│   │   │   ├── lib/            # auth, rbac, rate-limiter, utils
│   │   │   ├── actions/        # hotels, dashboard, occupancy, rate-plans
│   │   │   ├── hooks/
│   │   │   └── middleware.ts
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   └── worker/
│       ├── src/
│       │   ├── index.ts        # BullMQ workers + repeat job
│       │   ├── jobs/           # daily-scrape, recompute-recommendations
│       │   └── scrapers/       # adapter, mock, expedia, booking-stub
│       └── package.json
└── packages/
    ├── db/
    │   ├── prisma/
    │   │   ├── schema.prisma
    │   │   ├── migrations/
    │   │   └── seed.ts
    │   ├── src/index.ts
    │   └── package.json
    └── shared/
        ├── src/
        │   ├── schemas/
        │   ├── types/
        │   └── utils/          # recommendation, ADR, discount warning
        └── package.json
```

---

## macOS “._*” Files

The repo ignores **`._*`** files in `.gitignore` (macOS resource forks / AppleDouble). If you see such files locally, you can remove them safely with:

```bash
find . -name "._*" -not -path "*/node_modules/*" -not -path "*/.next/*" -delete
```

They are not part of the app and can be deleted without affecting behavior.

---

## Documentation

- **[Product documentation](docs/PRODUCT-DOCUMENTATION.md)** — Full product spec: user provisioning and auth (login, session, logout), roles and permissions, every route, step-by-step user flows (analyst and client), feature reference, data model, business rules, glossary. No self-service signup; users are seeded or provisioned by admin.
- **[Dashboard guide](docs/DASHBOARD-GUIDE.md)** — Screen-by-screen explanation of the dashboard, rate matrix, calendar, day detail modal, occupancy, pace, promotions, settings, and scrape admin.

---

## Tech Stack

- Next.js 14 (App Router) + TypeScript  
- Tailwind CSS + shadcn/ui  
- Recharts  
- Prisma + PostgreSQL  
- Redis + BullMQ  
- Playwright (real scraping)  
- Zod  
- Custom JWT auth + bcrypt  
- Turborepo monorepo  
