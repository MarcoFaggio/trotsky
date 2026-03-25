# How to launch Trosky

You need **PostgreSQL** and **Redis** running somewhere. Your `.env` currently points to `localhost:5432` and `localhost:6379`, which require Docker (or local Postgres/Redis).

---

## Option 1: With Docker (easiest if you install it)

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) and start it.
2. In the project folder run:

```bash
cd "/Volumes/T7/Dev/AI HOTEL PRICING"
docker compose up -d
```

3. Then either use the launch script:

```bash
chmod +x scripts/launch.sh
./scripts/launch.sh
```

   **or** run the steps yourself:

```bash
pnpm install
pnpm --filter @hotel-pricing/db exec prisma generate
pnpm --filter @hotel-pricing/db exec prisma migrate dev --name init
pnpm db:seed
pnpm --filter @hotel-pricing/web dev
```

4. Open **http://localhost:3000** and log in with **analyst@example.com** / **Password123!**

---

## Option 2: Without Docker (free hosted DB + Redis)

1. **PostgreSQL** — Sign up at [Neon](https://neon.tech), create a project, copy the connection string.
2. **Redis** — Sign up at [Upstash](https://upstash.com), create a Redis database, copy the Redis URL.
3. Edit `.env` in the project root and set:
   - `DATABASE_URL` = your Neon connection string
   - `REDIS_URL` = your Upstash Redis URL
   - Keep `JWT_SECRET` and `JWT_REFRESH_SECRET` (or set any long random strings)
4. Run the launch script:

```bash
cd "/Volumes/T7/Dev/AI HOTEL PRICING"
chmod +x scripts/launch.sh
./scripts/launch.sh
```

   **or** run the same commands as in Option 1 step 3 (without Docker).

5. Open **http://localhost:3000** and log in with **analyst@example.com** / **Password123!**

---

## What you’ll see

- **Login** — Email/password, demo accounts listed.
- **Dashboard** — Overview cards and hotel list (analyst) or redirect to your hotel (client).
- **Hotel dashboard** — Summary cards (today’s rate, recommended, occupancy, etc.), **Rate Matrix** (dates × our hotel + competitors, chart below), **Calendar** (month tiles, click for day detail).
- **Day detail modal** — Pricing, competitors, occupancy, ADR/revenue, events/promotions.
- **Occupancy** (analyst) — Bulk edit next 30 days.
- **Pace** — OTB vs last year chart and STR-like index.
- **Promotions** (analyst) — CRUD.
- **Hotel settings** (analyst) — General, competitors, rate plans.
- **Scrape admin** (analyst) — Run scrape now, view runs (worker optional).

Worker is only needed for “Run scrape now”; the UI works without it.
