'use client'
import { useEffect, useState, useCallback } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Search, RefreshCw, Shield, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

type User = {
  id: string; email: string; name: string | null; role: string
  isAdmin: boolean; subscriptionStatus: string; planId: string | null
  createdAt: string; _count: { cases: number }
}

const STATUS_BADGE: Record<string, string> = {
  active:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  inactive: 'bg-slate-100 text-slate-600 border-slate-200',
  past_due: 'bg-amber-50 text-amber-700 border-amber-200',
  canceled: 'bg-red-50 text-red-700 border-red-200',
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [q, setQ]         = useState('')
  const [page, setPage]   = useState(1)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/users?page=${page}&q=${encodeURIComponent(q)}`)
    const data = await res.json()
    setUsers(data.users ?? [])
    setTotal(data.total ?? 0)
    setLoading(false)
  }, [page, q])

  useEffect(() => { load() }, [load])

  async function setRole(userId: string, role: string) {
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action: 'set_role', data: { role } }),
    })
    load()
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-white">User Management</h1>
            <p className="text-slate-500 text-sm">{total.toLocaleString()} total users</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="input pl-9 w-full"
            placeholder="Search by email or name…"
            value={q}
            onChange={e => { setQ(e.target.value); setPage(1) }}
          />
        </div>

        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/[0.05]">
                {['User', 'Role', 'Subscription', 'Cases', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.03]">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900 dark:text-white text-xs">{u.name ?? '—'}</div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <select
                        value={u.role}
                        onChange={e => setRole(u.id, e.target.value)}
                        className="text-xs border border-slate-200 dark:border-white/10 rounded px-2 py-1 bg-transparent text-slate-700 dark:text-slate-300"
                      >
                        <option value="attorney">Attorney</option>
                        <option value="client">Client</option>
                        <option value="admin">Admin</option>
                        <option value="partner">Partner</option>
                      </select>
                      {u.isAdmin && <Shield className="w-3 h-3 text-violet-500" title="Platform admin" />}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${STATUS_BADGE[u.subscriptionStatus] ?? STATUS_BADGE.inactive}`}>
                      {u.subscriptionStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{u._count.cases}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-xs text-brand-600 dark:text-brand-400 hover:underline">View</button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">No users found</td></tr>
              )}
            </tbody>
          </table>
          {total > 25 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-white/[0.05]">
              <span className="text-xs text-slate-500">Page {page} of {Math.ceil(total / 25)}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 25)}>Next</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
