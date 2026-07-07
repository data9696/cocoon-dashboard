import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'

interface Props {
  onSwitchToLogin: () => void
}

export function Signup({ onSwitchToLogin }: Props) {
  const { signUp } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    const { error } = await signUp(email, password, fullName)
    setLoading(false)

    if (error) {
      setError(error)
    } else {
      setDone(true)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-cream)] px-4">
        <div className="card p-8 w-full max-w-sm text-center">
          <div className="text-4xl mb-3">✅</div>
          <div className="font-display text-xl mb-2">Account created</div>
          <p className="text-sm text-[var(--color-muted)] mb-5">
            Your sign-up request has been sent. An admin needs to approve your account before you can access the dashboard.
          </p>
          <button onClick={onSwitchToLogin} className="text-[var(--color-sage-dark)] underline text-sm font-medium">
            Go to Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-cream)] px-4">
      <div className="card p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="font-display text-2xl text-[var(--color-sage-dark)]">Fashion 1972NE</div>
          <div className="text-sm text-[var(--color-muted)] mt-1">Request dashboard access</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)]"
            />
          </div>
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
          <div>
            <label className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Confirm Password</label>
            <div className="relative mt-1">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)]"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-charcoal)]"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <div className="text-sm text-[#dc2626]">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-[var(--color-sage)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {loading ? 'Creating account…' : 'Request Access'}
          </button>
        </form>

        <div className="text-center text-sm text-[var(--color-muted)] mt-5">
          Already have an account?{' '}
          <button onClick={onSwitchToLogin} className="text-[var(--color-sage-dark)] underline font-medium">
            Login
          </button>
        </div>
      </div>
    </div>
  )
}
