# Deploy Trotsky (Web) to Vercel

Follow these steps to get your landing page and app live for clients.

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

The repo is a **monorepo**. The Next.js app lives in `apps/web`. Set:

| Field | Value |
|--------|--------|
| **Framework Preset** | Next.js (should be auto-detected) |
| **Root Directory** | `apps/web` — click **Edit**, select `apps/web`, confirm. |
| **Build Command** | Leave default (`next build` or `pnpm run build`). |
| **Output Directory** | Leave default (`.next`). |
| **Install Command** | Leave default (`pnpm install`). Vercel will run it from the **repo root** and then build from `apps/web`. |

If there is an **Environment Variables** section, you can skip it for now unless your app needs `JWT_SECRET` or DB URLs for the deployed site. You can add those later in Project Settings.

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
