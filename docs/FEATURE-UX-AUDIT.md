# Trosky Feature & UX Audit

Date: 2026-05-19 (updated 2026-05-26 for action-first MVP and demo-mode hardening)

Scope: current Trosky product surface, with emphasis on unique software value, frontend quality, onboarding, accessibility, responsiveness, theming, and technical hardening.

Design context used: premium red-and-graphite revenue intelligence for hotel analysts and hotel stakeholders. Operational screens should feel dense, calm, precise, and trustworthy.

## Unique Product Strengths

Trosky is strongest when it explains why a hotel should care about a date.

| Feature | Why It Is Distinctive | Current Surface |
|---------|------------------------|-----------------|
| Revenue action queue | Prioritized pricing/event/demand work with evidence drawer and analyst workflow — action-first landing. | `/dashboard`, `/actions`, `/rate-calendar` |
| Revenue cockpit | Combines our rate, comp average, recommendation, occupancy, pace, events, promos, and alerts instead of splitting them across tools. | `/hotels/[id]` (matrix/calendar) |
| Rate matrix + calendar | Gives both analyst-grade grid comparison and calendar-style date scanning. | Matrix/Calendar tabs |
| Day detail modal | One-date operating view: price, comp set, occupancy, ADR/revenue, events, promotions, discount warnings, overrides. | Dashboard date click |
| AI-ready inquiry layer | Public demand capture becomes structured lead, intent, missing fields, RFP details, and proposal shell. | `/inquire`, `/inquiries` |
| Role-aware client portal | Clients get scoped read-only intelligence and collaboration without analyst controls. | App shell, client routes |
| External signals | Imported market signals can be matched to hotels and influence recommendations. | Events/signals/recommendation pipeline |
| Worker-backed pricing pipeline | Mock/real scrape adapters, Redis queues, recommendation recompute, scrape admin history. | Worker, `/admin/scrapes` |
| Discount control | Rate plans and discount mix connect tactical pricing to ADR warning logic. | Settings, day detail |
| Messaging | Hotel-scoped threads keep client and analyst collaboration near the pricing context. | `/messages` |

## Audit Health Score

| # | Dimension | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | 2/4 | Several forms use visible labels that are not programmatically associated with controls. |
| 2 | Performance | 3/4 | Build is healthy; chart-heavy routes are acceptable but could use focused route/component optimization. |
| 3 | Responsive Design | 3/4 | Mobile shell is deliberate; dense forms and tables need more mobile-specific refinement. |
| 4 | Theming | 3/4 | Dark mode and semantic tokens improved on Trosky shell; some legacy screens may still hard-code light-only colors. |
| 5 | Anti-Patterns | 3/4 | App screens are mostly operational and distinctive; landing still leans on gradient/glass/card patterns. |
| **Total** | | **14/20** | **Good: strong product foundation, with accessibility and design-system consistency as the main strengthening path.** |

## Anti-Patterns Verdict

Partial pass. The authenticated app feels more like real operational software than a generic AI mockup: dense dashboards, scoped role behavior, real tables, real workflows, and meaningful charts help a lot.

The public/landing surfaces still carry some AI-era tells: gradient bands, glass/backdrop blur, repeated rounded feature cards, and decorative glow language. These do not block the product, but they dilute the premium red-and-graphite point of view.

## Executive Summary

- Audit Health Score: **14/20** (Good)
- Issues found: **P0: 0, P1: 4, P2: 6, P3: 2**
- Top priorities:
  - Associate labels and controls in forms.
  - Add accessible names to icon-only controls.
  - Normalize hard-coded semantic colors into tokens.
  - Improve empty states and onboarding moments.
  - Reduce landing-page glass/gradient/card repetition.

## Detailed Findings By Severity

### [P1] Visible labels are not consistently associated with inputs

- **Location:** `apps/web/src/app/(app)/inquiries/page.tsx` around status/RFP/proposal/manual inquiry forms; `apps/web/src/components/dashboard/promotions-list.tsx` around create promotion form; `apps/web/src/components/hotels/hotel-settings.tsx` around settings forms.
- **Category:** Accessibility
- **Impact:** Screen reader users may hear unlabeled fields or lose context in dense forms.
- **WCAG/Standard:** WCAG 1.3.1 Info and Relationships, 3.3.2 Labels or Instructions.
- **Recommendation:** Add stable `id` values and `htmlFor` to every `Label`; add `aria-describedby` for helper/error text where present.
- **Suggested command:** `/harden`

### [P1] Several icon-only buttons lack accessible names

- **Location:** `apps/web/src/components/hotels/hotel-settings.tsx` icon back/delete buttons; `apps/web/src/components/dashboard/calendar-view.tsx` month navigation; `apps/web/src/components/dashboard/promotions-list.tsx` delete button.
- **Category:** Accessibility
- **Impact:** Keyboard/screen-reader users cannot reliably know what the control does.
- **WCAG/Standard:** WCAG 4.1.2 Name, Role, Value.
- **Recommendation:** Add `aria-label` to icon-only buttons and ensure destructive icon buttons also expose the target item name when possible.
- **Suggested command:** `/harden`

### [P1] Dense client-facing pages need stronger onboarding empty states

- **Location:** `apps/web/src/app/(app)/inquiries/page.tsx` empty inquiry list; `apps/web/src/components/dashboard/promotions-list.tsx` empty promotion state; dashboard no-data states.
- **Category:** Onboarding / UX
- **Impact:** New users learn what is missing, but not what value the screen will eventually provide.
- **Recommendation:** Replace generic empty copy with role-aware empty states: what will appear, why it matters, and the next permitted action.
- **Suggested command:** `/onboard`

