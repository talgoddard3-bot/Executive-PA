'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const LANGUAGES = [
  'English', 'French', 'German', 'Spanish', 'Portuguese', 'Italian',
  'Dutch', 'Polish', 'Swedish', 'Norwegian', 'Danish', 'Finnish',
  'Japanese', 'Mandarin Chinese', 'Korean', 'Arabic', 'Hebrew',
]

const SECTION_COLORS: Record<string, string> = {
  company_news: 'bg-gray-100 text-gray-600',
  competitor_intelligence: 'bg-orange-50 text-orange-700',
  marketing_opportunities: 'bg-emerald-50 text-emerald-700',
  geopolitical_news: 'bg-violet-50 text-violet-700',
  financial_news: 'bg-blue-50 text-blue-700',
  financial_signals: 'bg-blue-50 text-blue-700',
  tech_intelligence: 'bg-cyan-50 text-cyan-700',
  hr_intelligence: 'bg-pink-50 text-pink-700',
  ma_watch: 'bg-indigo-50 text-indigo-700',
  operational_intelligence: 'bg-amber-50 text-amber-700',
  customer_intelligence: 'bg-teal-50 text-teal-700',
  risk_summary: 'bg-red-50 text-red-700',
}

type Tab = 'profile' | 'saved' | 'notifications'

interface UserProfile { full_name: string; position: string; email: string; avatar_url: string | null; language: string }
interface SavedItem { id: string; brief_id: string; section: string; item_index: number; headline: string; section_label: string; brief_week_of: string | null }
interface Notification { id: string; from_user_id: string; from_name: string; headline: string | null; comment_body: string | null; created_at: string; read: boolean; brief_id: string | null; section: string | null; item_index: number | null }

