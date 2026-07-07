import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'

interface Props {
  onSwitchToSignup: () => void
}

export function Login({ onSwitchToSignup }: Props) {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) setError(error)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-cream)] px-4">
      <div className="card p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="font-display text-2xl text-[var(--color-sage-dark)]">Fashion 1972NE</div>
          <div className="text-sm text-[var(--color-muted)] mt-1">Sign in to your dashboard</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)]"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)]"
            />
          </div>

          {error && <div className="text-sm text-[#dc2626]">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-[var(--color-sage)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="text-center text-sm text-[var(--color-muted)] mt-5">
          Don't have an account?{' '}
          <button onClick={onSwitchToSignup} className="text-[var(--color-sage-dark)] underline font-medium">
            Sign up
          </button>
        </div>
      </div>
    </div>
  )
}
