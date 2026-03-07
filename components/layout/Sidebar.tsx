'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// ── Icons ────────────────────────────────────────────────────────────────────
const HomeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)
const DocumentIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)
const ChartIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)
const UsersIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)
const ChipIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="7" y="7" width="10" height="10" rx="1" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4" />
  </svg>
)
const GlobeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
)
const SupplyIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
)
const BuildingIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)
const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)
const AdminIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)
const BackIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
)
const OverviewIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
)

// ── Brief sub-nav items (used when inside a brief) ────────────────────────────
const PeopleIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const MergeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
)

const NewsIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
  </svg>
)

const BRIEF_CHILDREN = [
  { label: 'Full Brief',      segment: 'full',         icon: <DocumentIcon /> },
  { label: 'Market Signals',  segment: 'markets',      icon: <ChartIcon /> },
  { label: 'Supply Chain',    segment: 'supply-chain', icon: <SupplyIcon /> },
  { label: 'Competitors',     segment: 'competitors',  icon: <UsersIcon /> },
  { label: 'Customers',       segment: 'customers',    icon: <BuildingIcon /> },
  { label: 'Technology',      segment: 'technology',   icon: <ChipIcon /> },
  { label: 'Geopolitical',    segment: 'geopolitical', icon: <GlobeIcon /> },
  { label: 'HR Intelligence', segment: 'hr',           icon: <PeopleIcon /> },
  { label: 'M&A Watch',       segment: 'ma',           icon: <MergeIcon /> },
  { label: 'Company News',    segment: 'company-news', icon: <NewsIcon /> },
]

function NavLink({
  href, label, icon, active, small = false,
}: {
  href: string; label: string; icon: React.ReactNode; active: boolean; small?: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-3 rounded-lg transition-colors ${
        small ? 'py-1.5 text-xs' : 'py-2 text-sm'
      } ${
        active
          ? 'bg-blue-50 text-blue-700 font-medium dark:bg-blue-900/30 dark:text-blue-400'
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200'
      }`}
    >
      <span className={`shrink-0 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>{icon}</span>
      {label}
    </Link>
  )
}

export default function Sidebar() {
  const pathname = usePathname()

  // Extract briefId if we're inside /briefs/[uuid] or /briefs/[uuid]/something
  const briefMatch = pathname.match(/^\/briefs\/([^/]+)/)
  const briefId = briefMatch ? briefMatch[1] : null
  const insideBrief = briefId !== null

  if (insideBrief) {
    // ── Brief-context nav ──────────────────────────────────────────────────
    const briefBase = `/briefs/${briefId}`
    const currentSegment = pathname.replace(briefBase, '').replace(/^\//, '') // e.g. "markets"

    return (
      <aside className="w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-white/10 flex flex-col shrink-0 overflow-hidden">
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {/* Back to list */}
          <Link
            href="/briefs"
            className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-1"
          >
            <BackIcon />
            All Briefs
          </Link>

          <div className="px-3 pt-1 pb-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-300 dark:text-gray-600">This Brief</div>
          </div>

          {/* Brief Dashboard */}
          <NavLink
            href={briefBase}
            label="Dashboard"
            icon={<OverviewIcon />}
            active={pathname === briefBase}
          />

          {/* Sub-sections */}
          <div className="ml-3 mt-1 pl-3 border-l border-gray-200 dark:border-white/10 space-y-0.5">
            {BRIEF_CHILDREN.map(({ label, segment, icon }) => (
              <NavLink
                key={segment}
                href={`${briefBase}/${segment}`}
                label={label}
                icon={icon}
                active={currentSegment === segment}
                small
              />
            ))}
          </div>
        </nav>

        <div className="border-t border-gray-100 dark:border-white/10 py-3 px-3 space-y-0.5">
          <NavLink href="/profile" label="Company Profile" icon={<BuildingIcon />} active={pathname === '/profile'} />
          <NavLink href="/settings/schedule" label="Brief Schedule" icon={<CalendarIcon />} active={pathname.startsWith('/settings/schedule')} />
          <NavLink href="/admin" label="Admin" icon={<AdminIcon />} active={pathname === '/admin'} />
        </div>
      </aside>
    )
  }

  // ── Default top-level nav ──────────────────────────────────────────────────
  return (
    <aside className="w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-white/10 flex flex-col shrink-0">
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        <NavLink href="/dashboard"    label="Dashboard"            icon={<HomeIcon />}     active={pathname === '/dashboard'} />
        <NavLink href="/briefs"       label="Intelligence Briefs"  icon={<DocumentIcon />} active={pathname === '/briefs'} />
        <NavLink href="/company-news" label="Company News"         icon={<NewsIcon />}     active={pathname === '/company-news'} />
      </nav>
      <div className="border-t border-gray-100 dark:border-white/10 py-3 px-3 space-y-0.5">
        <NavLink href="/profile" label="Company Profile" icon={<BuildingIcon />} active={pathname === '/profile'} />
        <NavLink href="/settings/schedule" label="Brief Schedule" icon={<CalendarIcon />} active={pathname.startsWith('/settings/schedule')} />
      </div>
    </aside>
  )
}
