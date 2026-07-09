import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { fetchAllSales, fetchAllStock, fetchSkuStyleMap, fetchDailySalesSummary, fetchTodaySales } from './queries'
import { latestDateWithData } from './aggregations'
import { todayIST } from './dateLogic'
import { getCached, setCached, clearCached } from './cache'
import type { NormalizedSale, StockSnapshot, SkuStyleMap, DailySummaryRow } from '../types'

const SALES_CACHE_KEY = 'cache_sales_v1'
const STOCK_CACHE_KEY = 'cache_stock_v1'
const STYLE_MAP_CACHE_KEY = 'cache_style_map_v1'
const SUMMARY_CACHE_KEY = 'cache_summary_v1'

interface DataContextValue {
  sales: NormalizedSale[]
  todaySales: NormalizedSale[]
  dailySummary: DailySummaryRow[]
  stock: StockSnapshot[]
  skuStyleMap: SkuStyleMap[]
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
  const [todaySales, setTodaySales] = useState<NormalizedSale[]>([])
  const [dailySummary, setDailySummary] = useState<DailySummaryRow[]>([])
  const [stock, setStock] = useState<StockSnapshot[]>([])
  const [skuStyleMap, setSkuStyleMap] = useState<SkuStyleMap[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [asOfOverride, setAsOfOverride] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)

  useEffect(() => {
    let cancelled = false
    const isManualRefresh = reloadKey > 0

    if (isManualRefresh) {
      clearCached(SALES_CACHE_KEY)
      clearCached(STOCK_CACHE_KEY)
      clearCached(STYLE_MAP_CACHE_KEY)
      clearCached(SUMMARY_CACHE_KEY)
      setLoading(true)
    } else {
      const cachedSales = getCached<NormalizedSale[]>(SALES_CACHE_KEY)
      const cachedStock = getCached<StockSnapshot[]>(STOCK_CACHE_KEY)
      const cachedStyleMap = getCached<SkuStyleMap[]>(STYLE_MAP_CACHE_KEY)
      const cachedSummary = getCached<DailySummaryRow[]>(SUMMARY_CACHE_KEY)
      if (cachedSales && cachedStock && cachedSummary) {
        setSales(cachedSales)
        setStock(cachedStock)
        if (cachedStyleMap) setSkuStyleMap(cachedStyleMap)
        setDailySummary(cachedSummary)
        setLoading(false)
      } else {
        setLoading(true)
      }
    }

    setError(null)

    Promise.all([fetchAllSales(), fetchAllStock(), fetchSkuStyleMap(), fetchDailySalesSummary(), fetchTodaySales()])
      .then(([salesData, stockData, styleMapData, summaryData, todayData]) => {
        if (cancelled) return
        setSales(salesData)
        setStock(stockData)
        setSkuStyleMap(styleMapData)
        setDailySummary(summaryData)
        setTodaySales(todayData)
        setLastSyncedAt(new Date())
        setCached(SALES_CACHE_KEY, salesData)
        setCached(STOCK_CACHE_KEY, stockData)
        setCached(STYLE_MAP_CACHE_KEY, styleMapData)
        setCached(SUMMARY_CACHE_KEY, summaryData)
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
    todaySales,
    dailySummary,
    stock,
    skuStyleMap,
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
