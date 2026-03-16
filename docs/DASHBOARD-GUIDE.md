# Dashboard Guide — Trotsky

This document explains every part of the Trotsky UI and how the pieces fit together.

---

## 1. Login & roles

**Login page (`/login`)**  
- Email + password. Demo users: **analyst@example.com** and **client@example.com** (password: **Password123!**).
- Session: short-lived access token + refresh token (stored in httpOnly cookies). Idle timeout is effectively ~30 min via token expiry.
- Login is rate-limited (5 attempts per 15 minutes per IP).

**Two roles**  
- **ANALYST** — Full access: all hotels, create/edit hotels, competitors, occupancy, promotions, scrape admin, price overrides, events.
- **CLIENT** — Read-only access to **one assigned hotel** only. No edit buttons, no Hotels/Promotions/Occupancy/Admin in the sidebar.

---

## 2. App shell (after login)

**Sidebar (left)**  
- **Dashboard** — Multi-hotel overview (analyst) or redirect to your hotel (client).
- **Hotels** — List of all hotels (analyst only).
- **Occupancy** — Bulk occupancy entry (analyst only).
- **Pace / OTB** — Pace vs last year and STR-like index (both roles, scoped to allowed hotels).
- **Promotions** — CRUD for promotions (analyst only).
- **Scrape Admin** — Run scrape now, view runs/errors (analyst only).
- **Sign Out** at the bottom.

**Top bar**  
- **Hotel selector** — Dropdown to pick the “current” hotel. Analysts see all active hotels; clients see only their assigned one. Used for context when you open a hotel or go to Pace.
- **User badge** — Role (ANALYST / CLIENT) and email.

---

## 3. Dashboard (`/dashboard`)

**Analyst view**  
- **Summary cards** (top): Total hotels, average “today” rate across hotels, average occupancy today, count of recommendations today.
- **Hotel cards** (grid): One card per active hotel with:
  - Hotel name, “Active” badge.
  - Today’s **rate**, **occupancy %**, and **recommended rate** (AI).
  - Room count and competitor count.
- Clicking a card goes to that hotel’s **Hotel dashboard** (`/hotels/[id]`).

**Client view**  
- Redirects straight to the **Hotel dashboard** of their single assigned hotel (no multi-hotel list).

---

## 4. Hotel dashboard (`/hotels/[id]`)

This is the main “revenue” view for one property. It has: summary cards, two view modes (Rate Matrix and Calendar), and the Day Detail modal.

### 4.1 Summary cards (top of hotel dashboard)

One row of cards for **today** (start of the selected date range):

| Card | Meaning |
|------|--------|
| **Today’s Rate** | Our hotel’s rate for today (from scraped data or **price override** if set). “Override” badge if an override exists. |
| **Recommended Rate** | AI-suggested rate for today; subtext can show confidence %. |
| **Occupancy** | Today’s occupancy % (manual or derived); subtext can show “X rooms” (occ% × room count). |
| **LY Occupancy** | Last-year occupancy % for the same date. |
| **Comp Avg** | Weighted average of competitor rates for today. |
| **Est. ADR** | For today, approximated from our rate (or discount mix when used). |
| **Est. Revenue** | (Our rate × occupied rooms) for today. |
| **Alerts** (if any) | “Event” / “Promo” badges when today has an event or falls inside a promotion. |

**Discount warning**  
- If the system detects ADR too far below BAR or discount share above threshold, a **Discount warning** card/badge can appear (also reflected in the Day Detail modal).

### 4.2 View toggle: Rate Matrix vs Calendar

- **Rate Matrix** — Predictive Minds–style grid + chart.
- **Calendar** — ChoiceMAX-style month grid; click a day → Day Detail modal.

**Controls (above the view)**  
- **Date range** — “Next 7 / 14 / 30 days” (drives which dates load and show).
- **Export CSV** — Downloads the rate matrix (dates × our hotel + competitors + recommended, etc.) for the current range.

---

## 5. Rate Matrix view (Predictive Minds style)

**Purpose**  
Compare our rate and competitors day-by-day and see the AI recommendation and occupancy in one place.

**Grid (table)**  
- **Columns** — One per date in the selected range (e.g. 14 days). Header shows weekday + date; weekend columns can be subtly highlighted; event days can have a small marker.
- **Rows (in order):**
  1. **Our Hotel** — Pinned row; each cell = our price for that date (or “—” if missing). “override” note if there’s a price override.
  2. **AI Recommended** — Recommended rate per date; optional confidence %.
  3. **Comp Average** — Weighted average of competitor rates per date.
  4. **Competitors** — One row per competitor, sorted by weight (e.g. High → Low). Each cell = that competitor’s price; optional +/- % vs our rate.

**Weights**  
- Competitors are labeled **Low / Medium / High** (stored as a number 0–1, e.g. 0.25, 0.5, 0.85). Used in comp average and in the recommendation logic.

