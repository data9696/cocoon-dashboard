import { useMemo, useState } from 'react'
import { ShoppingBag, CalendarDays, TrendingUp, Wallet, BarChart2, Crosshair, Package, ShoppingCart, CircleDollarSign } from 'lucide-react'
import { useData } from '../lib/DataContext'
import { PageLayout } from '../components/PageLayout'
import { MetricCard } from '../components/MetricCard'
import { ChannelBadge } from '../components/ChannelBadge'
import { FilteredTrendSection } from '../components/FilteredTrendSection'
import { Reveal } from '../components/Reveal'
import { MTMComparison } from '../components/MTMComparison'
import { WoWComparison } from '../components/WoWComparison'
import { SalesSummaryCard } from '../components/SalesSummaryCard'
import {
  dayOverDayWindows,
  weekOverWeekWindows,
  monthOverMonthWindows,
  yearToDateWindow,
  weightedRunRate,
  formatDisplayDate,
  formatShortDate,
  addDays,
  firstOfMonth,
} from '../lib/dateLogic'
import {
  buildMetricSummary,
  filterSales,
  sumSales,
  groupBy,
  groupByDate,
} from '../lib/aggregations'

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

export function SalesOverview() {
  const { sales, asOfDate } = useData()
  const [overviewBrandFilter, setOverviewBrandFilter] = useState('All')

  const dod = useMemo(() => buildMetricSummary(sales, dayOverDayWindows(asOfDate)), [sales, asOfDate])
  const wow = useMemo(() => buildMetricSummary(sales, weekOverWeekWindows(asOfDate)), [sales, asOfDate])

  const monthTotalSales = useMemo(() => {
    const { start } = monthOverMonthWindows(asOfDate).current
    return sales
      .filter((s) => s.date >= start && s.date <= asOfDate)
      .reduce((a, s) => a + s.invoiceAmount, 0)
  }, [sales, asOfDate])

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

  const allChannels = useMemo(() =>
    Array.from(new Set(sales.map((s) => s.channel))).filter(Boolean).sort(),
    [sales]
  )

  const monthSales = useMemo(
    () => filterSales(sales, { start: firstOfMonth(asOfDate), end: asOfDate }),
    [sales, asOfDate]
  )

  const byChannel = useMemo(() => groupBy(monthSales, (s) => s.channel), [monthSales])
  const byBrand = useMemo(() => groupBy(monthSales, (s) => s.brand), [monthSales])
  const topSkus = useMemo(
    () => groupBy(monthSales, (s) => s.listingSku || s.skuCode || 'Unknown').slice(0, 10),
    [monthSales]
  )

  const rangeTotalSales = monthSales.reduce((a, s) => a + s.invoiceAmount, 0)
  const rangeTotalUnits = monthSales.reduce((a, s) => a + s.qty, 0)
  const rangeOrderCount = new Set(monthSales.map((s) => s.channelOrderId).filter(Boolean)).size
  const rangeAOV = monthSales.length > 0 ? rangeTotalSales / monthSales.length : 0

  const wtdLabel = `${formatShortDate(weekOverWeekWindows(asOfDate).current.start)} – ${formatShortDate(asOfDate)}`
  const monthLabel = `1 ${new Date(asOfDate).toLocaleDateString('en-GB', { month: 'short' })} – ${formatShortDate(asOfDate)}`

  return (
    <PageLayout
      title="Sales Overview"
      subtitle={`As of ${formatDisplayDate(asOfDate)} · ${sales.length.toLocaleString()} order line items loaded`}
    >
      {/* KPI Cards */}
      <Reveal>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <MetricCard icon={ShoppingBag} label="Today" value={inr(dod.current)} rawValue={dod.current} changePct={dod.changePct} changeAmount={dod.changeAmount} accent="sage" sparkline={sparklineValues} dateLabel={formatDisplayDate(asOfDate)} />
          <MetricCard icon={CalendarDays} label="Yesterday" value={inr(dod.prior)} rawValue={dod.prior} accent="blue" sparkline={sparklineValues} dateLabel={formatDisplayDate(addDays(asOfDate, -1))} />
          <MetricCard icon={TrendingUp} label="This Week" value={inr(wow.current)} rawValue={wow.current} changePct={wow.changePct} changeAmount={wow.changeAmount} accent="purple" sparkline={sparklineValues} dateLabel={wtdLabel} />
          <MetricCard icon={Wallet} label="Month Sales" value={inr(monthTotalSales)} rawValue={monthTotalSales} accent="corn" sparkline={sparklineValues} dateLabel={monthLabel} />
          <MetricCard icon={BarChart2} label="Year Sales" value={inr(ytdSales)} rawValue={ytdSales} accent="emerald" sparkline={sparklineValues} dateLabel={`1 Jan – ${formatShortDate(asOfDate)}`} />
          <MetricCard icon={Crosshair} label="Run Rate" value={`${runRateValue.toFixed(1)} u/day`} rawValue={runRateValue} accent="orange" sparkline={sparklineValues} dateLabel="30d weighted avg" />
        </div>
      </Reveal>

      {/* Range summary cards */}
      <Reveal delay={80}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <MetricCard icon={Wallet} label="Sales — This Month" value={inr(rangeTotalSales)} accent="sage" />
          <MetricCard icon={Package} label="Units — This Month" value={rangeTotalUnits.toLocaleString('en-IN')} accent="blue" />
          <MetricCard icon={ShoppingCart} label="Orders — This Month" value={rangeOrderCount.toLocaleString('en-IN')} accent="corn" />
          <MetricCard icon={CircleDollarSign} label="Avg Order Value" value={inr(rangeAOV)} accent="pink" />
        </div>
      </Reveal>

      {/* Sales Summary with brand filter */}
      <Reveal delay={100}>
        <SalesSummaryCard
          sales={monthSales}
          label="This Month"
          onBrandChange={setOverviewBrandFilter}
        />
      </Reveal>

      {/* MTM + WoW side by side */}
      <Reveal delay={105}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <MTMComparison sales={sales} asOfDate={asOfDate} brandFilter={overviewBrandFilter} />
          <WoWComparison sales={sales} asOfDate={asOfDate} brandFilter={overviewBrandFilter} />
        </div>
      </Reveal>

      {/* Filtered Trend Chart — same as Home */}
      <Reveal delay={120}>
        <FilteredTrendSection
          sales={sales}
          asOfDate={asOfDate}
          allChannels={allChannels}
          title="Sales Trend"
        />
      </Reveal>

      {/* Channel + Brand tables */}
      <Reveal delay={160}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="card p-5">
            <h3 className="font-display text-lg mb-4">Channel Mix — This Month</h3>
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
            <h3 className="font-display text-lg mb-4">Brand Split — This Month</h3>
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

      {/* Top SKUs */}
      <Reveal delay={200}>
        <div className="card p-5">
          <h3 className="font-display text-lg mb-4">Top 10 SKUs — This Month</h3>
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
