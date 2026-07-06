const IST_OFFSET_MIN = 5 * 60 + 30

/** Real current calendar date in IST, independent of what's in the sales data. */
export function todayIST(): string {
  const nowMs = Date.now() + IST_OFFSET_MIN * 60 * 1000
  const d = new Date(nowMs)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function unixToISTDateString(unixSeconds: number | string): string {
  const seconds = typeof unixSeconds === 'string' ? parseInt(unixSeconds, 10) : unixSeconds
  if (!seconds || Number.isNaN(seconds)) return ''
  const istMs = seconds * 1000 + IST_OFFSET_MIN * 60 * 1000
  const d = new Date(istMs)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function unixToISTHour(unixSeconds: number | string): number {
  const seconds = typeof unixSeconds === 'string' ? parseInt(unixSeconds, 10) : unixSeconds
  if (!seconds || Number.isNaN(seconds)) return 0
  const istMs = seconds * 1000 + IST_OFFSET_MIN * 60 * 1000
  return new Date(istMs).getUTCHours()
}

export function parseDateString(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function toDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(dateStr: string, days: number): string {
  const d = parseDateString(dateStr)
  d.setDate(d.getDate() + days)
  return toDateString(d)
}

function mondayIndex(d: Date): number {
  const day = d.getDay()
  return day === 0 ? 6 : day - 1
}

export function mondayOfWeek(dateStr: string): string {
  const d = parseDateString(dateStr)
  const idx = mondayIndex(d)
  d.setDate(d.getDate() - idx)
  return toDateString(d)
}

export function firstOfMonth(dateStr: string): string {
  const d = parseDateString(dateStr)
  return toDateString(new Date(d.getFullYear(), d.getMonth(), 1))
}

export function firstOfYear(dateStr: string): string {
  const d = parseDateString(dateStr)
  return toDateString(new Date(d.getFullYear(), 0, 1))
}

function daysInMonth(year: number, monthIndex0: number): number {
  return new Date(year, monthIndex0 + 1, 0).getDate()
}

export function sameDayPrevMonth(dateStr: string): string {
  const d = parseDateString(dateStr)
  const targetMonth = d.getMonth() - 1
  const year = d.getFullYear() + (targetMonth < 0 ? -1 : 0)
  const month0 = ((targetMonth % 12) + 12) % 12
  const cappedDay = Math.min(d.getDate(), daysInMonth(year, month0))
  return toDateString(new Date(year, month0, cappedDay))
}

export interface PeriodWindow {
  start: string
  end: string
}

export interface ComparisonWindows {
  current: PeriodWindow
  prior: PeriodWindow
}

export function dayOverDayWindows(asOf: string): ComparisonWindows {
  const yesterday = addDays(asOf, -1)
  return {
    current: { start: asOf, end: asOf },
    prior: { start: yesterday, end: yesterday },
  }
}

/**
 * Week-over-Week:
 * Current = Monday of this week → yesterday (excludes today, still syncing)
 * Prior   = Monday last week → same number of days
 */
export function weekOverWeekWindows(asOf: string): ComparisonWindows {
  const yesterday = addDays(asOf, -1)
  const thisMonday = mondayOfWeek(asOf)

  if (yesterday < thisMonday) {
    // asOf is a Monday — nothing from "this week" has happened yet, so show
    // the just-completed full week (last Mon–Sun) as "current" instead of
    // a near-empty single-day window.
    const currentStart = addDays(thisMonday, -7)
    const currentEnd = addDays(thisMonday, -1)
    const priorStart = addDays(currentStart, -7)
    const priorEnd = addDays(currentEnd, -7)
    return {
      current: { start: currentStart, end: currentEnd },
      prior: { start: priorStart, end: priorEnd },
    }
  }

  const currentEnd = yesterday
  const daysElapsed = Math.round(
    (parseDateString(currentEnd).getTime() - parseDateString(thisMonday).getTime()) /
    (1000 * 60 * 60 * 24)
  )
  const lastMonday = addDays(thisMonday, -7)
  const lastWeekEnd = addDays(lastMonday, daysElapsed)
  return {
    current: { start: thisMonday, end: currentEnd },
    prior: { start: lastMonday, end: lastWeekEnd },
  }
 
}
/**
 * Month-to-Month (MTM):
 * Current = 1st of this month → yesterday (excludes today, which may still be syncing)
 * Prior   = 1st of last month → same day-number last month (equal day range)
 */
export function monthOverMonthWindows(asOf: string): ComparisonWindows {
  const yesterday = addDays(asOf, -1)
  const thisFirst = firstOfMonth(asOf)
  const currentEnd = yesterday >= thisFirst ? yesterday : asOf
  const priorSamePoint = sameDayPrevMonth(currentEnd)
  const priorFirst = firstOfMonth(priorSamePoint)
  return {
    current: { start: thisFirst, end: currentEnd },
    prior: { start: priorFirst, end: priorSamePoint },
  }
}

export function yearToDateWindow(asOf: string): PeriodWindow {
  return { start: firstOfYear(asOf), end: asOf }
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '—'
  const d = parseDateString(dateStr)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = parseDateString(dateStr)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function pctChange(current: number, prior: number): number | null {
  if (prior === 0) return current === 0 ? 0 : null
  return ((current - prior) / prior) * 100
}

export function runRateUnitsPerDay(
  sales: { date: string; qty: number }[],
  asOf: string,
  windowDays: 7 | 15 | 30
): number {
  const since = addDays(asOf, -windowDays)
  const windowSales = sales.filter((s) => s.date >= since && s.date <= asOf)
  const totalUnits = windowSales.reduce((acc, s) => acc + s.qty, 0)
  return totalUnits / windowDays
}

export function stockCoverDays(currentStock: number, runRate: number): number {
  if (runRate === 0) return Infinity
  return currentStock / runRate
}

export function estimatedRequirement(runRate: number, futureDays: number): number {
  return runRate * futureDays
}

export function stockGap(currentStock: number, runRate: number, futureDays: number): number {
  return currentStock - estimatedRequirement(runRate, futureDays)
}

export function weightedRunRate(
  sales: { date: string; qty: number }[],
  asOf: string
): number {
  const rr7 = runRateUnitsPerDay(sales, asOf, 7)
  const rr15 = runRateUnitsPerDay(sales, asOf, 15)
  const rr30 = runRateUnitsPerDay(sales, asOf, 30)
  return (rr30 * 0.17) + (rr15 * 0.33) + (rr7 * 0.50)
}

export function runRate(monthToDateSales: number, asOf: string): number {
  const d = parseDateString(asOf)
  const elapsedDays = d.getDate()
  const totalDays = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  if (elapsedDays === 0) return 0
  return (monthToDateSales / elapsedDays) * totalDays
}
