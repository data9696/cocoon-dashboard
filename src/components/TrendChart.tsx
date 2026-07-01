import { useState } from 'react'
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatShortDate, formatDisplayDate } from '../lib/dateLogic'

interface TrendPoint {
  date: string
  sales: number
  units?: number
  orders?: number
}

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

const UP_COLOR = '#16a34a'
const DOWN_COLOR = '#dc2626'

type Metric = 'sales' | 'units' | 'orders'

const METRICS: { key: Metric; label: string; format: (v: number) => string; color: string }[] = [
  { key: 'sales',  label: 'Revenue', format: inr,    color: '#16a34a' },
  { key: 'units',  label: 'Units',   format: (v) => v.toLocaleString('en-IN'), color: '#2454a8' },
  { key: 'orders', label: 'Orders',  format: (v) => v.toLocaleString('en-IN'), color: '#6d28d9' },
]

export function TrendChart({ trend, height = 220 }: { trend: TrendPoint[]; height?: number }) {
  const [metric, setMetric] = useState<Metric>('sales')
  const activeMetric = METRICS.find((m) => m.key === metric)!

  if (!trend || trend.length === 0) {
    return (
      <div className="flex items-center justify-center text-[var(--color-muted)] text-sm" style={{ height }}>
        No data for this period
      </div>
    )
  }

  const indexed = trend.map((t, i) => ({ idx: i, date: t.date, value: (t[metric] ?? 0) as number }))

  const segments: { data: typeof indexed; color: string }[] = []
  for (let i = 1; i < indexed.length; i++) {
    const prev = indexed[i - 1]
    const cur = indexed[i]
    segments.push({
      data: [prev, cur],
      color: cur.value >= prev.value ? UP_COLOR : DOWN_COLOR,
    })
  }

  const gradientId = `trendGrad-${metric}`

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => setMetric(m.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              metric === m.key
                ? 'text-white shadow-md scale-105'
                : 'bg-[var(--color-cream)] border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-charcoal)]'
            }`}
            style={metric === m.key ? { background: m.color } : {}}
          >
            {m.label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={indexed}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={activeMetric.color} stopOpacity={0.15} />
              <stop offset="100%" stopColor={activeMetric.color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="idx"
            type="number"
            domain={[0, Math.max(indexed.length - 1, 1)]}
            allowDecimals={false}
            tick={{ fontSize: 11 }}
            tickFormatter={(idx) => (indexed[idx] ? formatShortDate(indexed[idx].date) : '')}
            minTickGap={30}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v) =>
              metric === 'sales' ? `₹${(v / 1000).toFixed(0)}k` : v.toLocaleString('en-IN')
            }
          />
          <Tooltip
            formatter={(v) => [activeMetric.format(Number(v)), activeMetric.label]}
            labelFormatter={(idx) => (indexed[idx] ? formatDisplayDate(indexed[idx].date) : '')}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="none"
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
          />
          {segments.map((seg, i) => (
            <Line
              key={i}
              data={seg.data}
              dataKey="value"
              stroke={seg.color}
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
              legendType="none"
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}