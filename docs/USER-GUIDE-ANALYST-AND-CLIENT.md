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

### Sidebar (typical order)

Dashboard · Portfolio · Manage Hotels · Events · Occupancy · Pace · Promotions · **Inquiries** · Messages · Scrape Admin  

*(Exact labels match the app; Promotions/Messages may vary slightly.)*

### What you can do

| Area | Actions |
|------|---------|
| **Portfolio / Dashboard** | Multi-hotel KPIs; open any hotel card → hotel dashboard. |
| **Manage Hotels** | List, create hotel, open **`/hotels/new`**, edit **`/hotels/[id]/settings`** (general, competitors, rate plans). |
| **Hotel dashboard** | Rate matrix, calendar, day detail, **price overrides**, export CSV. |
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

### Sidebar (order in app)

Dashboard · Events · Promotions · **Inquiries** · **Message Trosky** · Pace / OTB  

You do **not** see: Portfolio, Manage Hotels, Occupancy, Scrape Admin.

### What you can do

| Area | Detail |
|------|--------|
| **Dashboard** | Redirects to **your** hotel dashboard (`/hotels/[id]`). |
| **Hotel dashboard** | View matrix, calendar, day detail — **no** overrides, **no** occupancy edits, **no** add-event from analyst-only controls. |
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
- [AI-INQUIRY-LAYER.md](./AI-INQUIRY-LAYER.md) — inquiry domain and roadmap  
- [PRODUCT-DOCUMENTATION.md](./PRODUCT-DOCUMENTATION.md) — full route and feature reference  
