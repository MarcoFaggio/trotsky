# Troubleshooting — Trosky

Common issues and how to fix them.

---

## Local development

### "Cannot find module '@hotel-pricing/db'" or similar

Prisma client hasn't been generated yet.

```bash
pnpm --filter @hotel-pricing/db exec prisma generate
```

### "Can't reach database server"

PostgreSQL isn't running.

- **Docker:** `docker compose up -d` then `docker compose ps` to verify
- **Hosted (Neon/Supabase):** Check your `DATABASE_URL` in `.env` — make sure it includes `?sslmode=require` for hosted providers

### "connect ECONNREFUSED 127.0.0.1:6379" or "::1:6379"

Redis isn't running. Either:
- Start Redis: `pnpm infra:up` or `docker compose up -d`
- Use `REDIS_URL=redis://127.0.0.1:6379` in `.env` if `localhost` resolves to IPv6 (`::1`) but Redis listens on IPv4 only
- For UI-only dev, run `pnpm dev` (does not start the worker)

### Watchpack / "EMFILE: too many open files, watch"

Common on external drives or large monorepos. Fixes:
- From the repo root, `pnpm dev` enables webpack polling (`NEXT_DEV_POLLING`) — prefer this over `pnpm dev:full` when you only need the browser
- Run `./scripts/dev-local.sh` (raises `ulimit -n` on macOS before starting)
- Manually: `ulimit -n 10240` in the terminal session

### Login returns "Invalid email or password"

Database isn't seeded. Run:

```bash
pnpm db:seed
```

This creates `analyst@example.com` and `client@example.com` with password `Password123!`.

### "Error: Missing required environment variable: JWT_SECRET"

You're running in production mode without setting `JWT_SECRET`. Either:
- Set it in `.env`: `JWT_SECRET=<any-long-random-string>`
- Or run in development mode: `NODE_ENV=development`

### Prisma migration errors

If migrations are out of sync:

```bash
# Reset and re-apply (destroys data)
pnpm --filter @hotel-pricing/db exec prisma migrate reset

# Or push schema without migration history
pnpm --filter @hotel-pricing/db exec prisma db push
pnpm db:seed
```

### Wrong URL / 404 in the browser

Local dev uses a **fixed port (3030)** — open **http://localhost:3030**. If you open port **3000**, you may be hitting a different app (and see a 404 or blank page).

### Port 3030 already in use

Another process is using the dev port:

```bash
lsof -ti:3030 | xargs kill -9
```

Or change the port in `apps/web/package.json` (`next dev -p …`).

### `Cannot find module './4308.js'` (or similar webpack chunk)

Stale or corrupted **`.next`** cache — common after interrupted builds or editing on an **external drive** (T7/USB).

```bash
lsof -ti:3030 | xargs kill -9 2>/dev/null
cd /path/to/Trotsky
pnpm cleanup:appledouble
rm -rf apps/web/.next
pnpm --filter @hotel-pricing/web dev
```

Do not run `next build` and `next dev` against the same `.next` folder at the same time. If it persists, run a clean `pnpm --filter @hotel-pricing/web exec next build` once, then restart dev.

### Demo actions missing locally (or visible in production)

Controlled by **`TROSKY_DEMO_MODE`** (server-side, not `NEXT_PUBLIC_`):

| Setting | Effect |
|---------|--------|
| Unset + `NODE_ENV=development` | Demo/seed actions **visible** |
| `TROSKY_DEMO_MODE=false` | Demo actions **hidden** everywhere |
| `TROSKY_DEMO_MODE=true` | Demo actions **visible** (labelled) |
| Production, unset or `false` | Demo actions **hidden** |

See [REVENUE-ACTION-SYSTEM.md](REVENUE-ACTION-SYSTEM.md).

---

## Vercel deployment

### "No Output Directory named 'public' found"

Framework Preset is wrong. Fix:
1. Settings → Build & Development → Framework Preset → **Next.js**
2. Output Directory → leave empty or turn Override off
3. Redeploy

### Build fails with "prisma generate" errors

Build Command is overridden. Fix:
1. Settings → Build & Development → clear Build Command (leave empty)
2. The repo's `apps/web/vercel.json` handles the build
3. Redeploy

### Login returns 500 in production

Missing environment variables. Check:
1. Settings → Environment Variables
2. Verify `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET` are set
3. Redeploy after adding them

### "Refresh is not configured" error

`REDIS_URL` is not set. Add it in Settings → Environment Variables if you want scrape/refresh. Without it, the rest of the app works fine.

### Dashboard shows no data

Database hasn't been seeded. From your local machine (with the same `DATABASE_URL` as Vercel):

```bash
pnpm --filter @hotel-pricing/db exec prisma migrate deploy
pnpm db:seed
```

### "Run scrape now" does nothing

The worker isn't deployed. The worker is a separate long-running process — it can't run on Vercel. Deploy it on Railway, Render, or a VPS. See [Deploy guide](DEPLOY.md#6-worker-deployment-optional).

### Public inquiry returns "Too many inquiry submissions"

The public inquiry endpoint is rate-limited by IP.

- In production, set `REDIS_URL` so limits are shared across server instances.
- In local/dev without Redis, limits are in-memory and reset when the web process restarts.
- If this happens during testing, wait for the 15-minute window or restart the local dev process.

---

## Data issues

### Rates are stale / not updating

- Check if the worker is running (it runs the daily scrape at 04:00 UTC)
- Try "Refresh" on the hotel dashboard to queue a manual scrape
- Check Scrape Admin (`/admin/scrapes`) for error counts
- In mock mode, prices are deterministic — they only change when dates change

### Recommendations seem wrong

Recommendations depend on:
1. Competitor rates (need at least one competitor with data)
2. Occupancy data (manually entered on the Occupancy page)
3. Hotel min/max rate settings (clamps the recommendation)

Check Hotel Settings → ensure competitors have valid weights and min/max rates are set.

### "No hotels" on dashboard

- **Analyst:** No active hotels in the database. Run `pnpm db:seed` or create one at `/hotels/new`
- **Client:** No `HotelAccess` record linking the user to a hotel. Check the database.

---

## macOS-specific

### `._*` files appearing (AppleDouble)

macOS creates resource-fork sidecar files on external volumes. They can confuse Next/webpack and cause missing-chunk errors.

**Preferred cleanup:**

```bash
pnpm cleanup:appledouble
# same as: python3 scripts/cleanup-macos-appledouble.py .
```

Run after copying the repo to a USB drive or before `next dev` / `next build` if you see odd module errors. Then remove `.next` and restart dev (see webpack chunk section above).
