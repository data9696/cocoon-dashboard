import { useEffect, useState } from 'react'

function relativeTime(from: Date): string {
  const seconds = Math.floor((Date.now() - from.getTime()) / 1000)
  if (seconds < 10) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function LastSynced({ at }: { at: Date | null }) {
  const [, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 15000)
    return () => clearInterval(id)
  }, [])

  if (!at) return null

  return (
    <span
      className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--color-border)] text-[var(--color-muted)]"
      title={at.toLocaleString('en-IN')}
    >
      🔄 Synced {relativeTime(at)}
    </span>
  )
}
