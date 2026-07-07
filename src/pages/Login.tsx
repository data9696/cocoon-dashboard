import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'

interface Props {
  onSwitchToSignup: () => void
}

export function Login({ onSwitchToSignup }: Props) {
  const { signIn, resetPasswordForEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) setError(error)
  }

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await resetPasswordForEmail(email)
    setLoading(false)
    if (error) setError(error)
    else setResetSent(true)
  }

  if (forgotMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-cream)] px-4">
        <div className="card p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="font-display text-2xl text-[var(--color-sage-dark)]">Fashion 1972NE</div>
            <div className="text-sm text-[var(--color-muted)] mt-1">Reset your password</div>
          </div>

          {resetSent ? (
            <div className="text-center">
              <div className="text-4xl mb-3">📧</div>
              <p className="text-sm text-[var(--color-muted)] mb-5">
                If an account exists for <strong>{email}</strong>, a password reset link has been sent. Check your inbox.
              </p>
              <button
                onClick={() => { setForgotMode(false); setResetSent(false) }}
                className="text-[var(--color-sage-dark)] underline text-sm font-medium"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
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

              {error && <div className="text-sm text-[#dc2626]">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-[var(--color-sage)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>

              <button
                type="button"
                onClick={() => setForgotMode(false)}
                className="w-full text-center text-sm text-[var(--color-muted)] underline"
              >
                Back to Login
              </button>
            </form>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-cream)] px-4">
      <div className="card p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="font-display text-2xl text-[var(--color-sage-dark)]">Fashion 1972NE</div>
          <div className="text-sm text-[var(--color-muted)] mt-1">Login to your dashboard</div>
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
            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-charcoal)]"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <div className="text-sm text-[#dc2626]">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-[var(--color-sage)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>

        <div className="text-center mt-3">
          <button onClick={() => setForgotMode(true)} className="text-sm text-[var(--color-muted)] underline">
            Forgot password?
          </button>
        </div>

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
