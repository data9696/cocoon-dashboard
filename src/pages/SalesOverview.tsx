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
import { AvgSellingPriceCard } from '../components/AvgSellingPriceCard'
import {
  monthOverMonthWindows,
  weekOverWeekWindows,
  formatDisplayDate,
  formatShortDate,
  addDays,
} from '../lib/dateLogic'
import { filterSales, groupBy } from '../lib/aggregations'
import {
  yesterdayFromSummary,
  weekOverWeekFromSummary,
  monthOverMonthFromSummary,
  ytdFromSummary,
  weightedRunRateFromSummary,
  groupByBrandFromSummary,
  groupByChannelFromSummary,
  groupByDateFromSummary,
} from '../lib/summaryAggregations'

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

export function SalesOverview() {
  const { sales, todaySales, dailySummary, skuStyleMap, asOfDate } = useData()
  const [overviewBrandFilter, setOverviewBrandFilter] = useState('All')

  const todayTotal = useMemo(() => todaySales.reduce((a, s) => a + s.invoiceAmount, 0), [todaySales])
  const yesterdaySummary = useMemo(() => yesterdayFromSummary(dailySummary, asOfDate), [dailySummary, asOfDate])
  const yesterdaySales = yesterdaySummary.sales
  const dodChangeAmount = todayTotal - yesterdaySales
  const dodChangePct = yesterdaySales > 0 ? (dodChangeAmount / yesterdaySales) * 100 : null

  const wowSummary = useMemo(() => weekOverWeekFromSummary(dailySummary, asOfDate), [dailySummary, asOfDate])
  const wowChangeAmount = wowSummary.current.sales - wowSummary.prior.sales
  const wowChangePct = wowSummary.prior.sales > 0 ? (wowChangeAmount / wowSummary.prior.sales) * 100 : null

  const mtmSummary = useMemo(() => monthOverMonthFromSummary(dailySummary, asOfDate), [dailySummary, asOfDate])
  const monthTotalSales = mtmSummary.current.sales

  const ytdSales = useMemo(() => ytdFromSummary(dailySummary, asOfDate).sales, [dailySummary, asOfDate])

  const runRateValue = useMemo(() => weightedRunRateFromSummary(dailySummary, asOfDate), [dailySummary, asOfDate])

  const sparklineValues = useMemo(() => {
    const yesterday = addDays(asOfDate, -1)
    const since = addDays(yesterday, -13)
    const daily = groupByDateFromSummary(dailySummary, since, yesterday)
    return [...daily.map((d) => d.sales), todayTotal]
  }, [dailySummary, asOfDate, todayTotal])

  const allChannels = useMemo(() =>
    Array.from(new Set(sales.map((s) => s.channel))).filter(Boolean).sort(),
    [sales]
  )

  const monthSales = useMemo(
    () => filterSales(sales, monthOverMonthWindows(asOfDate).current),
    [sales, asOfDate]
  )
  const topSkus = useMemo(
    () => groupBy(monthSales, (s) => s.listingSku || s.skuCode || 'Unknown').slice(0, 10),
    [monthSales]
  )

  const byChannel = useMemo(
    () => groupByChannelFromSummary(dailySummary, mtmSummary.currentWindow.start, mtmSummary.currentWindow.end),
    [dailySummary, mtmSummary]
  )
  const byBrand = useMemo(
    () => groupByBrandFromSummary(dailySummary, mtmSummary.currentWindow.start, mtmSummary.currentWindow.end),
    [dailySummary, mtmSummary]
  )

  const rangeTotalSales = mtmSummary.current.sales
  const rangeTotalUnits = mtmSummary.current.units
  const rangeOrderCount = mtmSummary.current.orders
  const rangeAOV = rangeOrderCount > 0 ? rangeTotalSales / rangeOrderCount : 0

  const wtdLabel = `${formatShortDate(weekOverWeekWindows(asOfDate).current.start)} – ${formatShortDate(wowSummary.currentWindow.end)}`
  const monthLabel = `1 ${new Date(asOfDate).toLocaleDateString('en-GB', { month: 'short' })} – ${formatShortDate(mtmSummary.currentWindow.end)}`

  return (
    <PageLayout
      title="Sales Overview"
      subtitle={`As of ${formatDisplayDate(asOfDate)} · ${sales.length.toLocaleString()} recent order line items loaded`}
    >
      <Reveal>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <MetricCard icon={ShoppingBag} label="Today" value={inr(todayTotal)} rawValue={todayTotal} changePct={dodChangePct ?? undefined} changeAmount={dodChangeAmount} accent="sage" sparkline={sparklineValues} dateLabel={formatDisplayDate(asOfDate)} />
          <MetricCard icon={CalendarDays} label="Yesterday" value={inr(yesterdaySales)} rawValue={yesterdaySales} accent="blue" sparkline={sparklineValues} dateLabel={formatDisplayDate(addDays(asOfDate, -1))} />
          <MetricCard icon={TrendingUp} label="This Week" value={inr(wowSummary.current.sales)} rawValue={wowSummary.current.sales} changePct={wowChangePct ?? undefined} changeAmount={wowChangeAmount} accent="purple" sparkline={sparklineValues} dateLabel={wtdLabel} />
          <MetricCard icon={Wallet} label="Month Sales" value={inr(monthTotalSales)} rawValue={monthTotalSales} accent="corn" sparkline={sparklineValues} dateLabel={monthLabel} />
          <MetricCard icon={BarChart2} label="Year Sales" value={inr(ytdSales)} rawValue={ytdSales} accent="emerald" sparkline={sparklineValues} dateLabel={`1 Jan – ${formatShortDate(addDays(asOfDate, -1))}`} />
          <MetricCard icon={Crosshair} label="Run Rate" value={`${runRateValue.toFixed(1)} u/day`} rawValue={runRateValue} accent="orange" sparkline={sparklineValues} dateLabel="30d weighted avg" />
        </div>
      </Reveal>

      <Reveal delay={80}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <MetricCard icon={Wallet} label="Sales — This Month" value={inr(rangeTotalSales)} accent="sage" />
          <MetricCard icon={Package} label="Units — This Month" value={rangeTotalUnits.toLocaleString('en-IN')} accent="blue" />
          <MetricCard icon={ShoppingCart} label="Orders — This Month" value={rangeOrderCount.toLocaleString('en-IN')} accent="corn" />
          <MetricCard icon={CircleDollarSign} label="Avg Order Value" value={inr(rangeAOV)} accent="pink" />
        </div>
      </Reveal>

      <Reveal delay={100}>
        <SalesSummaryCard
          sales={sales}
          asOfDate={asOfDate}
          label="This Month"
          onBrandChange={setOverviewBrandFilter}
        />
      </Reveal>

      <Reveal delay={102}>
        <div className="mb-6">
          <AvgSellingPriceCard
            sales={sales}
            skuStyleMap={skuStyleMap}
            asOfDate={asOfDate}
          />
        </div>
      </Reveal>

      <Reveal delay={105}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <MTMComparison sales={sales} asOfDate={asOfDate} brandFilter={overviewBrandFilter} />
          <WoWComparison sales={sales} asOfDate={asOfDate} brandFilter={overviewBrandFilter} />
        </div>
      </Reveal>

      <Reveal delay={120}>
        <FilteredTrendSection
          sales={sales}
          asOfDate={asOfDate}
          allChannels={allChannels}
          title="Sales Trend"
        />
      </Reveal>

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
