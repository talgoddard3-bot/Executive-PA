'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const LANGUAGES = [
  'English', 'French', 'German', 'Spanish', 'Portuguese', 'Italian',
  'Dutch', 'Polish', 'Swedish', 'Norwegian', 'Danish', 'Finnish',
  'Japanese', 'Mandarin Chinese', 'Korean', 'Arabic', 'Hebrew',
]

interface UserProfile {
  full_name: string
  position: string
  email: string
  avatar_url: string | null
  language: string
}

export default function MyProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile>({ full_name: '', position: 'Chief Executive Officer', email: '', avatar_url: null, language: 'English' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const avatarInputRef = useRef<HTMLInputElement>(null)

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
      .finally(() => setLoading(false))
  }, [])

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

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = profile.full_name
    ? profile.full_name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : 'ME'

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center text-sm text-gray-400">
        Loading profile…
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Profile</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Personal details visible to you and your team.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm divide-y divide-gray-100 dark:divide-white/5">

        {/* Avatar section */}
        <div className="p-6 flex items-center gap-5">
          <div className="relative shrink-0">
            <div
              className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xl font-bold overflow-hidden cursor-pointer ring-2 ring-offset-2 ring-blue-200 hover:ring-blue-400 transition-all"
              onClick={() => avatarInputRef.current?.click()}
            >
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt="Avatar"
                  fill
                  className="object-cover rounded-full"
                  unoptimized
                />
              ) : (
                initials
              )}
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
            >
              <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{profile.full_name || 'Your Name'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{profile.position}</p>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="text-xs text-blue-600 hover:text-blue-800 mt-1.5 font-medium transition-colors"
            >
              {profile.avatar_url ? 'Change photo' : 'Upload photo'}
            </button>
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        {/* Name */}
        <div className="p-6">
          <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={profile.full_name}
            onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
            placeholder="Your full name"
            className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {/* Position — read-only */}
        <div className="p-6">
          <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
            Position
          </label>
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{profile.position}</p>
            <span className="text-[10px] text-gray-400 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-white/10 rounded px-1.5 py-0.5">Set by admin</span>
          </div>
        </div>

        {/* Email */}
        <div className="p-6">
          <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={profile.email}
            onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
            placeholder="your@email.com"
            className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">Used for brief digest emails and notifications.</p>
        </div>

        {/* Language */}
        <div className="p-6">
          <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
            Brief Language
          </label>
          <select
            value={profile.language}
            onChange={e => setProfile(p => ({ ...p, language: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          >
            {LANGUAGES.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
            Your intelligence brief and email digest will be generated in this language.
            The web app can also be translated by your browser automatically.
          </p>
        </div>

        {/* Actions */}
        <div className="p-6 flex items-center justify-between">
          <button
            onClick={signOut}
            className="text-sm text-gray-500 hover:text-red-600 transition-colors font-medium"
          >
            Sign out
          </button>
          <div className="flex items-center gap-3">
            {error && <p className="text-xs text-red-600">{error}</p>}
            {saved && <p className="text-xs text-emerald-600 font-medium">Saved ✓</p>}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-60"
            >
              {saving ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : null}
              Save changes
            </button>
          </div>
        </div>
      </div>

      {/* SQL migration note */}
      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
        <p className="font-semibold mb-1">Database migration required</p>
        <p className="text-amber-700 mb-2">Run in Supabase SQL editor if user profiles aren&apos;t saving:</p>
        <pre className="bg-amber-100 rounded p-2 text-[11px] overflow-x-auto">{`CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY,
  full_name TEXT DEFAULT '',
  position TEXT DEFAULT 'Executive',
  email TEXT DEFAULT '',
  avatar_url TEXT,
  language TEXT DEFAULT 'English'
);
-- If table already exists:
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'English';`}</pre>
        <p className="text-amber-700 mt-2">Also create a public Supabase Storage bucket named <strong>user-avatars</strong>.</p>
      </div>
    </div>
  )
}
