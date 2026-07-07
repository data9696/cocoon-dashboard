import { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { NormalizedSale, SkuStyleMap } from '../types'
import { addDays, formatShortDate } from '../lib/dateLogic'

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

interface Props {
  sales: NormalizedSale[]
  skuStyleMap: SkuStyleMap[]
  asOfDate: string
  trendDays?: number
}

export function AvgSellingPriceCard({ sales, skuStyleMap, asOfDate, trendDays = 14 }: Props) {
  const [channel, setChannel] = useState('All')
  const [category, setCategory] = useState('All')

  const skuToCategory = useMemo(() => {
    const map = new Map<string, string>()
    for (const m of skuStyleMap) {
      if (m.sku_code) map.set(m.sku_code, m.category || 'Uncategorized')
    }
    return map
  }, [skuStyleMap])

  const categoryOf = (skuCode: string) => skuToCategory.get(skuCode) || 'Uncategorized'

  const channels = useMemo(
    () => ['All', ...Array.from(new Set(sales.map((s) => s.channel))).filter(Boolean).sort()],
    [sales]
  )

  const categories = useMemo(() => {
    const cats = new Set<string>()
    for (const m of skuStyleMap) cats.add(m.category || 'Uncategorized')
    cats.add('Uncategorized')
    return ['All', ...Array.from(cats).sort()]
  }, [skuStyleMap])

  const filtered = useMemo(() => {
    return sales.filter((s) => {
      if (channel !== 'All' && s.channel !== channel) return false
      if (category !== 'All' && categoryOf(s.skuCode) !== category) return false
      return true
    })
  }, [sales, channel, category, skuToCategory])

  const trend = useMemo(() => {
    const yesterday = addDays(asOfDate, -1)
    const since = addDays(yesterday, -(trendDays - 1))
    const byDate = new Map<string, { revenue: number; units: number }>()

    let d = since
    while (d <= yesterday) {
      byDate.set(d, { revenue: 0, units: 0 })
      d = addDays(d, 1)
    }

    for (const s of filtered) {
      if (s.date < since || s.date > yesterday) continue
      const entry = byDate.get(s.date)
      if (entry) {
        entry.revenue += s.invoiceAmount
        entry.units += s.qty
      }
    }

    return Array.from(byDate.entries()).map(([date, v]) => ({
      date,
      asp: v.units > 0 ? v.revenue / v.units : 0,
    }))
  }, [filtered, asOfDate, trendDays])

  const yesterdayASP = trend.length > 0 ? trend[trend.length - 1].asp : 0
  const dayBeforeASP = trend.length > 1 ? trend[trend.length - 2].asp : 0
  const diff = yesterdayASP - dayBeforeASP
  const pct = dayBeforeASP > 0 ? (diff / dayBeforeASP) * 100 : 0
  const isUp = diff >= 0

  function FilterDropdown({
    label,
    options,
    value,
    onChange,
  }: {
    label: string
    options: string[]
    value: string
    onChange: (v: string) => void
  }) {
    return (
      <div>
        <div className="text-xs uppercase tracking-wide text-[var(--color-muted)] mb-1.5">{label}</div>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full text-sm border border-[var(--color-border)] rounded-lg px-3 py-1.5 bg-[var(--color-surface)] text-[var(--color-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)]"
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    )
  }

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-[var(--color-muted)] mb-1">
            Avg Selling Price — Yesterday
            {channel !== 'All' ? ` · ${channel}` : ''}
            {category !== 'All' ? ` · ${category}` : ''}
          </div>
          <div className="font-display text-3xl text-[var(--color-charcoal)]">{inr(yesterdayASP)}</div>
          <div className={`text-sm font-medium mt-1 ${isUp ? 'text-[var(--color-sage-dark)]' : 'text-[#dc2626]'}`}>
            {isUp ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}% vs day before ({inr(dayBeforeASP)})
          </div>
        </div>

        <div className="flex flex-col gap-3 min-w-[200px]">
          <FilterDropdown label="Channel" options={channels} value={channel} onChange={setChannel} />
          <FilterDropdown label="Category" options={categories} value={category} onChange={setCategory} />
        </div>
      </div>

      <ResponsiveContainer width="100%" height={100}>
        <LineChart data={trend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fontSize: 10 }} interval={Math.ceil(trendDays / 7)} />
          <Tooltip
            labelFormatter={(d) => formatShortDate(d as string)}
            formatter={(v: any) => [inr(Number(v)), 'ASP']}
          />
          <Line type="monotone" dataKey="asp" stroke="#15803d" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