**Interactions**  
- **Click any date cell** → Opens the **Day Detail modal** for that date.
- **Export CSV** → Same data (dates × our rate, recommended, comp avg, occupancy, competitors) as a file.

**Chart (below the grid)**  
- **X-axis** — Same dates as the grid.
- **Left Y-axis ($):**  
  - **Our rate** (line).  
  - **Comp average** (line).  
  - **Recommended rate** (dashed line).  
- **Right Y-axis (%):**  
  - **Occupancy** (e.g. bars or line).  
- **Event markers** — Dots or markers on dates that have an event.
- **Tooltip** — Hover a date to see: date, our rate, comp avg, recommended, occupancy, and “event” if applicable.

---

## 6. Calendar view (ChoiceMAX style)

**Purpose**  
Month-at-a-glance with rate and occupancy; drill into any day for full detail.

**Layout**  
- **Month navigation** — Previous / Next month.
- **Grid** — 7 columns (Sun–Sat); each cell = one day.
- **Per tile:**  
  - Day number.  
  - Small event/promo indicators if that day has an event or is inside a promotion.  
  - **Our rate**, **Recommended rate**, **Occupancy %** (when data exists).  
- **Color cues** (e.g. left border):  
  - Green: our rate roughly in line with comp avg.  
  - Red: our rate notably above comp avg.  
  - Blue: our rate notably below comp avg.  

**Interaction**  
- **Click a day tile** → Opens the **Day Detail modal** for that date.

---

## 7. Day Detail modal (ChoiceMAX-inspired)

**Purpose**  
Single-day deep dive: pricing, competitors, occupancy, OTB, ADR/revenue, events/promotions, and (for analysts) edits.

**Opened by**  
- Clicking a date in the Rate Matrix or a day in the Calendar.

**Left / top**  
- **Room pricing**  
  - **Current rate** — Our price for that day (override or scraped).  
  - **AI Recommended** — With optional confidence.  
  - **Price override** (analyst only) — Input $ and optional reason; “Set” saves. Override is used everywhere (matrix, calendar, recs) for that date.
- **Competitor set table**  
  - Columns: Weight (Low/Medium/High), Competitor name, Rate for that date, **Diff %** vs our rate.  
  - Footer: **Average comp price** for that date.

**Right**  
- **Occupancy & forecast**  
  - **OTB (on the books)** — Rooms on the books; occupancy % (and “X rooms” from % × room count).  
  - **Forecast** — Placeholder for future forecast.  
  - **LY (last year)** — OTB LY rooms, occupancy LY %.  
  - **Pace %** — (OTB − OTB_LY) / max(OTB_LY, 1) × 100; shows if we’re ahead or behind last year.  
  - **Edit occupancy** (analyst only) — Occ % and OTB rooms for that date; “Save” updates.
- **Operational forecast**  
  - **Arrivals / Departures** — Placeholder fields for future use.
- **ADR & Revenue**  
  - **Est. ADR** — From our rate (or discount mix when configured).  
  - **Est. Revenue** — ADR × occupied rooms.  
  - **STLY** — Same day last year ADR and revenue (from LY data).
- **Events & promotions**  
  - List of **events** on that date (title, notes).  
  - List of **promotions** that cover that date (title, description).  
  - **Add Event** (analyst only) — Title + notes, then save.  
  - **Add Promotion** links to the Promotions page; promotions are date-range based, so they appear here when the date falls inside the promo window.

**Discount warning**  
- If ADR is too far below BAR or discount share is above the configured threshold, a **warning banner** appears in the modal (and can also appear on the dashboard).

**Read-only for clients**  
- Clients see all the same data but no override, no “Add Event,” no occupancy edit.

---

## 8. Occupancy page (`/occupancy`) — Analyst only

**Purpose**  
Bulk enter or edit occupancy and last-year data for the next 30 days.

**Layout**  
- **Hotel selector** — Pick the hotel.
- **Table** — One row per date (next 30 days). Columns:
  - **Date** (with weekday).
  - **Occ %** — Occupancy percentage.
  - **Rooms OTB** — Rooms on the books.
  - **Occ LY %** — Last-year occupancy %.
  - **OTB LY Rooms** — Last-year rooms on the books.
- **Save All** — Persists all edited rows.
- **Export CSV** — Downloads occupancy/OTB data for the selected hotel.

Weekend rows can be lightly styled. Data from here feeds the dashboard summary, pace chart, and recommendation engine.

---

## 9. Pace / OTB page (`/pace`)

**Purpose**  
See booking pace vs last year and a simple STR-like performance index.

**Hotel selector**  
- Analyst: any active hotel. Client: only their hotel.

**Summary cards**  
- **Our ADR** — Approximated from our rate (e.g. today or average in range).  
- **Comp Avg ADR** — From competitor rates.  
- **ADR Index** — (Our ADR / Comp avg ADR) × 100. Above 100 = we’re above market; below 100 = below. Badge “Above market” / “Below market” for quick read.

