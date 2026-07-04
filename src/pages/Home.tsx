import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ShoppingBag,
  CalendarDays,
  TrendingUp,
  Wallet,
  BarChart2,
  Crosshair,
  BarChart3,
  Store,
  Package,
} from 'lucide-react'
import { useData } from '../lib/DataContext'
import { PageLayout } from '../components/PageLayout'
import { MetricCard } from '../components/MetricCard'
import { TargetProgress } from '../components/TargetProgress'
import { ShareBar } from '../components/ShareBar'
import { BrandDonut } from '../components/BrandDonut'
import { QuickInsights } from '../components/QuickInsights'
import { CalendarHeatmap } from '../components/CalendarHeatmap'
import { MTMComparison } from '../components/MTMComparison'
import { FilteredTrendSection } from '../components/FilteredTrendSection'
import { WoWComparison } from '../components/WoWComparison'
import { SalesSummaryCard } from '../components/SalesSummaryCard'
import { resolveChannelStyle } from '../components/ChannelBadge'
import { Reveal } from '../components/Reveal'
import {
  dayOverDayWindows,
  weekOverWeekWindows,
  monthOverMonthWindows,
  yearToDateWindow,
  weightedRunRate,
  addDays,
  formatDisplayDate,
  formatShortDate,
} from '../lib/dateLogic'
import {
  buildMetricSummary,
  filterSales,
  sumSales,
  groupBy,
  groupByDate,
} from '../lib/aggregations'
import { BRAND_COLORS } from '../lib/brand'

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

const MONTHLY_TARGET = 10000000

const NAV_ITEMS = [
  { to: '/overview', icon: BarChart3, title: 'Sales Overview', desc: 'KPIs & Trends' },
  { to: '/channel-brand', icon: Store, title: 'Channel & Brand', desc: 'Marketplace Analysis' },
  { to: '/products', icon: Package, title: 'Product & Stock', desc: 'SKU Analytics' },
]