function formatTime(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function MyPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('profile')
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Profile state
  const [profile, setProfile] = useState<UserProfile>({ full_name: '', position: 'Chief Executive Officer', email: '', avatar_url: null, language: 'English' })
  const [profileLoading, setProfileLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Saved articles state
  const [savedItems, setSavedItems] = useState<SavedItem[]>([])
  const [savedLoading, setSavedLoading] = useState(false)

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notifsLoading, setNotifsLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetch('/api/user-profile')
      .then(r => r.json())
      .then(data => {
        setProfile({
          full_name:  data.full_name  ?? '',
          position:   data.position   ?? 'Chief Executive Officer',
          email:      data.email      ?? '',
          avatar_url: data.avatar_url ?? null,
          language:   data.language   ?? 'English',
        })
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false))
  }, [])

  useEffect(() => {
    if (tab === 'saved' && savedItems.length === 0) {
      setSavedLoading(true)
      fetch('/api/favourites')
        .then(r => r.json())
        .then(d => { if (Array.isArray(d)) setSavedItems(d) })
        .catch(() => {})
        .finally(() => setSavedLoading(false))
    }
    if (tab === 'notifications' && notifications.length === 0) {
      setNotifsLoading(true)
      fetch('/api/notifications')
        .then(r => r.json())
        .then(d => {
          if (Array.isArray(d)) {
            setNotifications(d)
            setUnreadCount(d.filter((n: Notification) => !n.read).length)
          }
        })
        .catch(() => {})
        .finally(() => setNotifsLoading(false))
    }
  }, [tab])

  async function handleSave() {
    setSaving(true)
    setError('')
    const res = await fetch('/api/user-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: profile.full_name, email: profile.email, language: profile.language }),
    })
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Save failed')
    }
    setSaving(false)
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    setError('')
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/user-profile/avatar', { method: 'POST', body: form })
    const data = await res.json()
    if (res.ok) {
      setProfile(p => ({ ...p, avatar_url: data.avatar_url }))
    } else {
      setError(data.error ?? 'Upload failed')
    }
    setUploadingAvatar(false)
  }

  async function markAllRead() {
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = profile.full_name
    ? profile.full_name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : 'ME'

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'profile',       label: 'Profile' },
    { id: 'saved',         label: 'Saved',         count: savedItems.length || undefined },
    { id: 'notifications', label: 'Notifications',  count: unreadCount || undefined },
  ]

  return (
    <div className="p-6 max-w-2xl">

      {/* User card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4 mb-5">
        <div
          className="relative w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-lg font-bold overflow-hidden cursor-pointer ring-2 ring-offset-2 ring-blue-200 hover:ring-blue-400 transition-all shrink-0"
          onClick={() => avatarInputRef.current?.click()}
        >
          {profile.avatar_url ? (
            <Image src={profile.avatar_url} alt="Avatar" fill className="object-cover rounded-full" unoptimized />
          ) : initials}
          {uploadingAvatar && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900">{profile.full_name || 'Your Name'}</p>
          <p className="text-sm text-gray-500">{profile.position}</p>
          {profile.email && <p className="text-xs text-gray-400 mt-0.5">{profile.email}</p>}
        </div>
        <button
          onClick={signOut}
          className="text-xs text-gray-400 hover:text-red-600 transition-colors font-medium shrink-0"
        >
          Sign out
        </button>
        <input ref={avatarInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleAvatarChange} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                t.id === 'notifications' ? 'bg-red-500 text-white' : 'bg-blue-100 text-blue-700'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Profile tab ── */}
      {tab === 'profile' && (
        profileLoading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-sm text-gray-400">Loading…</div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
            {/* Name */}
            <div className="p-5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Full Name</label>
              <input
                type="text"
                value={profile.full_name}
                onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
                placeholder="Your full name"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
            {/* Position */}
            <div className="p-5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Position</label>
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-700 font-medium">{profile.position}</p>
                <span className="text-[10px] text-gray-400 bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5">Set by admin</span>
              </div>
            </div>
            {/* Email */}
            <div className="p-5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Email Address</label>
              <input
                type="email"
                value={profile.email}
                onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                placeholder="your@email.com"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <p className="text-xs text-gray-400 mt-1.5">Used for brief digest emails and @mention alerts.</p>
            </div>
            {/* Language */}
            <div className="p-5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Brief Language</label>
              <select
                value={profile.language}
                onChange={e => setProfile(p => ({ ...p, language: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              >
                {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
              </select>
            </div>
            {/* Save */}
            <div className="p-5 flex items-center justify-end gap-3">
              {error && <p className="text-xs text-red-600">{error}</p>}
              {saved && <p className="text-xs text-emerald-600 font-medium">Saved</p>}
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-60"
              >
                {saving && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Save changes
              </button>
            </div>
          </div>
        )
      )}

      {/* ── Saved tab ── */}
      {tab === 'saved' && (
        <div className="space-y-2">
          {savedLoading && (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-sm text-gray-400">Loading…</div>
          )}
          {!savedLoading && savedItems.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center">
              <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <p className="text-sm text-gray-400">No saved articles yet</p>
              <p className="text-xs text-gray-300 mt-1">Tap the bookmark icon on any article to save it here</p>
            </div>
          )}
          {savedItems.map(fav => {
            const weekOf = fav.brief_week_of
              ? new Date(fav.brief_week_of).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
              : null
            const color = SECTION_COLORS[fav.section] ?? 'bg-gray-100 text-gray-600'
            return (
              <Link
                key={fav.id}
                href={`/briefs/${fav.brief_id}/article/${fav.section}/${fav.item_index}`}
                className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-4 flex items-start gap-3 hover:border-gray-300 hover:shadow-md transition-all group block"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded shrink-0 ${color}`}>
                      {fav.section_label}
                    </span>
                    {weekOf && <span className="text-[10px] text-gray-400">Week of {weekOf}</span>}
                  </div>
                  <p className="text-sm font-medium text-gray-800 group-hover:text-blue-700 transition-colors line-clamp-2">
                    {fav.headline}
                  </p>
                </div>
                <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-400 shrink-0 mt-1 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )
          })}
        </div>
      )}

      {/* ── Notifications tab ── */}
      {tab === 'notifications' && (
        <div className="space-y-2">
          {notifsLoading && (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-sm text-gray-400">Loading…</div>
          )}
          {!notifsLoading && notifications.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center">
              <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="text-sm text-gray-400">No notifications yet</p>
              <p className="text-xs text-gray-300 mt-1">You will be notified when someone @mentions you in a comment</p>
            </div>
          )}
          {!notifsLoading && notifications.length > 0 && unreadCount > 0 && (
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-500">{unreadCount} unread</p>
              <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors">
                Mark all as read
              </button>
            </div>
          )}
          {notifications.map(n => {
            const href = n.brief_id && n.section !== null && n.item_index !== null
              ? `/briefs/${n.brief_id}/article/${n.section}/${n.item_index}`
              : '/briefs'
            return (
              <Link
                key={n.id}
                href={href}
                className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border shadow-sm transition-all hover:shadow-md ${
                  n.read ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-100'
                }`}
              >
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.read ? 'bg-gray-200' : 'bg-blue-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">
                    <span className="font-semibold">{n.from_name}</span> mentioned you in a comment
                    {n.headline && (
                      <span className="text-gray-500"> on &ldquo;{n.headline.slice(0, 60)}{n.headline.length > 60 ? '\u2026' : ''}&rdquo;</span>
                    )}
                  </p>
                  {n.comment_body && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 italic">&ldquo;{n.comment_body}&rdquo;</p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1">{formatTime(n.created_at)}</p>
                </div>
              </Link>
            )
          })}
        </div>
      )}

    </div>
  )
}
