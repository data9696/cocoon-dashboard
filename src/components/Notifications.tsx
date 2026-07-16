import { useState, useMemo } from 'react'
import { Bell, X, TrendingDown, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import type { NormalizedSale } from '../types'
import type { StockSnapshot } from '../types'
import { monthOverMonthWindows, dayOverDayWindows } from '../lib/dateLogic'
import { filterSales, sumSales } from '../lib/aggregations'

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

type AlertType = 'danger' | 'warning' | 'success' | 'info'

interface Alert {
  id: string
  type: AlertType
  title: string
  message: string
  time: string
}

const ICONS: Record<AlertType, typeof TrendingDown> = {
  danger: TrendingDown,
  warning: AlertTriangle,
  success: CheckCircle,
  info: Info,
}

const COLORS: Record<AlertType, { bg: string; text: string; icon: string }> = {
  danger:  { bg: '#fee2e2', text: '#991b1b', icon: '#dc2626' },
  warning: { bg: '#fef3c7', text: '#92400e', icon: '#d97706' },
  success: { bg: '#dcfce7', text: '#166534', icon: '#16a34a' },
  info:    { bg: '#dbeafe', text: '#1e40af', icon: '#2563eb' },
}

export function Notifications({ sales, stock, asOfDate }: { sales: NormalizedSale[]; stock: StockSnapshot[]; asOfDate: string }) {
  const [open, setOpen] = useState(false)

  const alerts = useMemo((): Alert[] => {
    const result: Alert[] = []

    const dod = dayOverDayWindows(asOfDate)
    const todaySales = sumSales(filterSales(sales, dod.current))
    const yesterdaySales = sumSales(filterSales(sales, dod.prior))
    if (yesterdaySales > 0) {
      const drop = ((todaySales - yesterdaySales) / yesterdaySales) * 100
      if (drop < -30) {
        result.push({ id: 'today-drop', type: 'danger', title: 'Sales Drop Alert', message: `Today's sales (${inr(todaySales)}) are down ${Math.abs(drop).toFixed(0)}% vs yesterday (${inr(yesterdaySales)})`, time: 'Just now' })
      }
    }

    const mtm = monthOverMonthWindows(asOfDate)
    const thisMTM = sumSales(filterSales(sales, mtm.current))
    const lastMTM = sumSales(filterSales(sales, mtm.prior))
    if (lastMTM > 0) {
      const change = ((thisMTM - lastMTM) / lastMTM) * 100
      if (change >= 10) {
        result.push({ id: 'mtm-up', type: 'success', title: 'Month-on-Month Growth', message: `Sales this month are up ${change.toFixed(0)}% vs same period last month 🎉`, time: 'Today' })
      } else if (change < -20) {
        result.push({ id: 'mtm-down', type: 'warning', title: 'Month-on-Month Decline', message: `Sales this month are down ${Math.abs(change).toFixed(0)}% vs same period last month`, time: 'Today' })
      }
    }

    const latestDate = stock.reduce((max, s) => s.snapshot_date > max ? s.snapshot_date : max, '')
    const latestStock = stock.filter((s) => s.snapshot_date === latestDate)
    const lowStockItems = latestStock.filter((s) => { const qty = Number(s.in_stock) || 0; return qty > 0 && qty <= 5 })
    if (lowStockItems.length > 0) {
      result.push({ id: 'low-stock', type: 'warning', title: 'Low Stock Alert', message: `${lowStockItems.length} SKU${lowStockItems.length > 1 ? 's are' : ' is'} critically low (≤5 units): ${lowStockItems.slice(0, 2).map((s) => s.sku_code).join(', ')}${lowStockItems.length > 2 ? ` +${lowStockItems.length - 2} more` : ''}`, time: 'Today' })
    }

    const outOfStock = latestStock.filter((s) => (Number(s.in_stock) || 0) === 0)
    if (outOfStock.length > 0) {
      result.push({ id: 'out-of-stock', type: 'danger', title: 'Out of Stock', message: `${outOfStock.length} SKU${outOfStock.length > 1 ? 's are' : ' is'} completely out of stock`, time: 'Today' })
    }

    const byChannel = new Map<string, number>()
    for (const s of filterSales(sales, mtm.current)) {
      byChannel.set(s.channel, (byChannel.get(s.channel) ?? 0) + s.invoiceAmount)
    }
    const topChannel = [...byChannel.entries()].sort((a, b) => b[1] - a[1])[0]
    if (topChannel) {
      result.push({ id: 'top-channel', type: 'info', title: 'Top Channel This Month', message: `${topChannel[0]} is leading with ${inr(topChannel[1])} in sales`, time: 'This month' })
    }

    return result
  }, [sales, stock, asOfDate])

  const unread = alerts.length

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-9 h-9 rounded-full flex items-center justify-center border border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-cream)] transition-colors"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#dc2626] text-white text-[9px] flex items-center justify-center font-bold">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="fixed sm:absolute inset-x-4 sm:inset-x-auto sm:right-0 top-20 sm:top-11 w-auto sm:w-80 max-w-full bg-[var(--color-surface)] rounded-2xl shadow-xl border border-[var(--color-border)] z-40 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
              <span className="font-display text-base">Notifications</span>
              <button onClick={() => setOpen(false)} className="text-[var(--color-muted)]"><X size={16} /></button>
            </div>
            {alerts.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-[var(--color-muted)]">No alerts right now 🎉</div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {alerts.map((alert) => {
                  const Icon = ICONS[alert.type]
                  const colors = COLORS[alert.type]
                  return (
                    <div key={alert.id} className="px-4 py-3 border-b border-[var(--color-border)] last:border-0">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: colors.bg }}>
                          <Icon size={14} style={{ color: colors.icon }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[var(--color-charcoal)]">{alert.title}</div>
                          <div className="text-xs text-[var(--color-muted)] mt-0.5 leading-relaxed">{alert.message}</div>
                          <div className="text-[10px] text-[var(--color-muted)] mt-1 opacity-60">{alert.time}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}