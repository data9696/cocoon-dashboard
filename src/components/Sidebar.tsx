import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { LayoutDashboard, BarChart3, Store, Package, Boxes, Sparkles, Menu, X, LogOut, ShieldCheck, Pencil } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { getLocalAvatar } from '../lib/localAvatar'
import { ProfileModal } from './ProfileModal'

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
  { to: '/overview', label: 'Sales Overview', icon: BarChart3 },
  { to: '/channel-brand', label: 'Channel & Brand', icon: Store },
  { to: '/products', label: 'Product & Stock', icon: Package },
  { to: '/inventory', label: 'Inventory', icon: Boxes },
  { to: '/insights', label: 'Insights & AI', icon: Sparkles },
]

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const { profile, signOut } = useAuth()
  const displayName = profile?.full_name || profile?.email || 'Team'
  const initials = displayName.slice(0, 2).toUpperCase()
  const avatar = profile ? getLocalAvatar(profile.id) : null
  const subtitle = profile?.role || profile?.team || 'Team Member'

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

        {profile?.is_admin && (
          <NavLink
            to="/admin"
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
            <ShieldCheck size={20} strokeWidth={2} className="transition-transform duration-200 group-hover:scale-110" />
            Admin
          </NavLink>
        )}
      </nav>

      <div className="px-4 py-4 border-t border-[var(--color-border)]">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-[var(--color-cream)]">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 overflow-hidden"
            style={{ background: 'var(--color-sage)' }}
          >
            {avatar ? <img src={avatar} alt="Profile" className="w-full h-full object-cover" /> : initials}
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-[var(--color-charcoal)] truncate">{displayName}</div>
            <div className="text-[11px] text-[var(--color-muted)] truncate">{subtitle}</div>
          </div>

          <button
            onClick={() => setProfileModalOpen(true)}
            title="Edit profile"
            className="text-[var(--color-muted)] hover:text-[var(--color-sage-dark)] shrink-0"
          >
            <Pencil size={14} />
          </button>

          <button onClick={() => signOut()} title="Sign out" className="text-[var(--color-muted)] hover:text-[#dc2626] shrink-0">
            <LogOut size={16} />
          </button>
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

      {profileModalOpen && <ProfileModal onClose={() => setProfileModalOpen(false)} />}
    </>
  )
}
