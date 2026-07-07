export interface RawOrderItem {
  id: string
  order_date: string
  channel: string | null
  company: string | null
  sku_code: string | null
  listing_sku: string | null
  qty: string | null
  selling_price_per_item: string | null
  invoice_amount: string | null
  status: string | null
  channel_order_id: string | null
}

export interface NormalizedSale {
  date: string       // YYYY-MM-DD, IST calendar date
  hour: number       // 0-23, IST hour — for intra-day charts
  channel: string
  brand: string
  skuCode: string
  listingSku: string
  qty: number
  sellingPricePerItem: number
  invoiceAmount: number
  status: string
  channelOrderId: string
}

export interface StockSnapshot {
  id: string
  snapshot_date: string
  warehouse_id: string | null
  sku_id: string | null
  sku_code: string | null
  name: string | null
  in_stock: string | null
  blocked: string | null
  bad_stock: string | null
  source: string | null
}

export interface MetricSummary {
  current: number
  prior: number
  changeAmount: number
  changePct: number | null
}

export interface SkuStyleMap {
  sku_code: string
  style_name?: string | null
  listing_sku?: string | null
  style?: string | null
  category?: string | null
}