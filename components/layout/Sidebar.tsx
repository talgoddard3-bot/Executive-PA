'use client'

import Link from 'next/link'
import Image from 'next/image'
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
const NewsIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
  </svg>
)
const InternalIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
)
const ChartIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
  </svg>
)
const UsersIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)
const GlobeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const ChipIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M9 3H7a2 2 0 00-2 2v2M9 3h6M9 3v2m6-2h2a2 2 0 012 2v2m0 0V7m0 4v2m0 4v2m0-8h2m-2 4h2M3 9h2m-2 4h2M7 21h2m4 0h2m-8-6H5a2 2 0 01-2-2v-2" />
  </svg>
)
const SupplyIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
)
const MergeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M8 7h4m0 0V3m0 4l6 6m-6-6l-6 6m6 6v4m0-4l6-6m-6 6l-6-6" />
  </svg>
)


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

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="px-3 pt-3 pb-1">
      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-300 dark:text-gray-600">{label}</div>
    </div>
  )
}

export default function Sidebar() {
  const pathname = usePathname()

  const briefMatch = pathname.match(/^\/briefs\/([^/]+)/)
  const briefId = briefMatch ? briefMatch[1] : null
  const insideBrief = briefId !== null

  if (insideBrief) {
    const briefBase = `/briefs/${briefId}`
    const currentSegment = pathname.replace(briefBase, '').replace(/^\//, '')

    return (
      <aside className="hidden md:flex w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-white/10 flex-col shrink-0 overflow-hidden">
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
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

          <NavLink href={briefBase} label="Overview" icon={<OverviewIcon />} active={pathname === briefBase} />
          <NavLink href={`${briefBase}/full`} label="Full Brief" icon={<DocumentIcon />} active={currentSegment === 'full'} />

          <SectionLabel label="Intelligence" />
          <NavLink href={`${briefBase}/full#brief-company-news`} label="Company News"  icon={<NewsIcon />}     active={false} />
          <NavLink href={`${briefBase}/full#brief-fin-signals`}  label="Markets"       icon={<ChartIcon />}    active={false} />
          <NavLink href={`${briefBase}/full#brief-comp`}         label="Competitors"   icon={<UsersIcon />}    active={false} />
          <NavLink href={`${briefBase}/full#brief-geo`}          label="Geopolitical"  icon={<GlobeIcon />}    active={false} />
          <NavLink href={`${briefBase}/full#brief-tech`}         label="Technology"    icon={<ChipIcon />}     active={false} />
          <NavLink href={`${briefBase}/full#brief-ops`}          label="Supply Chain"  icon={<SupplyIcon />}   active={false} />
          <NavLink href="/internal"                              label="Internal Intel" icon={<InternalIcon />} active={pathname === '/internal'} />

          <SectionLabel label="M&amp;A" />
          <NavLink href={`${briefBase}/full#brief-ma`}           label="M&A Watch"     icon={<MergeIcon />}    active={false} />
        </nav>

        <div className="border-t border-gray-100 dark:border-white/10 py-3 px-3 space-y-0.5">
          <NavLink href="/profile" label="Company Profile" icon={<BuildingIcon />} active={pathname === '/profile'} />
          <NavLink href="/settings/schedule" label="Brief Schedule" icon={<CalendarIcon />} active={pathname.startsWith('/settings/schedule')} />
          <NavLink href="/admin" label="Admin" icon={<AdminIcon />} active={pathname === '/admin'} />
        </div>
        <div className="px-4 py-3 border-t border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-2 opacity-40 hover:opacity-60 transition-opacity">
            <Image src="/logo-icon.png" alt="Intelligent Brief" width={16} height={16} className="shrink-0" />
            <span className="text-[10px] font-semibold tracking-tight text-gray-500 dark:text-gray-400">
              Intelligent <span className="text-blue-500">Brief</span>
            </span>
          </div>
        </div>
      </aside>
    )
  }

  // ── Default top-level nav ──────────────────────────────────────────────────
  return (
    <aside className="hidden md:flex w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-white/10 flex-col shrink-0">
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        <NavLink href="/dashboard" label="Dashboard"           icon={<HomeIcon />}     active={pathname === '/dashboard'} />
        <NavLink href="/briefs"    label="Intelligence Briefs" icon={<DocumentIcon />} active={pathname.startsWith('/briefs')} />

        <SectionLabel label="Intelligence" />
        <NavLink href="/company-news" label="Company News"   icon={<NewsIcon />}     active={pathname === '/company-news'} />
        <NavLink href="/internal"     label="Internal Intel" icon={<InternalIcon />} active={pathname === '/internal'} />
      </nav>
      <div className="border-t border-gray-100 dark:border-white/10 py-3 px-3 space-y-0.5">
        <NavLink href="/profile"           label="Company Profile" icon={<BuildingIcon />} active={pathname === '/profile'} />
        <NavLink href="/settings/schedule" label="Brief Schedule"  icon={<CalendarIcon />} active={pathname.startsWith('/settings/schedule')} />
      </div>
      <div className="px-4 py-3 border-t border-gray-100 dark:border-white/10">
        <div className="flex items-center gap-2 opacity-40 hover:opacity-60 transition-opacity">
          <Image src="/logo-icon.png" alt="Intelligent Brief" width={16} height={16} className="shrink-0" />
          <span className="text-[10px] font-semibold tracking-tight text-gray-500 dark:text-gray-400">
            Intelligent <span className="text-blue-500">Brief</span>
          </span>
        </div>
      </div>
    </aside>
  )
}
