# Quick launch — Trosky

Get the app running in under 5 minutes.

---

## Option 1: Docker (easiest)

```bash
# Start PostgreSQL + Redis
docker compose up -d

# Install, migrate, seed, and run
pnpm install
pnpm --filter @hotel-pricing/db exec prisma generate
pnpm --filter @hotel-pricing/db exec prisma migrate dev --name init
pnpm db:seed
pnpm --filter @hotel-pricing/web dev
```

Or use the launch script: `chmod +x scripts/launch.sh && ./scripts/launch.sh`

---

## Option 2: Hosted (no Docker)

1. **PostgreSQL** — [Neon](https://neon.tech) free tier. Create a project, copy the connection string.
2. **Redis** — [Upstash](https://upstash.com) free tier. Create a database, copy the URL.
3. Edit `.env`:
   ```
   DATABASE_URL=<your Neon connection string>
   REDIS_URL=<your Upstash URL>
   JWT_SECRET=<any long random string>
   JWT_REFRESH_SECRET=<any long random string>
   ```
4. Run the same install/migrate/seed/dev commands from Option 1.

---

## Log in

Open **http://localhost:3030** and use:

| Role | Email | Password |
|------|-------|----------|
| Analyst (full access) | analyst@example.com | Password123! |
| Client (read-only) | client@example.com | Password123! |

---

## What you'll see

- **Dashboard** — Overview cards and hotel list (analyst) or your hotel (client)
- **Hotel dashboard** — Rate matrix, calendar, 7-day forecast, competitor cards, summary KPIs
- **Day detail modal** — Pricing, competitors, occupancy, ADR/revenue, events/promotions
- **Occupancy** — Bulk edit next 30 days (analyst)
- **Pace** — OTB vs last year + STR-like ADR index
- **Events** — Manual events + external signal management
- **Messages** — Threaded messaging per hotel
- **Portfolio** — Cross-hotel KPI overview (analyst)
- **Promotions** — Create and manage promotions (analyst)
- **Scrape admin** — Run scrape now, view history (analyst, worker optional)

---

## Optional: run the worker

The worker processes scrape jobs and recomputes recommendations. Not needed for basic browsing.

```bash
pnpm --filter @hotel-pricing/worker dev
```

---

## Troubleshooting

See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for common issues.
