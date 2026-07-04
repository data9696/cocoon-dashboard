// Simple TTL-based cache using localStorage, so repeat page loads/navigations
// don't re-fetch from Supabase every time. Falls back silently on any error
// (private browsing, quota exceeded, etc.) — caching is an optimization, never
// something the app depends on to function.

const TTL_MS = 15 * 60 * 1000 // 15 minutes

interface CacheEntry<T> {
  savedAt: number
  data: T
}

export function getCached<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed: CacheEntry<T> = JSON.parse(raw)
    if (Date.now() - parsed.savedAt > TTL_MS) return null
    return parsed.data
  } catch {
    return null
  }
}

export function setCached<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { savedAt: Date.now(), data }
    localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // Ignore quota errors — cache is best-effort only.
  }
}

export function clearCached(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}
