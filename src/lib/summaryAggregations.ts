import type { DailySummaryRow } from '../types'
import { addDays, mondayOfWeek, firstOfMonth, firstOfYear, sameDayPrevMonth } from './dateLogic'

function inRange(row: DailySummaryRow, start: string, end: string): boolean {
  return row.sale_date >= start && row.sale_date <= end
}

export function sumSummary(rows: DailySummaryRow[]): { sales: number; units: number; orders: number } {
  return rows.reduce(
    (acc, r) => ({
      sales: acc.sales + Number(r.total_sales),
      units: acc.units + Number(r.total_units),
      orders: acc.orders + Number(r.total_orders),
    }),
    { sales: 0, units: 0, orders: 0 }
  )
}

export function filterSummary(
  rows: DailySummaryRow[],
  start: string,
  end: string,
  opts?: { brand?: string; channel?: string }
): DailySummaryRow[] {
  return rows.filter((r) => {
    if (!inRange(r, start, end)) return false
    if (opts?.brand && opts.brand !== 'All' && r.brand !== opts.brand) return false
    if (opts?.channel && opts.channel !== 'All' && r.channel !== opts.channel) return false
    return true
  })
}

/** Yesterday's totals from the summary table. */
export function yesterdayFromSummary(rows: DailySummaryRow[], asOfDate: string) {
  const yesterday = addDays(asOfDate, -1)
  return sumSummary(filterSummary(rows, yesterday, yesterday))
}

/** This Week (Mon -> yesterday) vs Last Week (same days), from the summary table. */
export function weekOverWeekFromSummary(rows: DailySummaryRow[], asOfDate: string) {
  const yesterday = addDays(asOfDate, -1)
  const thisMonday = mondayOfWeek(asOfDate)
  const currentEnd = yesterday >= thisMonday ? yesterday : asOfDate
  const daysElapsed = Math.round(
    (new Date(currentEnd).getTime() - new Date(thisMonday).getTime()) / (1000 * 60 * 60 * 24)
  )
  const lastMonday = addDays(thisMonday, -7)
  const lastWeekEnd = addDays(lastMonday, daysElapsed)

  const current = sumSummary(filterSummary(rows, thisMonday, currentEnd))
  const prior = sumSummary(filterSummary(rows, lastMonday, lastWeekEnd))
  return { current, prior, currentWindow: { start: thisMonday, end: currentEnd }, priorWindow: { start: lastMonday, end: lastWeekEnd } }
}

/** This Month (1st -> yesterday) vs Last Month (same day-range), from the summary table. */
export function monthOverMonthFromSummary(rows: DailySummaryRow[], asOfDate: string) {
  const yesterday = addDays(asOfDate, -1)
  const thisFirst = firstOfMonth(asOfDate)
  const currentEnd = yesterday >= thisFirst ? yesterday : asOfDate
  const priorSamePoint = sameDayPrevMonth(currentEnd)
  const priorFirst = firstOfMonth(priorSamePoint)

  const current = sumSummary(filterSummary(rows, thisFirst, currentEnd))
  const prior = sumSummary(filterSummary(rows, priorFirst, priorSamePoint))
  return { current, prior, currentWindow: { start: thisFirst, end: currentEnd }, priorWindow: { start: priorFirst, end: priorSamePoint } }
}

/** Year to date (1 Jan -> yesterday), from the summary table. */
export function ytdFromSummary(rows: DailySummaryRow[], asOfDate: string) {
  const yesterday = addDays(asOfDate, -1)
  const start = firstOfYear(asOfDate)
  return sumSummary(filterSummary(rows, start, yesterday))
}

/** Weighted run rate (7d/15d/30d units-per-day), from the summary table, ending yesterday. */
export function weightedRunRateFromSummary(rows: DailySummaryRow[], asOfDate: string): number {
  const yesterday = addDays(asOfDate, -1)
  function unitsPerDay(days: number): number {
    const since = addDays(yesterday, -(days - 1))
    const total = sumSummary(filterSummary(rows, since, yesterday)).units
    return total / days
  }
  const rr7 = unitsPerDay(7)
  const rr15 = unitsPerDay(15)
  const rr30 = unitsPerDay(30)
  return rr30 * 0.17 + rr15 * 0.33 + rr7 * 0.5
}

/** Group summary rows by brand within a window. */
export function groupByBrandFromSummary(rows: DailySummaryRow[], start: string, end: string) {
  const filtered = filterSummary(rows, start, end)
  const map = new Map<string, { key: string; sales: number; units: number }>()
  for (const r of filtered) {
    const existing = map.get(r.brand)
    if (existing) {
      existing.sales += Number(r.total_sales)
      existing.units += Number(r.total_units)
    } else {
      map.set(r.brand, { key: r.brand, sales: Number(r.total_sales), units: Number(r.total_units) })
    }
  }
  return Array.from(map.values()).sort((a, b) => b.sales - a.sales)
}

/** Group summary rows by date (summed across brand/channel) within a window — for trend/sparkline charts. */
export function groupByDateFromSummary(rows: DailySummaryRow[], start: string, end: string) {
  const filtered = filterSummary(rows, start, end)
  const map = new Map<string, { date: string; sales: number; units: number; orders: number }>()
  for (const r of filtered) {
    const existing = map.get(r.sale_date)
    if (existing) {
      existing.sales += Number(r.total_sales)
      existing.units += Number(r.total_units)
      existing.orders += Number(r.total_orders)
    } else {
      map.set(r.sale_date, { date: r.sale_date, sales: Number(r.total_sales), units: Number(r.total_units), orders: Number(r.total_orders) })
    }
  }
  return Array.from(map.values()).sort((a, b) => (a.date < b.date ? -1 : 1))
}

export function groupByChannelFromSummary(rows: DailySummaryRow[], start: string, end: string) {
  const filtered = filterSummary(rows, start, end)
  const map = new Map<string, { key: string; sales: number; units: number }>()
  for (const r of filtered) {
    const existing = map.get(r.channel)
    if (existing) {
      existing.sales += Number(r.total_sales)
      existing.units += Number(r.total_units)
    } else {
      map.set(r.channel, { key: r.channel, sales: Number(r.total_sales), units: Number(r.total_units) })
    }
  }
  return Array.from(map.values()).sort((a, b) => b.sales - a.sales)
}
