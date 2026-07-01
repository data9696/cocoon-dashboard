import { useMemo } from 'react'
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
import { TrendChart } from '../components/TrendChart'
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

const MONTHLY_TARGET = 10000000 // Adjust this to your real monthly revenue target.

const NAV_ITEMS = [
  { to: '/overview', icon: BarChart3, title: 'Sales Overview', desc: 'KPIs & Trends' },
  { to: '/channel-brand', icon: Store, title: 'Channel & Brand', desc: 'Marketplace Analysis' },
  { to: '/products', icon: Package, title: 'Product & Stock', desc: 'SKU Analytics' },
]

export function Home() {
  const { sales, asOfDate, trueLatestDate } = useData()

  const dod = useMemo(() => buildMetricSummary(sales, dayOverDayWindows(asOfDate)), [sales, asOfDate])
  const wow = useMemo(() => buildMetricSummary(sales, weekOverWeekWindows(asOfDate)), [sales, asOfDate])
  const mom = useMemo(() => buildMetricSummary(sales, monthOverMonthWindows(asOfDate)), [sales, asOfDate])
  const ytdWindow = useMemo(() => yearToDateWindow(asOfDate), [asOfDate])
  const ytdSales = useMemo(() => sumSales(filterSales(sales, ytdWindow)), [sales, ytdWindow])
  const yesterdaySales = dod.prior

  // Weighted Run Rate = (30d×17%) + (15d×33%) + (7d×50%) — units/day
  const runRateValue = useMemo(
    () => weightedRunRate(sales.map((s) => ({ date: s.date, qty: s.qty })), asOfDate),
    [sales, asOfDate]
  )

  const trend = useMemo(() => {
    const since = addDays(asOfDate || trueLatestDate, -30)
    const last30 = sales.filter((s) => s.date >= since)
    return groupByDate(last30).map((g) => ({ date: g.key, sales: g.sales }))
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

  const insights = useMemo(() => {
    const lines: string[] = []
    const channelsRanked = groupBy(monthSales, (s) => s.channel)
    if (channelsRanked.length > 0) {
      const best = channelsRanked[0]
      lines.push(`${best.key} is your top channel this month at ${inr(best.sales)}`)
    }
    if (channelsRanked.length > 1) {
      const worst = channelsRanked[channelsRanked.length - 1]
      lines.push(`${worst.key} is the lowest channel this month at ${inr(worst.sales)}`)
    }
    const brandTotal = byBrand.reduce((acc, b) => acc + b.sales, 0)
    if (byBrand.length > 0 && brandTotal > 0) {
      const top = byBrand[0]
      lines.push(`${top.key} contributed ${((top.sales / brandTotal) * 100).toFixed(0)}% of this month's sales`)
    }
    const topSku = groupBy(monthSales, (s) => s.listingSku || s.skuCode || 'Unknown')[0]
    if (topSku) {
      lines.push(`Best-selling SKU this month: ${topSku.key} (${inr(topSku.sales)})`)
    }
    if (mom.changePct !== null) {
      lines.push(
        `Month-to-date is ${mom.changePct >= 0 ? 'up' : 'down'} ${Math.abs(mom.changePct).toFixed(1)}% vs the same point last month`
      )
    }
    return lines
  }, [monthSales, byBrand, mom.changePct])

  const userName = localStorage.getItem('dashboard_user_name') || ''

  return (
    <PageLayout title={`Welcome back${userName ? `, ${userName}` : ''} 👋`} subtitle={`Fashion 1972NE · Cocoon Care & The Boo Boo Club · Last sync: ${formatDisplayDate(trueLatestDate)}`}>
      <Reveal>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <MetricCard icon={ShoppingBag} label="Today" value={inr(dod.current)} changePct={dod.changePct} changeAmount={dod.changeAmount} accent="sage" sparkline={sparklineValues} />
          <MetricCard icon={CalendarDays} label="Yesterday" value={inr(yesterdaySales)} accent="blue" sparkline={sparklineValues} />
          <MetricCard icon={TrendingUp} label="WTD" value={inr(wow.current)} changePct={wow.changePct} changeAmount={wow.changeAmount} accent="purple" sparkline={sparklineValues} />
          <MetricCard icon={Wallet} label="MTD" value={inr(mom.current)} changePct={mom.changePct} changeAmount={mom.changeAmount} accent="corn" sparkline={sparklineValues} />
          <MetricCard icon={BarChart2} label="YTD" value={inr(ytdSales)} accent="emerald" sparkline={sparklineValues} />
          <MetricCard icon={Crosshair} label="Run Rate (Wtd)" value={`${runRateValue.toFixed(1)} u/day`} accent="orange" sparkline={sparklineValues} />
        </div>
      </Reveal>

      <Reveal delay={100}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="card p-5 lg:col-span-2">
            <h3 className="font-display text-lg mb-4">30-Day Sales Trend</h3>
            <TrendChart trend={trend} />
          </div>
          <TargetProgress current={mom.current} target={MONTHLY_TARGET} />
        </div>
      </Reveal>

      <Reveal delay={150}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="card p-5">
            <h3 className="font-display text-lg mb-4">Brand Share — This Month</h3>
            <BrandDonut data={byBrand} colors={BRAND_COLORS} />
          </div>
          <div className="card p-5">
            <h3 className="font-display text-lg mb-4">Marketplace Share — This Month (Top 5)</h3>
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

      <Reveal delay={200}>
        <div className="card p-5 mb-8">
          <h3 className="font-display text-lg mb-4">Quick Insights</h3>
          <ul className="space-y-2 text-sm">
            {insights.map((line, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-[var(--color-sage-dark)]">✓</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

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