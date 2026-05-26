# Design System — Trosky

Color palette, typography, chart colors, and visual guidelines.

---

## Color palette

### Trosky cockpit tokens (`globals.css`)

| Token | Hex | Usage |
|-------|-----|-------|
| `--trosky-red` | `#D5171E` | Primary brand, urgent CTAs, active nav accent |
| `--trosky-red-dark` | `#A80E15` | Hover on primary actions |
| `--trosky-red-soft` | `#F6F1F1` | Soft panels, active nav background (desktop) |
| `--trosky-ink` | `#0E1523` | Headings, primary text in app |
| `--trosky-muted` | `#657681` | Captions, secondary labels |
| `--trosky-border` | `#DAD9DB` | Card and shell borders |

Reusable UI: `apps/web/src/components/trosky/` (`TroskyShell`, `TroskyPageHeader`, `TroskyMetricCard`, etc.).

### Dark mode (authenticated app)

- `.dark` in `globals.css` overrides Trosky cockpit tokens and maps semantic shadcn variables (`background`, `card`, `border`, `muted-foreground`, etc.).
- Prefer **semantic classes** in components: `bg-card`, `border-border`, `text-muted-foreground` — avoid hardcoded `bg-white` on operational surfaces.
- Shared patterns: `apps/web/src/components/trosky/trosky-primitives.ts` (`troskySurfaces`).

### Semantic colors (CSS variables in `globals.css`)

| Token | Usage | HSL / Hex |
|-------|-------|-----|
| `foreground` | Primary body text | maps to `--trosky-ink` |
| `primary` | Our hotel, main CTAs, active states | `#D5171E` / `358 81% 46%` |
| `secondary` | Muted backgrounds, secondary buttons | warm red-tinted neutral |
| `destructive` | Errors, delete actions, dark-mode primary base | `#780000` / `0 100% 23.5%` |
| `muted` | Disabled, placeholder text | warm red-tinted neutral |
| `accent` | Hover states, subtle highlights | warm red-tinted neutral |

### Status colors

| Status | Tailwind classes | Usage |
|--------|-----------------|-------|
| Success / AI | Emerald / teal tokens | Recommended rate, AI indicators |
| Warning | `text-amber-800`, `bg-amber-50` | Discount warnings, event markers |
| Error | `text-destructive`, `bg-destructive/10` | Form errors, failed states |
| Neutral | warm graphite tokens | Comp average, secondary data |

### Calendar color cues (left border)

| Color | Meaning |
|-------|---------|
| Green (`border-l-green-400`) | Our rate roughly in line with comp avg |
| Red (`border-l-red-400`) | Our rate notably above comp avg |
| Violet (`border-l-violet-400`) | Our rate notably below comp avg |

---

## Chart colors

### Competitive Rate Comparison (`overview-graph.tsx`)

| Element | Hex | Style |
|---------|-----|-------|
| Your Hotel | `#A60101` | Solid, strokeWidth 2.75, dots |
| Recommended | teal/emerald (`hsl(164 82% 42%)`) | Solid, strokeWidth 2.35+, dots |
| Comp Avg | warm graphite (`hsl(0 2% 48%)`) | Solid, lower opacity |
| Occupancy bars | violet (`hsl(263 70% 64%)`) | Vertical gradient bars |
| Grid lines | warm neutral token | Horizontal grid only where practical |

### Competitor lines (overview-graph.tsx COLORS array)

```
hsl(0 2% 52%), hsl(263 70% 64%), hsl(24 95% 53%), hsl(173 80% 40%), hsl(348 83% 58%), hsl(258 90% 66%), hsl(190 90% 48%)
```

### Matrix chart (`matrix-chart.tsx`)

| Element | Hex |
|---------|-----|
| Our rate bars / line | `#A60101` |
| Comp avg line | warm graphite |
| Recommended line | teal/emerald |
| Occupancy area | violet gradient |
| Event markers | `#f59e0b` |

### Pace chart (`pace-dashboard.tsx`)

| Element | Hex |
|---------|-----|
| OTB Rooms | `#A60101` |
| OTB LY | `#94a3b8` |

---

## Typography

| Level | Classes | Usage |
|-------|---------|-------|
| Page title | `text-2xl font-semibold` | Page headers |
| Section title | `text-lg font-semibold` | Card titles, section headers |
| Body | `text-sm` | Default content |
| Caption | `text-xs text-muted-foreground` | Subtexts, labels, timestamps |
| Metric value | `text-2xl font-bold` | Summary card values |

**Font:** Inter (Google Fonts), loaded in `layout.tsx`.

---

## Iconography

- **App (dashboard):** Lucide icons only (e.g. DollarSign, Target, BarChart3, TrendingUp, Calendar)
- **Landing page:** Lucide only — no react-icons
- **Icon sizing:** `h-4 w-4` (inline), `h-5 w-5` (buttons), `h-8 w-8` (feature cards)

---

## Spacing

Base unit: 4px (Tailwind default). Common patterns:

| Context | Classes |
|---------|---------|
| Page padding | `p-4 lg:p-6` |
| Card padding | `p-4` or `p-6` |
| Stack gap | `gap-2` (tight), `gap-4` (normal), `gap-6` (sections) |
| Grid gap | `gap-4` (cards), `gap-6` (page sections) |

---

## Component library

Built on [shadcn/ui](https://ui.shadcn.com/) with these components: Button, Card, Input, Label, Badge, Dialog, Select, Tabs, Skeleton, Tooltip, Toast, Separator, DropdownMenu.

Variant utility: `cn()` from `clsx` + `tailwind-merge` (`lib/utils.ts`).

---

## Landing page

The landing page uses a **scoped theme** (`.landing-page` class) with its own accent colors:

| Token | Color | Usage |
|-------|-------|-------|
| `landing-emerald` | Teal/emerald | AI, success, recommendation contrast |
| `landing-amber` | Amber | Alerts, attention |
| `landing-sky` | Deep red | Data accents that should align with brand red |
| `landing-violet` | Violet | Premium, differentiation |

The hero chart uses the **app palette** (Trosky red / teal recommendation / graphite comparison / violet occupancy) so it matches the real dashboard and the new logo.

---

## Dark mode

`darkMode: ["class"]` is configured in `tailwind.config.ts`. Dark mode uses a warm black base with `#780000` as the primary surface/action red and `#A60101` for chart identity.

---

## Guidelines

- Use semantic color tokens (`primary`, `destructive`, etc.) for app UI — not raw hex
- Chart colors are the exception: hex values are needed for Recharts props
- Keep the hero chart colors in sync with the app chart colors
- Landing accents should align semantically with app colors (emerald = AI/success)
- Badge variants: `default` (primary), `secondary` (neutral), `destructive` (error), `outline` (subtle)
