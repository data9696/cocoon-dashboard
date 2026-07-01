import { useMemo, useState, useEffect } from 'react'
import { ShoppingBag, CalendarDays, TrendingUp, Wallet, BarChart2, Crosshair, Package, ShoppingCart, CircleDollarSign } from 'lucide-react'
import { useData } from '../lib/DataContext'
import { PageLayout } from '../components/PageLayout'
import { MetricCard } from '../components/MetricCard'
import { ChannelBadge } from '../components/ChannelBadge'
import { TrendChart } from '../components/TrendChart'
import { HourlyChart } from '../components/HourlyChart'
import { Reveal } from '../components/Reveal'
import { DateRangePicker, defaultDateRange } from '../components/DateRangePicker'
import { QuickInsights } from '../components/QuickInsights'
import { SortableTable } from '../components/SortableTable'
import type { DateRange } from '../components/DateRangePicker'
import { BrandDonut } from '../components/BrandDonut'
import { BRAND_COLORS } from '../lib/brand'
import {
  dayOverDayWindows,
  weekOverWeekWindows,
  monthOverMonthWindows,
  yearToDateWindow,
  weightedRunRate,
  formatDisplayDate,
  addDays,
  firstOfMonth,
} from '../lib/dateLogic'
import {
  buildMetricSummary,
  filterSales,
  sumSales,
  groupBy,
  groupByDate,
  groupByHour,
} from '../lib/aggregations'

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

