import type { ReactNode } from 'react'
import { useData } from '../lib/DataContext'
import { AsOfDatePicker } from './AsOfDatePicker'
import { ThemeToggle } from './ThemeToggle'
import { formatDisplayDate } from '../lib/dateLogic'

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
  const { loading, error, sales, trueLatestDate } = useData()
  const userName = localStorage.getItem('dashboard_user_name') || 'Team'

  return (
    <div className="flex-1 px-4 md:px-8 py-4 md:py-6 w-full max-w-[1400px] pt-16 md:pt-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-3 flex-wrap">
        <div>
          <div className="text-sm text-[var(--color-muted)] mb-1">
            👋 {greeting()}, {userName}
          </div>
          <h1 className="font-display text-xl md:text-2xl text-[var(--color-charcoal)]">{title}</h1>
          {subtitle && (
            <p className="text-xs md:text-sm text-[var(--color-muted)] mt-1">{subtitle}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--color-sage-light)] text-[var(--color-sage-dark)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-sage)] animate-pulse inline-block" />
              Live
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--color-smokeblue-light)] text-[#2454a8]">
              📦 {sales.length.toLocaleString()}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--color-corn-light)] text-[#8a6a1f]">
              📅 {formatDisplayDate(trueLatestDate)}
            </span>
          </div>
          <AsOfDatePicker />
          <ThemeToggle />
        </div>
      </div>

      {loading && (
        <div className="card p-10 text-center text-[var(--color-muted)]">
          Loading sales data…
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