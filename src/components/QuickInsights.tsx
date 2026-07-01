import { useMemo } from 'react'
import type { NormalizedSale } from '../types'
import { groupBy } from '../lib/aggregations'

interface Props {
  sales: NormalizedSale[]
  label: string
}

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

type InsightType = 'up' | 'down' | 'info' | 'warn'

interface Insight {
  type: InsightType
  text: string
}

const ICONS: Record<InsightType, string> = {
  up:   '🟢',
  down: '🔴',
  info: '🔵',
  warn: '🟠',
}

export function QuickInsights({ sales, label }: Props) {
  const insights = useMemo((): Insight[] => {
    if (sales.length === 0) return []

    const result: Insight[] = []
    const totalSales = sales.reduce((a, s) => a + s.invoiceAmount, 0)
    const totalUnits = sales.reduce((a, s) => a + s.qty, 0)

    // Top channel
    const byChannel = groupBy(sales, (s) => s.channel)
    if (byChannel.length > 0) {
      const top = byChannel[0]
      const pct = totalSales > 0 ? ((top.sales / totalSales) * 100).toFixed(0) : '0'
      result.push({ type: 'up', text: `${top.key} is the top channel at ${inr(top.sales)} (${pct}% of ${label} sales)` })
    }

    // Lowest channel
    if (byChannel.length > 1) {
      const worst = byChannel[byChannel.length - 1]
      result.push({ type: 'down', text: `${worst.key} has the lowest sales at ${inr(worst.sales)} this period` })
    }

    // Brand contribution
    const byBrand = groupBy(sales, (s) => s.brand).filter((b) => b.key !== 'Other')
    if (byBrand.length > 0 && totalSales > 0) {
      const top = byBrand[0]
      const pct = ((top.sales / totalSales) * 100).toFixed(0)
      result.push({ type: 'info', text: `${top.key} contributed ${pct}% of ${label} revenue (${inr(top.sales)})` })
    }

    // Best SKU
    const bySku = groupBy(sales, (s) => s.listingSku || s.skuCode || 'Unknown')
    if (bySku.length > 0) {
      const top = bySku[0]
      result.push({ type: 'up', text: `Best SKU: ${top.key} with ${inr(top.sales)} and ${top.units} units sold` })
    }

    // AOV
    if (sales.length > 0) {
      const aov = totalSales / sales.length
      result.push({ type: 'info', text: `Average order value this period: ${inr(aov)}` })
    }

    // Units insight
    result.push({ type: 'info', text: `Total ${totalUnits.toLocaleString('en-IN')} units sold across all channels this period` })

    return result.slice(0, 6)
  }, [sales, label])

  if (insights.length === 0) return null

  return (
    <div className="card p-5">
      <h3 className="font-display text-lg mb-4">Quick Insights — {label}</h3>
      <ul className="space-y-3">
        {insights.map((insight, i) => (
          <li key={i} className="flex items-start gap-3 text-sm">
            <span className="text-base shrink-0 mt-0.5">{ICONS[insight.type]}</span>
            <span className="text-[var(--color-charcoal)]">{insight.text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}