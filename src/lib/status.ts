// Centralized rules for which order statuses count as real sales.
// Approach: exclude cancel/return-related statuses; count everything else
// (including New, Pending, Ready to ship, Shipped, Delivered, etc.).

export const EXCLUDED_SALE_STATUSES = new Set<string>([
  'Cancelled',
  'Cancelled Before Shipping',
  'Cancel Init',
  'Return Init',
  'Return Received',
  'Cancelled Return Received',
  'Partial Cancelled Return Received',
  'Partial Return Received',
])

/** True if a row's status should be counted as a real sale (i.e. not a cancellation/return). */
export function isValidSaleStatus(status: string): boolean {
  return !EXCLUDED_SALE_STATUSES.has(status)
}