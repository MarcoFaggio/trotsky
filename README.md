# Trosky

**Trosky** is hotel revenue intelligence software: competitive rate tracking from OTAs (scraped or mock), occupancy and pace views, events and promotions on the calendar, AI-assisted rate recommendations, and an **inquiry inbox** so planners and guests can submit leads (`/inquire`) while analysts and hotel clients triage them in-app (`/inquiries`).

**Who uses it:** **Analysts** (Trosky / revenue team — full portfolio, scrapes, settings). **Clients** (hotel stakeholders — assigned hotels, read-only pricing cockpit plus inquiries for their properties). See [docs/TROSKY-OVERVIEW.md](docs/TROSKY-OVERVIEW.md) and [docs/USER-GUIDE-ANALYST-AND-CLIENT.md](docs/USER-GUIDE-ANALYST-AND-CLIENT.md).

## Quick start

```bash
# 1. Install
pnpm install

# 2. Set up environment
cp .env.example .env
# Edit .env — see "Environment variables" below

# 3. Local Postgres + Redis (Docker)
pnpm infra:up
# Or: docker compose up -d

# 4. Database
pnpm db:generate
pnpm exec dotenv -e .env -- pnpm --filter @hotel-pricing/db exec prisma migrate dev --name init
# Or apply existing migrations without prompting: pnpm db:migrate:deploy
pnpm db:seed

# 5. Run the app (pick one)
pnpm dev                    # Next.js only — best default; no Redis/worker noise
./scripts/dev-local.sh      # Same + raises open-file limit on macOS / starts Docker
pnpm dev:stack              # Docker up + web + worker (queues need Redis)
pnpm dev:full               # Web + worker — start Redis first (`pnpm infra:up`)
```

**External drive / “too many open files” (EMFILE):** `pnpm dev` uses polling for file watching. If problems persist: `ulimit -n 10240` in the shell before running, or use `./scripts/dev-local.sh`.

In development, the app listens on **port 3030** (see `apps/web` `dev` script). Open **http://localhost:3030** and log in:

