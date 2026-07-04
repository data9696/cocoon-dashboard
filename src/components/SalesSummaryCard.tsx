import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import type { NormalizedSale } from '../types'
import { addDays, firstOfMonth } from '../lib/dateLogic'
import { createPortal } from 'react-dom'

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')
const BRANDS = ['All', 'Cocoon Care', 'The Boo Boo Club']

const DATE_OPTIONS = [
  { key: 'thisMonth', label: 'This Month' },
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last7', label: 'Last 7 Days' },
  { key: 'last15', label: 'Last 15 Days' },
  { key: 'custom', label: 'Custom Range' },
]

interface Props {
  sales: NormalizedSale[]
  asOfDate: string
  label: string
  onBrandChange?: (brand: string) => void
}

export function SalesSummaryCard({ sales, asOfDate, label, onBrandChange }: Props) {
  const [brand, setBrand] = useState('All')
  const [dateKey, setDateKey] = useState('thisMonth')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      const insideButton = dropRef.current?.contains(target)
      const insideMenu = menuRef.current?.contains(target)
      if (!insideButton && !insideMenu) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filteredSales = (() => {
    let s = sales
    if (asOfDate) {
      const yesterday = addDays(asOfDate, -1)
      const ranges: Record<string, { start: string; end: string }> = {
        thisMonth: { start: firstOfMonth(asOfDate), end: yesterday },
        today: { start: asOfDate, end: asOfDate },
        yesterday: { start: yesterday, end: yesterday },
        last7: { start: addDays(asOfDate, -7), end: asOfDate },
        last15: { start: addDays(asOfDate, -15), end: asOfDate },
        custom: { start: customStart || asOfDate, end: customEnd || asOfDate },
      }
      const r = ranges[dateKey]
      if (r) s = s.filter(x => x.date >= r.start && x.date <= r.end)
    }
    if (brand !== 'All') s = s.filter(x => x.brand === brand)
    return s
  })()

  const total = filteredSales.reduce((a, s) => a + s.invoiceAmount, 0)
  const units = filteredSales.reduce((a, s) => a + s.qty, 0)
  const orders = new Set(filteredSales.map((s) => s.channelOrderId).filter(Boolean)).size
  const activeLabel = DATE_OPTIONS.find(d => d.key === dateKey)?.label ?? label

  function handleBrand(b: string) {
    setBrand(b)
    onBrandChange?.(b)
  }

  return (
    <div className="card p-5 mb-6" style={{ overflow: 'visible' }}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-[var(--color-muted)] mb-1">
            Total Sales — {activeLabel}
          </div>
          <div className="font-display text-3xl text-[var(--color-charcoal)]">{inr(total)}</div>
          <div className="text-sm text-[var(--color-muted)] mt-1">
            {units.toLocaleString('en-IN')} units · {orders.toLocaleString('en-IN')} orders
          </div>
        </div>

        <div className="flex flex-col gap-3 items-end">
          {/* Date dropdown */}
          <div className="relative" ref={dropRef} style={{ zIndex: 100 }}>
            <button
              onClick={() => setDropdownOpen(o => !o)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-medium text-[var(--color-charcoal)] hover:border-[var(--color-sage)] transition-colors"
            >
              📅 {activeLabel}
              <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

    {dropdownOpen && createPortal(
              <div ref={menuRef} className="fixed bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl w-44 overflow-hidden" style={{ zIndex: 9999, top: (dropRef.current?.getBoundingClientRect().bottom ?? 0) + 8, right: window.innerWidth - (dropRef.current?.getBoundingClientRect().right ?? 0) }}>
                {DATE_OPTIONS.map((opt) => (
                  <button key={opt.key}
                    onClick={() => { setDateKey(opt.key); setDropdownOpen(false) }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      dateKey === opt.key
                        ? 'bg-[var(--color-sage-light)] text-[var(--color-sage-dark)] font-medium'
                        : 'text-[var(--color-charcoal)] hover:bg-[var(--color-cream)]'
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>,
                            document.body
            )}
          </div>

          {/* Custom date inputs */}
          {dateKey === 'custom' && (
            <div className="flex items-center gap-2">
              <input type="date" lang="en-GB" value={customStart} max={asOfDate}
                onChange={e => setCustomStart(e.target.value)}
                className="text-xs border border-[var(--color-border)] rounded-lg px-2 py-1.5 bg-[var(--color-surface)]" />
              <span className="text-xs text-[var(--color-muted)]">→</span>
              <input type="date" lang="en-GB" value={customEnd} max={asOfDate}
                onChange={e => setCustomEnd(e.target.value)}
                className="text-xs border border-[var(--color-border)] rounded-lg px-2 py-1.5 bg-[var(--color-surface)]" />
            </div>
          )}

          {/* Brand filter */}
          <div>
            <div className="text-xs uppercase tracking-wide text-[var(--color-muted)] mb-1">Filter by Brand</div>
            <div className="flex gap-1.5">
              {BRANDS.map((b) => (
                <button key={b} onClick={() => handleBrand(b)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    brand === b
                      ? 'bg-[var(--color-sage)] text-white shadow-sm scale-105'
                      : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-sage)]'
                  }`}>
                  {b === 'All' ? '🏷️ All' : b === 'Cocoon Care' ? '🌿 Cocoon' : '🐻 Boo Boo'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
