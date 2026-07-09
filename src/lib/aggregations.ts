import type { NormalizedSale, MetricSummary } from '../types'
import type { PeriodWindow, ComparisonWindows } from './dateLogic'
import { pctChange } from './dateLogic'

/** Filter sales to a date window [start, end] inclusive, optionally by channel/brand. */
export function filterSales(
  sales: NormalizedSale[],
  window: PeriodWindow,
  opts?: { channel?: string; brand?: string }
): NormalizedSale[] {
  return sales.filter((s) => {
    if (s.date < window.start || s.date > window.end) return false
    if (opts?.channel && s.channel !== opts.channel) return false
    if (opts?.brand && s.brand !== opts.brand) return false
    return true
  })
}

export function sumSales(sales: NormalizedSale[]): number {
  return sales.reduce((acc, s) => acc + s.invoiceAmount, 0)
}

export function sumUnits(sales: NormalizedSale[]): number {
  return sales.reduce((acc, s) => acc + s.qty, 0)
}

export function countOrders(sales: NormalizedSale[]): number {
  // Distinct order count would need channel_order_id; using row count as a stand-in
  // unless channel_order_id is selected too. For now this proxies "line items".
  return sales.length
}

/** Build a MetricSummary (current/prior/change) for a given comparison window pair. */
export function buildMetricSummary(
  sales: NormalizedSale[],
  windows: ComparisonWindows,
  opts?: { channel?: string; brand?: string }
): MetricSummary {
  const current = sumSales(filterSales(sales, windows.current, opts))
  const prior = sumSales(filterSales(sales, windows.prior, opts))
  return {
    current,
    prior,
    changeAmount: current - prior,
    changePct: pctChange(current, prior),
  }
}

export function latestDateWithData(sales: NormalizedSale[]): string {
  let latest = ''
  for (const s of sales) {
    if (s.date && s.date > latest) latest = s.date
  }
  return latest
}

export interface GroupedTotal {
  key: string
  sales: number
  units: number
}

export function groupBy(
  sales: NormalizedSale[],
  keyFn: (s: NormalizedSale) => string
): GroupedTotal[] {
  const map = new Map<string, GroupedTotal>()
  for (const s of sales) {
    const key = keyFn(s)
    const existing = map.get(key)
    if (existing) {
      existing.sales += s.invoiceAmount
      existing.units += s.qty
    } else {
      map.set(key, { key, sales: s.invoiceAmount, units: s.qty })
    }
  }
  return Array.from(map.values()).sort((a, b) => b.sales - a.sales)
}

export function groupByDate(sales: NormalizedSale[]): GroupedTotal[] {
  return groupBy(sales, (s) => s.date).sort((a, b) => (a.key < b.key ? -1 : 1))
}
/** Group by hour — used for Today/Yesterday intra-day charts.
 *  Falls back gracefully if hour field is missing (old cached data). */
export function groupByHour(sales: NormalizedSale[]): GroupedTotal[] {
  const map = new Map<number, GroupedTotal>()
  for (let h = 0; h < 24; h++) {
    map.set(h, { key: `${String(h).padStart(2, '0')}:00`, sales: 0, units: 0 })
  }
  for (const s of sales) {
    const h = (typeof (s as any).hour === 'number') ? (s as any).hour : 0
    const entry = map.get(h)
    if (entry) {
      entry.sales += s.invoiceAmount
      entry.units += s.qty
    }
  }
  return Array.from(map.values())
}
