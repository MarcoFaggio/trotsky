# User guide — Analyst vs client

Practical guide for **revenue analysts** and **hotel clients** using Trosky: what each role sees, where to click, and how **Inquiries** differs by role.

**Demo logins** (after `pnpm db:seed`): see [README.md](../README.md). Set `NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=true` in `.env` to show hints on the login page.

---

## Shared basics

| Topic | Detail |
|-------|--------|
| **URL (local)** | App listens on **http://localhost:3030** (`pnpm dev`). |
| **Login** | `/login` — email/password; JWT in httpOnly cookies. |
| **Logout** | Sidebar → **Sign Out**. |
| **Hotel selector** | Top bar: pick a hotel when you have access to more than one. |

---

## Analyst

### What you are

Trosky **revenue team**: full portfolio visibility, configuration, scraping, and occupancy entry.

### Sidebar (grouped)

**Operate** · Dashboard · Revenue Actions · Rate Calendar  

**Demand** · Events · Promotions · Pace / OTB  

**Portfolio** · Portfolio · Manage Hotels · Occupancy  

**Comms** · Inquiries · Messages  

**Admin** · Scrape Admin  

*(Group labels show on expanded desktop only; mobile stays flat. Exact labels match the app.)*

### What you can do

| Area | Actions |
|------|---------|
| **Dashboard → Operate** | Prioritized revenue actions (up to 4), metrics, rate chart; Accept primary; evidence drawer; overflow for Reject / Snooze / Complete. |
| **Dashboard → Market** | Overview / Matrix / Calendar for the scoped hotel (`?view=market`). |
| **Revenue actions** | Full triage queue; category chips; accept/reject/snooze/complete. |
| **Rate calendar** | Day-level urgency from rates + actions; open evidence per day. |
| **Portfolio / Hotels** | Multi-hotel KPIs; hotel cockpit at **`/hotels/[id]`** (matrix, calendar, overrides). |
| **Manage Hotels** | List, create hotel, **`/hotels/new`**, **`/hotels/[id]/settings`**. |
| **Occupancy** | Bulk edit next ~30 days for any hotel. |
| **Events / Promotions** | Create and manage across hotels you manage. |
| **Pace** | OTB vs last year, ADR index — any hotel. |
| **Scrape Admin** | Trigger scrape runs; inspect run history (worker + Redis required for jobs to finish). |
| **Messages** | Threads with hotels / Trosky. |

### Inquiries (analyst)

- **Route:** `/inquiries`
- **Scope:** **All active hotels** — list shows inquiries across the portfolio (filter by hotel when the UI provides a selector).
- **Workflow:** Open an inquiry → review AI/heuristic summary, intent, status, priority → **Analyze** to re-run extraction → add **staff messages** → advance **status** → attach **Group RFP** / **proposal** shells when implemented in forms.
- **Manual creation:** Create inquiries for **any** hotel you manage.

Use this inbox when **guests submit `/inquire`** or when leads are entered manually.

---

## Client

### What you are

**Hotel stakeholder**: read-heavy access to **your** property’s intelligence, plus collaboration on **inquiries** for hotels linked to your account (`HotelAccess`).

### Sidebar (grouped)

**Operate** · Dashboard · Revenue Actions · Rate Calendar  

**Demand** · Events · Promotions · Pace / OTB  

**Comms** · Inquiries · **Message Trosky**  

You do **not** see: Portfolio, Manage Hotels, Occupancy, Scrape Admin.

### What you can do

| Area | Detail |
|------|--------|
| **Dashboard → Operate** | Your hotel’s prioritized actions; **read-only** workflow; open **evidence** on any card. |
| **Dashboard → Market** | Overview / Matrix / Calendar for your hotel. |
| **Revenue actions** | View and filter actions for your hotel (category chips; hotel via top bar); no accept/reject/snooze. |
| **Rate calendar** | See which dates need attention; evidence drawer read-only. |
| **Hotel dashboard** (`/hotels/[id]`) | Matrix, calendar, day detail — **no** overrides or analyst edits. |
| **Events / Promotions** | **View** what Trosky/analysts configured (per product rules — confirm in-app). |
| **Pace** | Your hotel only (or selectable among hotels you access). |
| **Messages** | Contact Trosky / threads for your hotel. |

### Inquiries (client)

- **Route:** **`/inquiries`** (same URL as analysts — **not** a different page).
- **Scope:** Only inquiries for hotels where you have **HotelAccess**.
- **Workflow:** Same detail view pattern: read summary, messages, run **Analyze** if shown, update status / add staff notes **within your hotel’s** leads.

You **cannot** see other hotels’ inquiries.

---

## Public inquiry form (no login)

| Item | Detail |
|------|--------|
| **URL** | `/inquire` |
| **Audience** | Guests, planners, schools, corporate — anyone booking or asking for a block. |
| **Behavior** | Pick hotel, enter contact + message → **`POST /api/inquiries/public`** creates an inquiry and runs heuristic analysis. |
| **Spam / abuse** | Honeypot field + server-side rate limiting by IP. |

Hotel teams respond from **`/inquiries`** after the lead appears.

---

## Quick comparison

| Capability | Analyst | Client |
|------------|---------|--------|
| Command centre / revenue actions / rate calendar | Yes (workflow on actions) | Yes (read-only) |
| Portfolio / all hotels | Yes | No |
| Hotel settings, competitors, scrapes | Yes | No |
| Bulk occupancy | Yes | No |
| Price overrides | Yes | No |
| **`/inquiries` visible** | Yes | Yes |
| **Inquiries scope** | All hotels | Assigned hotels only |
| **`/inquire` public form** | N/A (public) | N/A (public) |

---

## Related docs

- [TROSKY-OVERVIEW.md](./TROSKY-OVERVIEW.md) — product and architecture summary  
- [REVENUE-ACTION-SYSTEM.md](./REVENUE-ACTION-SYSTEM.md) — revenue actions, demo mode, evidence drawer  
- [AI-INQUIRY-LAYER.md](./AI-INQUIRY-LAYER.md) — inquiry domain and roadmap  
- [PRODUCT-DOCUMENTATION.md](./PRODUCT-DOCUMENTATION.md) — full route and feature reference  
- [TECH-UX-HARDENING.md](./TECH-UX-HARDENING.md) — release hardening and UX acceptance criteria  
