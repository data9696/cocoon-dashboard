import { supabase } from './supabaseClient'
import { brandFromListingSku } from './brand'
import type { NormalizedSale, RawOrderItem, StockSnapshot } from '../types'
import { unixToISTDateString, unixToISTHour } from './dateLogic'
import { isValidSaleStatus } from './status'

const PAGE_SIZE = 5000
const IST_OFFSET_MIN = 5 * 60 + 30
const MAX_CONCURRENT_PAGES = 8 // cap concurrency so we don't blast the DB connection pool

/**
 * Fetches all order_items rows matching a date filter by partitioning the `order_date` epoch
 * range into N chunks and fetching each chunk in PARALLEL — instead of OFFSET-based pagination.
 *
 * Why: Postgres OFFSET pagination gets progressively more expensive the deeper you page,
 * because it has to scan and discard every row before the offset point even with an index.
 * Firing several deep OFFSET queries concurrently (as a naive parallel-fetch would) compounds
 * that cost and can blow past the statement timeout — which is what was happening here.
 *
 * `order_date` is stored as text, but every value is a 10-digit epoch-seconds number, so text
 * comparison and numeric comparison agree — safe to partition by numeric range. (`id` was
 * checked and rejected for this: it's a variable-length text field, not a sequential number,
 * so range-partitioning it could have silently skipped or duplicated rows.)
 */
async function fetchSalesByDateRange(cutoff: string, selectCols: string): Promise<RawOrderItem[]> {
  const { count, error: countError } = await supabase
    .from('order_items')
    .select('id', { count: 'estimated', head: true })
    .gte('order_date', cutoff)
  if (countError) throw countError
  const total = count ?? 0
  if (total === 0) return []

  const [{ data: minData, error: minErr }, { data: maxData, error: maxErr }] = await Promise.all([
    supabase.from('order_items').select('order_date').gte('order_date', cutoff).order('order_date', { ascending: true }).limit(1),
    supabase.from('order_items').select('order_date').gte('order_date', cutoff).order('order_date', { ascending: false }).limit(1),
  ])
  if (minErr) throw minErr
  if (maxErr) throw maxErr
  if (!minData?.length || !maxData?.length) return []

  const minDate = Number((minData[0] as any).order_date)
  const maxDate = Number((maxData[0] as any).order_date)
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const span = maxDate - minDate + 1
  const chunkWidth = Math.max(1, Math.ceil(span / pageCount))

  const chunks: { start: number; end: number }[] = []
  for (let start = minDate; start <= maxDate; start += chunkWidth) {
    chunks.push({ start, end: Math.min(start + chunkWidth - 1, maxDate) })
  }

  const results: RawOrderItem[][] = new Array(chunks.length)
  for (let i = 0; i < chunks.length; i += MAX_CONCURRENT_PAGES) {
    const batch = chunks.map((c, idx) => ({ ...c, idx })).slice(i, i + MAX_CONCURRENT_PAGES)
    const batchResults = await Promise.all(
      batch.map(async ({ start, end, idx }) => {
        const { data, error } = await supabase
          .from('order_items')
          .select(selectCols)
          .gte('order_date', String(start))
          .lte('order_date', String(end))
          .order('order_date', { ascending: true })
        if (error) throw error
        return { idx, data: (data as unknown as RawOrderItem[]) || [] }
      })
    )
    for (const r of batchResults) results[r.idx] = r.data
  }

  return results.flat()
}

/** Epoch seconds for 1 Jan of the current year, IST midnight. Covers YTD + everything the dashboard shows. */
function startOfYearEpoch(): string {
  const nowIST = new Date(Date.now() + IST_OFFSET_MIN * 60 * 1000)
  const year = nowIST.getUTCFullYear()
  const jan1Utc = Date.UTC(year, 0, 1, 0, 0, 0) - IST_OFFSET_MIN * 60 * 1000
  return Math.floor(jan1Utc / 1000).toString()
}

