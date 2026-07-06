// Centralized rules for which order statuses count as real sales.
// Per team decision: only exclude actual cancellations. RTO/RTV/returns
// are intentionally NOT subtracted — we count the order amount as-is.

export const EXCLUDED_SALE_STATUSES = new Set<string>([
  'Cancelled',
  'Cancelled Before Shipping',
  'Cancel Init',
])

/** True if a row's status should be counted as a real sale (i.e. not cancelled). */
export function isValidSaleStatus(status: string): boolean {
  return !EXCLUDED_SALE_STATUSES.has(status)
}