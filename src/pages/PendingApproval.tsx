import { useAuth } from '../lib/AuthContext'

export function PendingApproval() {
  const { profile, signOut, refreshProfile } = useAuth()
  const rejected = profile?.status === 'rejected'

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-cream)] px-4">
      <div className="card p-8 w-full max-w-sm text-center">
        <div className="text-4xl mb-3">{rejected ? '🚫' : '⏳'}</div>
        <div className="font-display text-xl mb-2">
          {rejected ? 'Access Denied' : 'Awaiting Approval'}
        </div>
        <p className="text-sm text-[var(--color-muted)] mb-5">
          {rejected
            ? 'Your access request was declined. Contact an admin if you believe this is a mistake.'
            : "Your account is waiting for admin approval. You'll be able to access the dashboard once approved."}
        </p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => refreshProfile()}
            className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm font-medium hover:border-[var(--color-sage)]"
          >
            Check again
          </button>
          <button
            onClick={() => signOut()}
            className="px-4 py-2 rounded-lg bg-[var(--color-sage)] text-white text-sm font-medium hover:opacity-90"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
