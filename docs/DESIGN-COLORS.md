# Trotsky — Design & Color Reference

This doc summarizes the **app** color scheme used in the dashboard and product UI so the landing page and any marketing assets stay consistent.

---

## Dashboard / product UI (light theme)

- **Background:** White (`#ffffff`, `bg-white`), light gray for muted areas (`bg-muted`, `bg-slate-50`).
- **Primary (Our Hotel / main actions):** Blue — `#2563eb`, Tailwind `primary` (hsl 221.2 83.2% 53.3%). Used for "Your Hotel" line, primary buttons, key CTAs.
- **AI Recommended / success:** Emerald — `#16a34a` or `#10b981`, `text-emerald-600`, `bg-emerald-50`. Used for the "Recommended" (AI) line in charts, AI Recommended row in rate matrix, success states.
- **Comp Avg / neutral:** Slate — `#64748b`, `#94a3b8`, `text-slate-500`, `text-slate-600`. Used for "Comp Avg" line and comp average row.
- **Occupancy (chart):** Light gray bars — `#e2e8f0` (overview-graph), or violet `#a78bfa` (matrix-chart), opacity 0.3–0.5.
- **Alerts / events:** Amber — `border-amber-200`, `bg-amber-50`, `text-amber-800` for warnings and event markers.
- **Borders / grid:** `#f1f5f9`, `border-slate-200`, `stroke="#f1f5f9"` for chart grid.

## Competitive Rate Comparison chart (overview-graph.tsx)

| Element        | Color / style                          |
|----------------|----------------------------------------|
| Your Hotel     | `#2563eb`, solid, strokeWidth 2.5, dots |
| Recommended    | `#16a34a`, dashed (6 3), strokeWidth 1.5 |
| Comp Avg       | `#64748b`, dashed (4 4), strokeWidth 1.5 |
| Occupancy bars | `#e2e8f0`, opacity 0.5                 |
| CartesianGrid  | `#f1f5f9`, strokeDasharray 3 3         |

## Landing page (dark theme)

The marketing landing uses a **scoped dark theme** (`.landing-page`) so the rest of the app stays light:

- **Landing accents:** `landing-emerald`, `landing-amber`, `landing-sky`, `landing-violet` (from `globals.css`).
- **Semantic alignment:** Emerald on landing = same “trust / AI / success” as emerald in the app. The **hero chart** uses the **app** palette (white card, blue/emerald/slate lines) so it looks like the real dashboard.

## Iconography

- **App (dashboard):** Lucide (e.g. DollarSign, Target, BarChart3, TrendingUp).
- **Landing:** Lucide only; no react-icons on the landing.

---

When adding new charts or product mockups on the landing, use the exact hex values above so the preview matches the in-app Competitive Rate Comparison and rate matrix.