| Role | Email | Password |
|------|-------|----------|
| Analyst | analyst@example.com | Password123! |
| Client | client@example.com | Password123! |

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Monorepo (Turborepo)                 │
│                                                          │
│  apps/web ──────── Next.js 14 (App Router)               │
│  │  Server actions, API routes, Tailwind + shadcn/ui     │
│  │  Recharts for charts, Framer Motion for landing       │
│  │                                                       │
│  apps/worker ───── BullMQ worker                         │
│  │  Scrape queue (mock + Expedia + Booking stub)         │
│  │  Signal ingestion, matching, recommendation engine    │
│  │                                                       │
│  packages/db ───── Prisma schema, migrations, seed       │
│  packages/shared ─ Zod schemas, types, business logic    │
│                                                          │
│  Infrastructure: PostgreSQL 16 + Redis 7                 │
└──────────────────────────────────────────────────────────┘
```

**Data flow:** Scraper → DailyRate → Recommendation engine → Dashboard. Occupancy is manual entry (or future PMS integration). Analysts manage hotels, competitors, events, and promotions. Clients get read-only access to their assigned hotel(s). **Inquiries:** public form posts to the API; heuristic (model-ready) analysis runs on create; staff work leads in `/inquiries` (see [docs/AI-INQUIRY-LAYER.md](docs/AI-INQUIRY-LAYER.md)).

---

## Environment variables

Copy `.env.example` to `.env` and configure:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | No | Redis URL — needed for scrape/refresh jobs and shared rate limits across deployed instances |
| `JWT_SECRET` | Yes | Access token signing key. **Must be set in production** (app will crash without it) |
| `JWT_REFRESH_SECRET` | Yes | Refresh token signing key. **Must be set in production** |
| `SCRAPE_MODE` | No | `mock` (default) or `real` (uses Playwright) |
| `SCRAPE_CRON` | No | Worker scrape schedule, default `0 */2 * * *` |
| `SIGNAL_CRON` | No | Worker external-signal ingestion schedule, default `15 */6 * * *` |
| `HOTEL_GEO_CRON` | No | Worker hotel geocoding schedule, default `45 2 * * *` |
| `OPENAI_API_KEY` | No | Reserved for future live inquiry AI calls; current provider falls back to heuristic analysis |
| `INQUIRY_AI_PROVIDER` | No | `heuristic` by default; placeholder for future `openai` inquiry analysis |
| `INQUIRY_AI_MODEL` | No | Placeholder model name for future inquiry analysis, e.g. `gpt-4o-mini` |
| `INQUIRY_PUBLIC_AI_ANALYSIS` | No | Set to `false` to skip automatic analysis on public inquiry capture |
| `INQUIRY_UI_ANALYZE` | No | Set to `false` to hide/disable the in-app Analyze action |
| `NEXT_PUBLIC_DISCOUNT_ADR_THRESHOLD` | No | Client-side ADR warning threshold % below BAR (default: 12) |
| `NEXT_PUBLIC_DISCOUNT_SHARE_THRESHOLD` | No | Client-side discount share warning threshold % (default: 35) |
| `NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS` | No | Set to `true` to show demo login credentials |

**Security note:** In production, `JWT_SECRET` and `JWT_REFRESH_SECRET` must be long random strings (e.g. `openssl rand -hex 32`). The app throws on startup if these are missing in production.

---

## Infrastructure options

### Option A: Docker (local development)

```bash
docker compose up -d    # Starts PostgreSQL + Redis
```

Default connection strings in `.env.example` point to `localhost:5432` and `localhost:6379`.

### Option B: Hosted (no Docker needed)

1. **PostgreSQL** — [Neon](https://neon.tech) (free tier) or Supabase or Railway
2. **Redis** — [Upstash](https://upstash.com) (free tier, serverless)

Set `DATABASE_URL` and `REDIS_URL` in `.env` to your hosted instances.

---

## Running the worker

The worker processes scrape jobs and recomputes recommendations. It's optional for basic UI browsing.

```bash
pnpm --filter @hotel-pricing/worker dev
```

Without the worker, "Run scrape now" and "Refresh" return an error; everything else works.

---

## Commands

| Command | What it does |
|---------|-------------|
| `pnpm install` | Install all workspace deps |
| `pnpm dev` | Start web app only (**port 3030**), polling watcher — recommended daily driver |
| `pnpm dev:full` | Turborepo: web + worker (Redis must be running) |
| `pnpm dev:stack` | `docker compose up -d` then `dev:full` |
| `pnpm infra:up` / `pnpm infra:down` | Start/stop Postgres + Redis via Docker Compose |
| `./scripts/dev-local.sh` | macOS-friendly: `ulimit`, Docker up, then web only (`--full` for worker too) |
| `pnpm --filter @hotel-pricing/worker dev` | Start BullMQ worker alone (needs Redis) |
| `pnpm build` | Build all packages |
| `pnpm db:seed` | Seed demo data (1 hotel, 5 competitors, 2 users) |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm db:migrate` | Interactive migrate (dev) — from `packages/db` |
| `pnpm db:migrate:deploy` | Apply migrations (CI/prod) — loads `.env` via `pnpm exec dotenv` |
| `pnpm db:generate` | Regenerate Prisma client |
| `pnpm cleanup:appledouble` | Remove macOS `._*` junk files (external disks) |

---

## Pages and routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Marketing landing (redirects to `/dashboard` if valid session cookie) |
| `/login` | Public | Email/password login |
| `/inquire` | Public | Guest/planner inquiry form → creates lead + heuristic analysis |
| `/dashboard` | All | Multi-hotel overview (analyst) or redirect to assigned hotel (client) |
| `/hotels` | Analyst | Hotel list + create |
| `/hotels/[id]` | All | Hotel dashboard — rate matrix, calendar, summary cards |
| `/hotels/[id]/settings` | Analyst | Hotel config — general, competitors, rate plans |
| `/occupancy` | Analyst | Bulk occupancy/OTB entry (30 days) |
| `/pace` | All | Pace vs last year + STR-like ADR index |
| `/events` | All | Events + external signal management |
| `/inquiries` | All | Inquiry inbox — **analyst:** all hotels; **client:** assigned hotels only |
| `/messages` | All | Threaded messaging per hotel |
| `/promotions` | All | Promotion view for assigned hotels; analyst-only create/delete |
| `/portfolio` | Analyst | Cross-hotel KPI overview |
| `/admin/scrapes` | Analyst | Scrape run history + manual trigger |

