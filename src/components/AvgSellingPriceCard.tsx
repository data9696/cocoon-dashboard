import { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { NormalizedSale, SkuStyleMap } from '../types'
import { addDays, formatShortDate } from '../lib/dateLogic'

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

interface Props {
  sales: NormalizedSale[]
  skuStyleMap: SkuStyleMap[]
  asOfDate: string
}

const DATE_RANGE_OPTIONS = [
  { key: 'yesterday', label: 'Yesterday', days: 1 },
  { key: 'last7', label: 'Last 7 Days', days: 7 },
  { key: 'last15', label: 'Last 15 Days', days: 15 },
  { key: 'last30', label: 'Last 30 Days', days: 30 },
]

const ALL_BRANDS = ['All', 'Cocoon Care', 'The Boo Boo Club']

export function AvgSellingPriceCard({ sales, skuStyleMap, asOfDate }: Props) {
  const [channel, setChannel] = useState('All')
  const [category, setCategory] = useState('All')
  const [brand, setBrand] = useState('All')
  const [dateRangeKey, setDateRangeKey] = useState('yesterday')

  const dateRangeOption = DATE_RANGE_OPTIONS.find((d) => d.key === dateRangeKey) || DATE_RANGE_OPTIONS[0]
  const trendDays = Math.max(dateRangeOption.days, 14)

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
      if (brand !== 'All' && s.brand !== brand) return false
      return true
    })
  }, [sales, channel, category, brand, skuToCategory])

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

  // Current period ASP (based on selected date range) vs the equal-length period before it.
  const { currentASP, priorASP, rangeLabel } = useMemo(() => {
    const yesterday = addDays(asOfDate, -1)
    const currentStart = addDays(yesterday, -(dateRangeOption.days - 1))
    const priorEnd = addDays(currentStart, -1)
    const priorStart = addDays(priorEnd, -(dateRangeOption.days - 1))

    function totals(start: string, end: string) {
      let revenue = 0
      let units = 0
      for (const s of filtered) {
        if (s.date >= start && s.date <= end) {
          revenue += s.invoiceAmount
          units += s.qty
        }
      }
      return units > 0 ? revenue / units : 0
    }

    const label =
      dateRangeOption.days === 1
        ? formatShortDate(yesterday)
        : `${formatShortDate(currentStart)} – ${formatShortDate(yesterday)}`

    return {
      currentASP: totals(currentStart, yesterday),
      priorASP: totals(priorStart, priorEnd),
      rangeLabel: label,
    }
  }, [filtered, asOfDate, dateRangeOption])

  const diff = currentASP - priorASP
  const pct = priorASP > 0 ? (diff / priorASP) * 100 : 0
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
            Avg Selling Price — {rangeLabel}
            {brand !== 'All' ? ` · ${brand}` : ''}
            {channel !== 'All' ? ` · ${channel}` : ''}
            {category !== 'All' ? ` · ${category}` : ''}
          </div>
          <div className="font-display text-3xl text-[var(--color-charcoal)]">{inr(currentASP)}</div>
          <div className={`text-sm font-medium mt-1 ${isUp ? 'text-[var(--color-sage-dark)]' : 'text-[#dc2626]'}`}>
            {isUp ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}% vs prior period ({inr(priorASP)})
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 min-w-[280px]">
          <FilterDropdown
            label="Date Range"
            options={DATE_RANGE_OPTIONS.map((d) => d.label)}
            value={dateRangeOption.label}
            onChange={(v) => {
              const opt = DATE_RANGE_OPTIONS.find((d) => d.label === v)
              if (opt) setDateRangeKey(opt.key)
            }}
          />
          <FilterDropdown label="Brand" options={ALL_BRANDS} value={brand} onChange={setBrand} />
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