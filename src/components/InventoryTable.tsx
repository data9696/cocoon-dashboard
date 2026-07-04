import { useMemo, useState } from 'react'
import type { StockSnapshot } from '../types'

type SortKey = 'sku_id' | 'sku_code' | 'name' | 'in_stock'
type SortDir = 'asc' | 'desc'

interface Props {
  rows: StockSnapshot[]
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className={`ml-1 text-[10px] ${active ? 'text-[var(--color-sage-dark)]' : 'text-[var(--color-border)]'}`}>
      {active ? (dir === 'asc' ? '▲' : '▼') : '⇅'}
    </span>
  )
}

const COLUMNS: { key: SortKey; label: string; align?: 'right' }[] = [
  { key: 'sku_id', label: 'SKU ID' },
  { key: 'sku_code', label: 'SKU Code' },
  { key: 'name', label: 'Product Name' },
  { key: 'in_stock', label: 'In Stock', align: 'right' },
]

export function InventoryTable({ rows }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('in_stock')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [search, setSearch] = useState('')

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'in_stock' ? 'desc' : 'asc')
    }
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return rows
    const q = search.toLowerCase()
    return rows.filter(
      (r) =>
        (r.sku_id || '').toLowerCase().includes(q) ||
        (r.sku_code || '').toLowerCase().includes(q) ||
        (r.name || '').toLowerCase().includes(q)
    )
  }, [rows, search])

  const sorted = useMemo(() => {
    const numeric = sortKey === 'in_stock'
    return [...filtered].sort((a, b) => {
      if (numeric) {
        const valA = Number(a.in_stock) || 0
        const valB = Number(b.in_stock) || 0
        return sortDir === 'asc' ? valA - valB : valB - valA
      }
      const valA = (a[sortKey] || '').toString()
      const valB = (b[sortKey] || '').toString()
      return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
    })
  }, [filtered, sortKey, sortDir])

  return (
    <div className="card p-5 no-hover-lift">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h3 className="font-display text-lg">Inventory — All SKUs</h3>
        <input
          type="text"
          placeholder="Search SKU ID, SKU code, or name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-1.5 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] w-full sm:w-64"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr className="text-left text-[var(--color-muted)] text-xs uppercase">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`pb-2 cursor-pointer select-none whitespace-nowrap ${col.align === 'right' ? 'text-right' : ''}`}
                  onClick={() => handleSort(col.key)}
                >
                  {col.label}
                  <SortIcon active={sortKey === col.key} dir={sortDir} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const inStock = Number(r.in_stock) || 0
              return (
                <tr key={r.id} className="border-t border-[var(--color-border)]">
                  <td className="py-2 whitespace-nowrap">{r.sku_id || '—'}</td>
                  <td className="py-2 whitespace-nowrap">{r.sku_code || '—'}</td>
                  <td className="py-2">{r.name || '—'}</td>
                  <td className={`py-2 text-right font-medium ${inStock <= 5 ? 'text-[#b4564f]' : 'text-[var(--color-charcoal)]'}`}>
                    {inStock.toLocaleString('en-IN')}
                  </td>
                </tr>
              )
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-[var(--color-muted)]">
                  No matching SKUs
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-[var(--color-muted)] mt-3">{sorted.length} SKUs</div>
    </div>
  )
}
