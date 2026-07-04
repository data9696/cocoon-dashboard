import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { StockSnapshot } from '../types'
import { formatShortDate } from '../lib/dateLogic'
import { ShareBar } from './ShareBar'

const SHARE_COLORS = ['#15803d', '#2454a8', '#e3a9a0', '#e8c468', '#8fa6b8', '#f97316']

interface Props {
  latestStock: StockSnapshot[]
  allStock: StockSnapshot[]
}

export function InventoryCharts({ latestStock, allStock }: Props) {
  const topStock = [...latestStock]
    .map((s) => ({
      label: s.sku_code || s.sku_id || '—',
      name: s.name || s.sku_code || s.sku_id || '—',
      value: Number(s.in_stock) || 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 12)

  const byDate = new Map<string, number>()
  for (const s of allStock) {
    const key = s.snapshot_date
    if (!key) continue
    byDate.set(key, (byDate.get(key) || 0) + (Number(s.in_stock) || 0))
  }
  const trend = Array.from(byDate.entries())
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => (a.date < b.date ? -1 : 1))

  const totalStock = topStock.reduce((a, s) => a + s.value, 0)
  const shareRows = topStock.slice(0, 6).map((s) => ({
    label: s.name,
    pct: totalStock > 0 ? (s.value / totalStock) * 100 : 0,
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card p-5 lg:col-span-2">
        <h3 className="font-display text-lg mb-4">Stock Share — Top 6 SKUs</h3>
        {shareRows.map((row, i) => (
          <ShareBar key={row.label} label={row.label} pct={row.pct} color={SHARE_COLORS[i % SHARE_COLORS.length]} />
        ))}
      </div>

      <div className="card p-5">
        <h3 className="font-display text-lg mb-4">Top 12 SKUs by Current Stock</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={topStock} layout="vertical" margin={{ left: 10, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="label" width={90} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: any) => Number(v).toLocaleString('en-IN')} />            <Bar dataKey="value" fill="#15803d" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card p-5">
        <h3 className="font-display text-lg mb-4">Total Stock Trend</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={trend} margin={{ left: 0, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
            labelFormatter={(d) => formatShortDate(d as string)}
           formatter={(v: any) => Number(v).toLocaleString('en-IN')}
/>
            <Line type="monotone" dataKey="total" stroke="#2454a8" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
