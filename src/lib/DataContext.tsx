import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { fetchAllSales, fetchAllStock } from './queries'
import { latestDateWithData } from './aggregations'
import { todayIST } from './dateLogic'
import type { NormalizedSale, StockSnapshot } from '../types'

interface DataContextValue {
  sales: NormalizedSale[]
  stock: StockSnapshot[]
  loading: boolean
  error: string | null
  trueLatestDate: string
  asOfDate: string
  lastSyncedAt: Date | null
  setAsOfDate: (date: string | null) => void
  refresh: () => void
}

const DataContext = createContext<DataContextValue | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const [sales, setSales] = useState<NormalizedSale[]>([])
  const [stock, setStock] = useState<StockSnapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [asOfOverride, setAsOfOverride] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    Promise.all([fetchAllSales(), fetchAllStock()])
      .then(([salesData, stockData]) => {
        if (cancelled) return
        setSales(salesData)
        setStock(stockData)
        setLastSyncedAt(new Date())
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message || 'Failed to load data from Supabase')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const trueLatestDate = useMemo(() => latestDateWithData(sales), [sales])
  const asOfDate = asOfOverride || todayIST()

  const value: DataContextValue = {
    sales,
    stock,
    loading,
    error,
    trueLatestDate,
    asOfDate,
    lastSyncedAt,
    setAsOfDate: setAsOfOverride,
    refresh: () => setReloadKey((k) => k + 1),
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within a DataProvider')
  return ctx
}
