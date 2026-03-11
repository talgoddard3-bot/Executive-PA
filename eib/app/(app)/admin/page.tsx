'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

const POSITIONS = [
  'Chief Executive Officer',
  'Chief Operating Officer',
  'Chief Financial Officer',
  'Chief Marketing Officer',
  'Chief Business Process Officer',
  'Chief Technology Officer',
  'VP Human Resources',
  'Business Development',
  'Executive',
]

const POSITION_ROLE: Record<string, string> = {
  'Chief Executive Officer':       'CEO',
  'Chief Operating Officer':       'COO',
  'Chief Financial Officer':       'CFO',
  'Chief Marketing Officer':       'CMO',
  'Chief Business Process Officer':'CBPO',
  'Chief Technology Officer':      'CTO',
  'VP Human Resources':            'VP HR',
  'Business Development':          'BD',
  'Executive':                     'All',
}

const ROLE_COLOR: Record<string, string> = {
  CEO:    'bg-violet-100 text-violet-700',
  COO:    'bg-indigo-100 text-indigo-700',
  CFO:    'bg-blue-100 text-blue-700',
  CMO:    'bg-emerald-100 text-emerald-700',
  CBPO:   'bg-orange-100 text-orange-700',
  CTO:    'bg-cyan-100 text-cyan-700',
  'VP HR':'bg-pink-100 text-pink-700',
  BD:     'bg-indigo-100 text-indigo-700',
  All:    'bg-gray-100 text-gray-600',
}

interface UserRow {
  user_id: string
  full_name: string
  email: string
  position: string
  language: string
  avatar_url: string | null
  status: string
  company_name: string | null
  requested_at: string | null
  is_admin: boolean
  company: { name: string; industry: string } | null
}

type Tab = 'pending' | 'all'

export default function AdminPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('pending')
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(d => setUsers(d.users ?? []))
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoading(false))
  }, [])

  async function updateUser(userId: string, patch: { status?: string; position?: string }) {
    setSaving(userId)
    setUsers(prev => prev.map(u =>
      u.user_id === userId ? { ...u, ...patch } : u
    ))
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, ...patch }),
    })
    if (!res.ok) setError('Failed to save')
    setSaving(null)
  }

  const pending = users.filter(u => u.status === 'pending')
  const all = users.filter(u => !u.is_admin)
  const displayed = tab === 'pending' ? pending : all

  const initials = (name: string) =>
    name ? name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() : '?'

  const formatDate = (iso: string | null) => iso
    ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—'

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">User Management</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Approve access requests and manage user positions.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab('pending')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === 'pending'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Pending Approval
          {pending.length > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {pending.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('all')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === 'all'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          All Users
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-400">Loading…</div>
        ) : displayed.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-gray-400">
              {tab === 'pending' ? 'No pending requests.' : 'No users yet.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-gray-900/40">
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">User</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Company</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Position</th>
                {tab === 'pending' && (
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Requested</th>
                )}
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {tab === 'pending' ? 'Action' : 'Status'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {displayed.map(user => {
                const role = POSITION_ROLE[user.position] ?? 'All'
                return (
                  <tr key={user.user_id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    {/* User */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                          {user.avatar_url ? (
                            <Image src={user.avatar_url} alt="" width={32} height={32} className="object-cover w-full h-full" unoptimized />
                          ) : initials(user.full_name)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white leading-tight">
                            {user.full_name || <span className="text-gray-400 italic">No name</span>}
                          </p>
                          <p className="text-[10px] text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Company */}
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-800 dark:text-gray-200">
                        {user.company?.name ?? user.company_name ?? <span className="text-gray-400 italic">—</span>}
                      </p>
                      {user.company?.industry && (
                        <p className="text-[10px] text-gray-400">{user.company.industry}</p>
                      )}
                    </td>

                    {/* Position */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <select
                          value={user.position || 'Executive'}
                          onChange={e => updateUser(user.user_id, { position: e.target.value })}
                          disabled={saving === user.user_id}
                          className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-xs text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 cursor-pointer"
                        >
                          {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${ROLE_COLOR[role] ?? 'bg-gray-100 text-gray-500'}`}>
                          {role}
                        </span>
                      </div>
                    </td>

                    {/* Requested date (pending tab only) */}
                    {tab === 'pending' && (
                      <td className="px-5 py-3.5 text-xs text-gray-400">
                        {formatDate(user.requested_at)}
                      </td>
                    )}

                    {/* Action / Status */}
                    <td className="px-5 py-3.5">
                      {tab === 'pending' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateUser(user.user_id, { status: 'active' })}
                            disabled={saving === user.user_id}
                            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            {saving === user.user_id
                              ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              : null}
                            Approve
                          </button>
                          <button
                            onClick={() => updateUser(user.user_id, { status: 'rejected' })}
                            disabled={saving === user.user_id}
                            className="px-3 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          user.status === 'active'   ? 'bg-emerald-100 text-emerald-700' :
                          user.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                       'bg-amber-100 text-amber-700'
                        }`}>
                          {user.status ?? 'pending'}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="mt-4 text-xs text-gray-400">
        Approved users can log in immediately. Position determines which brief sections they see.
      </p>
    </div>
  )
}
