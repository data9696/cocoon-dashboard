import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Profile } from '../lib/AuthContext'

export function AdminApprovals() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').order('status', { ascending: true })
    setProfiles((data as Profile[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function updateStatus(id: string, status: 'approved' | 'rejected') {
    await supabase.from('profiles').update({ status }).eq('id', id)
    load()
  }

  async function toggleAdmin(id: string, makeAdmin: boolean) {
    await supabase.from('profiles').update({ is_admin: makeAdmin }).eq('id', id)
    load()
  }

  const pending = profiles.filter((p) => p.status === 'pending')
  const others = profiles.filter((p) => p.status !== 'pending')

  if (loading) return <div className="card p-5 text-sm text-[var(--color-muted)]">Loading users…</div>

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <h3 className="font-display text-lg mb-4">
          Pending Approval {pending.length > 0 && `(${pending.length})`}
        </h3>
        {pending.length === 0 ? (
          <div className="text-sm text-[var(--color-muted)]">No pending requests.</div>
        ) : (
          <div className="space-y-3">
            {pending.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-cream)]">
                <div>
                  <div className="font-medium text-sm">{p.full_name || 'Unnamed'}</div>
                  <div className="text-xs text-[var(--color-muted)]">{p.email}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus(p.id, 'approved')}
                    className="px-3 py-1.5 rounded-lg bg-[var(--color-sage)] text-white text-xs font-medium hover:opacity-90"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => updateStatus(p.id, 'rejected')}
                    className="px-3 py-1.5 rounded-lg bg-[#dc2626] text-white text-xs font-medium hover:opacity-90"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-5">
        <h3 className="font-display text-lg mb-4">All Users</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--color-muted)] text-xs uppercase border-b border-[var(--color-border)]">
              <th className="pb-2">Name</th>
              <th className="pb-2">Email</th>
              <th className="pb-2">Status</th>
              <th className="pb-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {others.map((p) => (
              <tr key={p.id} className="border-t border-[var(--color-border)]">
                <td className="py-2">{p.full_name || '—'} {p.is_admin && <span className="text-xs text-[var(--color-sage-dark)]">(admin)</span>}</td>
                <td className="py-2">{p.email}</td>
                <td className="py-2 capitalize">
                  <span className={p.status === 'approved' ? 'text-[var(--color-sage-dark)]' : 'text-[#dc2626]'}>
                    {p.status}
                  </span>
                </td>
                <td className="py-2 text-right space-x-3">
                  {p.status === 'approved' && !p.is_admin && (
                    <button
                      onClick={() => updateStatus(p.id, 'rejected')}
                      className="text-xs text-[#dc2626] underline"
                    >
                      Revoke
                    </button>
                  )}
                  {p.status === 'rejected' && (
                    <button
                      onClick={() => updateStatus(p.id, 'approved')}
                      className="text-xs text-[var(--color-sage-dark)] underline"
                    >
                      Re-approve
                    </button>
                  )}
                  {p.status === 'approved' && (
                    <button
                      onClick={() => toggleAdmin(p.id, !p.is_admin)}
                      className="text-xs text-[#6d28d9] underline"
                    >
                      {p.is_admin ? 'Remove Admin' : 'Make Admin'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
