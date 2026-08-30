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
2. Create a project and copy **both** connection strings.

**`DATABASE_URL` — pooled.** Every concurrent Vercel lambda opens its own Prisma
pool. On the direct endpoint a traffic spike exhausts Neon's connection limit and
requests start failing with `too many connections`. Use the `-pooler` host and
cap the per-instance pool:

```
postgresql://user:pass@ep-xxx-pooler.REGION.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connection_limit=1
```

**`DIRECT_DATABASE_URL` — non-pooled.** `prisma migrate deploy` needs DDL and
advisory locks that pgbouncer's transaction mode cannot provide, so migrations
use this endpoint instead:

```
postgresql://user:pass@ep-xxx.REGION.aws.neon.tech/neondb?sslmode=require
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
     "buildCommand": "cd ../.. && pnpm --filter @hotel-pricing/db exec prisma migrate deploy && pnpm --filter @hotel-pricing/db exec prisma generate && pnpm --filter @hotel-pricing/web build"
   }
   ```
   `DATABASE_URL` must be set before the first production build so `migrate deploy` can run.

4. **Framework Preset** — should auto-detect as **Next.js**. If it says "Other", change it.

---

## 4. Environment variables

Settings → Environment Variables → add for **Production** (and Preview if desired):

| Variable | Value | Required |
|----------|-------|----------|
| `DATABASE_URL` | **Pooled** Postgres URL (`-pooler` host, `connection_limit=1`) | Yes |
| `DIRECT_DATABASE_URL` | **Non-pooled** Postgres URL — used only by `migrate deploy` | Yes on Neon/Supabase pooling |
| `JWT_SECRET` | `openssl rand -hex 32` output | Yes |
| `JWT_REFRESH_SECRET` | Another `openssl rand -hex 32` output | Yes |
| `REDIS_URL` | Your Upstash Redis URL | No, but recommended |
| `CSP_MODE` | `report-only` to stop enforcing the Content-Security-Policy | No (enforced by default) |
| `HEALTH_DETAIL_TOKEN` | Random string; unlocks the detailed `/api/health` payload | No |
| `INQUIRY_AI_PROVIDER` | `heuristic` unless live AI is implemented | No |
| `INQUIRY_PUBLIC_AI_ANALYSIS` | `false` only if public capture should skip auto-analysis | No |
| `INQUIRY_UI_ANALYZE` | `false` only if the Analyze control should be disabled | No |
| `NEXT_PUBLIC_DISCOUNT_ADR_THRESHOLD` | ADR warning threshold, default `12` | No |
| `NEXT_PUBLIC_DISCOUNT_SHARE_THRESHOLD` | Discount share warning threshold, default `35` | No |
| `NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS` | `true` only for demo environments | No |
| `TROSKY_DEMO_MODE` | `true` for demo/staging tenants; omit or `false` in production | **Yes for demo Vercel tenants** |

**Demo data:** Seed/demo RevenueActions are **hidden in production** unless `TROSKY_DEMO_MODE=true`. Without that flag (and without a worker generating live actions), the command centre looks empty even when hotels and rates exist. In local development demo actions are visible by default. Set `TROSKY_DEMO_MODE=false` locally to verify production-like behaviour. Demo data must never be treated as live hotel intelligence.

Save and **Redeploy** (Deployments → ... → Redeploy).

### Checking health after deploy

`/api/health` is deliberately terse for anonymous callers in production, so it
cannot be used to fingerprint which parts of the stack are unconfigured:

```bash
curl -s https://trotsky.vercel.app/api/health
# {"status":"ok","ready":true}          — HTTP 200, or 503 when degraded
```

Set `HEALTH_DETAIL_TOKEN` to get the full breakdown (DB status, which env vars
are present, queue availability, demo mode, remediation hints):

```bash
curl -s -H "x-health-token: $HEALTH_DETAIL_TOKEN" https://trotsky.vercel.app/api/health | jq
```

### Content-Security-Policy

The CSP is **enforced** and built per-request around a nonce, which is why every
route renders dynamically — a prerendered HTML file cannot carry a per-request
value. It currently allows Google Fonts (`fonts.googleapis.com`,
`fonts.gstatic.com`) because the root layout loads them.

Adding any third-party script, iframe, or API origin will be blocked until you
widen `buildCsp()` in `apps/web/src/lib/security-headers.ts`. To diagnose without
breaking the page, deploy with `CSP_MODE=report-only`, read the browser console
violations, widen the policy, then remove the variable.

---

## 5. Run migrations and seed

From your local machine, with the **same** `DATABASE_URL` as Vercel:

```bash
# Set production DATABASE_URL in your .env
pnpm --filter @hotel-pricing/db exec prisma generate
pnpm db:migrate:deploy
# Hosted DBs refuse seed unless forced (seed WIPEs all data):
SEED_FORCE=true pnpm db:seed
```

`migrate deploy` should be the normal production path, including for an empty database (also runs automatically in the Vercel build via `vercel.json`). Avoid `prisma db push` in production because it bypasses migration history; reserve it for a deliberate emergency recovery where data loss and schema drift have been assessed.

After this, open your Vercel URL and log in with **analyst@example.com / Password123!**

If the command centre still shows no actions on a demo tenant, confirm `TROSKY_DEMO_MODE=true` is set and the project was redeployed.

