import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { LayoutDashboard, BarChart3, Store, Package, Boxes, Menu, X, User } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
  { to: '/overview', label: 'Sales Overview', icon: BarChart3 },
  { to: '/channel-brand', label: 'Channel & Brand', icon: Store },
  { to: '/products', label: 'Product & Stock', icon: Package },
  { to: '/inventory', label: 'Inventory', icon: Boxes },
]

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const userName = localStorage.getItem('dashboard_user_name') || 'Team'
  const initials = userName.slice(0, 2).toUpperCase()

  const navContent = (
    <>
      <div className="px-6 py-6 border-b border-[var(--color-border)] flex items-center gap-3">
        <div className="logo-card-sm">
          <img src="/assets/fashion1972ne-logo.png" alt="Fashion 1972NE" className="logo-cropped" />
        </div>
        <div>
          <div className="text-[10px] tracking-widest uppercase text-[var(--color-muted)]">
            dashboard
          </div>
          <div className="font-display text-lg text-[var(--color-sage-dark)] leading-tight">
            Fashion 1972NE
          </div>
        </div>
        <button
          className="ml-auto md:hidden text-[var(--color-muted)]"
          onClick={() => setMobileOpen(false)}
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 px-4 py-8 space-y-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                clsx(
                  'nav-item group flex items-center gap-3 px-4 py-4 rounded-xl text-base font-medium transition-colors',
                  isActive
                    ? 'bg-[var(--color-sage-light)] text-[var(--color-sage-dark)] shadow-sm'
                    : 'text-[var(--color-charcoal)] hover:bg-[var(--color-cream)]'
                )
              }
            >
              <Icon size={20} strokeWidth={2} className="transition-transform duration-200 group-hover:scale-110" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      {/* User Profile — #14 */}
      <div className="px-4 py-4 border-t border-[var(--color-border)]">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-[var(--color-cream)]">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ background: 'var(--color-sage)' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-[var(--color-charcoal)] truncate">{userName}</div>
            <div className="text-[11px] text-[var(--color-muted)]">Sales Team</div>
          </div>
          <User size={14} className="text-[var(--color-muted)] shrink-0" />
        </div>
        <div className="text-[11px] text-[var(--color-muted)] text-center mt-2">
          Data synced every 2 hours
        </div>
      </div>
    </>
  )

  return (
    <>
      <button
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-white border border-[var(--color-border)] flex items-center justify-center shadow-md"
        onClick={() => setMobileOpen(true)}
      >
        <Menu size={20} className="text-[var(--color-charcoal)]" />
      </button>

      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={clsx(
          'fixed top-0 left-0 h-full z-50 flex flex-col bg-white sidebar-panel transition-transform duration-300',
          'w-72 md:w-64',
          'md:sticky md:translate-x-0 md:shrink-0 md:h-screen md:flex',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {navContent}
      </aside>
    </>
  )
}