/** IST date string N days back from now. Used to window stock snapshot history. */
function daysAgoDateString(days: number): string {
  const nowIST = new Date(Date.now() + IST_OFFSET_MIN * 60 * 1000)
  nowIST.setUTCDate(nowIST.getUTCDate() - days)
  const y = nowIST.getUTCFullYear()
  const m = String(nowIST.getUTCMonth() + 1).padStart(2, '0')
  const d = String(nowIST.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Epoch seconds for the start of today, IST midnight. */
function startOfTodayEpoch(): string {
  const nowIST = new Date(Date.now() + IST_OFFSET_MIN * 60 * 1000)
  const y = nowIST.getUTCFullYear()
  const m = nowIST.getUTCMonth()
  const d = nowIST.getUTCDate()
  const todayUtc = Date.UTC(y, m, d, 0, 0, 0) - IST_OFFSET_MIN * 60 * 1000
  return Math.floor(todayUtc / 1000).toString()
}

function buildChannelLabel(company: string | null | undefined, channel: string | null | undefined): string {
  const comp = (company || '').trim()
  const ch = (channel || '').trim()
  if (!ch) return comp || 'Unknown'
  if (!comp) return ch
  // Avoid double-prefixing if the raw channel value already starts with "F - " / "A - " etc.
  if (ch.toUpperCase().startsWith(comp.toUpperCase() + ' - ')) return ch
  return `${comp} - ${ch}`
}

function normalizeSaleRow(row: RawOrderItem): NormalizedSale {
  return {
    date: unixToISTDateString(row.order_date),
    hour: unixToISTHour(row.order_date),
    channel: buildChannelLabel(row.company, row.channel),
    brand: brandFromListingSku(row.listing_sku),
    skuCode: row.sku_code || '',
    listingSku: row.listing_sku || '',
    qty: Number(row.qty) || 0,
    sellingPricePerItem: Number(row.selling_price_per_item) || 0,
    invoiceAmount: Number(row.invoice_amount) || 0,
    status: row.status || '',
    channelOrderId: row.channel_order_id || '',
  }
}

/**
 * Pull this year's order_items (sequential pagination) and normalize into a clean shape.
 * Windowed to Jan 1 of current year onward — covers YTD and everything the dashboard displays,
 * while avoiding downloading the entire multi-year table on every load.
 */
export async function fetchAllSales(): Promise<NormalizedSale[]> {
  const cutoff = startOfYearEpoch()
  const SELECT_COLS = 'id, order_date, channel, company, sku_code, listing_sku, qty, selling_price_per_item, invoice_amount, status, channel_order_id'

  const rawRows = await fetchSalesByDateRange(cutoff, SELECT_COLS)

  const results: NormalizedSale[] = []
  for (const row of rawRows) {
    if (!isValidSaleStatus(row.status || '')) continue
    results.push(normalizeSaleRow(row))
  }
  return results
}

/**
 * Pull stock snapshots (sequential pagination), windowed to the last 45 days —
 * enough for the Inventory trend chart and latest-snapshot table, without pulling
 * the full historical snapshot archive on every load. Kept as simple sequential
 * pagination since this table was never the source of the timeout issue, and its
 * `id` column has the same non-numeric-text problem as order_items.
 */
export async function fetchAllStock(): Promise<StockSnapshot[]> {
  const cutoffDate = daysAgoDateString(45)
  const results: StockSnapshot[] = []
  let from = 0
  let keepGoing = true

  while (keepGoing) {
    const { data, error } = await supabase
      .from('stock_snapshots')
      .select('*')
      .gte('snapshot_date', cutoffDate)
      .order('snapshot_date', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw error
    if (!data || data.length === 0) {
      keepGoing = false
      break
    }

    results.push(...(data as StockSnapshot[]))

    if (data.length < PAGE_SIZE) {
      keepGoing = false
    } else {
      from += PAGE_SIZE
    }
  }

  return results
}

/** Fetch the pre-aggregated daily sales summary table — small, fast, refreshed every 15 min by pg_cron. */
export async function fetchDailySalesSummary(): Promise<import('../types').DailySummaryRow[]> {
  const { data, error } = await supabase
    .from('daily_sales_summary')
    .select('sale_date, brand, channel, total_sales, total_units, total_orders')

  if (error) throw error
  return (data as import('../types').DailySummaryRow[]) || []
}

/** Fetch just today's raw order_items rows — small, always live, since the summary table doesn't include today. */
export async function fetchTodaySales(): Promise<NormalizedSale[]> {
  const todayStart = startOfTodayEpoch()
  const { data, error } = await supabase
    .from('order_items')
    .select(
      'id, order_date, channel, company, sku_code, listing_sku, qty, selling_price_per_item, invoice_amount, status, channel_order_id'
    )
    .gte('order_date', todayStart)

  if (error) throw error
  const results: NormalizedSale[] = []
  for (const row of (data as RawOrderItem[]) || []) {
    if (!isValidSaleStatus(row.status || '')) continue
    results.push(normalizeSaleRow(row))
  }
  return results
}

/** Fetch the SKU → style/category mapping table (small, no pagination needed). */
export async function fetchSkuStyleMap(): Promise<import('../types').SkuStyleMap[]> {
  const { data, error } = await supabase
    .from('sku_style_map')
    .select('sku_code, "Style_Name", listing_sku, style, category')

  if (error) throw error
  return (data as import('../types').SkuStyleMap[]) || []
}
