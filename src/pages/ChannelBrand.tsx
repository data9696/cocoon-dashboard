import { useMemo, useState } from 'react'
import { useData } from '../lib/DataContext'
import { PageLayout } from '../components/PageLayout'
import { ChannelBadge } from '../components/ChannelBadge'
import { BrandDonut } from '../components/BrandDonut'
import { SortableTable } from '../components/SortableTable'
import { QuickInsights } from '../components/QuickInsights'
import { FilteredTrendSection } from '../components/FilteredTrendSection'
import { Reveal } from '../components/Reveal'
import {
  formatDisplayDate,
  firstOfMonth,
  addDays,
  toDateString,
} from '../lib/dateLogic'
import { filterSales } from '../lib/aggregations'
import {
  weekOverWeekFromSummary,
  monthOverMonthFromSummary,
  groupByBrandFromSummary,
  groupByChannelFromSummary,
  filterSummary,
  sumSummary,
} from '../lib/summaryAggregations'
import { BRAND_COLORS } from '../lib/brand'

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

const ALL_BRANDS = ['All', 'Cocoon Care', 'The Boo Boo Club']

type SortKey = 'channel' | 'wtd' | 'wow' | 'mtm' | 'mom'
type SortDir = 'asc' | 'desc'

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className={`ml-1 text-[10px] ${active ? 'text-[var(--color-sage-dark)]' : 'text-[var(--color-border)]'}`}>
      {active ? (dir === 'asc' ? '▲' : '▼') : '⇅'}
    </span>
  )
}

