# Deploy Trotsky (Web) to Vercel

Follow these steps to get your landing page and app live for clients.

---

## If your build failed — fix it in the Vercel website (no terminal)

You **don’t run any commands** in a terminal. You only change settings on the Vercel site. Vercel will then run the right commands for you (they’re already in the repo’s `apps/web/vercel.json`).

### Step A: Open project settings

1. Go to [vercel.com](https://vercel.com) and log in.
2. Open your **Trotsky** project (click the project name).
3. In the top menu, click **Settings**.

### Step B: Set Root Directory

1. In the left sidebar under **Settings**, click **General**.
2. Find the **Root Directory** section.
3. Click **Edit** next to it.
4. In the text field, type: **`apps/web`**
5. Click **Save**.

### Step C: Don’t override Build or Install

1. In the left sidebar, click **Build & Development** (under Settings).
2. For **Build Command** — leave it **empty** (or if it says something like `pnpm run build`, clear it so the field is empty). That way Vercel uses the command from the repo’s `vercel.json`.
3. For **Install Command** — leave it **empty** as well.
4. No need to type anything else; the rest can stay default.

### Step D: Redeploy

1. Click **Deployments** in the top menu.
2. Find the latest deployment (the one that failed).
3. Click the **three dots (⋯)** on the right of that row.
4. Click **Redeploy**.
5. Confirm **Redeploy** in the popup.

Vercel will run the build again using `apps/web` as the root and the commands from `apps/web/vercel.json`. You don’t run any commands yourself.

### If you see: "No Output Directory named 'public' found"

Next.js builds to **`.next`**, not `public`. Two things to do:

1. **In the repo** — `apps/web/vercel.json` now has `"outputDirectory": ".next"`. Push that change and redeploy (or redeploy after the next push).
2. **In Vercel** — **Settings** → **Build & Development**. Find **Output Directory**. If it says `public`, clear it (leave it empty) or set it to **`.next`**. Save, then **Redeploy**.

---

## Step 1: Push to GitHub (if you haven’t yet)

From the repo root:

```bash
git push origin main
```

If you’re asked to sign in, use a **Personal Access Token** (not your GitHub password):

- GitHub → **Settings** → **Developer settings** → **Personal access tokens** → create a token with `repo` scope.
- When Git asks for a password, paste the token.

---

## Step 2: Sign in to Vercel

1. Go to [vercel.com](https://vercel.com).
2. Click **Sign Up** or **Log In**.
3. Choose **Continue with GitHub** and authorize Vercel to access your GitHub account.

---

## Step 3: Import the Trotsky repo

1. On the Vercel dashboard, click **Add New…** → **Project**.
2. Find **Trotsky** in the list (repo: `MarcoFaggio/Trotsky`) and click **Import**.

---

## Step 4: Configure the project (monorepo)

The repo is a **monorepo**. The Next.js app lives in `apps/web`. You **must** set Root Directory so the build doesn’t run the whole Turborepo.

| Field | Value |
|--------|--------|
| **Framework Preset** | Next.js (auto-detected) |
| **Root Directory** | **`apps/web`** — click **Edit**, type `apps/web`, save. **Required.** |
| **Build Command** | Leave empty so `apps/web/vercel.json` is used (it runs Prisma generate + web build). |
| **Output Directory** | Leave default (`.next`). |
| **Install Command** | Leave empty so `apps/web/vercel.json` is used (install from repo root). |

The repo already has `apps/web/vercel.json` that:
- Runs **install** from the repo root: `cd ../.. && pnpm install`
- Runs **build**: Prisma generate, then only the web app: `pnpm --filter @hotel-pricing/web build`

Do not override Build or Install in the Vercel dashboard or the full monorepo will build and likely fail.

If there is an **Environment Variables** section, you can skip it for now unless your app needs `JWT_SECRET` or DB URLs. You can add those later in Project Settings.

---

## Step 5: Deploy

1. Click **Deploy**.
2. Wait for the build to finish (usually 1–2 minutes).
3. When it’s done, Vercel shows a **Visit** link (e.g. `trotsky-xxx.vercel.app`). That’s your live site.

---

## Step 6: Optional — custom domain

1. In the project, go to **Settings** → **Domains**.
2. Add your domain (e.g. `app.trotsky.com` or `trotsky.com`).
3. Follow Vercel’s instructions to add the DNS records at your registrar. Vercel will issue SSL automatically.

---

## Step 7: Later — env vars and DB

If your app needs env vars in production (e.g. `JWT_SECRET`, `DATABASE_URL`):

1. In the project, go to **Settings** → **Environment Variables**.
2. Add each variable and choose **Production** (and Preview if you want).
3. Trigger a new deployment (**Deployments** → **…** on latest → **Redeploy**).

---

## Summary

- **Push:** `git push origin main`
- **Vercel:** Import repo → set **Root Directory** to `apps/web` → Deploy.
- **Live URL:** Use the **Visit** link from the deployment (or your custom domain once configured).

You can share the Vercel URL with clients to show the Trotsky landing page and app.
