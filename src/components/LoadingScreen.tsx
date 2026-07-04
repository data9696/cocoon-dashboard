import { useEffect, useState } from 'react'

export function LoadingScreen() {
  const [progress, setProgress] = useState(8)
  const [name, setName] = useState('')
  const [submitted, setSubmitted] = useState(false)

  // Check if name already saved from a previous visit
  useEffect(() => {
    const saved = localStorage.getItem('dashboard_user_name')
    if (saved) {
      setName(saved)
      setSubmitted(true)
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => (p < 92 ? p + (92 - p) * 0.08 : p))
    }, 200)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    localStorage.setItem('dashboard_user_name', trimmed)
    setSubmitted(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--color-cream)] overflow-hidden">
      <div className="blob blob-sage" />
      <div className="blob blob-pink" />
      <div className="blob blob-blue" />

      <div className="relative flex items-center justify-center z-10 w-36 h-36">
        <div className="loader-ring" />
        <div className="logo-card logo-pop">
          <img
            src="/assets/fashion1972ne-logo.png"
            alt="Fashion 1972NE"
            className="logo-cropped"
          />
        </div>
      </div>

      <div className="mt-6 font-display text-2xl text-[var(--color-sage-dark)] z-10">
        Fashion 1972NE
      </div>
      <div className="text-sm text-[var(--color-muted)] mt-1 z-10">
        Cocoon Care · The Boo Boo Club
      </div>

      {!submitted ? (
        <div className="mt-6 z-10 flex flex-col items-center gap-3">
          <p className="text-sm text-[var(--color-muted)]">What's your name?</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="e.g. CoCoon Care"
              autoFocus
              className="text-sm border border-[var(--color-border)] rounded-lg px-4 py-2 bg-[var(--color-surface)] text-[var(--color-charcoal)] outline-none focus:border-[var(--color-sage)]"
            />
            <button
              onClick={handleSubmit}
              className="text-sm px-4 py-2 rounded-lg bg-[var(--color-sage)] text-white font-medium hover:bg-[var(--color-sage-dark)] transition-colors"
            >
              Go
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 z-10 text-sm text-[var(--color-sage-dark)] font-medium">
          Welcome back, {name} 👋
        </div>
      )}

      <div className="mt-6 w-56 h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden z-10">
        <div
          className="h-full rounded-full bg-[var(--color-sage)] transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="text-xs text-[var(--color-muted)] mt-3 z-10">
        Syncing today's sales from Supabase…
      </div>
    </div>
  )
}