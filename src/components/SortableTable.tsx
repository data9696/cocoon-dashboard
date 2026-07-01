import { useState } from 'react'
import type { ReactNode } from 'react'

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

type SortKey = 'name' | 'sales' | 'units' | 'pct'
type SortDir = 'asc' | 'desc'

interface Row {
  name: ReactNode
  namePlain: string
  sales: number
  units: number
  pct?: number
}

interface Props {
  title: string
  rows: Row[]
  showRank?: boolean
  showPct?: boolean
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className={`ml-1 text-[10px] ${active ? 'text-[var(--color-sage-dark)]' : 'text-[var(--color-border)]'}`}>
      {active ? (dir === 'asc' ? '▲' : '▼') : '⇅'}
    </span>
  )
}

function PctBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--color-sage)]"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className="text-xs text-[var(--color-muted)] w-8">{pct.toFixed(0)}%</span>
    </div>
  )
}

export function SortableTable({ title, rows, showRank = false, showPct = false }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('sales')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const totalSales = rows.reduce((a, r) => a + r.sales, 0)

  const rowsWithPct = rows.map((r) => ({
    ...r,
    pct: totalSales > 0 ? (r.sales / totalSales) * 100 : 0,
  }))

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sorted = [...rowsWithPct].sort((a, b) => {
    if (sortKey === 'name') {
      return sortDir === 'asc'
        ? a.namePlain.localeCompare(b.namePlain)
        : b.namePlain.localeCompare(a.namePlain)
    }
    const valA = sortKey === 'pct' ? a.pct : a[sortKey as 'sales' | 'units']
    const valB = sortKey === 'pct' ? b.pct : b[sortKey as 'sales' | 'units']
    return sortDir === 'asc' ? valA - valB : valB - valA
  })

  return (
    <div className="card p-5">
      <h3 className="font-display text-lg mb-4">{title}</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[var(--color-muted)] text-xs uppercase border-b border-[var(--color-border)]">
            {showRank && <th className="pb-2 pr-2">#</th>}
            <th
              className="pb-2 cursor-pointer hover:text-[var(--color-charcoal)] select-none"
              onClick={() => handleSort('name')}
            >
              Name <SortIcon active={sortKey === 'name'} dir={sortDir} />
            </th>
            <th
              className="pb-2 text-right cursor-pointer hover:text-[var(--color-charcoal)] select-none"
              onClick={() => handleSort('sales')}
            >
              Sales <SortIcon active={sortKey === 'sales'} dir={sortDir} />
            </th>
            <th
              className="pb-2 text-right cursor-pointer hover:text-[var(--color-charcoal)] select-none"
              onClick={() => handleSort('units')}
            >
              Units <SortIcon active={sortKey === 'units'} dir={sortDir} />
            </th>
            <th
              className="pb-2 cursor-pointer hover:text-[var(--color-charcoal)] select-none pl-3"
              onClick={() => handleSort('pct')}
            >
              Share <SortIcon active={sortKey === 'pct'} dir={sortDir} />
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr
              key={i}
              className="border-t border-[var(--color-border)] hover:bg-[var(--color-cream)] transition-colors"
            >
              {showRank && (
                <td className="py-2 pr-2 text-[var(--color-muted)] text-xs">{i + 1}</td>
              )}
              <td className="py-2">{row.name}</td>
              <td className="py-2 text-right font-medium">{inr(row.sales)}</td>
              <td className="py-2 text-right">{row.units}</td>
              <td className="py-2 pl-3">
                <PctBar pct={row.pct} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}