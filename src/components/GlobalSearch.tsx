import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, X, TrendingUp, Package, Store } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { NormalizedSale } from '../types'
import { groupBy } from '../lib/aggregations'

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

interface Result {
  type: 'sku' | 'channel' | 'brand'
  key: string
  sales: number
  units: number
}

export function GlobalSearch({ sales }: { sales: NormalizedSale[] }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const index = useMemo((): Result[] => {
    const skus = groupBy(sales, (s) => s.listingSku || s.skuCode || '').map((g) => ({ type: 'sku' as const, key: g.key, sales: g.sales, units: g.units }))
    const channels = groupBy(sales, (s) => s.channel).map((g) => ({ type: 'channel' as const, key: g.key, sales: g.sales, units: g.units }))
    const brands = groupBy(sales, (s) => s.brand).map((g) => ({ type: 'brand' as const, key: g.key, sales: g.sales, units: g.units }))
    return [...channels, ...brands, ...skus]
  }, [sales])

  const results = useMemo(() => {
    if (!query.trim() || query.length < 2) return []
    const q = query.toLowerCase()
    return index.filter((r) => r.key.toLowerCase().includes(q)).slice(0, 8)
  }, [query, index])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setOpen((o) => !o) }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const ICONS = { sku: Package, channel: Store, brand: TrendingUp }
  const LABELS = { sku: 'SKU', channel: 'Channel', brand: 'Brand' }

  function handleSelect(result: Result) {
    if (result.type === 'channel' || result.type === 'brand') navigate('/channel-brand')
    else navigate('/products')
    setQuery(''); setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] text-sm hover:border-[var(--color-sage)] transition-colors"
      >
        <Search size={14} />
        <span className="hidden sm:inline">Search...</span>
        <span className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-cream)] border border-[var(--color-border)]">⌘K</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setOpen(false)} />
          <div className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-lg bg-[var(--color-surface)] rounded-2xl shadow-2xl border border-[var(--color-border)] z-50 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]">
              <Search size={16} className="text-[var(--color-muted)] shrink-0" />
              <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search SKU, channel, brand..." className="flex-1 text-sm outline-none bg-transparent text-[var(--color-charcoal)] placeholder:text-[var(--color-muted)]" />
              {query && <button onClick={() => setQuery('')} className="text-[var(--color-muted)]"><X size={14} /></button>}
            </div>
            {results.length === 0 && query.length >= 2 && <div className="px-4 py-8 text-center text-sm text-[var(--color-muted)]">No results for "{query}"</div>}
            {results.length === 0 && query.length < 2 && <div className="px-4 py-6 text-center text-xs text-[var(--color-muted)]">Type at least 2 characters to search</div>}
            {results.length > 0 && (
              <div className="max-h-80 overflow-y-auto">
                {results.map((r, i) => {
                  const Icon = ICONS[r.type]
                  return (
                    <button key={i} onClick={() => handleSelect(r)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-cream)] transition-colors text-left border-b border-[var(--color-border)] last:border-0">
                      <div className="w-8 h-8 rounded-lg bg-[var(--color-sage-light)] text-[var(--color-sage-dark)] flex items-center justify-center shrink-0"><Icon size={14} /></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[var(--color-charcoal)] truncate">{r.key}</div>
                        <div className="text-xs text-[var(--color-muted)]">{LABELS[r.type]} · {inr(r.sales)} · {r.units} units</div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-cream)] text-[var(--color-muted)] shrink-0">{LABELS[r.type]}</span>
                    </button>
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
