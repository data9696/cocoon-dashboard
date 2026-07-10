import { useMemo } from 'react'
import type { NormalizedSale } from '../types'
import { weekOverWeekWindows, parseDateString, formatShortDate, addDays } from '../lib/dateLogic'
import { filterSales } from '../lib/aggregations'

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface Props {
  sales: NormalizedSale[]
  asOfDate: string
  brandFilter?: string
}

export function WoWComparison({ sales, asOfDate, brandFilter = 'All' }: Props) {
  const { currentLabel, priorLabel, currentTotal, priorTotal, diff, pct, yesterdayDayName } = useMemo(() => {
    // Always compare up to yesterday, not today
    const yesterday = addDays(asOfDate, -1)
    const windows =weekOverWeekWindows(asOfDate)

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

    const yesterdayDayName = DAYS[parseDateString(yesterday).getDay()]
    const currentLabel = `${formatShortDate(windows.current.start)} – ${formatShortDate(windows.current.end)}`
    const priorLabel = `${formatShortDate(windows.prior.start)} – ${formatShortDate(windows.prior.end)}`

    return { currentLabel, priorLabel, currentTotal, priorTotal, diff, pct, yesterdayDayName }
  }, [sales, asOfDate, brandFilter])

  const isUp = diff >= 0

  return (
    <div className={`card p-5 border-l-4 ${isUp ? 'border-[#2454a8]' : 'border-[#dc2626]'}`}>
      <div className="text-xs uppercase tracking-wide text-[var(--color-muted)] mb-3">
        WoW <span className="normal-case opacity-60">Mon → {yesterdayDayName}</span>
        {brandFilter !== 'All' && ` · ${brandFilter}`}
      </div>

      <div className={`flex items-center justify-between mb-4 p-3 rounded-xl ${isUp ? 'bg-[#dbeafe]' : 'bg-[#fee2e2]'}`}>
        <div className="text-4xl">{isUp ? '🚀' : '⚠️'}</div>
        <div className="text-right">
          <div className={`text-sm font-medium ${isUp ? 'text-[#1e40af]' : 'text-[#991b1b]'}`}>
            {isUp ? '+' : ''}{pct.toFixed(1)}%
          </div>
          <div className={`text-3xl font-bold ${isUp ? 'text-[#1e40af]' : 'text-[#991b1b]'}`}>
            {isUp ? '+' : ''}{inr(diff)}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2454a8] shrink-0" />
            <span className="text-xs text-[var(--color-muted)]">This week ({currentLabel})</span>
          </div>
          <span className="font-display text-base text-[var(--color-charcoal)]">{inr(currentTotal)}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#94a3b8] shrink-0" />
            <span className="text-xs text-[var(--color-muted)]">Last week ({priorLabel})</span>
          </div>
          <span className="font-display text-base text-[var(--color-muted)]">{inr(priorTotal)}</span>
        </div>
      </div>
    </div>
  )
}