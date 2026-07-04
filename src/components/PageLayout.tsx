import type { ReactNode } from 'react'
import { useData } from '../lib/DataContext'
import { AsOfDatePicker } from './AsOfDatePicker'
import { ThemeToggle } from './ThemeToggle'
import { Notifications } from './Notifications'
import { GlobalSearch } from './GlobalSearch'
import { formatDisplayDate } from '../lib/dateLogic'
import { RefreshCw } from 'lucide-react'
import { LastSynced } from './LastSynced'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

export function PageLayout({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  const { loading, error, sales, stock, trueLatestDate, asOfDate, lastSyncedAt, refresh } = useData()
 const userName = localStorage.getItem('dashboard_user_name') || 'Team'

  return (
    <div className="flex-1 px-4 md:px-8 py-4 md:py-6 w-full max-w-[1400px] pt-16 md:pt-6">

      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">

        <div>
          <div className="text-sm text-[var(--color-muted)] mb-0.5">
            👋 {greeting()}, <span className="font-medium text-[var(--color-charcoal)]">{userName}</span>
          </div>
          <h1 className="font-display text-xl md:text-2xl text-[var(--color-charcoal)]">{title}</h1>
          {subtitle && (
            <p className="text-xs text-[var(--color-muted)] mt-0.5">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--color-sage-light)] text-[var(--color-sage-dark)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-sage)] animate-pulse inline-block" />
              Live
            </span>
            <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--color-smokeblue-light)] text-[#2454a8]">
              📦 {sales.length.toLocaleString()} orders
            </span>
            <span className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--color-corn-light)] text-[#8a6a1f]">
              📅 {formatDisplayDate(trueLatestDate)}
              <LastSynced at={lastSyncedAt} />
            </span>
          </div>

          <div className="w-px h-6 bg-[var(--color-border)] hidden sm:block" />

          <GlobalSearch sales={sales} />
          <Notifications sales={sales} stock={stock} asOfDate={asOfDate} />

          <button
            onClick={refresh}
            className="w-9 h-9 rounded-full flex items-center justify-center border border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-cream)] hover:text-[var(--color-sage-dark)] transition-colors"
            title="Refresh data"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>

          <div className="w-px h-6 bg-[var(--color-border)] hidden sm:block" />

          <AsOfDatePicker />
          <ThemeToggle />
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8 animate-pulse">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="card p-4 h-32 bg-[var(--color-border)]" />
          ))}
        </div>
      )}

      {error && (
        <div className="card p-6 bg-[var(--color-dustypink-light)] text-[#8a4a44]">
          Couldn't load data: {error}
        </div>
      )}

      {!loading && !error && children}
    </div>
  )
}