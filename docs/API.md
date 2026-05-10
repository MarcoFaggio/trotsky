# API Reference — Trosky

This documents all API routes and server actions. The app uses two patterns:
- **API routes** (`/api/*`) — standard HTTP endpoints for auth and data
- **Server actions** (`actions/*.ts`) — Next.js server actions called directly from components

---

## API routes

### Authentication

#### `POST /api/auth/login`

Login with email and password.

**Request:**
```json
{ "email": "analyst@example.com", "password": "Password123!" }
```

**Success (200):**
```json
{
  "user": { "id": "uuid", "email": "analyst@example.com", "role": "ANALYST", "name": "Demo Analyst" }
}
```
Sets `access_token` (15 min) and `refresh_token` (7 days) as httpOnly cookies.

**Errors:**
| Status | Body | Cause |
|--------|------|-------|
| 400 | `{ "error": "Invalid credentials format" }` | Email/password failed Zod validation |
| 401 | `{ "error": "Invalid email or password" }` | Wrong email or password |
| 429 | `{ "error": "Too many login attempts..." }` | Rate limit exceeded (5 attempts / 15 min per IP) |
| 500 | `{ "error": "Internal server error" }` | Server error (details logged server-side) |

#### `POST /api/auth/refresh`

Exchange refresh token for new access token. No request body — uses `refresh_token` cookie.

**Success (200):** Sets new `access_token` cookie. Returns `{ "ok": true }`.

**Errors:** 401 if refresh token is invalid or expired.

#### `POST /api/auth/logout`

Clears auth cookies. No request body.

**Success (200):** `{ "ok": true }`

#### `GET /api/auth/me`

Returns current user info from JWT.

**Success (200):**
```json
{ "id": "uuid", "email": "analyst@example.com", "role": "ANALYST" }
```

### Health

#### `GET /api/health`

Check database connectivity. No auth required.

**Response (200 or 503):**
```json
{
  "env": { "DATABASE_URL": true },
  "db": "ok"
}
```

If DB is unreachable, returns 503 with `"db": "error"` and a generic error message (details are logged server-side, not exposed).

### Public inquiries

#### `POST /api/inquiries/public`

Creates an **`Inquiry`** for a hotel from the public **`/inquire`** form (no auth).

**Request (JSON):** Validated by `publicInquirySchema` — includes `hotelId`, guest fields, `message`, optional `source`, honeypot `website` (must be empty).

**Success (200):** `{ "inquiry": { "id": "...", ... } }` — inquiry persisted; heuristic analysis runs unless `INQUIRY_PUBLIC_AI_ANALYSIS=false`.

**Errors:**

| Status | Cause |
|--------|--------|
| 400 | Invalid payload |
| 404 | Hotel missing or inactive |
| 429 | Rate limit (per IP; key `public-inquiry:<ip>`) |
| 500 | Server error |

### Dashboard data

#### `GET /api/v1/dashboard/[hotelId]?range=14`

Fetch overview data for a hotel. Requires valid session.

**Query params:**
- `range` — number of days (1–365, default 14)

**Success (200):** Dashboard data object (rates, occupancy, competitors, recommendations, events, promotions).

**Errors:** 401 (no session), 403 (no access to hotel), 500 (server error).

#### `POST /api/v1/dashboard/[hotelId]/refresh`

Queue a scrape refresh job for a hotel. Analyst only.

**Success (200):**
```json
{ "jobId": "123", "message": "Refresh job queued for hotel" }
```

**Errors:** 401, 403 (not analyst), 404 (hotel not found), 503 (Redis not configured).

---

## Server actions

Server actions are called directly from React components. They enforce auth via RBAC helpers.

### Hotels (`actions/hotels.ts`)

| Action | Auth | Description |
|--------|------|-------------|
| `getHotels()` | Any user | Returns hotels. Analysts: all hotels. Clients: only hotels they have access to. |
| `getHotelById(id)` | Hotel access | Full hotel with listings, competitors, rate plans |
| `createHotel(formData)` | Analyst | Creates hotel + OTA listings. Validates with Zod. |
| `updateHotel(data)` | Analyst | Update hotel fields |
| `addCompetitorToHotel(data)` | Analyst | Find-or-create competitor, link to hotel with weight |
| `updateHotelCompetitor(data)` | Analyst | Update weight or active status |
| `removeHotelCompetitor(hotelId, competitorId)` | Analyst | Delete hotel-competitor link |

### Dashboard (`actions/dashboard.ts`)

