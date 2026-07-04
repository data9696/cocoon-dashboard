// Centralized rules for which order statuses count as real sales.
// Any status NOT in VALID_SALE_STATUSES is excluded from every total,
// chart, KPI, and comparison across the dashboard.

export const VALID_SALE_STATUSES = new Set<string>([
  'Shipped',
  'In Transit',
  'Packed',
  'Delivered',
])

export const EXCLUDED_SALE_STATUSES = new Set<string>([
  'New',
  'Cancelled',
  'Cancelled Before Shipping',
  'Cancel Init',
  'Return Init',
  'Return Received',
  'Cancelled Return Received',
])

/** True if a row's status should be counted as a real, valid sale. */
export function isValidSaleStatus(status: string): boolean {
  return VALID_SALE_STATUSES.has(status)
}