import { useState, useMemo } from 'react'
import { BarChart2, Package, ShoppingCart, Filter } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import type { NormalizedSale } from '../types'
import { addDays, formatShortDate, parseDateString, toDateString, firstOfMonth } from '../lib/dateLogic'
import { filterSales, groupByHour } from '../lib/aggregations'
import { HourlyChart } from './HourlyChart'

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

type DatePreset = 'today' | 'yesterday' | 'last7' | 'last15' | 'lastMonth' | 'last2Months' | 'custom'

interface Period { start: string; end: string; label: string }

function getPeriods(preset: DatePreset, asOf: string, customStart: string, customEnd: string): { current: Period; prior: Period } {
  const yesterday = addDays(asOf, -1)

  if (preset === 'today') return {
    current: { start: asOf, end: asOf, label: 'Today' },
    prior: { start: yesterday, end: yesterday, label: 'Yesterday' },
  }
  if (preset === 'yesterday') return {
    current: { start: yesterday, end: yesterday, label: 'Yesterday' },
    prior: { start: addDays(asOf, -2), end: addDays(asOf, -2), label: '2 Days Ago' },
  }
  if (preset === 'last7') return {
    current: { start: addDays(asOf, -7), end: yesterday, label: 'Last 7 Days' },
    prior: { start: addDays(asOf, -14), end: addDays(asOf, -8), label: 'Prev 7 Days' },
  }
  if (preset === 'last15') return {
    current: { start: addDays(asOf, -15), end: yesterday, label: 'Last 15 Days' },
    prior: { start: addDays(asOf, -30), end: addDays(asOf, -16), label: 'Prev 15 Days' },
  }
  if (preset === 'lastMonth') {
    const d = parseDateString(asOf)
    const lastFirst = new Date(d.getFullYear(), d.getMonth() - 1, 1)
    const lastLast = new Date(d.getFullYear(), d.getMonth(), 0)
    const prevFirst = new Date(d.getFullYear(), d.getMonth() - 2, 1)
    const prevLast = new Date(d.getFullYear(), d.getMonth() - 1, 0)
    return {
      current: { start: toDateString(lastFirst), end: toDateString(lastLast), label: lastFirst.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) },
      prior: { start: toDateString(prevFirst), end: toDateString(prevLast), label: prevFirst.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) },
    }
  }
  if (preset === 'last2Months') {
    const d = parseDateString(asOf)
    const s = new Date(d.getFullYear(), d.getMonth() - 2, 1)
    const days = Math.round((parseDateString(yesterday).getTime() - s.getTime()) / 86400000)
    const ps = addDays(toDateString(s), -days - 1)
    const pe = addDays(toDateString(s), -1)
    return {
      current: { start: toDateString(s), end: yesterday, label: 'Last 2 Months' },
      prior: { start: ps, end: pe, label: 'Prev 2 Months' },
    }
  }
  if (preset === 'custom' && customStart && customEnd) {
    const start = customStart < customEnd ? customStart : customEnd
    const end = customStart < customEnd ? customEnd : customStart
    const days = Math.round((parseDateString(end).getTime() - parseDateString(start).getTime()) / 86400000)
    const ps = addDays(start, -days - 1)
    const pe = addDays(start, -1)
    return {
      current: { start, end, label: `${formatShortDate(start)} – ${formatShortDate(end)}` },
      prior: { start: ps, end: pe, label: `${formatShortDate(ps)} – ${formatShortDate(pe)}` },
    }
  }
  const s = firstOfMonth(asOf)
  return {
    current: { start: s, end: yesterday, label: 'This Month' },
    prior: { start: addDays(s, -30), end: addDays(s, -1), label: 'Last Month' },
  }
}

interface Props {
  sales: NormalizedSale[]
  asOfDate: string
  allChannels: string[]
  title?: string
}

