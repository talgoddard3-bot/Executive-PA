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

// Maps display name → brief role filter key
const POSITION_ROLE: Record<string, string> = {
  'Chief Executive Officer':      'CEO',
  'Chief Operating Officer':      'COO',
  'Chief Financial Officer':      'CFO',
  'Chief Marketing Officer':      'CMO',
  'Chief Business Process Officer':'CBPO',
  'Chief Technology Officer':     'CTO',
  'VP Human Resources':           'VP HR',
  'Business Development':         'BD',
  'Executive':                    'All',
}

const ROLE_COLOR: Record<string, string> = {
  CEO:  'bg-violet-100 text-violet-700',
  COO:  'bg-indigo-100 text-indigo-700',
  CFO:  'bg-blue-100 text-blue-700',
  CMO:  'bg-emerald-100 text-emerald-700',
  CBPO: 'bg-orange-100 text-orange-700',
  CTO:  'bg-cyan-100 text-cyan-700',
  'VP HR': 'bg-pink-100 text-pink-700',
  BD:   'bg-indigo-100 text-indigo-700',
  All:  'bg-gray-100 text-gray-600',
}

interface UserRow {
  user_id: string
  full_name: string
  email: string
  position: string
  language: string
  avatar_url: string | null
  company: { name: string; industry: string } | null
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(d => setUsers(d.users ?? []))
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoading(false))
  }, [])

  async function updatePosition(userId: string, position: string) {
    setSaving(userId)
    setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, position } : u))
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, position }),
    })
    if (!res.ok) setError('Failed to save position')
    setSaving(null)
  }

  const initials = (name: string) =>
    name ? name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() : '?'

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">User Management</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
          All registered users. Set each person's position to control which brief sections they see.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-400">Loading users…</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">No users found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-gray-900/40">
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">User</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Email</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Company</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Position</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {users.map(user => {
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
                          {user.language && user.language !== 'English' && (
                            <p className="text-[10px] text-gray-400">{user.language}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400">
                      {user.email || <span className="text-gray-300 italic">—</span>}
                    </td>

                    {/* Company */}
                    <td className="px-5 py-3.5">
                      {user.company ? (
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-200 leading-tight">{user.company.name}</p>
                          <p className="text-[10px] text-gray-400">{user.company.industry}</p>
                        </div>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600 italic text-xs">No company</span>
                      )}
                    </td>

                    {/* Position dropdown */}
                    <td className="px-5 py-3.5">
                      <div className="relative">
                        <select
                          value={user.position || 'Executive'}
                          onChange={e => updatePosition(user.user_id, e.target.value)}
                          disabled={saving === user.user_id}
                          className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-xs text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-60 pr-8 appearance-none cursor-pointer"
                        >
                          {POSITIONS.map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                        {saving === user.user_id && (
                          <span className="absolute right-2 top-2 w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>
                    </td>

                    {/* Role badge */}
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${ROLE_COLOR[role] ?? 'bg-gray-100 text-gray-500'}`}>
                        {role}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="mt-4 text-xs text-gray-400">
        The position determines which brief sections each user sees in their filtered view.
      </p>
    </div>
  )
}