export function Home() {
  const { sales, asOfDate, trueLatestDate } = useData()
  const [homeBrandFilter, setHomeBrandFilter] = useState('All')

  const dod = useMemo(() => buildMetricSummary(sales, dayOverDayWindows(asOfDate)), [sales, asOfDate])
  const wow = useMemo(() => buildMetricSummary(sales, weekOverWeekWindows(asOfDate)), [sales, asOfDate])
  const ytdWindow = useMemo(() => yearToDateWindow(asOfDate), [asOfDate])
  const ytdSales = useMemo(() => sumSales(filterSales(sales, ytdWindow)), [sales, ytdWindow])
  const yesterdaySales = dod.prior

  const runRateValue = useMemo(
    () => weightedRunRate(sales.map((s) => ({ date: s.date, qty: s.qty })), asOfDate),
    [sales, asOfDate]
  )

  // Full month sales (1st to today)
  const monthTotalSales = useMemo(() => {
  const { start, end } = monthOverMonthWindows(asOfDate).current
  return sales
    .filter((s) => s.date >= start && s.date <= end)
    .reduce((a, s) => a + s.invoiceAmount, 0)
}, [sales, asOfDate])

  const trend = useMemo(() => {
    const since = addDays(asOfDate || trueLatestDate, -30)
    const last30 = sales.filter((s) => s.date >= since)
    const byDate = groupByDate(last30)
    return byDate.map((g) => {
      const daySales = last30.filter((s) => s.date === g.key)
      return {
        date: g.key,
        sales: g.sales,
        units: g.units,
        orders: new Set(daySales.map((s) => s.channelOrderId).filter(Boolean)).size,
      }
    })
  }, [sales, asOfDate, trueLatestDate])

  const sparklineValues = useMemo(() => trend.slice(-14).map((t) => t.sales), [trend])

  const monthSales = useMemo(
    () => filterSales(sales, monthOverMonthWindows(asOfDate).current),
    [sales, asOfDate]
  )

  const byBrand = useMemo(() => groupBy(monthSales, (s) => s.brand), [monthSales])
  const byChannel = useMemo(
    () => groupBy(monthSales, (s) => s.channel).slice(0, 5),
    [monthSales]
  )
  const channelTotal = byChannel.reduce((acc, c) => acc + c.sales, 0)

  // Pre-computed date labels
  const todayLabel = formatDisplayDate(asOfDate)
  const yesterdayLabel = formatDisplayDate(addDays(asOfDate, -1))
  const wtdWindows = weekOverWeekWindows(asOfDate)
  const wtdLabel = `${formatShortDate(wtdWindows.current.start)} – ${formatShortDate(asOfDate)}`
  const monthLabel = `1 ${new Date(asOfDate).toLocaleDateString('en-GB', { month: 'short' })} – ${formatShortDate(monthOverMonthWindows(asOfDate).current.end)}`
  const ytdLabel = `1 Jan – ${formatShortDate(asOfDate)}`

  return (
    <PageLayout title="Welcome back" subtitle="Cocoon Care & The Boo Boo Club">
      {/* KPI Cards */}
      <Reveal>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <MetricCard icon={ShoppingBag} label="Today" value={inr(dod.current)} rawValue={dod.current} changePct={dod.changePct} changeAmount={dod.changeAmount} accent="sage" sparkline={sparklineValues} dateLabel={todayLabel} />
          <MetricCard icon={CalendarDays} label="Yesterday" value={inr(yesterdaySales)} rawValue={yesterdaySales} accent="blue" sparkline={sparklineValues} dateLabel={yesterdayLabel} />
          <MetricCard icon={TrendingUp} label="This Week" value={inr(wow.current)} rawValue={wow.current} changePct={wow.changePct} changeAmount={wow.changeAmount} accent="purple" sparkline={sparklineValues} dateLabel={wtdLabel} />
          <MetricCard icon={Wallet} label="Month Sales" value={inr(monthTotalSales)} rawValue={monthTotalSales} accent="corn" sparkline={sparklineValues} dateLabel={monthLabel} />
          <MetricCard icon={BarChart2} label="Year Sales" value={inr(ytdSales)} rawValue={ytdSales} accent="emerald" sparkline={sparklineValues} dateLabel={ytdLabel} />
          <MetricCard icon={Crosshair} label="Run Rate (Wtd)" value={`${runRateValue.toFixed(1)} u/day`} rawValue={runRateValue} accent="orange" sparkline={sparklineValues} dateLabel="30d weighted avg" />
        </div>
      </Reveal>

      {/* Total Sales Summary Card with Brand Filter */}
      {/* Sales Summary Card */}
<Reveal delay={90}>
  <SalesSummaryCard
    sales={sales}
    asOfDate={asOfDate}
    label="This Month"
    onBrandChange={setHomeBrandFilter}
  />
</Reveal>

{/* MTM + WoW + Target */}
<Reveal delay={95}>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
    <MTMComparison
      sales={sales}
      asOfDate={asOfDate}
      brandFilter={homeBrandFilter}
    />

    <WoWComparison
      sales={sales}
      asOfDate={asOfDate}
      brandFilter={homeBrandFilter}
    />

    <TargetProgress
      current={monthTotalSales}
      target={MONTHLY_TARGET}
    />
  </div>
</Reveal>

      {/* Trend Chart + MTM Comparison + Target Progress */}
  <Reveal delay={100}>
      <FilteredTrendSection
    sales={sales}
    asOfDate={asOfDate}
     allChannels={Array.from(new Set(sales.map(s => s.channel))).sort()}
      title="Sales Trend"
      />
  </Reveal>

      {/* Calendar Heatmap */}
      <Reveal delay={130}>
        <div className="mb-8">
          <CalendarHeatmap sales={sales} asOf={asOfDate} weeks={12} />
        </div>
      </Reveal>

      {/* Brand + Marketplace Share */}
      <Reveal delay={150}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="card p-5">
            <h3 className="font-display text-lg mb-4">Brand Share — This Month</h3>
            <BrandDonut data={byBrand} colors={BRAND_COLORS} />
          </div>
          <div className="card p-5">
            <h3 className="font-display text-lg mb-4">Marketplace Share — Top 5</h3>
            {byChannel.map((c) => (
              <ShareBar
                key={c.key}
                label={c.key}
                pct={channelTotal > 0 ? (c.sales / channelTotal) * 100 : 0}
                color={resolveChannelStyle(c.key).fg.startsWith('var') ? 'var(--color-sage)' : resolveChannelStyle(c.key).fg}
              />
            ))}
          </div>
        </div>
      </Reveal>

      {/* Quick Insights */}
      <Reveal delay={200}>
        <div className="mb-8">
          <QuickInsights sales={monthSales} label="This Month" />
        </div>
      </Reveal>

      {/* Nav Cards */}
      <Reveal delay={250}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {NAV_ITEMS.map((t) => {
            const Icon = t.icon
            return (
              <Link key={t.to} to={t.to} className="card p-5 hover:shadow-md transition-shadow block">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-sage-light)] text-[var(--color-sage-dark)] flex items-center justify-center mb-3">
                  <Icon size={20} />
                </div>
                <h3 className="font-display text-lg mb-1">{t.title}</h3>
                <p className="text-sm text-[var(--color-muted)]">{t.desc}</p>
              </Link>
            )
          })}
        </div>
      </Reveal>
    </PageLayout>
  )
}
