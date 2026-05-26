# Deploying Trosky

This guide covers deploying the web app to Vercel, setting up a production database, and optionally running the worker for scraping.

---

## 1. Prerequisites

- GitHub repo pushed to `github.com/MarcoFaggio/trotsky`
- A Vercel account (free tier works)
- A hosted PostgreSQL instance (Neon, Supabase, or Railway — all have free tiers)

---

## 2. Database setup

### Neon (recommended)

1. Sign up at [neon.tech](https://neon.tech)
2. Create a project, copy the connection string:
   ```
   postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```

### Supabase (alternative)

1. Sign up at [supabase.com](https://supabase.com), create a project
2. Settings → Database → Connection string → URI (use Transaction pooler URI if available)

### Redis (optional but recommended)

Needed for "Run scrape now", "Refresh", scheduled scrapes, recommendation queues, and shared rate limits across server instances.

1. Sign up at [upstash.com](https://upstash.com)
2. Create a Redis database, copy the URL:
   ```
   rediss://default:xxx@xxx.upstash.io:6379
   ```

Without Redis, the app works normally — scrape/refresh buttons show a clear error message.

---

## 3. Vercel project setup

1. Go to [vercel.com](https://vercel.com) → Add New → Project → Import `MarcoFaggio/trotsky`

2. **Root Directory** (critical for monorepo):
   Settings → General → Root Directory → set to **`apps/web`** → Save

3. **Build settings** — leave Build Command and Install Command **empty**. The repo's `apps/web/vercel.json` handles both:
   ```json
   {
     "framework": "nextjs",
     "installCommand": "cd ../.. && pnpm install",
     "buildCommand": "cd ../.. && pnpm --filter @hotel-pricing/db exec prisma generate && pnpm --filter @hotel-pricing/web build"
   }
   ```

4. **Framework Preset** — should auto-detect as **Next.js**. If it says "Other", change it.

---

## 4. Environment variables

Settings → Environment Variables → add for **Production** (and Preview if desired):

| Variable | Value | Required |
|----------|-------|----------|
| `DATABASE_URL` | Your Postgres connection string | Yes |
| `JWT_SECRET` | `openssl rand -hex 32` output | Yes |
| `JWT_REFRESH_SECRET` | Another `openssl rand -hex 32` output | Yes |
| `REDIS_URL` | Your Upstash Redis URL | No, but recommended |
| `INQUIRY_AI_PROVIDER` | `heuristic` unless live AI is implemented | No |
| `INQUIRY_PUBLIC_AI_ANALYSIS` | `false` only if public capture should skip auto-analysis | No |
| `INQUIRY_UI_ANALYZE` | `false` only if the Analyze control should be disabled | No |
| `NEXT_PUBLIC_DISCOUNT_ADR_THRESHOLD` | ADR warning threshold, default `12` | No |
| `NEXT_PUBLIC_DISCOUNT_SHARE_THRESHOLD` | Discount share warning threshold, default `35` | No |
| `NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS` | `true` only for demo environments | No |
| `TROSKY_DEMO_MODE` | `true` for demo/staging tenants; omit or `false` in production | No |

**Demo data:** Seed/demo RevenueActions are hidden in production unless `TROSKY_DEMO_MODE=true`. In local development they are visible by default. Set `TROSKY_DEMO_MODE=false` locally to verify production-like behaviour. Demo data must never be treated as live hotel intelligence.

Save and **Redeploy** (Deployments → ... → Redeploy).

---

## 5. Run migrations and seed

From your local machine, with the **same** `DATABASE_URL` as Vercel:

```bash
# Set production DATABASE_URL in your .env
pnpm --filter @hotel-pricing/db exec prisma generate
pnpm db:migrate:deploy
pnpm db:seed
```

`migrate deploy` should be the normal production path, including for an empty database. Avoid `prisma db push` in production because it bypasses migration history; reserve it for a deliberate emergency recovery where data loss and schema drift have been assessed.

After this, open your Vercel URL and log in with **analyst@example.com / Password123!**

---

## 6. Worker deployment (optional)

The worker (`apps/worker`) processes scrape jobs and recomputes recommendations. It's a long-running Node process — **it cannot run on Vercel**.

### Railway

1. New project → deploy from repo
2. Set root directory to repo root
3. Add env vars: `DATABASE_URL`, `REDIS_URL` (same values as Vercel)
4. Optional schedule env: `SCRAPE_CRON` (default `0 */2 * * *`), `SIGNAL_CRON` (default `15 */6 * * *`), `HOTEL_GEO_CRON` (default `45 2 * * *`)
5. Build: `pnpm install && pnpm --filter @hotel-pricing/worker build`
6. Start: `node apps/worker/dist/index.js`

### Render

Same approach — create a Background Worker service with the same config.

### No worker

Everything works except "Run scrape now" and "Refresh" — they'll return a message that the worker is not configured.

---

## 7. Custom domain

1. Settings → Domains → add your domain (e.g. `app.trosky.com`)
2. Add the DNS records Vercel shows at your registrar
3. SSL is automatic

---

## 8. Deployment checklist

- [ ] PostgreSQL created and `DATABASE_URL` set in Vercel
- [ ] `JWT_SECRET` and `JWT_REFRESH_SECRET` set in Vercel (long random strings)
- [ ] (Optional) Redis created and `REDIS_URL` set in Vercel
- [ ] Production rate limiting strategy confirmed (`REDIS_URL` set for shared limits, or accepted in-memory fallback)
- [ ] Root Directory set to `apps/web`
- [ ] Build/Install commands left empty (using vercel.json)
- [ ] Redeployed after adding env vars
- [ ] Migrations and seed run against production DB
- [ ] Login works at Vercel URL
- [ ] (Optional) Worker deployed elsewhere with same DATABASE_URL and REDIS_URL
- [ ] Public `/inquire` tested for success, validation error, and rate-limit behavior
- [ ] Analyst and client smoke tests pass: dashboard, promotions, inquiries, messages, and logout

---

## Troubleshooting deployment

**"No Output Directory named 'public' found"**
→ Framework Preset is not set to Next.js. Go to Settings → Build & Development → set Framework Preset to Next.js. Don't set Output Directory.

**Build fails with Prisma errors**
→ Make sure Build Command is empty (not overridden). The `vercel.json` runs `prisma generate` before build.

**Login returns 500**
→ `JWT_SECRET` or `DATABASE_URL` not set. Check Settings → Environment Variables.

**"Refresh is not configured"**
→ `REDIS_URL` not set. Add it if you want scrape/refresh functionality.