If rates show as `—` weeks after the first seed, the rolling date window has moved past the seeded days. Refresh without wiping users:

```bash
SEED_FORCE=true pnpm db:refresh-demo
```

---

## 6. Worker deployment

The worker (`apps/worker`) processes scrape jobs and recomputes recommendations. It's a long-running Node process — **it cannot run on Vercel**.

A one-shot path (no Redis) lives at `pnpm worker:run-once`. Hosted databases require `SEED_FORCE=true`. GitHub Actions (`.github/workflows/worker-pipeline.yml`) runs that same job every 2 hours so the 30-day window stays fresh.

### Redis (Upstash, free tier)

Needed for "Run scrape now" / "Refresh" to enqueue instead of 503.

1. Accept Vercel marketplace terms: [Upstash](https://vercel.com/target-alert-group/~/integrations/accept-terms/upstash?source=cli)
2. Provision and attach to production:

```bash
npx vercel integration add upstash/upstash-kv --plan free \
  -m primaryRegion=dub1 -m autoUpgrade=false -m eviction=true \
  --environment production --scope team_Efp3uwY6NBKutBd4aEowAs3P
```

3. Confirm `REDIS_URL` is set, then redeploy. Leave `TROSKY_DEMO_MODE` unset/false so only live actions show.

### Railway (queued worker)

Repo root has `Dockerfile.worker` and `railway.toml`.

1. `railway login` then `railway init` in the repo root (or New Project → deploy from GitHub)
2. Builder uses `Dockerfile.worker` (skips Playwright; `SCRAPE_MODE=mock`)
3. Env: `DATABASE_URL` (same Neon), `REDIS_URL` (same Upstash), `SCRAPE_MODE=mock`, `SCRAPE_CRON=0 */2 * * *`
4. Start command (already in `railway.toml`): `pnpm --filter @hotel-pricing/worker exec tsx src/index.ts`

### Render

`render.yaml` defines a Docker worker. Set `DATABASE_URL` and `REDIS_URL` in the dashboard; `SCRAPE_MODE` and `SCRAPE_CRON` are prefilled.

### Bootstrap without Redis

```bash
SEED_FORCE=true pnpm worker:run-once
```

Writes live `DailyRate`, `Recommendation`, and `RevenueAction` rows (`source: RECOMMENDATION` / `EVENT_DEMAND`).

### No queued worker

The scheduled GitHub Action still refreshes rates. "Run scrape now" and "Refresh" return 503 until `REDIS_URL` is set and a long-lived worker is consuming the queue.

---

## 7. Custom domain

1. Settings → Domains → add your domain (e.g. `app.trosky.com`)
2. Add the DNS records Vercel shows at your registrar
3. SSL is automatic

---

## 8. Deployment checklist

- [ ] PostgreSQL created; `DATABASE_URL` uses the **pooled** host with `connection_limit=1`
- [ ] `DIRECT_DATABASE_URL` set to the non-pooled host so `migrate deploy` can run
- [ ] `JWT_SECRET` and `JWT_REFRESH_SECRET` set in Vercel (long random strings)
- [ ] (Optional) Redis created and `REDIS_URL` set in Vercel
- [ ] Rate limiting: Redis if available, otherwise the Postgres `RateLimitBucket` fallback — both are shared across instances, unlike the in-memory last resort
- [ ] Demo tenant: `TROSKY_DEMO_MODE=true` set (otherwise seed actions stay hidden)
- [ ] Root Directory set to `apps/web`
- [ ] Build/Install commands left empty (using vercel.json)
- [ ] Redeployed after adding env vars
- [ ] Migrations applied; seed run with `SEED_FORCE=true` against production DB when needed
- [ ] `/api/health` returns `{"status":"ok","ready":true}` (add `HEALTH_DETAIL_TOKEN` for the full report)
- [ ] Browser console is free of CSP violations (else set `CSP_MODE=report-only` and widen the policy)
- [ ] Logout verified to end the session: a copied cookie must stop working afterwards
- [ ] Login works at Vercel URL
- [ ] (Optional) Worker deployed elsewhere with same DATABASE_URL and REDIS_URL
- [ ] Public `/inquire` tested for success, validation error, and rate-limit behavior
- [ ] Analyst and client smoke tests pass: dashboard, promotions, inquiries, messages, and logout

---

## Troubleshooting deployment

**"No Output Directory named 'public' found"**
→ Framework Preset is not set to Next.js. Go to Settings → Build & Development → set Framework Preset to Next.js. Don't set Output Directory.

**Build fails with Prisma errors**
→ Make sure Build Command is empty (not overridden). The `vercel.json` runs `migrate deploy` + `prisma generate` before build. `DATABASE_URL` must be available at build time.

**Login returns 500**
→ `JWT_SECRET` or `DATABASE_URL` not set. Check Settings → Environment Variables. With `HEALTH_DETAIL_TOKEN` set, `/api/health` shows which JWT vars are present.

**Command centre empty after seed**
→ Set `TROSKY_DEMO_MODE=true` for demo tenants and redeploy, or deploy Redis + worker for live actions.

**"Refresh is not configured"**
→ `REDIS_URL` not set. Add it if you want scrape/refresh functionality.
