// Centralized rules for which order statuses count as real sales.
// Per team decision: only exclude actual cancellations. Everything else —
// including returns, RTO/RTV-related statuses, and in-progress cancellations —
// is counted as-is.

export const EXCLUDED_SALE_STATUSES = new Set<string>([
  'Cancelled',
  'Cancelled Before Shipping',
])

/** True if a row's status should be counted as a real sale (i.e. not cancelled). */
export function isValidSaleStatus(status: string): boolean {
  return !EXCLUDED_SALE_STATUSES.has(status)
}