# Full backend on Vercel

Get the Trotsky web app on Vercel talking to a real database and (optionally) Redis so login, dashboard, hotels, and the rest of the app work in production.

---

## 1. Hosted database (Postgres)

You need a Postgres instance that Vercel can reach. Free tiers work for demos.

### Option A: Neon (recommended)

1. Go to [neon.tech](https://neon.tech) and sign up.
2. Create a project and copy the **connection string** (e.g. `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`).
3. Keep this for step 3.

### Option B: Supabase

1. Go to [supabase.com](https://supabase.com), create a project.
2. **Settings** → **Database** → **Connection string** → **URI**, copy it.
3. Use the **Transaction** pooler URI if shown (port 6543); otherwise the direct URI is fine.

### Option C: Railway / Render / other

Create a Postgres service and copy the `DATABASE_URL` they give you.

---

## 2. Hosted Redis (optional but recommended)

Needed for **“Run scrape now”**, **“Refresh”** on a hotel, and any scheduled scrape. Without it, those buttons will return a clear error; the rest of the app works.

### Upstash (serverless Redis, free tier)

1. Go to [upstash.com](https://upstash.com) and sign up.
2. Create a Redis database (e.g. in the same region as your Vercel app).
3. Copy the **Redis URL** (e.g. `rediss://default:xxx@xxx.upstash.io:6379`).

---

## 3. Environment variables in Vercel

1. Open your project on [vercel.com](https://vercel.com) → **Settings** → **Environment Variables**.
2. Add these for **Production** (and **Preview** if you want):

| Name | Value | Required |
|------|--------|----------|
| `DATABASE_URL` | Your Postgres connection string from step 1 | Yes |
| `JWT_SECRET` | Long random string (e.g. `openssl rand -hex 32`) | Yes |
| `JWT_REFRESH_SECRET` | Another long random string | Yes |
| `REDIS_URL` | Your Redis URL from step 2 | No (needed for scrape/refresh) |

3. Save. **Redeploy** the project (Deployments → … → Redeploy) so the new env vars are used.

---

## 4. Run migrations and seed (once)

The database schema and demo data must be applied to your **hosted** Postgres. Do this from your **local** machine with the **same** `DATABASE_URL` as in Vercel.

1. In the repo root, copy env and set the production DB URL:

   ```bash
   cp .env.example .env
   # Edit .env and set DATABASE_URL to the same value you added in Vercel.
   ```

2. Generate Prisma client, run migrations, and seed:

   ```bash
   pnpm --filter @hotel-pricing/db exec prisma generate
   pnpm --filter @hotel-pricing/db exec prisma migrate deploy
   pnpm db:seed
   ```

3. If `migrate deploy` says the DB is empty and you prefer to push the schema without migration history:

   ```bash
   pnpm --filter @hotel-pricing/db exec prisma db push
   pnpm db:seed
   ```

After this, your Vercel app can log in and use all data (e.g. **analyst@example.com** / **Password123!**).

---

## 5. Worker (scraping and refresh jobs)

The **worker** (`apps/worker`) is a long-running Node process (BullMQ). It **does not run on Vercel**. To have “Run scrape now” and hotel “Refresh” actually process jobs:

- **Option A – Deploy the worker elsewhere**  
  Run the worker on a host that supports long-running processes and point it to the same **DATABASE_URL** and **REDIS_URL** as Vercel, e.g.:
  - [Railway](https://railway.app): new project → deploy from repo, set root to repo root, build command to build worker, start command to run `node apps/worker/dist/index.js` (or equivalent after building).
  - [Render](https://render.com): background worker, same idea.
  - A small VPS or your own server.

- **Option B – No worker**  
  Leave REDIS_URL unset or don’t run a worker. The app and login/dashboard work; “Run scrape now” and “Refresh” will return a message that Redis/the worker is not configured.

---

## 6. Quick checklist

- [ ] Postgres created (Neon / Supabase / etc.) and `DATABASE_URL` in Vercel.
- [ ] `JWT_SECRET` and `JWT_REFRESH_SECRET` in Vercel.
- [ ] (Optional) Redis created (Upstash) and `REDIS_URL` in Vercel.
- [ ] Redeploy on Vercel after adding env vars.
- [ ] Migrations and seed run once against `DATABASE_URL` (from local).
- [ ] Log in at your Vercel URL with **analyst@example.com** / **Password123!**.
- [ ] (Optional) Worker deployed elsewhere with same `DATABASE_URL` and `REDIS_URL` if you want scrape/refresh to run.