---

## Roles

**Analyst** — Full access: manage hotels, competitors, occupancy, events, promotions, rate plans, price overrides, scraping, CSV exports, **all hotels’ inquiries**.

**Client** — Read-only pricing intelligence for assigned hotel(s): dashboard, matrix, calendar, day detail, pace, events/promotions as exposed in-app; **inquiries only for hotels they can access**. No scrape admin, no bulk occupancy, no hotel settings.

Access is enforced at three levels: middleware (JWT), server actions (RBAC helpers), and UI (conditional rendering).

---

## Data model

**Core:** User, Hotel, HotelAccess, Competitor, HotelCompetitor, HotelListing, CompetitorListing

**Rates:** DailyRate, ReviewSnapshot, PriceOverride, Recommendation

**Operations:** OccupancyEntry, Event, Promotion, RatePlan, DiscountMix

**Pipeline:** ScrapeRun, ScrapeError, ExternalSignal, HotelSignalImpact, SecurityEvent

**Collaboration:** MessageThread, Message

**Inquiries:** Inquiry, InquiryMessage, GroupRfp, InquiryProposal

See [Product documentation](docs/PRODUCT-DOCUMENTATION.md) for full entity descriptions and relationships.

---

## Deploy to production

See [Deploying to Vercel](docs/DEPLOY.md) for step-by-step deployment instructions covering:
- Vercel project setup (monorepo configuration)
- Database setup (Neon/Supabase/Railway)
- Redis setup (Upstash)
- Environment variables
- Running migrations against production DB
- Worker deployment (Railway/Render)

---

## Documentation

| Document | What it covers |
|----------|---------------|
| [Trosky overview](docs/TROSKY-OVERVIEW.md) | What the product is, architecture, inquiry slice, recent ship themes |
| [Analyst & client user guide](docs/USER-GUIDE-ANALYST-AND-CLIENT.md) | Sidebar, permissions, `/inquiries` by role, public `/inquire` |
| [AI inquiry layer](docs/AI-INQUIRY-LAYER.md) | Inquiry domain model, flows, phases, AI/heuristic direction |
| [Tech & UX hardening](docs/TECH-UX-HARDENING.md) | Production hardening checklist, UX acceptance criteria, quality gates |
| [Feature & UX audit](docs/FEATURE-UX-AUDIT.md) | Unique feature inventory, quality score, and prioritized frontend strengthening backlog |
| [Product documentation](docs/PRODUCT-DOCUMENTATION.md) | Full spec: roles, auth flows, user flows, feature reference, data model, business rules, glossary |
| [Dashboard guide](docs/DASHBOARD-GUIDE.md) | Screen-by-screen walkthrough of dashboard UI |
| [Deploy guide](docs/DEPLOY.md) | Vercel + database + worker deployment |
| [Design & colors](docs/DESIGN-COLORS.md) | Color palette, chart colors, typography, iconography |
| [API reference](docs/API.md) | Endpoints, server actions, error codes |
| [Troubleshooting](docs/TROUBLESHOOTING.md) | Common issues and fixes |

---

## Tech stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Recharts, Framer Motion
- **Backend:** Server actions, API routes, custom JWT auth (jose + bcrypt)
- **Database:** PostgreSQL 16, Prisma ORM
- **Queue:** Redis 7, BullMQ
- **Scraping:** Playwright (real mode), adapter pattern (mock/Expedia/Booking stub)
- **Validation:** Zod
- **Monorepo:** Turborepo, pnpm workspaces
