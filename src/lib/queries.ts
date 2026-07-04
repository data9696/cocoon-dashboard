import { supabase } from './supabaseClient'
import { brandFromListingSku } from './brand'
import type { NormalizedSale, RawOrderItem, StockSnapshot } from '../types'
import { unixToISTDateString, unixToISTHour } from './dateLogic'


const PAGE_SIZE = 5000

/** Pull every row from order_items (paginated) and normalize into a clean shape for the dashboard. */
export async function fetchAllSales(): Promise<NormalizedSale[]> {
  const results: NormalizedSale[] = []
  let from = 0
  let keepGoing = true

  while (keepGoing) {
    const { data, error } = await supabase
      .from('order_items')
      .select(
        'id, order_date, channel, company, sku_code, listing_sku, qty, selling_price_per_item, invoice_amount, status, channel_order_id'
      )
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw error
    if (!data || data.length === 0) {
      keepGoing = false
      break
    }

    for (const row of data as RawOrderItem[]) {
    results.push({
        date: unixToISTDateString(row.order_date),
        hour: unixToISTHour(row.order_date),
        channel: row.company && row.channel ? `${row.company} - ${row.channel}` : row.channel || 'Unknown',
        brand: brandFromListingSku(row.listing_sku),
        skuCode: row.sku_code || '',
        listingSku: row.listing_sku || '',
        qty: Number(row.qty) || 0,
        sellingPricePerItem: Number(row.selling_price_per_item) || 0,
        invoiceAmount: Number(row.invoice_amount) || 0,
        status: row.status || '',
        channelOrderId: row.channel_order_id || '',
      })
    }

    if (data.length < PAGE_SIZE) {
      keepGoing = false
    } else {
      from += PAGE_SIZE
    }
  }

  return results
}

export async function fetchAllStock(): Promise<StockSnapshot[]> {
  const results: StockSnapshot[] = []
  let from = 0
  let keepGoing = true

  while (keepGoing) {
    const { data, error } = await supabase
      .from('stock_snapshots')
      .select('*')
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