### [P1] Some role boundaries are correct technically but need continuous UX enforcement

- **Location:** App shell/profile/routes broadly; recently fixed `/promotions` client behavior.
- **Category:** UX / Access control
- **Impact:** Any future client-visible route that redirects or exposes dead controls will weaken trust.
- **Recommendation:** Keep "if it appears in client nav, it must be useful for clients" as a release gate.
- **Suggested command:** `/audit`

### [P2] Hard-coded semantic colors bypass the token system

- **Location:** `apps/web/src/components/dashboard/rate-matrix.tsx`, `calendar-view.tsx`, `day-detail-modal.tsx`, `pace-dashboard.tsx`, `ui/badge.tsx`, `public-inquiry-form.tsx`.
- **Category:** Theming
- **Impact:** Dark mode and future brand refinements become harder to keep consistent.
- **Recommendation:** Move recurring status colors into semantic tokens or local utility variants.
- **Suggested command:** `/normalize`

### [P2] Landing visual language is more decorative than the app

- **Location:** Landing components use frequent gradients, backdrop blur, large rounded cards, and glow/shadow treatments.
- **Category:** Anti-Pattern
- **Impact:** The first impression can feel more generic than the actual product.
- **Recommendation:** Move landing toward premium operational credibility: fewer decorative containers, more real product surfaces and sharper editorial hierarchy.
- **Suggested command:** `/quieter`

### [P2] Chart-heavy routes should be watched for bundle creep

- **Location:** `/dashboard`, `/hotels/[id]`, `overview-dashboard.tsx`, chart components.
- **Category:** Performance
- **Impact:** The dashboard is the product core; slow first load would directly affect perceived software quality.
- **Recommendation:** Track route bundle size, consider dynamic imports for rarely used modal/detail surfaces, and memoize expensive chart transforms if profiling shows churn.
- **Suggested command:** `/optimize`

### [P2] Some dense forms need mobile-first restructuring

- **Location:** `/inquiries` manual create/RFP/proposal forms; hotel settings.
- **Category:** Responsive
- **Impact:** Mobile users can complete tasks, but the density makes scanning and correction harder.
- **Recommendation:** Group advanced fields behind progressive sections and give primary fields more room on small screens.
- **Suggested command:** `/adapt`

### [P2] Legacy dashboard component appears unused

- **Location:** `apps/web/src/components/dashboard/hotel-dashboard.tsx`.
- **Category:** Performance / Maintainability
- **Impact:** Dead components create confusion and increase the chance of patching the wrong implementation.
- **Recommendation:** Confirm it is unused and remove or archive it after checking route imports.
- **Suggested command:** `/distill`

### [P2] AI wording should stay assistive and precise

- **Location:** Inquiry detail "AI Assist" language and recommendation labels.
- **Category:** UX Writing
- **Impact:** Users may over-trust deterministic/heuristic output if language implies certainty.
- **Recommendation:** Prefer "Assistive analysis," "Suggested status," and "Recommended rate" with confidence where available.
- **Suggested command:** `/clarify`

### [P3] Some hover lift and glass effects are slightly overused

- **Location:** Sidebar nav, landing cards, card utilities.
- **Category:** Anti-Pattern
- **Impact:** Not harmful, but a calmer enterprise posture would age better.
- **Recommendation:** Keep motion for orientation and feedback; reduce decorative lift where it does not aid comprehension.
- **Suggested command:** `/quieter`

### [P3] Final visual consistency pass needed after onboarding additions

- **Location:** New onboarding guide and profile dropdown.
- **Category:** Polish
- **Impact:** The new guide is intentionally compact, but should be reviewed in browser across desktop/mobile after live data loads.
- **Recommendation:** Screenshot desktop and mobile states, then tighten spacing if needed.
- **Suggested command:** `/polish`

## Patterns & Systemic Issues

- **Forms rely on visual labels more than semantic labels.** This is the highest-leverage accessibility improvement.
- **Status color exists in components, not only tokens.** Red/green/amber/violet are semantically useful, but should be centralized.
- **The app is stronger than the landing.** Authenticated screens communicate product depth; marketing pages still have more decorative AI-era surface treatment.
- **Onboarding was missing as a replayable help surface.** The new profile menu onboarding entry addresses this, but empty states should also teach in context.

## Positive Findings

- Role-aware access is taken seriously across server actions and UI.
- The app has genuine product depth: rates, competitors, occupancy, events, promos, signals, recommendations, inquiries, RFPs, proposals, messages.
- Dashboard surfaces are dense and operational rather than brochure-like.
- The design context is clear: red-and-graphite, premium, calm, precise.
- The docs now define production, AI, and UX hardening expectations.
- Build health is good, with only the known BullMQ warning from the scrape API route.

## Recommended Actions

1. **[P1] `/harden`** — Fix labels, icon-only button names, and a11y semantics across inquiry, promotions, hotel settings, and calendar controls.
2. **[P1] `/onboard`** — Extend the new profile-menu onboarding into role-aware empty states and first-run hints.
3. **[P2] `/normalize`** — Consolidate hard-coded status colors into reusable semantic tokens/variants.
4. **[P2] `/adapt`** — Improve mobile layout for dense forms and matrix/calendar workflows.
5. **[P2] `/optimize`** — Profile dashboard/chart routes and isolate heavy or rarely used surfaces.
6. **[P2] `/quieter`** — Reduce decorative landing-page glass/gradient/card repetition.
7. **[P3] `/polish`** — Final screenshot pass across desktop/mobile after the above fixes.

You can ask me to run these one at a time, all at once, or in any order you prefer.

Re-run `/audit` after fixes to see your score improve.
