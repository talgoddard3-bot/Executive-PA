'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

interface CompanyBranding {
  name: string | null
  logo_url: string | null
  brand_color: string | null
}

interface UserProfile {
  full_name: string | null
  avatar_url: string | null
}

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [company, setCompany] = useState<CompanyBranding>({ name: null, logo_url: null, brand_color: null })
  const [user, setUser] = useState<UserProfile>({ full_name: null, avatar_url: null })
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const RTL_LANGS: Record<string, string> = { 'Hebrew': 'he', 'Arabic': 'ar' }

  useEffect(() => {
    fetch('/api/company').then(r => r.json()).then(setCompany).catch(() => {})
    fetch('/api/user-profile').then(r => r.json()).then(data => {
      setUser({ full_name: data.full_name || null, avatar_url: data.avatar_url || null })
      const lang: string = data.language ?? 'English'
      const langCode = RTL_LANGS[lang]
      document.documentElement.dir = langCode ? 'rtl' : 'ltr'
      document.documentElement.lang = langCode ?? 'en'
    }).catch(() => {})
  }, [pathname])

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const brandColor = company.brand_color ?? '#2563eb'
  const userInitials = user.full_name
    ? user.full_name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : (company.name ? company.name.slice(0, 2).toUpperCase() : 'EX')

  return (
    <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-white/10 flex items-center justify-between px-4 md:px-6 shrink-0 z-20">
      {/* Brand — click to go home */}
      <Link href="/dashboard" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: brandColor }}>
          {company.logo_url ? (
            <Image
              src={company.logo_url}
              alt={company.name ?? 'Company logo'}
              width={28}
              height={28}
              className="w-full h-full object-cover"
            />
          ) : (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          )}
        </div>
        <div className="flex flex-col leading-none">
          {company.name && (
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest leading-none mb-0.5">
              {company.name}
            </span>
          )}
          <span className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight leading-none">
            Executive Intelligence
          </span>
        </div>
      </Link>

      {/* Right controls */}
      <div className="flex items-center gap-1.5">
        {/* Settings */}
        <Link
          href="/settings"
          title="Settings"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-white/5 dark:hover:text-gray-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </Link>

        {/* Bell */}
        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/5 dark:hover:text-gray-200 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>

        {/* Avatar + dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            title="My profile"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white hover:opacity-90 transition-opacity overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400"
            style={{ background: `linear-gradient(135deg, ${brandColor}, ${brandColor}cc)` }}
          >
            {user.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt="Profile"
                width={32}
                height={32}
                className="w-full h-full object-cover rounded-full"
                unoptimized
              />
            ) : (
              userInitials
            )}
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-10 w-48 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 shadow-lg py-1 z-50 animate-fadeIn">
              {user.full_name && (
                <div className="px-4 py-2.5 border-b border-gray-100 dark:border-white/10">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{user.full_name}</p>
                </div>
              )}
              <Link
                href="/me"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                My Profile
              </Link>
              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </Link>
              <div className="border-t border-gray-100 dark:border-white/10 mt-1 pt-1">
                <button
                  onClick={() => { setMenuOpen(false); signOut() }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
