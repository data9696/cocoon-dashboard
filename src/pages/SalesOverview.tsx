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
import type { DateRange } from '../components/DateRangePicker'
import {
  dayOverDayWindows,
  weekOverWeekWindows,
  monthOverMonthWindows,
  yearToDateWindow,
  weightedRunRate,
  formatDisplayDate,
  addDays,
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

  const [dateRange, setDateRange] = useState<DateRange>(() =>
    asOfDate ? defaultDateRange(asOfDate) : { start: '', end: '', label: 'This Month' }
  )

 // Sync default range when asOfDate becomes available
  useEffect(() => {
    if (asOfDate) {
      setDateRange((prev) =>
        prev.start === '' ? defaultDateRange(asOfDate) : prev
      )
    }
  }, [asOfDate])

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
      dateRange.start && dateRange.end
        ? filterSales(sales, { start: dateRange.start, end: dateRange.end })
        : [],
    [sales, dateRange]
  )

 const isSingleDay = dateRange.label === 'Today' || dateRange.label === 'Yesterday'

  const trend = useMemo(
    () =>
      isSingleDay
        ? groupByHour(rangeSales).map((g) => ({ date: g.key, sales: g.sales }))
        : groupByDate(rangeSales).map((g) => ({ date: g.key, sales: g.sales })),
    [rangeSales, isSingleDay]
  )

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
          <MetricCard icon={Wallet} label={`Sales — ${dateRange.label}`} value={inr(rangeTotalSales)} accent="sage" />
          <MetricCard icon={Package} label={`Units — ${dateRange.label}`} value={rangeTotalUnits.toLocaleString('en-IN')} accent="blue" />
          <MetricCard icon={ShoppingCart} label={`Orders — ${dateRange.label}`} value={rangeOrderCount.toLocaleString('en-IN')} accent="corn" />
          <MetricCard icon={CircleDollarSign} label={`Avg Order Value — ${dateRange.label}`} value={inr(rangeAOV)} accent="pink" />
        </div>
      </Reveal>

      <Reveal delay={120}>
        <div className="card p-5 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <h3 className="font-display text-lg">Sales Trend</h3>
            <span className="text-xs text-[var(--color-muted)]">{dateRange.label}</span>
          </div>
          <DateRangePicker asOf={asOfDate} onChange={setDateRange} />
          {isSingleDay
            ? <HourlyChart trend={trend} height={280} />
            : <TrendChart trend={trend} height={280} />
          }
        </div>
      </Reveal>

      <Reveal delay={160}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="card p-5">
            <h3 className="font-display text-lg mb-4">Channel Mix — {dateRange.label}</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--color-muted)] text-xs uppercase">
                  <th className="pb-2">Channel</th>
                  <th className="pb-2 text-right">Sales</th>
                  <th className="pb-2 text-right">Units</th>
                </tr>
              </thead>
              <tbody>
                {byChannel.map((c) => (
                  <tr key={c.key} className="border-t border-[var(--color-border)]">
                    <td className="py-2 flex items-center gap-2">
                      <ChannelBadge channel={c.key} />
                      {c.key}
                    </td>
                    <td className="py-2 text-right">{inr(c.sales)}</td>
                    <td className="py-2 text-right">{c.units}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card p-5">
            <h3 className="font-display text-lg mb-4">Brand Split — {dateRange.label}</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--color-muted)] text-xs uppercase">
                  <th className="pb-2">Brand</th>
                  <th className="pb-2 text-right">Sales</th>
                  <th className="pb-2 text-right">Units</th>
                </tr>
              </thead>
              <tbody>
                {byBrand.map((b) => (
                  <tr key={b.key} className="border-t border-[var(--color-border)]">
                    <td className="py-2">{b.key}</td>
                    <td className="py-2 text-right">{inr(b.sales)}</td>
                    <td className="py-2 text-right">{b.units}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Reveal>

      <Reveal delay={200}>
        <div className="card p-5">
          <h3 className="font-display text-lg mb-4">Top 10 SKUs — {dateRange.label}</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--color-muted)] text-xs uppercase">
                <th className="pb-2">#</th>
                <th className="pb-2">SKU</th>
                <th className="pb-2 text-right">Sales</th>
                <th className="pb-2 text-right">Units</th>
              </tr>
            </thead>
            <tbody>
              {topSkus.map((s, i) => (
                <tr key={s.key} className="border-t border-[var(--color-border)]">
                  <td className="py-2 text-[var(--color-muted)]">{i + 1}</td>
                  <td className="py-2">{s.key}</td>
                  <td className="py-2 text-right">{inr(s.sales)}</td>
                  <td className="py-2 text-right">{s.units}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>
    </PageLayout>
  )
}