**Chart**  
- **OTB rooms** vs **OTB LY rooms** for the next 30 days (bars).  
- **Tooltip** — Date, OTB, OTB LY, **Pace %** = (OTB − OTB_LY) / max(OTB_LY, 1) × 100.

**Table**  
- Same dates: OTB rooms, OTB LY, Pace % (positive = ahead of last year, negative = behind).

Data comes from the same occupancy/OTB entries you edit on the Occupancy page.

---

## 10. Promotions page (`/promotions`) — Analyst only

**Purpose**  
Create and manage promotions (date-range offers) per hotel.

**List**  
- Each row: promotion **title**, **hotel name**, **start – end date**, **description**, Active/Inactive badge (based on whether today is inside the range).  
- **Delete** (trash) per row.

**Add Promotion**  
- Dialog: Hotel, Title, Description, Start date, End date, Terms.  
- Saves and shows in the list; promotions that cover a given date appear in the Day Detail modal and can be used in logic (e.g. recommendation or alerts).

---

## 11. Hotels list & settings (Analyst only)

**Hotels list (`/hotels`)**  
- Cards: hotel name, PMS name or address, status (Active/Inactive), room count, competitor count, listing count.  
- **Add Hotel** → Create form.  
- Click a card → Hotel dashboard.

**Create hotel (`/hotels/new`)**  
- Fields: name, PMS name, phone, email, address, room count, timezone, occupancy target, min/max rate, **Expedia URL** (required), Booking URL (optional).  
- Creates the hotel and can create the Expedia listing; then you can add competitors and rate plans in settings.

**Hotel settings (`/hotels/[id]/settings`)**  
- **General** — Edit name, contact, address, room count, timezone, min/max rate, occ target.  
- **Competitors** — Table of competitors with weight (Low/Medium/High), Expedia URL; add new (name, Expedia URL, weight), remove, or change weight.  
- **Rate plans** — Table of plans (code, name, discount %); add (e.g. BAR, AAA, Senior, Mobile). Used for discount mix and ADR warnings.

---

## 12. Scrape Admin (`/admin/scrapes`) — Analyst only

**Purpose**  
Trigger a scrape run and see history.

**Run Scrape Now**  
- Queues a job (BullMQ). Requires the **worker** to be running to process it.  
- In **mock** mode the worker generates deterministic prices (no real scraping).  
- In **real** mode it uses the Expedia Playwright adapter (and Booking stub) and writes rates + errors.

**Runs table**  
- Columns: Run ID, Started at, Duration, Status (e.g. PENDING/RUNNING/COMPLETED/FAILED), Mode (MOCK/REAL), Rates stored, Error count.  
- **Refresh** to reload. Failed runs and per-run errors are stored (ScrapeError); the table shows error counts.

---

## 13. How the data fits together

- **Hotels & competitors** — One hotel has many competitors (with weights) and OTA listings (Expedia required, Booking optional).  
- **Daily rates** — Stored per listing per date (our hotel + each competitor); source = scrape run or mock.  
- **Occupancy** — One row per hotel per date: occ %, rooms OTB, occ LY %, OTB LY. Manual (or later from PMS).  
- **Recommendations** — One row per hotel per date: recommended price, confidence, rationale. Computed by the **recommendation engine** (worker or on-demand) from: our rate (or override), competitor rates, occupancy, pace, events, min/max guardrails.  
- **Price overrides** — One per hotel per date; when set, they replace “our rate” in the UI and in recommendations.  
- **Events** — One per hotel per date (title, notes). Shown on matrix/calendar and in Day Detail.  
- **Promotions** — Date range per hotel; any date inside the range shows the promo in Day Detail and can affect alerts.  
- **Rate plans & discount mix** — Plans (e.g. BAR, AAA) with discount %; per-date mix (share % per plan) lets the system compute ADR and show discount warnings when ADR is too far below BAR or discount share is too high.

---

## 14. What you have now (summary)

You have a single **Trotsky** app where:

- **Analysts** can manage hotels and competitors, enter occupancy and OTB, see rate matrix + calendar, open day-level detail (pricing, competitors, occupancy, ADR/revenue, events/promotions), set overrides and add events, manage promotions and rate plans, run scrapes (mock or real), and export CSV.  
- **Clients** see only their hotel, read-only: same dashboard, matrix, calendar, and day detail, but no edits.  
- **AI recommendations** are computed from competitor rates, occupancy, pace, and events, and shown in the matrix, calendar, and day detail.  
- **Scraping** is adapter-based (mock by default; real Expedia + Booking stub when worker runs with `SCRAPE_MODE=real`).  
- **Discount control** (rate plans + mix + warnings) and **STR-like** pace/ADR index are in place for the POC.

All of this is what the dashboard and the rest of the app represent “right now.”
