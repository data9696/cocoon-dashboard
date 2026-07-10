import { useMemo } from 'react'
import type { NormalizedSale } from '../types'
import { monthOverMonthWindows, parseDateString } from '../lib/dateLogic'
import { filterSales } from '../lib/aggregations'

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

interface Props {
  sales: NormalizedSale[]
  asOfDate: string
  brandFilter?: string
}

export function MTMComparison({ sales, asOfDate, brandFilter = 'All' }: Props) {
  const { currentLabel, priorLabel, currentTotal, priorTotal, diff, pct } = useMemo(() => {
    const windows = monthOverMonthWindows(asOfDate)
    let currentSales = filterSales(sales, windows.current)
    let priorSales = filterSales(sales, windows.prior)
    if (brandFilter !== 'All') {
      currentSales = currentSales.filter((s) => s.brand === brandFilter)
      priorSales = priorSales.filter((s) => s.brand === brandFilter)
    }
    const currentTotal = currentSales.reduce((a, s) => a + s.invoiceAmount, 0)
    const priorTotal = priorSales.reduce((a, s) => a + s.invoiceAmount, 0)
    const diff = currentTotal - priorTotal
    const pct = priorTotal > 0 ? (diff / priorTotal) * 100 : 0
    const currentMonthName = parseDateString(windows.current.start).toLocaleDateString('en-GB', { month: 'long' })
    const priorMonthName = parseDateString(windows.prior.start).toLocaleDateString('en-GB', { month: 'long' })
    const day = parseDateString(windows.current.end).getDate()
    return {
      currentLabel: `1–${day} ${currentMonthName}`,
      priorLabel: `1–${day} ${priorMonthName}`,
      currentTotal, priorTotal, diff, pct,
    }
  }, [sales, asOfDate, brandFilter])

  const isUp = diff >= 0

  return (
    <div className={`card p-5 border-l-4 ${isUp ? 'border-[#16a34a]' : 'border-[#dc2626]'}`}>
      <div className="text-xs uppercase tracking-wide text-[var(--color-muted)] mb-3">
        MTM {brandFilter !== 'All' ? `· ${brandFilter}` : ''}
      </div>
      <div className={`flex items-center justify-between mb-4 p-3 rounded-xl ${isUp ? 'bg-[#dcfce7]' : 'bg-[#fee2e2]'}`}>
        <div className="text-4xl">{isUp ? '📈' : '📉'}</div>
        <div className="text-right">
          <div className={`text-sm font-medium ${isUp ? 'text-[#166534]' : 'text-[#991b1b]'}`}>
            {isUp ? '+' : ''}{pct.toFixed(1)}%
          </div>
          <div className={`text-3xl font-bold ${isUp ? 'text-[#166534]' : 'text-[#991b1b]'}`}>
            {isUp ? '+' : ''}{inr(diff)}
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a] shrink-0" />
            <span className="text-xs text-[var(--color-muted)]">{currentLabel}</span>
          </div>
          <span className="font-display text-base text-[var(--color-charcoal)]">{inr(currentTotal)}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#94a3b8] shrink-0" />
            <span className="text-xs text-[var(--color-muted)]">{priorLabel}</span>
          </div>
          <span className="font-display text-base text-[var(--color-muted)]">{inr(priorTotal)}</span>
        </div>
      </div>
    </div>
  )
}