export function FilteredTrendSection({ sales, asOfDate, allChannels, title = 'Sales Trend' }: Props) {
  const [preset, setPreset] = useState<DatePreset>('last7')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [selectedBrands, setSelectedBrands] = useState<string[]>(['All'])
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['All'])
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>(['All'])
  const [applied, setApplied] = useState<{
    preset: DatePreset; customStart: string; customEnd: string
    brands: string[]; channels: string[]; companies: string[]
  }>({ preset: 'last7', customStart: '', customEnd: '', brands: ['All'], channels: ['All'], companies: ['All'] })

  const PRESETS: { key: DatePreset; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'last7', label: 'Last 7 Days' },
    { key: 'last15', label: 'Last 15 Days' },
    { key: 'lastMonth', label: 'Last Month' },
    { key: 'last2Months', label: 'Last 2 Months' },
    { key: 'custom', label: 'Custom Range' },
  ]
  const BRANDS = ['All', 'Cocoon Care', 'The Boo Boo Club']

  const allCompanies = useMemo(() => {
    const companies = Array.from(new Set(sales.map(s => s.channel.split(' - ')[0]))).filter(Boolean).sort()
    return ['All', ...companies]
  }, [sales])

  function toggleBrand(b: string) {
    if (b === 'All') { setSelectedBrands(['All']); return }
    const next = selectedBrands.filter(x => x !== 'All')
    if (next.includes(b)) {
      const r = next.filter(x => x !== b)
      setSelectedBrands(r.length === 0 ? ['All'] : r)
    } else setSelectedBrands([...next, b])
  }

  function toggleChannel(ch: string) {
    if (ch === 'All') { setSelectedChannels(['All']); return }
    const next = selectedChannels.filter(x => x !== 'All')
    if (next.includes(ch)) {
      const r = next.filter(x => x !== ch)
      setSelectedChannels(r.length === 0 ? ['All'] : r)
    } else setSelectedChannels([...next, ch])
  }

  function toggleCompany(c: string) {
    if (c === 'All') { setSelectedCompanies(['All']); return }
    const next = selectedCompanies.filter(x => x !== 'All')
    if (next.includes(c)) {
      const r = next.filter(x => x !== c)
      setSelectedCompanies(r.length === 0 ? ['All'] : r)
    } else setSelectedCompanies([...next, c])
  }

  function applyFilters() {
    setApplied({ preset, customStart, customEnd, brands: selectedBrands, channels: selectedChannels, companies: selectedCompanies })
  }

  const { current, prior } = useMemo(
    () => getPeriods(applied.preset, asOfDate, applied.customStart, applied.customEnd),
    [applied, asOfDate]
  )

  const filterData = (period: Period) => {
    let data = filterSales(sales, { start: period.start, end: period.end })
    if (!applied.brands.includes('All')) data = data.filter(s => applied.brands.includes(s.brand))
    if (!applied.channels.includes('All')) data = data.filter(s => applied.channels.includes(s.channel))
    if (!applied.companies.includes('All')) data = data.filter(s => s.channel.startsWith(applied.companies.find(c => s.channel.startsWith(c)) || ''))
    return data
  }

  const currentData = useMemo(() => filterData(current), [sales, current, applied])
  const priorData = useMemo(() => filterData(prior), [sales, prior, applied])

  const currentRevenue = currentData.reduce((a, s) => a + s.invoiceAmount, 0)
  const currentUnits = currentData.reduce((a, s) => a + s.qty, 0)
  const currentOrders = new Set(currentData.map(s => s.channelOrderId).filter(Boolean)).size
  const priorRevenue = priorData.reduce((a, s) => a + s.invoiceAmount, 0)
  const priorUnits = priorData.reduce((a, s) => a + s.qty, 0)
  const revChange = priorRevenue > 0 ? ((currentRevenue - priorRevenue) / priorRevenue) * 100 : 0
  const unitChange = priorUnits > 0 ? ((currentUnits - priorUnits) / priorUnits) * 100 : 0

  const isSingleDay = applied.preset === 'today' || applied.preset === 'yesterday'

  const chartData = useMemo(() => {
    if (isSingleDay) {
      return groupByHour(currentData).map(g => ({ label: g.key, [current.label]: g.sales }))
    }
    const curByDate = new Map<string, number>()
    for (const s of currentData) curByDate.set(s.date, (curByDate.get(s.date) ?? 0) + s.invoiceAmount)
    const priByDate = new Map<string, number>()
    for (const s of priorData) priByDate.set(s.date, (priByDate.get(s.date) ?? 0) + s.invoiceAmount)
    const curDates = Array.from(curByDate.keys()).sort()
    const priDates = Array.from(priByDate.keys()).sort()
    const maxLen = Math.max(curDates.length, priDates.length)
    const result = []
    for (let i = 0; i < maxLen; i++) {
      result.push({
        label: curDates[i] ? formatShortDate(curDates[i]) : `Day ${i + 1}`,
        [current.label]: curDates[i] ? (curByDate.get(curDates[i]) ?? 0) : undefined,
        [prior.label]: priDates[i] ? (priByDate.get(priDates[i]) ?? 0) : undefined,
      })
    }
    return result
  }, [currentData, priorData, isSingleDay, current.label, prior.label])

  const filterLabel = [
    PRESETS.find(p => p.key === applied.preset)?.label,
    applied.brands.includes('All') ? '' : applied.brands.join(', '),
    applied.channels.includes('All') ? '' : applied.channels.slice(0, 2).join(', '),
  ].filter(Boolean).join(' · ')

  return (
    <div className="card p-5 mb-8">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="font-display text-lg">{title}</h3>
        <span className="text-xs text-[var(--color-muted)]">{filterLabel}</span>
      </div>

      {/* Filter Panel */}
      <div className="bg-[var(--color-cream)] rounded-xl p-4 mb-5 space-y-3">
        {/* Company filter */}
        <div>
          <div className="text-xs uppercase tracking-wide text-[var(--color-muted)] mb-2">Company</div>
          <div className="flex flex-wrap gap-1.5">
            {allCompanies.map(c => (
              <button key={c} onClick={() => toggleCompany(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedCompanies.includes(c)
                    ? 'bg-[#6d28d9] text-white shadow-sm'
                    : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] hover:border-[#6d28d9]'
                }`}>{c}</button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-[var(--color-muted)] mb-2">Date Range</div>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map(p => (
              <button key={p.key} onClick={() => setPreset(p.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  preset === p.key
                    ? 'bg-[var(--color-sage)] text-white shadow-sm'
                    : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-sage)]'
                }`}>{p.label}</button>
            ))}
          </div>
          {preset === 'custom' && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <input type="date" lang="en-GB" value={customStart} max={asOfDate} onChange={e => setCustomStart(e.target.value)}
                className="text-xs border border-[var(--color-border)] rounded-lg px-3 py-1.5 bg-[var(--color-surface)]" />
              <span className="text-[var(--color-muted)] text-xs">→</span>
              <input type="date" lang="en-GB" value={customEnd} max={asOfDate} onChange={e => setCustomEnd(e.target.value)}
                className="text-xs border border-[var(--color-border)] rounded-lg px-3 py-1.5 bg-[var(--color-surface)]" />
            </div>
          )}
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-[var(--color-muted)] mb-2">Brand</div>
          <div className="flex flex-wrap gap-1.5">
            {BRANDS.map(b => (
              <button key={b} onClick={() => toggleBrand(b)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedBrands.includes(b)
                    ? 'bg-[var(--color-sage)] text-white shadow-sm'
                    : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-sage)]'
                }`}>{b}</button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-[var(--color-muted)] mb-2">Channel</div>
          <div className="flex flex-wrap gap-1.5">
            {['All', ...allChannels].map(ch => (
              <button key={ch} onClick={() => toggleChannel(ch)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedChannels.includes(ch)
                    ? 'bg-[var(--color-smokeblue)] text-white shadow-sm'
                    : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-smokeblue)]'
                }`}>{ch === 'All' ? 'All' : ch}</button>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button onClick={applyFilters}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[var(--color-sage)] text-white text-sm font-medium hover:bg-[var(--color-sage-dark)] transition-colors shadow-md">
            <Filter size={14} />
            Apply Filters
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl p-4 bg-[#dcfce7] border border-[#bbf7d0]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#16a34a] flex items-center justify-center">
              <BarChart2 size={15} className="text-white" />
            </div>
            <span className="text-xs uppercase tracking-wide text-[#166534] font-medium">Revenue</span>
          </div>
          <div className="font-display text-2xl text-[#14532d]">{inr(currentRevenue)}</div>
          <div className="text-xs mt-1 text-[#166534]">
            vs {inr(priorRevenue)} ({prior.label})
            <span className={`ml-1 font-bold ${revChange >= 0 ? 'text-[#166534]' : 'text-[#dc2626]'}`}>
              {revChange >= 0 ? '▲' : '▼'} {Math.abs(revChange).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="rounded-xl p-4 bg-[#dbeafe] border border-[#bfdbfe]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#2563eb] flex items-center justify-center">
              <Package size={15} className="text-white" />
            </div>
            <span className="text-xs uppercase tracking-wide text-[#1e40af] font-medium">Units Sold</span>
          </div>
          <div className="font-display text-2xl text-[#1e3a8a]">{currentUnits.toLocaleString('en-IN')}</div>
          <div className="text-xs mt-1 text-[#1e40af]">
            vs {priorUnits.toLocaleString('en-IN')} ({prior.label})
            <span className={`ml-1 font-bold ${unitChange >= 0 ? 'text-[#166534]' : 'text-[#dc2626]'}`}>
              {unitChange >= 0 ? '▲' : '▼'} {Math.abs(unitChange).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="rounded-xl p-4 bg-[#fef3c7] border border-[#fde68a]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#d97706] flex items-center justify-center">
              <ShoppingCart size={15} className="text-white" />
            </div>
            <span className="text-xs uppercase tracking-wide text-[#92400e] font-medium">Orders</span>
          </div>
          <div className="font-display text-2xl text-[#78350f]">{currentOrders.toLocaleString('en-IN')}</div>
          <div className="text-xs mt-1 text-[#92400e]">{current.label}</div>
        </div>
      </div>

      {/* Comparison Chart */}
      {isSingleDay ? (
        <HourlyChart trend={chartData as any} height={260} />
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData}>
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} minTickGap={20} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={v => inr(Number(v))} />
            <Legend />
            <Line type="monotone" dataKey={current.label} stroke="#16a34a" strokeWidth={2.5} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey={prior.label} stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}