| Action | Auth | Description |
|--------|------|-------------|
| `getOverviewData(hotelId, range)` | Hotel access | Full dashboard data for date range |

### Occupancy & pricing (`actions/occupancy.ts`)

| Action | Auth | Description |
|--------|------|-------------|
| `upsertOccupancy(data)` | Analyst | Upsert occupancy for hotel + date |
| `bulkUpsertOccupancy(entries)` | Analyst | Bulk upsert multiple dates |
| `getOccupancyData(hotelId, days)` | Hotel access | Occupancy entries for next N days |
| `setPriceOverride(data)` | Analyst | Set/update price override for date |
| `createEvent(data)` | Analyst | Create single-day event |
| `createPromotion(data)` | Analyst | Create date-range promotion |
| `getPromotions(hotelId?)` | Varies | All promotions (analyst) or hotel-specific (client) |
| `deletePromotion(id)` | Analyst | Delete a promotion |
| `getEventsForDate(hotelId, date)` | Hotel access | Events on a specific date |
| `getPromotionsForDate(hotelId, date)` | Hotel access | Active promotions covering a date |

### Rate plans (`actions/rate-plans.ts`)

| Action | Auth | Description |
|--------|------|-------------|
| `getRatePlans(hotelId)` | Hotel access | List rate plans for hotel |
| `createRatePlan(data)` | Hotel access | Create rate plan (code, name, discount %) |
| `updateRatePlan(data)` | Analyst | Update rate plan fields |
| `getDiscountMix(hotelId, date)` | Hotel access | Discount mix for hotel + date |
| `saveDiscountMix(data)` | Analyst | Replace discount mix for hotel + date |

### Signals (`actions/signals.ts`)

| Action | Auth | Description |
|--------|------|-------------|
| `getImportedSignals(hotelId?, days)` | Analyst | External signal impacts for next N days |
| `getSignalsForDate(hotelId, date)` | Hotel access | Non-suppressed signals for a date |
| `suppressSignalImpact(data)` | Analyst | Suppress a signal with reason |
| `unsuppressSignalImpact(data)` | Analyst | Restore a suppressed signal |

### Events (`actions/events.ts`)

| Action | Auth | Description |
|--------|------|-------------|
| `getEvents(hotelId?)` | Any user | Events filtered by role and hotel access |
| `deleteEvent(id)` | Analyst | Delete an event |
| `updateEvent(data)` | Analyst | Update event title/notes |
| `getUpcomingEventCount()` | Any user | Count of events in next 7 days |

### Messages (`actions/messages.ts`)

| Action | Auth | Description |
|--------|------|-------------|
| `getThreads(hotelId?)` | Any user | Message threads for accessible hotels |
| `createThread(data)` | Any user | Start a new thread |
| `getMessages(threadId)` | Any user | Messages in a thread |
| `sendMessage(data)` | Any user | Send a message in a thread |
| `resolveThread(threadId)` / `reopenThread(threadId)` | Analyst | Change thread status |

### Inquiries (`actions/inquiries.ts`)

| Action | Auth | Description |
|--------|------|-------------|
| `getInquiries(hotelId?)` | Any user | List inquiries; analyst: all hotels (optional filter); client: accessible hotels only |
| `getInquiryDetail(id)` | Inquiry access | Full detail including messages, RFP/proposal, AI analysis shape |
| `createManualInquiry(formData)` | Hotel access | Create inquiry for selected hotel |
| `analyzeInquiry(formData)` | Inquiry access | Re-run heuristic extraction; updates `aiExtractedJson` / confidence |
| `updateInquiryStatus(formData)` | Inquiry access | Status, intent, priority updates |
| `addInquiryMessage(formData)` | Inquiry access | Staff or structured guest message |
| `upsertGroupRfp(formData)` | Inquiry access | Create/update **GroupRfp** shell |
| `createInquiryProposal(formData)` | Inquiry access | Create **InquiryProposal** shell |

---

## Error patterns

All server actions throw errors that are caught by the calling component:

| Error message | Meaning |
|---------------|---------|
| `UNAUTHORIZED` | No valid session — user needs to log in |
| `FORBIDDEN` | User lacks permission for this action/hotel |

API routes return JSON with an `error` field and appropriate HTTP status codes.

---

## Rate limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /api/auth/login` | 5 attempts | 15 minutes per IP |
| `POST /api/inquiries/public` | Configured in `rate-limiter` | Per IP (`public-inquiry:*`) |

Rate limiting is in-memory (resets on deploy).
