'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// ── Icons ─────────────────────────────────────────────────────────────────────
const HomeIcon = ({ active }: { active: boolean }) => (
  <svg className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2 : 1.75}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)
const DocumentIcon = ({ active }: { active: boolean }) => (
  <svg className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2 : 1.75}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)
const NewsIcon = ({ active }: { active: boolean }) => (
  <svg className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2 : 1.75}
      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
  </svg>
)
const BuildingIcon = ({ active }: { active: boolean }) => (
  <svg className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2 : 1.75}
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)
const BackIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
)

// ── Config ────────────────────────────────────────────────────────────────────
const MAIN_TABS = [
  { href: '/dashboard',    label: 'Dashboard', Icon: HomeIcon },
  { href: '/briefs',       label: 'Briefs',    Icon: DocumentIcon },
  { href: '/company-news', label: 'News',      Icon: NewsIcon },
  { href: '/profile',      label: 'Profile',   Icon: BuildingIcon },
]

const BRIEF_SECTIONS = [
  { segment: '',             label: 'Overview' },
  { segment: 'full',         label: 'Full Brief' },
  { segment: 'markets',      label: 'Markets' },
  { segment: 'supply-chain', label: 'Supply Chain' },
  { segment: 'competitors',  label: 'Competitors' },
  { segment: 'customers',    label: 'Customers' },
  { segment: 'technology',   label: 'Technology' },
  { segment: 'geopolitical', label: 'Geopolitical' },
  { segment: 'hr',           label: 'HR Intel' },
  { segment: 'ma',           label: 'M&A Watch' },
  { segment: 'company-news', label: 'Co. News' },
]

export default function MobileNav() {
  const pathname = usePathname()

  const briefMatch = pathname.match(/^\/briefs\/([^/]+)/)
  const briefId = briefMatch ? briefMatch[1] : null
  const insideBrief = briefId !== null
  const briefBase = briefId ? `/briefs/${briefId}` : ''
  const currentSegment = insideBrief
    ? pathname.replace(briefBase, '').replace(/^\//, '')
    : ''

  // ── Brief context: back link + horizontal section scroll ──────────────────
  if (insideBrief) {
    return (
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-xl">
        {/* Back row */}
        <div className="flex items-center px-4 pt-2 pb-1">
          <Link
            href="/briefs"
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors"
          >
            <BackIcon />
            All Briefs
          </Link>
        </div>
        {/* Section chips */}
        <div className="flex overflow-x-auto px-3 pb-3 gap-2 no-scrollbar">
          {BRIEF_SECTIONS.map(({ segment, label }) => {
            const href = segment ? `${briefBase}/${segment}` : briefBase
            const active = currentSegment === segment
            return (
              <Link
                key={segment}
                href={href}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </div>
        {/* iOS safe area */}
        <div className="h-safe-bottom bg-white" />
      </div>
    )
  }

  // ── Default: bottom tab bar ───────────────────────────────────────────────
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-xl">
      <div className="flex">
        {MAIN_TABS.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5"
            >
              <Icon active={active} />
              <span className={`text-[10px] font-medium leading-none ${active ? 'text-blue-600' : 'text-gray-400'}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
      {/* iOS home indicator safe area */}
      <div className="h-safe-bottom bg-white" />
    </nav>
  )
}