export function ChannelBrand() {
  const { sales, dailySummary, asOfDate } = useData()

  const [selectedBrands, setSelectedBrands] = useState<string[]>(['All'])
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['All'])
  const [sortKey, setSortKey] = useState<SortKey>('mtm')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [summaryPreset, setSummaryPreset] = useState<'thisMonth' | 'last7' | 'last15' | 'lastMonth' | 'custom'>('thisMonth')
  const [summaryBrand, setSummaryBrand] = useState<string>('All')
  const [summaryCompany, setSummaryCompany] = useState<string>('All')
  const [summaryCustomStart, setSummaryCustomStart] = useState('')
  const [summaryCustomEnd, setSummaryCustomEnd] = useState('')

  const allChannels = useMemo(() =>
    Array.from(new Set(sales.map((s) => s.channel))).filter(Boolean).sort(),
    [sales]
  )

  const allCompanies = useMemo(() =>
    ['All', ...Array.from(new Set(sales.map((s) => s.channel.split(' - ')[0]))).filter(Boolean).sort()],
    [sales]
  )

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

  // Per-channel WoW + MoM, now from the summary table.
  const channelRows = useMemo(
    () => allChannels.map((ch) => {
      const wow = weekOverWeekFromSummary(filterSummary(dailySummary, '0000-01-01', '9999-12-31', { channel: ch }), asOfDate)
      const mom = monthOverMonthFromSummary(filterSummary(dailySummary, '0000-01-01', '9999-12-31', { channel: ch }), asOfDate)
      const wowChangePct = wow.prior.sales > 0 ? ((wow.current.sales - wow.prior.sales) / wow.prior.sales) * 100 : null
      const momChangePct = mom.prior.sales > 0 ? ((mom.current.sales - mom.prior.sales) / mom.prior.sales) * 100 : null
      return {
        channel: ch,
        wow: { current: wow.current.sales, changePct: wowChangePct },
        mom: { current: mom.current.sales, changePct: momChangePct },
      }
    }),
    [allChannels, dailySummary, asOfDate]
  )

  const monthStart = firstOfMonth(asOfDate)
  const yesterday = addDays(asOfDate, -1)

  const summaryLabels = {
    thisMonth: 'This Month',
    last7: 'Last 7 Days',
    last15: 'Last 15 Days',
    lastMonth: 'Last Month',
    custom: 'Custom',
  }

  const summaryRange = useMemo(() => {
    const d = new Date(asOfDate)
    const ranges: Record<string, { start: string; end: string }> = {
      thisMonth: { start: monthStart, end: monthOverMonthFromSummary(dailySummary, asOfDate).currentWindow.end },
      last7: { start: addDays(asOfDate, -7), end: yesterday },
      last15: { start: addDays(asOfDate, -15), end: yesterday },
      lastMonth: {
        start: toDateString(new Date(d.getFullYear(), d.getMonth() - 1, 1)),
        end: toDateString(new Date(d.getFullYear(), d.getMonth(), 0)),
      },
      custom: {
        start: summaryCustomStart || monthStart,
        end: summaryCustomEnd || yesterday,
      },
    }
    return ranges[summaryPreset]
  }, [asOfDate, summaryPreset, monthStart, yesterday, summaryCustomStart, summaryCustomEnd, dailySummary])

  const summaryTotals = useMemo(() => {
    let filtered = filterSummary(dailySummary, summaryRange.start, summaryRange.end)
    if (summaryBrand !== 'All') filtered = filtered.filter((r) => r.brand === summaryBrand)
    if (summaryCompany !== 'All') filtered = filtered.filter((r) => r.channel.startsWith(summaryCompany))
    return sumSummary(filtered)
  }, [dailySummary, summaryRange, summaryBrand, summaryCompany])

  // Row-level detail still needed for Quick Insights (SKU-aware).
  const rangeSalesRows = useMemo(() => {
    let filtered = filterSales(sales, summaryRange)
    if (summaryBrand !== 'All') filtered = filtered.filter((s) => s.brand === summaryBrand)
    if (summaryCompany !== 'All') filtered = filtered.filter((s) => s.channel.startsWith(summaryCompany))
    return filtered
  }, [sales, summaryRange, summaryBrand, summaryCompany])

  // Brand/Channel breakdown for the tables below — from the summary table, filtered by the multi-select pills.
  const tableWindow = useMemo(() => monthOverMonthFromSummary(dailySummary, asOfDate).currentWindow, [dailySummary, asOfDate])

  const filteredSummaryRows = useMemo(() => {
    let rows = filterSummary(dailySummary, tableWindow.start, tableWindow.end)
    if (!selectedBrands.includes('All')) rows = rows.filter((r) => selectedBrands.includes(r.brand))
    if (!selectedChannels.includes('All')) rows = rows.filter((r) => selectedChannels.includes(r.channel))
    return rows
  }, [dailySummary, tableWindow, selectedBrands, selectedChannels])

  const byChannel = useMemo(
    () => groupByChannelFromSummary(filteredSummaryRows, tableWindow.start, tableWindow.end),
    [filteredSummaryRows, tableWindow]
  )
  const byBrand = useMemo(
    () => groupByBrandFromSummary(filteredSummaryRows, tableWindow.start, tableWindow.end),
    [filteredSummaryRows, tableWindow]
  )
  const topChannel = byChannel[0]
  const worstChannel = byChannel[byChannel.length - 1]
  const totalSales = byChannel.reduce((a, c) => a + c.sales, 0)

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  const sortedChannelRows = useMemo(() => {
    const filtered = channelRows.filter(
      (r) => selectedChannels.includes('All') || selectedChannels.includes(r.channel)
    )
    return [...filtered].sort((a, b) => {
      let valA = 0, valB = 0
      if (sortKey === 'wtd') { valA = a.wow.current; valB = b.wow.current }
      else if (sortKey === 'wow') { valA = a.wow.changePct ?? 0; valB = b.wow.changePct ?? 0 }
      else if (sortKey === 'mtm') { valA = a.mom.current; valB = b.mom.current }
      else if (sortKey === 'mom') { valA = a.mom.changePct ?? 0; valB = b.mom.changePct ?? 0 }
      else return sortDir === 'asc' ? a.channel.localeCompare(b.channel) : b.channel.localeCompare(a.channel)
      return sortDir === 'asc' ? valA - valB : valB - valA
    })
  }, [channelRows, selectedChannels, sortKey, sortDir])

  return (
    <PageLayout
      title="Channel & Brand Sales"
      subtitle={`As of ${formatDisplayDate(asOfDate)}`}
    >
      {/* Total Sales Summary Card with Brand + Company + Date filters */}
      <Reveal>
        <div className="card p-5 mb-6">
          <div className="mb-4">
            <div className="text-xs uppercase tracking-wide text-[var(--color-muted)] mb-1">
              Total Sales — {summaryLabels[summaryPreset]}
              {summaryBrand !== 'All' ? ` · ${summaryBrand}` : ''}
              {summaryCompany !== 'All' ? ` · ${summaryCompany}` : ''}
            </div>
            <div className="font-display text-3xl text-[var(--color-charcoal)]">{inr(summaryTotals.sales)}</div>
            <div className="text-sm text-[var(--color-muted)] mt-1">
              {summaryTotals.units.toLocaleString('en-IN')} units · {summaryTotals.orders.toLocaleString('en-IN')} orders
            </div>
          </div>

          <div className="space-y-3 bg-[var(--color-cream)] rounded-xl p-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-[var(--color-muted)] mb-2">Date Range</div>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(summaryLabels) as Array<keyof typeof summaryLabels>).map((p) => (
                  <button key={p} onClick={() => setSummaryPreset(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      summaryPreset === p
                        ? 'bg-[var(--color-sage)] text-white shadow-sm'
                        : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-sage)]'
                    }`}>{summaryLabels[p]}</button>
                ))}
              </div>
              {summaryPreset === 'custom' && (
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <input type="date" lang="en-GB" value={summaryCustomStart} max={asOfDate}
                    onChange={e => setSummaryCustomStart(e.target.value)}
                    className="text-xs border border-[var(--color-border)] rounded-lg px-3 py-1.5 bg-[var(--color-surface)]" />
                  <span className="text-[var(--color-muted)] text-xs">→</span>
                  <input type="date" lang="en-GB" value={summaryCustomEnd} max={asOfDate}
                    onChange={e => setSummaryCustomEnd(e.target.value)}
                    className="text-xs border border-[var(--color-border)] rounded-lg px-3 py-1.5 bg-[var(--color-surface)]" />
                </div>
              )}
            </div>

            <div>
              <div className="text-xs uppercase tracking-wide text-[var(--color-muted)] mb-2">Brand</div>
              <div className="flex flex-wrap gap-1.5">
                {ALL_BRANDS.map((b) => (
                  <button key={b} onClick={() => setSummaryBrand(b)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      summaryBrand === b
                        ? 'bg-[var(--color-sage)] text-white shadow-sm'
                        : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-sage)]'
                    }`}>{b}</button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wide text-[var(--color-muted)] mb-2">Company</div>
              <div className="flex flex-wrap gap-1.5">
                {allCompanies.map((c) => (
                  <button key={c} onClick={() => setSummaryCompany(c)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      summaryCompany === c
                        ? 'bg-[#6d28d9] text-white shadow-sm'
                        : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] hover:border-[#6d28d9]'
                    }`}>{c}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Filtered Trend Chart */}
      <Reveal delay={40}>
        <FilteredTrendSection
          sales={sales}
          asOfDate={asOfDate}
          allChannels={allChannels}
          title="Channel Performance Trend"
        />
      </Reveal>

      {/* Multi-select filters for tables below */}
      <Reveal delay={80}>
        <div className="card p-5 mb-6">
          <h3 className="font-display text-lg mb-4">Filter Tables Below</h3>
          <div className="space-y-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-[var(--color-muted)] mb-2">
                Brand <span className="normal-case font-normal opacity-60 ml-1">(multi-select)</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ALL_BRANDS.map((b) => (
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
              <div className="text-xs uppercase tracking-wide text-[var(--color-muted)] mb-2">
                Channel <span className="normal-case font-normal opacity-60 ml-1">(multi-select)</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['All', ...allChannels].map((ch) => (
                  <button key={ch} onClick={() => toggleChannel(ch)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedChannels.includes(ch)
                        ? 'bg-[var(--color-smokeblue)] text-white shadow-sm'
                        : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-smokeblue)]'
                    }`}>{ch === 'All' ? 'All' : ch}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Top / Lowest / Top Brand */}
      {topChannel && (
        <Reveal delay={100}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card p-5 border-l-4 border-[var(--color-sage)]">
              <div className="text-xs uppercase tracking-wide text-[var(--color-muted)] mb-2">🏆 Top Channel</div>
              <div className="flex items-center gap-2 mb-1">
                <ChannelBadge channel={topChannel.key} size={20} />
                <div className="font-display text-xl text-[var(--color-charcoal)]">{topChannel.key}</div>
              </div>
              <div className="text-2xl font-bold text-[var(--color-sage-dark)]">{inr(topChannel.sales)}</div>
              <div className="text-sm text-[var(--color-muted)] mt-1">
                {totalSales > 0 ? ((topChannel.sales / totalSales) * 100).toFixed(0) : 0}% of total · {topChannel.units} units
              </div>
            </div>
            {worstChannel && worstChannel.key !== topChannel.key && (
              <div className="card p-5 border-l-4 border-[#dc2626]">
                <div className="text-xs uppercase tracking-wide text-[var(--color-muted)] mb-2">⚠️ Lowest Channel</div>
                <div className="flex items-center gap-2 mb-1">
                  <ChannelBadge channel={worstChannel.key} size={20} />
                  <div className="font-display text-xl text-[var(--color-charcoal)]">{worstChannel.key}</div>
                </div>
                <div className="text-2xl font-bold text-[#dc2626]">{inr(worstChannel.sales)}</div>
                <div className="text-sm text-[var(--color-muted)] mt-1">
                  {totalSales > 0 ? ((worstChannel.sales / totalSales) * 100).toFixed(0) : 0}% of total · {worstChannel.units} units
                </div>
              </div>
            )}
            {byBrand[0] && (() => {
              const topBrand = byBrand[0]
              const brandTotal = byBrand.reduce((a, b) => a + b.sales, 0)
              const pct = brandTotal > 0 ? ((topBrand.sales / brandTotal) * 100).toFixed(0) : '0'
              return (
                <div className="card p-5 border-l-4 border-[var(--color-corn)]">
                  <div className="text-xs uppercase tracking-wide text-[var(--color-muted)] mb-2">🏅 Top Brand</div>
                  <div className="font-display text-xl text-[var(--color-charcoal)] mb-1">{topBrand.key}</div>
                  <div className="text-2xl font-bold text-[#92400e]">{inr(topBrand.sales)}</div>
                  <div className="text-sm text-[var(--color-muted)] mt-1">{pct}% of total · {topBrand.units} units</div>
                </div>
              )
            })()}
          </div>
        </Reveal>
      )}

      {/* Channel Mix + Brand Split */}
      <Reveal delay={140}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <SortableTable
            title="Channel Mix — This Month"
            rows={byChannel.map((c) => ({
              name: <span className="flex items-center gap-2"><ChannelBadge channel={c.key} />{c.key}</span>,
              namePlain: c.key,
              sales: c.sales,
              units: c.units,
            }))}
          />
          <div className="card p-5">
            <h3 className="font-display text-lg mb-4">Brand Split — This Month</h3>
            <BrandDonut data={byBrand} colors={BRAND_COLORS} />
            <table className="w-full text-sm mt-4">
              <thead>
                <tr className="text-left text-[var(--color-muted)] text-xs uppercase border-b border-[var(--color-border)]">
                  <th className="pb-2">Brand</th>
                  <th className="pb-2 text-right">Sales</th>
                  <th className="pb-2 text-right">Units</th>
                  <th className="pb-2 text-right">Share</th>
                </tr>
              </thead>
              <tbody>
                {byBrand.map((b) => {
                  const brandTotal = byBrand.reduce((a, x) => a + x.sales, 0)
                  const pct = brandTotal > 0 ? ((b.sales / brandTotal) * 100).toFixed(0) : '0'
                  return (
                    <tr key={b.key} className="border-t border-[var(--color-border)] hover:bg-[var(--color-cream)]">
                      <td className="py-2 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: BRAND_COLORS[b.key as keyof typeof BRAND_COLORS] || '#999' }} />
                        {b.key}
                      </td>
                      <td className="py-2 text-right font-medium">{inr(b.sales)}</td>
                      <td className="py-2 text-right">{b.units}</td>
                      <td className="py-2 text-right text-[var(--color-sage-dark)] font-medium">{pct}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Reveal>

      {/* WoW & MoM sortable table */}
      <Reveal delay={180}>
        <div className="card p-5 mb-8 overflow-x-auto">
          <h3 className="font-display text-lg mb-4">Channel Performance — WoW &amp; MoM</h3>
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="text-left text-[var(--color-muted)] text-xs uppercase border-b border-[var(--color-border)]">
                <th className="pb-2 cursor-pointer select-none" onClick={() => handleSort('channel')}>
                  Channel <SortIcon active={sortKey === 'channel'} dir={sortDir} />
                </th>
                <th className="pb-2 text-right cursor-pointer select-none" onClick={() => handleSort('wtd')}>
                  WTD Sales <SortIcon active={sortKey === 'wtd'} dir={sortDir} />
                </th>
                <th className="pb-2 text-right cursor-pointer select-none" onClick={() => handleSort('wow')}>
                  WoW % <SortIcon active={sortKey === 'wow'} dir={sortDir} />
                </th>
                <th className="pb-2 text-right cursor-pointer select-none" onClick={() => handleSort('mtm')}>
                  MTM Sales <SortIcon active={sortKey === 'mtm'} dir={sortDir} />
                </th>
                <th className="pb-2 text-right cursor-pointer select-none" onClick={() => handleSort('mom')}>
                  MoM % <SortIcon active={sortKey === 'mom'} dir={sortDir} />
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedChannelRows.map((r) => (
                <tr key={r.channel} className="border-t border-[var(--color-border)] hover:bg-[var(--color-cream)]">
                  <td className="py-2 flex items-center gap-2">
                    <ChannelBadge channel={r.channel} />
                    {r.channel}
                  </td>
                  <td className="py-2 text-right">{inr(r.wow.current)}</td>
                  <td className={`py-2 text-right font-medium ${(r.wow.changePct ?? 0) >= 0 ? 'text-[var(--color-sage-dark)]' : 'text-[#dc2626]'}`}>
                    {r.wow.changePct === null ? '—' : `${r.wow.changePct >= 0 ? '+' : ''}${r.wow.changePct.toFixed(1)}%`}
                  </td>
                  <td className="py-2 text-right">{inr(r.mom.current)}</td>
                  <td className={`py-2 text-right font-medium ${(r.mom.changePct ?? 0) >= 0 ? 'text-[var(--color-sage-dark)]' : 'text-[#dc2626]'}`}>
                    {r.mom.changePct === null ? '—' : `${r.mom.changePct >= 0 ? '+' : ''}${r.mom.changePct.toFixed(1)}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>

      {/* Quick Insights */}
      <Reveal delay={220}>
        <div className="mb-8">
          <QuickInsights sales={rangeSalesRows} label="This Month" />
        </div>
      </Reveal>
    </PageLayout>
  )
}