export function SalesOverview() {
  const { sales, asOfDate } = useData()

  const [dateRange, setDateRange] = useState<DateRange | null>(null)

  useEffect(() => {
    if (asOfDate && !dateRange) {
      setDateRange(defaultDateRange(asOfDate))
    }
  }, [asOfDate, dateRange])

  const effectiveRange: DateRange = dateRange ?? {
    start: asOfDate ? firstOfMonth(asOfDate) : '',
    end: asOfDate ?? '',
    label: 'This Month',
  }

  const dod = useMemo(() => buildMetricSummary(sales, dayOverDayWindows(asOfDate)), [sales, asOfDate])
  const wow = useMemo(() => buildMetricSummary(sales, weekOverWeekWindows(asOfDate)), [sales, asOfDate])
  const mom = useMemo(() => buildMetricSummary(sales, monthOverMonthWindows(asOfDate)), [sales, asOfDate])
  const ytdWindow = useMemo(() => yearToDateWindow(asOfDate), [asOfDate])
  const ytdSales = useMemo(() => sumSales(filterSales(sales, ytdWindow)), [sales, ytdWindow])
  const runRateValue = useMemo(
    () => weightedRunRate(sales.map((s) => ({ date: s.date, qty: s.qty })), asOfDate),
    [sales, asOfDate]
  )

  const sparklineValues = useMemo(() => {
    const since = addDays(asOfDate, -14)
    return groupByDate(sales.filter((s) => s.date >= since)).map((g) => g.sales)
  }, [sales, asOfDate])

  const rangeSales = useMemo(
    () =>
      effectiveRange.start && effectiveRange.end
        ? filterSales(sales, { start: effectiveRange.start, end: effectiveRange.end })
        : [],
    [sales, effectiveRange]
  )

  const isSingleDay = effectiveRange.label === 'Today' || effectiveRange.label === 'Yesterday'

  const trend = useMemo(() => {
    if (isSingleDay) {
      return groupByHour(rangeSales).map((g) => ({
        date: g.key,
        sales: g.sales,
        units: g.units,
        orders: g.units,
      }))
    }
    const byDate = groupByDate(rangeSales)
    return byDate.map((g) => {
      const daySales = rangeSales.filter((s) => s.date === g.key)
      return {
        date: g.key,
        sales: g.sales,
        units: g.units,
        orders: new Set(daySales.map((s) => s.channelOrderId).filter(Boolean)).size,
      }
    })
  }, [rangeSales, isSingleDay])

  const byChannel = useMemo(() => groupBy(rangeSales, (s) => s.channel), [rangeSales])
  const byBrand = useMemo(() => groupBy(rangeSales, (s) => s.brand), [rangeSales])
  const topSkus = useMemo(
    () => groupBy(rangeSales, (s) => s.listingSku || s.skuCode || 'Unknown').slice(0, 10),
    [rangeSales]
  )

  const rangeTotalSales = rangeSales.reduce((a, s) => a + s.invoiceAmount, 0)
  const rangeTotalUnits = rangeSales.reduce((a, s) => a + s.qty, 0)
  const rangeOrderCount = new Set(rangeSales.map((s) => s.channelOrderId).filter(Boolean)).size
  const rangeAOV = rangeSales.length > 0 ? rangeTotalSales / rangeSales.length : 0

  return (
    <PageLayout
      title="Sales Overview"
      subtitle={`As of ${formatDisplayDate(asOfDate)} · ${sales.length.toLocaleString()} order line items loaded`}
    >
      <Reveal>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <MetricCard icon={ShoppingBag} label="Today" value={inr(dod.current)} changePct={dod.changePct} changeAmount={dod.changeAmount} accent="sage" sparkline={sparklineValues} />
          <MetricCard icon={CalendarDays} label="Yesterday" value={inr(dod.prior)} accent="blue" sparkline={sparklineValues} />
          <MetricCard icon={TrendingUp} label="WTD" value={inr(wow.current)} changePct={wow.changePct} changeAmount={wow.changeAmount} accent="purple" sparkline={sparklineValues} />
          <MetricCard icon={Wallet} label="MTD" value={inr(mom.current)} changePct={mom.changePct} changeAmount={mom.changeAmount} accent="corn" sparkline={sparklineValues} />
          <MetricCard icon={BarChart2} label="YTD" value={inr(ytdSales)} accent="emerald" sparkline={sparklineValues} />
          <MetricCard icon={Crosshair} label="Run Rate (Wtd)" value={`${runRateValue.toFixed(1)} u/day`} accent="orange" sparkline={sparklineValues} />
        </div>
      </Reveal>

      <Reveal delay={80}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <MetricCard icon={Wallet} label={`Sales — ${effectiveRange.label}`} value={inr(rangeTotalSales)} accent="sage" />
          <MetricCard icon={Package} label={`Units — ${effectiveRange.label}`} value={rangeTotalUnits.toLocaleString('en-IN')} accent="blue" />
          <MetricCard icon={ShoppingCart} label={`Orders — ${effectiveRange.label}`} value={rangeOrderCount.toLocaleString('en-IN')} accent="corn" />
          <MetricCard icon={CircleDollarSign} label={`Avg Order Value — ${effectiveRange.label}`} value={inr(rangeAOV)} accent="pink" />
        </div>
      </Reveal>

      <Reveal delay={120}>
        <div className="card p-5 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <h3 className="font-display text-lg">Sales Trend</h3>
            <span className="text-xs text-[var(--color-muted)]">{effectiveRange.label}</span>
          </div>
          <DateRangePicker asOf={asOfDate} onChange={setDateRange} />
          {isSingleDay
            ? <HourlyChart trend={trend} height={280} />
            : <TrendChart trend={trend} height={280} />
          }
        </div>
      </Reveal>

      <Reveal delay={150}>
        <div className="mb-8">
          <QuickInsights sales={rangeSales} label={effectiveRange.label} />
        </div>
      </Reveal>

      <Reveal delay={160}>
        <Reveal delay={180}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Top Performer */}
          {byChannel[0] && (() => {
            const top = byChannel[0]
            const worst = byChannel[byChannel.length - 1]
            const total = byChannel.reduce((a, c) => a + c.sales, 0)
            const topPct = total > 0 ? ((top.sales / total) * 100).toFixed(0) : '0'
            const worstPct = total > 0 ? ((worst.sales / total) * 100).toFixed(0) : '0'
            return (
              <>
                <div className="card p-5 border-l-4 border-[var(--color-sage)]">
                  <div className="text-xs uppercase tracking-wide text-[var(--color-muted)] mb-2">🏆 Top Marketplace</div>
                  <div className="font-display text-xl text-[var(--color-charcoal)] mb-1">{top.key}</div>
                  <div className="text-2xl font-bold text-[var(--color-sage-dark)]">{inr(top.sales)}</div>
                  <div className="text-sm text-[var(--color-muted)] mt-1">{topPct}% of total · {top.units} units</div>
                </div>

                <div className="card p-5 border-l-4 border-[#dc2626]">
                  <div className="text-xs uppercase tracking-wide text-[var(--color-muted)] mb-2">⚠️ Lowest Marketplace</div>
                  <div className="font-display text-xl text-[var(--color-charcoal)] mb-1">{worst.key}</div>
                  <div className="text-2xl font-bold text-[#dc2626]">{inr(worst.sales)}</div>
                  <div className="text-sm text-[var(--color-muted)] mt-1">{worstPct}% of total · {worst.units} units</div>
                </div>

                <div className="card p-5 border-l-4 border-[var(--color-corn)]">
                  <div className="text-xs uppercase tracking-wide text-[var(--color-muted)] mb-2">🏅 Top Brand</div>
                  {byBrand[0] && (() => {
                    const topBrand = byBrand[0]
                    const brandTotal = byBrand.reduce((a, b) => a + b.sales, 0)
                    const brandPct = brandTotal > 0 ? ((topBrand.sales / brandTotal) * 100).toFixed(0) : '0'
                    return (
                      <>
                        <div className="font-display text-xl text-[var(--color-charcoal)] mb-1">{topBrand.key}</div>
                        <div className="text-2xl font-bold text-[#92400e]">{inr(topBrand.sales)}</div>
                        <div className="text-sm text-[var(--color-muted)] mt-1">{brandPct}% of total · {topBrand.units} units</div>
                      </>
                    )
                  })()}
                </div>
              </>
            )
          })()}
        </div>
      </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <SortableTable
            title={`Channel Mix — ${effectiveRange.label}`}
            rows={byChannel.map((c) => ({
              name: <span className="flex items-center gap-2"><ChannelBadge channel={c.key} />{c.key}</span>,
              namePlain: c.key,
              sales: c.sales,
              units: c.units,
            }))}
          />
          <div className="card p-5">
            <h3 className="font-display text-lg mb-4">Brand Split — {effectiveRange.label}</h3>
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
                  const total = byBrand.reduce((a, x) => a + x.sales, 0)
                  const pct = total > 0 ? ((b.sales / total) * 100).toFixed(0) : '0'
                  return (
                    <tr key={b.key} className="border-t border-[var(--color-border)] hover:bg-[var(--color-cream)]">
                      <td className="py-2 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: BRAND_COLORS[b.key as keyof typeof BRAND_COLORS] || '#999' }}
                        />
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

      <Reveal delay={200}>
        <SortableTable
          title={`Top SKUs — ${effectiveRange.label}`}
          rows={topSkus.map((s) => ({
            name: s.key,
            namePlain: s.key,
            sales: s.sales,
            units: s.units,
          }))}
          showRank
        />
      </Reveal>
    </PageLayout>
  )
}