import type { NormalizedSale, DailySummaryRow, SkuStyleMap } from '../types'
import { addDays } from './dateLogic'
import { filterSummary, sumSummary } from './summaryAggregations'

export interface Warning {
  id: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  detail: string
  changePct: number
}

const DROP_THRESHOLD_PCT = -15
const CRITICAL_THRESHOLD_PCT = -30

function severityFor(pct: number): 'critical' | 'warning' {
  return pct <= CRITICAL_THRESHOLD_PCT ? 'critical' : 'warning'
}

function pctChange(current: number, prior: number): number | null {
  if (prior === 0) return null
  return ((current - prior) / prior) * 100
}

export function generateWarnings(
  dailySummary: DailySummaryRow[],
  sales: NormalizedSale[],
  skuStyleMap: SkuStyleMap[],
  asOfDate: string
): Warning[] {
  const warnings: Warning[] = []
  const yesterday = addDays(asOfDate, -1)

  const last10Start = addDays(yesterday, -9)
  const priorDaysRows = filterSummary(dailySummary, last10Start, addDays(yesterday, -1))
  const priorDaysTotal = sumSummary(priorDaysRows).sales
  const priorDaysAvg = priorDaysTotal / 9
  const yesterdayTotal = sumSummary(filterSummary(dailySummary, yesterday, yesterday)).sales
  const dailyPct = pctChange(yesterdayTotal, priorDaysAvg)
  if (dailyPct !== null && dailyPct <= DROP_THRESHOLD_PCT && priorDaysAvg > 100) {
    warnings.push({
      id: 'daily-overall',
      severity: severityFor(dailyPct),
      title: 'Daily sales down',
      detail: `Yesterday's sales were ${Math.abs(dailyPct).toFixed(0)}% below the last 9-day average.`,
      changePct: dailyPct,
    })
  }

  const brands = Array.from(new Set(dailySummary.map((r) => r.brand)))
  for (const brand of brands) {
    const brandRows = dailySummary.filter((r) => r.brand === brand)
    const priorAvg = sumSummary(filterSummary(brandRows, last10Start, addDays(yesterday, -1))).sales / 9
    const y = sumSummary(filterSummary(brandRows, yesterday, yesterday)).sales
    const pct = pctChange(y, priorAvg)
    if (pct !== null && pct <= DROP_THRESHOLD_PCT && priorAvg > 100) {
      warnings.push({
        id: `brand-${brand}`,
        severity: severityFor(pct),
        title: `${brand} sales down`,
        detail: `${brand} sold ${Math.abs(pct).toFixed(0)}% less yesterday vs its recent daily average.`,
        changePct: pct,
      })
    }
  }

  const channels = Array.from(new Set(dailySummary.map((r) => r.channel)))
  for (const channel of channels) {
    const channelRows = dailySummary.filter((r) => r.channel === channel)
    const priorAvg = sumSummary(filterSummary(channelRows, last10Start, addDays(yesterday, -1))).sales / 9
    const y = sumSummary(filterSummary(channelRows, yesterday, yesterday)).sales
    const pct = pctChange(y, priorAvg)
    if (pct !== null && pct <= DROP_THRESHOLD_PCT && priorAvg > 300) {
      warnings.push({
        id: `channel-${channel}`,
        severity: severityFor(pct),
        title: `${channel} sales down`,
        detail: `${channel} sold ${Math.abs(pct).toFixed(0)}% less yesterday vs its recent daily average.`,
        changePct: pct,
      })
    }
  }

  function weekTotal(rows: DailySummaryRow[], weekStart: string, weekEnd: string) {
    return sumSummary(filterSummary(rows, weekStart, weekEnd)).sales
  }
  const thisWeekEnd = yesterday
  const thisWeekStart = addDays(thisWeekEnd, -6)
  const lastWeekEnd = addDays(thisWeekStart, -1)
  const lastWeekStart = addDays(lastWeekEnd, -6)

  const thisWeekAll = weekTotal(dailySummary, thisWeekStart, thisWeekEnd)
  const lastWeekAll = weekTotal(dailySummary, lastWeekStart, lastWeekEnd)
  const weekPctAll = pctChange(thisWeekAll, lastWeekAll)
  if (weekPctAll !== null && weekPctAll <= DROP_THRESHOLD_PCT && lastWeekAll > 500) {
    warnings.push({
      id: 'week-overall',
      severity: severityFor(weekPctAll),
      title: 'Weekly sales down',
      detail: `This week (last 7 days) is ${Math.abs(weekPctAll).toFixed(0)}% below last week.`,
      changePct: weekPctAll,
    })
  }

  for (const brand of brands) {
    const rows = dailySummary.filter((r) => r.brand === brand)
    const tw = weekTotal(rows, thisWeekStart, thisWeekEnd)
    const lw = weekTotal(rows, lastWeekStart, lastWeekEnd)
    const pct = pctChange(tw, lw)
    if (pct !== null && pct <= DROP_THRESHOLD_PCT && lw > 500) {
      warnings.push({
        id: `week-brand-${brand}`,
        severity: severityFor(pct),
        title: `${brand} — weekly sales down`,
        detail: `${brand}'s last 7 days are ${Math.abs(pct).toFixed(0)}% below the prior 7 days.`,
        changePct: pct,
      })
    }
  }

  for (const channel of channels) {
    const rows = dailySummary.filter((r) => r.channel === channel)
    const tw = weekTotal(rows, thisWeekStart, thisWeekEnd)
    const lw = weekTotal(rows, lastWeekStart, lastWeekEnd)
    const pct = pctChange(tw, lw)
    if (pct !== null && pct <= DROP_THRESHOLD_PCT && lw > 500) {
      warnings.push({
        id: `week-channel-${channel}`,
        severity: severityFor(pct),
        title: `${channel} — weekly sales down`,
        detail: `${channel}'s last 7 days are ${Math.abs(pct).toFixed(0)}% below the prior 7 days.`,
        changePct: pct,
      })
    }
  }

  const skuToCategory = new Map<string, string>()
  for (const m of skuStyleMap) {
    if (m.sku_code) skuToCategory.set(m.sku_code, m.category || 'Uncategorized')
  }

  const period1Start = addDays(yesterday, -9)
  const period1End = yesterday
  const period0Start = addDays(period1Start, -10)
  const period0End = addDays(period1Start, -1)

  const byCategoryPeriod = new Map<string, { revenue: number; units: number }>()
  const byCategoryPrior = new Map<string, { revenue: number; units: number }>()

  for (const s of sales) {
    const cat = skuToCategory.get(s.skuCode) || 'Uncategorized'
    if (s.date >= period1Start && s.date <= period1End) {
      const e = byCategoryPeriod.get(cat) || { revenue: 0, units: 0 }
      e.revenue += s.invoiceAmount
      e.units += s.qty
      byCategoryPeriod.set(cat, e)
    } else if (s.date >= period0Start && s.date <= period0End) {
      const e = byCategoryPrior.get(cat) || { revenue: 0, units: 0 }
      e.revenue += s.invoiceAmount
      e.units += s.qty
      byCategoryPrior.set(cat, e)
    }
  }

  for (const [cat, current] of byCategoryPeriod.entries()) {
    const prior = byCategoryPrior.get(cat)
    if (!prior || prior.revenue < 500) continue

    const salesPct = pctChange(current.revenue, prior.revenue)
    if (salesPct !== null && salesPct <= DROP_THRESHOLD_PCT) {
      warnings.push({
        id: `category-sales-${cat}`,
        severity: severityFor(salesPct),
        title: `${cat} — sales down`,
        detail: `${cat} sales are ${Math.abs(salesPct).toFixed(0)}% lower over the last 10 days vs the 10 days before.`,
        changePct: salesPct,
      })
    }

    const currentASP = current.units > 0 ? current.revenue / current.units : 0
    const priorASP = prior.units > 0 ? prior.revenue / prior.units : 0
    const aspPct = pctChange(currentASP, priorASP)
    if (aspPct !== null && aspPct <= DROP_THRESHOLD_PCT && priorASP > 0) {
      warnings.push({
        id: `category-asp-${cat}`,
        severity: severityFor(aspPct),
        title: `${cat} — avg selling price down`,
        detail: `${cat}'s average selling price dropped ${Math.abs(aspPct).toFixed(0)}% over the last 10 days (₹${Math.round(priorASP)} → ₹${Math.round(currentASP)}).`,
        changePct: aspPct,
      })
    }
  }

  return warnings.sort((a, b) => a.changePct - b.changePct)
}