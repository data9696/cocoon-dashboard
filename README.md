# Cocoon Care Sales Dashboard

A sales dashboard for **Cocoon Care** and **The Boo Boo Club**, built on top of your
existing OMS Guru → Supabase pipeline.

## Stack

- **React + TypeScript + Vite** — frontend SPA
- **Tailwind CSS v4** — styling, themed with Cocoon Care's soft pastel palette
- **Recharts** — charts
- **Supabase** — your existing database, queried directly from the frontend via the
  `anon` public key (safe to expose, as long as Row Level Security is configured)

No separate backend server is needed: Supabase itself serves as the backend (Postgres +
auto-generated REST API). All calculations (Today/WTD/MTD/YTD, WoW/MoM, run rate, etc.)
happen in the frontend in `src/lib/`, following the rules in
`Sales_Dashboard_Logic_Summary.md`.

## Project structure

```
src/
  lib/
    dateLogic.ts        # Core date-comparison engine (DoD/WoW/MoM/YTD, "as of" override)
    brand.ts             # listing_sku -> brand mapping (CC- / BB- / TBBC-)
    supabaseClient.ts     # Supabase client (reads from .env)
    queries.ts           # Paginated fetch of order_items + stock_snapshots
    aggregations.ts       # Sum/group helpers used by every page
    DataContext.tsx       # Loads all data once, shares it + the "as of" date app-wide
  components/
    Sidebar.tsx
    MetricCard.tsx
    AsOfDatePicker.tsx
    PageLayout.tsx
  pages/
    Home.tsx
    SalesOverview.tsx     # KPI cards, 90-day trend, channel/brand table, top SKUs
    ChannelBrand.tsx       # Channel x brand stacked chart, WoW/MoM by channel, brand ranking
    ProductAnalysis.tsx    # Best/worst sellers, low-stock watch (from stock_snapshots)
```

## Setup

```bash
npm install
cp .env.example .env   # then fill in your Supabase URL + anon key (already done for you)
npm run dev
```

Open http://localhost:5173

Your `.env` is already populated with your project's URL and anon key. **Never commit
`.env`** — it's already in `.gitignore`. The anon key is safe in frontend code only if
Row Level Security (RLS) is enabled on `orders`, `order_items`, `credit_notes`, and
`stock_snapshots` — if you haven't enabled RLS yet, do that before deploying publicly.

## Known data-mapping decisions (confirm these match your intent)

- **Brand** = derived from `order_items.listing_sku` prefix: `CC-` -> Cocoon Care,
  `BB-` or `TBBC-` -> The Boo Boo Club, anything else -> "Other" (excluded from brand
  charts, but still counted in channel/total sales).
- **Dates** = `order_date` is parsed as a Unix timestamp (seconds) and converted to an
  IST calendar date, per your logic doc.
- **Sales amount** = `order_items.invoice_amount`, summed per day/channel/brand/SKU.
- **Monthly target** = currently a placeholder constant (`MONTHLY_TARGET` in
  `SalesOverview.tsx`) — change it to your real number, or tell me and I'll wire it to
  a `targets` table instead.
- **Credit notes / returns** are not yet subtracted from sales anywhere, matching your
  logic doc's "Known Limitations" — flagged as a v2 item.

## Performance note

All `order_items` rows (~90k) and all `stock_snapshots` rows (~40k) are pulled into the
browser once on load and aggregated client-side. This keeps the logic simple and exactly
matches your doc's rules, but as your data grows past a few hundred thousand rows, we
should move the heavy aggregation into Postgres views/RPC functions in Supabase instead
of pulling raw rows. Flag it when load times start to feel slow.

## Deployment (Vercel)

1. Push this project to a GitHub repo.
2. Go to vercel.com -> New Project -> import the repo.
3. In Vercel's project settings -> Environment Variables, add `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` (same values as your local `.env`).
4. Deploy. Vercel auto-redeploys on every push to `main`.

## v2 backlog (not in this build)

- Ads Dashboard (Spend/ROAS/ACOS/CPC/CTR) — needs ad-platform API integration first
- Authentication & role-based access (Admin/Manager/Sales Team)
- Export to PDF/Excel, scheduled email reports
- Alerts (sales drop, low stock, target achieved, run-rate warnings)
- Credit notes folded into net-sales calculations
- Year-over-year comparison (currently undefined per your logic doc)
