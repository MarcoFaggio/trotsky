# Trotsky — Full Product Documentation

Complete product documentation for **Trotsky**: user flows, features, data model, and behavior. This describes the system as built (POC/MVP scope).

---

## Table of contents

1. [Product overview](#1-product-overview)
2. [User roles and access control](#2-user-roles-and-access-control)
3. [User provisioning and authentication](#3-user-provisioning-and-authentication)
4. [Route map and permissions](#4-route-map-and-permissions)
5. [User flows (step-by-step)](#5-user-flows-step-by-step)
6. [Feature and page reference](#6-feature-and-page-reference)
7. [Data model and entities](#7-data-model-and-entities)
8. [Business rules and calculations](#8-business-rules-and-calculations)
9. [Glossary](#9-glossary)

---

## 1. Product overview

### 1.1 What it is

**Trotsky** is a SaaS application for revenue teams and hotel clients. It supports:

- **Competitive rate tracking** — Our hotel’s rates and competitor rates (from OTA listings, scraped or mock).
- **AI rate recommendations** — Deterministic engine that suggests a price per date from competitor anchor, occupancy, pace, and events.
- **Occupancy and pace** — Manual entry of occupancy %, rooms on the books (OTB), and last-year (LY) data; pace vs last year and STR-like ADR index.
- **Day-level detail** — Per-date view: pricing, competitor set, occupancy, ADR/revenue, events and promotions, overrides (analyst only).
- **Promotions and events** — Date-range promotions and single-day events, shown on matrix/calendar and in day detail.
- **Discount control** — Rate plans (BAR, AAA, etc.), discount mix per date, ADR-based warnings when discount impact is high.
- **Scraping** — Mock or real (Playwright) OTA scrapers; admin can run a scrape and see runs/errors.

### 1.2 Who uses it

- **Revenue analysts** — Full access: manage hotels and competitors, enter occupancy, set overrides, add events/promotions, run scrapes, export data.
- **Hotel clients** — Read-only access to one assigned hotel: view dashboard, rate matrix, calendar, day detail, and pace.

### 1.3 Out of scope (current POC)

- Self-service **signup** (users are provisioned via seed or future admin).
- Password reset / forgot password.
- Multi-tenant branding or white-label.
- PMS/Channel Manager integrations.
- Real-time or webhook-based rate updates (rates come from scheduled or manual scrape runs).

---

## 2. User roles and access control

### 2.1 Roles

| Role     | Description | Scope |
|----------|-------------|--------|
| **ANALYST** | Revenue team; full manage and view. | All active hotels. |
| **CLIENT**  | Hotel stakeholder; view only.        | One hotel, via `HotelAccess`. |

### 2.2 What each role can do

| Capability | ANALYST | CLIENT |
|------------|---------|--------|
| View dashboard (multi-hotel or single) | Yes (multi-hotel) | Yes (redirect to own hotel) |
| View hotel dashboard (matrix, calendar, summary) | Yes, any hotel | Yes, assigned hotel only |
| View Day Detail modal (read-only) | Yes | Yes |
| Set price override | Yes | No |
| Add / edit occupancy for a date | Yes | No |
| Add event | Yes | No |
| Create / edit / delete promotion | Yes | No |
| Manage hotels (create, edit, settings) | Yes | No (no access to /hotels) |
| Bulk occupancy entry | Yes | No (no access to /occupancy) |
| View Pace / OTB | Yes, any allowed hotel | Yes, assigned hotel |
| Run scrape / view Scrape Admin | Yes | No (no access to /admin) |
| Export CSV (matrix, occupancy) | Yes | No (export in context of hotel dashboard) |

### 2.3 How access is enforced

- **Middleware** — All non-public routes require a valid JWT in the `access_token` cookie. If missing or expired, user is redirected to `/login` (or 401 for API).
- **Server actions and API routes** — Use RBAC helpers:
  - `requireAuth()` — any logged-in user.
  - `requireRole('ANALYST')` — analyst only.
  - `requireHotelAccess(hotelId)` — analyst (any hotel) or client with `HotelAccess` for that `hotelId`.
- **UI** — Analyst-only links (Hotels, Occupancy, Promotions, Scrape Admin) are hidden for clients. Buttons for override, Add Event, edit occupancy, etc., are hidden for clients in the Day Detail modal and elsewhere.

---

## 3. User provisioning and authentication

### 3.1 User provisioning (no self-service signup)

There is **no public signup flow**. Users are created by:

- **Seed script** — Creates demo users (e.g. `analyst@example.com`, `client@example.com`) and assigns the client to a hotel via `HotelAccess`.
- **Future** — An admin or back-office process would create users and assign clients to hotels (not implemented in UI).

To add a user today: run a script or insert into `User` and, for clients, into `HotelAccess`.

### 3.2 Login flow

1. **User opens the app** (e.g. `/` or any protected URL).
2. **Middleware** finds no valid `access_token` cookie → redirect to **`/login`**.
3. **Login page** shows:
   - Email and password fields.
   - “Sign In” button.
   - Demo account hints (e.g. analyst@example.com / Password123!).
4. **User submits** email + password.
5. **Client** sends `POST /api/auth/login` with `{ email, password }`.
6. **Server**:
   - Applies **rate limit**: 5 attempts per 15 minutes per IP; if exceeded → 429.
   - Validates body with Zod (`loginSchema`).
   - Looks up `User` by email (case-insensitive).
   - If no user or **bcrypt** verify fails → 401 “Invalid email or password”.
   - On success: creates **access token** (JWT, 15 min expiry) and **refresh token** (JWT, 7 days), sets **httpOnly cookies** (`access_token`, `refresh_token`), returns `{ user: { id, email, role, name } }`.
7. **Client** redirects to **`/dashboard`** and refreshes.
8. **Dashboard** (or middleware) loads; user sees the app shell and content according to role.

### 3.3 Session and “30 min idle”

- **Access token** lifetime is **15 minutes**. There is no sliding-window logout in the UI; “30 min idle” is approximated by token expiry.
- **Refresh token** (7 days) is stored in an httpOnly cookie. The app can call `POST /api/auth/refresh` with that cookie to get a new access token (and optionally a new refresh token) so the user stays logged in across tabs or after idle.
- If the **access token is expired** and no refresh is done, the next request hits middleware → redirect to `/login` (or 401 for API).

### 3.4 Logout flow

1. User clicks **Sign Out** in the sidebar.
2. **Client** calls `POST /api/auth/logout`.
3. **Server** clears `access_token` and `refresh_token` cookies.
4. **Client** redirects to **`/login`** (e.g. `window.location.href = '/login'`).

### 3.5 Protected routes and API

- **Public**: `/login`, `POST /api/auth/login`, `POST /api/auth/refresh`. No JWT required.
- **All other app routes and APIs** require a valid JWT. Unauthenticated → redirect to `/login` or 401.

---

## 4. Route map and permissions

| Route | Purpose | ANALYST | CLIENT |
|-------|---------|---------|--------|
| `/login` | Login page | Allowed (usually redirect if already logged in) | Same |
| `/` | Root | Redirect to `/dashboard` | Same |
| `/dashboard` | Overview or redirect | Multi-hotel dashboard | Redirect to `/hotels/[assignedId]` |
| `/hotels` | Hotel list | Yes | No (403/redirect) |
| `/hotels/new` | Create hotel form | Yes | No |
| `/hotels/[id]` | Hotel dashboard (matrix/calendar) | Yes, any hotel | Yes, only if `HotelAccess` |
| `/hotels/[id]/settings` | Hotel settings (general, competitors, rate plans) | Yes | No |
| `/occupancy` | Bulk occupancy entry | Yes | No |
| `/pace` | Pace / OTB dashboard | Yes, any hotel | Yes, assigned hotel |
| `/promotions` | Promotions list and CRUD | Yes | No |
| `/admin/scrapes` | Scrape runs and “Run now” | Yes | No |
| `POST /api/auth/login` | Login | Public | Public |
| `POST /api/auth/refresh` | Refresh token | Cookie-based | Same |
| `POST /api/auth/logout` | Logout | Authenticated | Same |
| `GET /api/auth/me` | Current user | Authenticated | Same |
| `POST /api/scrape` | Queue scrape job | Analyst only | 403 |

---

## 5. User flows (step-by-step)

### 5.1 Analyst: First-time login to viewing a hotel

1. Open app → redirected to **`/login`**.
2. Enter **analyst@example.com** / **Password123!** → Sign In.
3. **POST /api/auth/login** succeeds → cookies set → redirect to **`/dashboard`**.
4. **Dashboard** loads:
   - Summary cards: total hotels, avg today rate, avg occupancy, recommendations count.
   - Grid of **hotel cards** (name, today rate, occ %, recommended rate, room count, competitor count).
5. Click a **hotel card** → navigate to **`/hotels/[id]`** (Hotel dashboard).
6. Hotel dashboard loads:
   - **Summary cards** for today (rate, recommended, occupancy, LY occ, comp avg, ADR, revenue, alerts).
   - **Rate Matrix** tab: table (our row, recommended row, comp avg row, competitor rows) and chart below; **Calendar** tab available.
   - Date range selector (7/14/30 days), Export CSV.
7. Analyst can change date range, switch to Calendar, click a date → **Day Detail modal** opens.

### 5.2 Analyst: Setting a price override

1. From Hotel dashboard (**Rate Matrix** or **Calendar**), click a **date** (cell or tile).
2. **Day Detail modal** opens.
3. In “Room Pricing” or “Price Override” section (analyst-only):
   - Enter **price** (e.g. 129) and optional **reason**.
   - Click **Set** (or “Save”).
4. Server action **setPriceOverride** runs (ANALYST check, upsert `PriceOverride`).
5. Modal can stay open or close; on next load, **Today’s Rate** and matrix/calendar show the override for that date; recommendation engine may use override as “our rate” for that day.

### 5.3 Analyst: Adding an event

1. Open **Day Detail modal** for a date (from matrix or calendar).
2. In “Events & Promotions” section, click **Add Event** (analyst-only).
3. Form appears: **Title** (required), **Notes** (optional).
4. Submit → server action **createEvent** (ANALYST, insert `Event` for hotel + date).
5. Event appears in the modal list and, on matrix/calendar, that date can show an event marker; recommendations may factor “event present” (e.g. +5%).

### 5.4 Analyst: Bulk occupancy entry

1. Sidebar → **Occupancy**.
2. **Occupancy** page loads: hotel selector, table (next 30 days × Occ %, Rooms OTB, Occ LY %, OTB LY Rooms).
3. Select **hotel** (if more than one).
4. Edit cells (e.g. Occ % or Rooms OTB for several dates).
5. Click **Save All** → server action **bulkUpsertOccupancy** (ANALYST, upsert many `OccupancyEntry`).
6. Optional: **Export CSV** → download occupancy/OTB data for that hotel.

### 5.5 Analyst: Creating a promotion

1. Sidebar → **Promotions**.
2. **Promotions** page: list of existing promotions; **Add Promotion** button.
3. Click **Add Promotion** → dialog: **Hotel**, **Title**, **Description**, **Start date**, **End date**, **Terms**.
4. Submit → server action **createPromotion** (ANALYST, insert `Promotion`).
5. New row appears in the list. Any date inside [startDate, endDate] will show this promo in Day Detail and can trigger “Promo” badge on dashboard.

### 5.6 Analyst: Managing hotels and competitors

1. Sidebar → **Hotels**.
2. **Hotel list**: cards per hotel; click card → Hotel dashboard. **Add Hotel** → **`/hotels/new`**.
3. **Create hotel**: fill name, PMS name, contact, address, room count, timezone, occ target, min/max rate, **Expedia URL** (required), Booking URL (optional) → Submit → create hotel (+ listings) → redirect to **`/hotels/[id]/settings`**.
4. **Hotel settings** (or via “Settings” from hotel dashboard):
   - **General**: edit name, contact, room count, min/max rate, occ target, etc. → Save.
   - **Competitors**: table of competitors (name, weight, Expedia URL); **Add** (name, Expedia URL, weight Low/Medium/High); change weight; remove.
   - **Rate plans**: table of plans (code, name, discount %); **Add** (e.g. BAR, AAA, Senior, Mobile).

### 5.7 Analyst: Running a scrape and viewing runs

1. Sidebar → **Scrape Admin** (**/admin/scrapes**).
2. Page shows **Runs table**: Run ID, Started, Duration, Status, Mode (MOCK/REAL), Rates stored, Errors.
3. Click **Run Scrape Now** → **POST /api/scrape** (ANALYST) → job added to BullMQ queue.
4. If the **worker** is running, it processes the job: for each active hotel and competitor listing, runs mock or real scraper, writes `DailyRate` and `ReviewSnapshot`, then can trigger recommendation recompute; writes `ScrapeRun` and `ScrapeError` if failures.
5. Click **Refresh** to reload the table and see new run and error counts.

### 5.8 Analyst: Exporting CSV

- **Rate matrix**: On Hotel dashboard, with Rate Matrix or Calendar visible, click **Export CSV** → client builds CSV (dates × our rate, recommended, comp avg, occupancy, competitors) and triggers download.
- **Occupancy**: On **Occupancy** page, select hotel, click **Export CSV** (or “CSV”) → download occupancy/OTB table for that hotel.

### 5.9 Client: Full flow (read-only)

1. Open app → **`/login`**.
2. Enter **client@example.com** / **Password123!** → Sign In.
3. Redirect to **`/dashboard`** → server sees CLIENT role and **HotelAccess** → redirect to **`/hotels/[assignedHotelId]`**.
4. **Hotel dashboard** loads for the single assigned hotel:
   - Same summary cards, Rate Matrix, Calendar, date range, but **no Export CSV** (or it may be hidden for client).
5. Click a date → **Day Detail modal** opens:
   - Client sees: room pricing, competitor table, occupancy block, ADR/revenue, events/promotions.
   - Client does **not** see: Price override input, Add Event, Edit occupancy, Add Promotion.
6. Sidebar: only **Dashboard** (which redirects to same hotel), **Pace / OTB**, **Sign Out**. No Hotels, Occupancy, Promotions, Scrape Admin.
7. **Pace** page: client can select only their hotel (or it’s pre-selected); sees OTB vs LY chart and ADR index.
8. **Sign Out** → **POST /api/auth/logout** → redirect to **`/login`**.

### 5.10 Logout (any role)

1. Sidebar → **Sign Out**.
2. **POST /api/auth/logout** → cookies cleared.
3. Client redirects to **`/login`**.

---

## 6. Feature and page reference

### 6.1 Login page (`/login`)

- **Fields**: Email, Password.
- **Actions**: Sign In (submit to `POST /api/auth/login`).
- **Validation**: Client-side required; server Zod (email format, password min length).
- **Rate limit**: 5 attempts / 15 min per IP (server).
- **Demo hint**: Text showing analyst@example.com and client@example.com with Password123!.
- **Post-success**: Redirect to `/dashboard`.

### 6.2 App shell (layout after login)

- **Sidebar**: Logo/name; nav links (Dashboard, Hotels, Occupancy, Pace, Promotions, Scrape Admin); Sign Out. Links shown/hidden by role.
- **Top bar**: Hotel selector (dropdown of allowed hotels), user role badge and email.
- **Main area**: Outlet for current page (dashboard, hotel dashboard, occupancy, etc.).

### 6.3 Dashboard (`/dashboard`)

- **Analyst**: Summary cards (total hotels, avg rate, avg occupancy, recommendations count); grid of hotel cards (name, today rate, occ, recommended rate, room count, competitor count); click card → `/hotels/[id]`.
- **Client**: Redirect to `/hotels/[assignedHotelId]`.

### 6.4 Hotel dashboard (`/hotels/[id]`)

- **Access**: Analyst (any hotel); Client (only if `HotelAccess` for that hotel).
- **Header**: Hotel name, room count; link to Settings (analyst only).
- **Summary cards**: Today’s Rate, Recommended Rate, Occupancy, LY Occupancy, Comp Avg, Est. ADR, Est. Revenue; optional Alerts (Event/Promo) and Discount warning.
- **View toggle**: Rate Matrix | Calendar.
- **Controls**: Date range (Next 7 / 14 / 30 days), Export CSV (analyst).
- **Rate Matrix**: Table (columns = dates; rows = Our hotel, AI Recommended, Comp average, then competitors with weight); chart below (our rate, comp avg, recommended, occupancy; event markers; tooltips). Click cell → Day Detail modal.
- **Calendar**: Month grid (prev/next); tiles show day, our rate, recommended, occupancy, event/promo dots; color vs comp (green/red/blue). Click tile → Day Detail modal.

### 6.5 Day Detail modal

- **Trigger**: Click a date in Rate Matrix or Calendar.
- **Left/top**: Room pricing (current rate, override badge if any; AI recommended + confidence); Price override form (analyst only); Competitor set table (weight, name, price, diff %; footer = comp avg).
- **Right**: Occupancy block (OTB rooms, occ %, forecast placeholder, LY occ, OTB LY, pace %); Edit occupancy (analyst only); Operational forecast placeholders (arrivals/departures); ADR & Revenue (est. ADR, revenue, STLY ADR, STLY revenue); Events & Promotions list; Add Event (analyst only); Discount warning banner when applicable.
- **Read-only for client**: No override, no Add Event, no occupancy edit.

### 6.6 Occupancy page (`/occupancy`) — Analyst only

- Hotel selector; table (next 30 days × Date, Occ %, Rooms OTB, Occ LY %, OTB LY Rooms); Save All; Export CSV.
- Data source/target: `OccupancyEntry` (unique per hotel + date).

### 6.7 Pace page (`/pace`)

- Hotel selector (analyst: all; client: assigned only).
- Summary cards: Our ADR, Comp Avg ADR, ADR Index (our/comp*100) with Above/Below market badge.
- Chart: OTB rooms vs OTB LY rooms (next 30 days); tooltip with pace %.
- Table: Date, OTB Rooms, OTB LY, Pace %.

### 6.8 Promotions page (`/promotions`) — Analyst only

- List of promotions (title, hotel, date range, description, Active/Inactive); Delete per row.
- Add Promotion: dialog (Hotel, Title, Description, Start date, End date, Terms) → create.

### 6.9 Hotels list (`/hotels`) — Analyst only

- Cards: hotel name, PMS name or address, status, room count, competitor count, listing count; click → `/hotels/[id]`; **Add Hotel** → `/hotels/new`.

### 6.10 Create hotel (`/hotels/new`) — Analyst only

- Form: name, pmsName, phone, email, address, roomCount, timezone, occTarget, minRate, maxRate, expediaUrl (required), bookingUrl (optional). Submit → create Hotel + HotelListing(s) → redirect to `/hotels/[id]/settings`.

### 6.11 Hotel settings (`/hotels/[id]/settings`) — Analyst only

- **General**: Edit name, pmsName, phone, email, address, roomCount, timezone, minRate, maxRate, occTarget; Save.
- **Competitors**: Table (name, weight, Expedia URL); add (name, Expedia URL, weight); update weight; remove.
- **Rate plans**: Table (code, name, discount %); add (code, name, discount %).

### 6.12 Scrape Admin (`/admin/scrapes`) — Analyst only

- **Run Scrape Now**: POST /api/scrape → enqueue job (worker must be running to process).
- **Runs table**: Run ID, Started at, Duration, Status, Mode, Rates stored, Error count; Refresh button.
- Errors are stored in `ScrapeError` per run (detail view can be added later).

---

## 7. Data model and entities

### 7.1 Core entities

- **User** — id, email, passwordHash, role (ANALYST | CLIENT), name, timestamps. One user can have many HotelAccess (for clients).
- **Hotel** — id, name, pmsName, phone, email, address, timezone, roomCount, status (ACTIVE | INACTIVE), minRate, maxRate, occTarget, timestamps. Has many: HotelAccess, HotelListing, HotelCompetitor, DailyRate (ours), OccupancyEntry, Promotion, Event, PriceOverride, Recommendation, RatePlan, DiscountMix, ReviewSnapshot (ours).
- **HotelAccess** — userId, hotelId (unique together). Links a CLIENT user to one hotel.
- **Competitor** — id, name. Has CompetitorListing, HotelCompetitor, DailyRate (comp), ReviewSnapshot (comp).
- **HotelListing** — hotelId, ota (EXPEDIA | BOOKING), url, active. One per hotel per OTA.
- **CompetitorListing** — competitorId, ota, url, active.
- **HotelCompetitor** — hotelId, competitorId, weight (0–1), active. Unique (hotelId, competitorId). Weight used for comp average and recommendations.
- **DailyRate** — listingType (HOTEL | COMPETITOR), hotelId or competitorId, ota, date, priceCents, currency, scrapedAt, sourceRunId. Indexed (date, hotelId) and (date, competitorId).
- **ReviewSnapshot** — listingType, hotelId or competitorId, ota, ratingValue, ratingScale, scrapedAt, sourceRunId.
- **OccupancyEntry** — hotelId, date (unique together), occPercent, roomsOnBooks, occLyPercent, otbLyRooms, timestamps.
- **Promotion** — hotelId, title, description, startDate, endDate, terms, createdAt.
- **Event** — hotelId, date, title, notes. Indexed (hotelId, date).
- **PriceOverride** — hotelId, date (unique), overridePriceCents, reason, createdByUserId, createdAt.
- **Recommendation** — hotelId, date (unique), recommendedPriceCents, confidence, rationaleJson, createdAt.
- **RatePlan** — hotelId, code, name, discountPercent, active. Unique (hotelId, code).
- **DiscountMix** — hotelId, date, planId, sharePercent. Unique (hotelId, date, planId). Sum of sharePercent for a hotel/date should be 100 for full mix.
- **ScrapeRun** — startedAt, finishedAt, status (PENDING | RUNNING | COMPLETED | FAILED), mode (MOCK | REAL), summaryJson. Has many DailyRate, ReviewSnapshot, ScrapeError.
- **ScrapeError** — runId, contextJson, message, createdAt.

### 7.2 How “our rate” is resolved

For a given hotel and date:

- If a **PriceOverride** exists → use **overridePriceCents** as “our rate.”
- Else use the latest **DailyRate** for that hotel (listingType HOTEL, that date), e.g. from the most recent scrape.

Same “our rate” is used in matrix, calendar, summary cards, day detail, and as input to the recommendation engine (when recomputing).

### 7.3 How recommendations are produced

- **Inputs**: our rate (or override), competitor rates (from DailyRate) with weights (HotelCompetitor), occupancy (OccupancyEntry), events (Event), min/max (Hotel), optional discount warning.
- **Algorithm**: comp_anchor = weighted average of competitor rates; demand adjustments (occupancy vs occTarget, pace vs LY, event present); price = comp_anchor * (1 + adjustments); clamp to [minRate, maxRate]; round; confidence and rationale from data quality and signals.
- **Storage**: Recommendation (hotelId, date) upserted by worker or on-demand recompute.
- **Display**: Matrix row “AI Recommended,” Calendar tile “Rec,” Day Detail “AI Recommended,” Summary card “Recommended Rate.”

---

## 8. Business rules and calculations

### 8.1 Comp average

- For a date: among competitors linked to the hotel (HotelCompetitor, active), take each competitor’s DailyRate for that date; **weighted average** = sum(rate × weight) / sum(weight) over those with a rate. Displayed in matrix, chart, day detail, and used in recommendation.

### 8.2 Occupancy and OTB

- **occPercent** and **roomsOnBooks** can both be stored; if only one is entered, the other can be derived (occ = roomsOnBooks/roomCount * 100 or roomsOnBooks = occPercent/100 * roomCount) where the app supports it.
- **Pace %** = (OTB − OTB_LY) / max(OTB_LY, 1) × 100. Positive = ahead of last year.

### 8.3 ADR and revenue

- **Est. ADR**: For POC, typically our rate (or ADR from discount mix when rate plans + DiscountMix exist for that date).
- **Revenue** = ADR × occupied rooms (occupied rooms from occPercent × roomCount or roomsOnBooks).
- **STLY** (same time last year): From OccupancyEntry or stored LY fields; STLY ADR and STLY revenue shown in Day Detail when available.

### 8.4 STR-like index

- **ADR Index** = (Our ADR / Comp avg ADR) × 100. Comp avg ADR from competitor DailyRates (e.g. average of their rates for the period or day). &gt;100 = above market; &lt;100 = below.

### 8.5 Discount control

- **Rate plans**: e.g. BAR (0% discount), AAA (10%), Senior (15%). Each plan has discountPercent.
- **Discount mix**: Per hotel per date, share % per plan (sum = 100). **ADR** = Σ (plan_rate × sharePercent/100), where plan_rate = BAR_rate × (1 − discountPercent/100).
- **Warning**: If ADR is more than N% below BAR (default 12%) or total discount share above threshold (default 35%), show discount warning in Day Detail and optionally on dashboard. Thresholds from env (DISCOUNT_ADR_THRESHOLD, DISCOUNT_SHARE_THRESHOLD).

### 8.6 Events and promotions

- **Event**: Single date; shown on matrix/calendar (marker) and in Day Detail; can drive recommendation (e.g. +5%).
- **Promotion**: Start/end date range; any date in range shows the promo in Day Detail and can show “Promo” badge; used for display and future logic.

---

## 9. Glossary

- **ADR** — Average daily rate (revenue per occupied room).
- **BAR** — Best available rate (often the base rate plan with 0% discount).
- **Comp / competitor** — A competing property whose rates we track; linked to our hotel via HotelCompetitor with a weight.
- **Discount mix** — Share of bookings per rate plan for a given date (e.g. 60% BAR, 25% AAA, 15% Senior); used to compute ADR.
- **LY** — Last year (same calendar date or comparable period).
- **OTA** — Online travel agency (e.g. Expedia, Booking.com). We store listing URLs and scrape or mock rates.
- **OTB** — On the books; rooms or revenue committed for a future date.
- **Pace** — Comparison vs last year (e.g. OTB vs OTB_LY); pace % = (OTB − OTB_LY) / max(OTB_LY,1) × 100.
- **Price override** — Analyst-set rate for a hotel/date that overrides the scraped “our rate” everywhere.
- **Rate plan** — Named rate type (BAR, AAA, Senior, etc.) with an optional discount % off BAR.
- **Recommendation** — AI-suggested price for a hotel/date from competitor anchor, occupancy, pace, events, and guardrails.
- **Scrape run** — One execution of the scraping pipeline (mock or real) producing DailyRate and ReviewSnapshot and optionally ScrapeErrors.
- **STLY** — Same time last year (comparison metrics).
- **STR-like** — Similar to STR (Smith Travel Research) reporting; here, ADR index vs comp set (our ADR / comp avg ADR × 100).
- **Weight** — Importance of a competitor in the comp set (0–1); displayed as Low/Medium/High and used in weighted average and recommendations.

---

This document describes **Trotsky** as implemented: authentication (login, session, logout), user roles (Analyst vs Client), every route and who can access it, step-by-step user flows for analysts and clients, and a full feature and data reference. User provisioning is via seed or future admin (no self-service signup). For dashboard-level detail of each screen component, see **DASHBOARD-GUIDE.md**.
