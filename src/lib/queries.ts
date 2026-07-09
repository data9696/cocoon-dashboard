import { supabase } from './supabaseClient'
import { brandFromListingSku } from './brand'
import type { NormalizedSale, RawOrderItem, StockSnapshot } from '../types'
import { unixToISTDateString, unixToISTHour } from './dateLogic'
import { isValidSaleStatus } from './status'

const PAGE_SIZE = 5000
const IST_OFFSET_MIN = 5 * 60 + 30

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
  const results: NormalizedSale[] = []
  let from = 0
  let keepGoing = true

  while (keepGoing) {
    const { data, error } = await supabase
      .from('order_items')
      .select(
        'id, order_date, channel, company, sku_code, listing_sku, qty, selling_price_per_item, invoice_amount, status, channel_order_id'
      )
      .gte('order_date', cutoff)
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw error
    if (!data || data.length === 0) {
      keepGoing = false
      break
    }

    for (const row of data as RawOrderItem[]) {
      if (!isValidSaleStatus(row.status || '')) continue
      results.push(normalizeSaleRow(row))
    }

    if (data.length < PAGE_SIZE) {
      keepGoing = false
    } else {
      from += PAGE_SIZE
    }
  }

  return results
}

/**
 * Pull stock snapshots (sequential pagination), windowed to the last 45 days —
 * enough for the Inventory trend chart and latest-snapshot table, without pulling
 * the full historical snapshot archive on every load.
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