'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

// ── Icons ─────────────────────────────────────────────────────────────────────
const HomeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)
const DocumentIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)
const IntelIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const SocialIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
  </svg>
)
const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)
const BackIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 19l-7-7 7-7" />
  </svg>
)
const OverviewIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
)
const MergeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M8 7h4m0 0V3m0 4l6 6m-6-6l-6 6m6 6v4m0-4l6-6m-6 6l-6-6" />
  </svg>
)

// Sub-nav icons (smaller)
const SmHomeIcon    = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
const SmDocIcon     = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
const SmNewsIcon    = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
const SmInternalIcon= () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
const SmHeartIcon   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
const SmBellIcon    = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
const SmBuildingIcon= () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
const SmCalIcon     = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
const SmAdminIcon   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
const SmChartIcon   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
const SmUsersIcon   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
const SmGlobeIcon   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
const SmChipIcon    = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 3H7a2 2 0 00-2 2v2M9 3h6M9 3v2m6-2h2a2 2 0 012 2v2m0 0V7m0 4v2m0 4v2m0-8h2m-2 4h2M3 9h2m-2 4h2M7 21h2m4 0h2m-8-6H5a2 2 0 01-2-2v-2" /></svg>
const SmSupplyIcon  = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
const SmMergeIcon   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7h4m0 0V3m0 4l6 6m-6-6l-6 6m6 6v4m0-4l6-6m-6 6l-6-6" /></svg>
const SmOverviewIcon= () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>

// ── Primitives ────────────────────────────────────────────────────────────────

type MainSection = 'home' | 'briefs' | 'intel' | 'social' | 'settings'
type BriefSection = 'brief' | 'intelligence' | 'ma' | 'settings'

function detectMainSection(path: string): MainSection {
  if (path === '/dashboard') return 'home'
  if (path.startsWith('/briefs')) return 'briefs'
  if (path === '/company-news' || path === '/internal') return 'intel'
  if (path === '/saved' || path === '/notifications' || path === '/me') return 'social'
  if (path === '/profile' || path.startsWith('/settings') || path === '/admin') return 'settings'
  return 'home'
}

function RailBtn({
  icon, label, active, onClick,
}: {
  icon: React.ReactNode; label: string; active: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all mx-auto ${
        active
          ? 'bg-blue-600 text-white shadow-sm'
          : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-500 dark:hover:bg-white/10 dark:hover:text-gray-200'
      }`}
    >
      {icon}
    </button>
  )
}


function NavLink({
  href, label, icon, active,
}: {
  href: string; label: string; icon: React.ReactNode; active: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
        active
          ? 'bg-blue-50 text-blue-700 font-medium dark:bg-blue-900/30 dark:text-blue-400'
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200'
      }`}
    >
      <span className={`shrink-0 ${active ? 'text-blue-600' : 'text-gray-400 dark:text-gray-500'}`}>{icon}</span>
      <span className="truncate">{label}</span>
    </Link>
  )
}

function SubLabel({ label }: { label: string }) {
  return (
    <p className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-300 dark:text-gray-600">
      {label}
    </p>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function Sidebar() {
  const pathname = usePathname()

  const briefMatch = pathname.match(/^\/briefs\/([^/]+)/)
  const briefId = briefMatch ? briefMatch[1] : null
  const insideBrief = briefId !== null

  // ── Brief sidebar ────────────────────────────────────────────────────────
  if (insideBrief) {
    const briefBase = `/briefs/${briefId}`
    const currentSegment = pathname.replace(briefBase, '').replace(/^\//, '')

    const detectBriefSection = (p: string): BriefSection => {
      if (p === briefBase || currentSegment === 'full' || currentSegment.startsWith('article')) return 'brief'
      if (p === '/profile' || p.startsWith('/settings') || p === '/admin') return 'settings'
      return 'brief'
    }

    const [briefSection, setBriefSection] = useState<BriefSection>(() => detectBriefSection(pathname))
    useEffect(() => { setBriefSection(detectBriefSection(pathname)) }, [pathname])

    const sections: { id: BriefSection; icon: React.ReactNode; label: string }[] = [
      { id: 'brief',        icon: <OverviewIcon />, label: 'Brief' },
      { id: 'intelligence', icon: <IntelIcon />,    label: 'Intelligence' },
      { id: 'ma',           icon: <MergeIcon />,    label: 'M&A' },
      { id: 'settings',     icon: <SettingsIcon />, label: 'Settings' },
    ]

    return (
      <aside className="hidden md:flex w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-white/10 shrink-0 overflow-hidden">
        {/* Rail */}
        <div className="w-14 shrink-0 flex flex-col items-center py-3 gap-1 border-r border-gray-100 dark:border-white/5">
          <Link
            href="/briefs"
            title="All Briefs"
            className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-500 dark:hover:bg-white/10 transition-all mb-1"
          >
            <BackIcon />
          </Link>
          <div className="w-6 border-t border-gray-100 dark:border-white/10 mb-1" />
          {sections.map(s => (
            <RailBtn
              key={s.id}
              icon={s.icon}
              label={s.label}
              active={briefSection === s.id}
              onClick={() => setBriefSection(s.id)}
            />
          ))}
          <div className="flex-1" />
          <div className="pb-2 opacity-40">
            <Image src="/logo-icon.png" alt="EIB" width={20} height={20} />
          </div>
        </div>

        {/* Sub-nav */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
            {briefSection === 'brief' && (
              <>
                <SubLabel label="This Brief" />
                <NavLink href={briefBase}           label="Overview"   icon={<SmOverviewIcon />} active={pathname === briefBase} />
                <NavLink href={`${briefBase}/full`} label="Full Brief" icon={<SmDocIcon />}      active={currentSegment === 'full'} />
              </>
            )}
            {briefSection === 'intelligence' && (
              <>
                <SubLabel label="Intelligence" />
                <NavLink href={`${briefBase}/full#brief-company-news`} label="Company News"   icon={<SmNewsIcon />}     active={false} />
                <NavLink href={`${briefBase}/full#brief-fin-signals`}  label="Markets"        icon={<SmChartIcon />}   active={false} />
                <NavLink href={`${briefBase}/full#brief-fin-news`}     label="Financial News" icon={<SmChartIcon />}   active={false} />
                <NavLink href={`${briefBase}/full#brief-comp`}         label="Competitors"    icon={<SmUsersIcon />}   active={false} />
                <NavLink href={`${briefBase}/full#brief-geo`}          label="Geopolitical"   icon={<SmGlobeIcon />}   active={false} />
                <NavLink href={`${briefBase}/full#brief-tech`}         label="Technology"     icon={<SmChipIcon />}    active={false} />
                <NavLink href={`${briefBase}/full#brief-ops`}          label="Supply Chain"   icon={<SmSupplyIcon />}  active={false} />
                <NavLink href={`${briefBase}/full#brief-hr`}           label="HR Intel"       icon={<SmUsersIcon />}   active={false} />
                <NavLink href="/internal"                              label="Internal Intel" icon={<SmInternalIcon />} active={pathname === '/internal'} />
              </>
            )}
            {briefSection === 'ma' && (
              <>
                <SubLabel label="Deals & Scenarios" />
                <NavLink href={`${briefBase}/full#brief-ma`}       label="M&A Watch"       icon={<SmMergeIcon />}   active={false} />
                <NavLink href={`${briefBase}/full#brief-risk`}     label="Risk Register"   icon={<SmGlobeIcon />}   active={false} />
                <NavLink href={`${briefBase}/full#brief-scenario`} label="Scenario Models" icon={<SmDocIcon />}     active={false} />
              </>
            )}
            {briefSection === 'settings' && (
              <>
                <SubLabel label="Settings" />
                <NavLink href="/profile"           label="Company Profile" icon={<SmBuildingIcon />} active={pathname === '/profile'} />
                <NavLink href="/settings/schedule" label="Brief Schedule"  icon={<SmCalIcon />}      active={pathname.startsWith('/settings/schedule')} />
                <NavLink href="/admin"             label="Admin"           icon={<SmAdminIcon />}    active={pathname === '/admin'} />
              </>
            )}
          </div>
        </div>
      </aside>
    )
  }

  // ── Main sidebar ─────────────────────────────────────────────────────────

  const [section, setSection] = useState<MainSection>(() => detectMainSection(pathname))
  useEffect(() => { setSection(detectMainSection(pathname)) }, [pathname])

  const mainSections: { id: MainSection; icon: React.ReactNode; label: string }[] = [
    { id: 'home',     icon: <HomeIcon />,     label: 'Dashboard' },
    { id: 'briefs',   icon: <DocumentIcon />, label: 'Briefs' },
    { id: 'intel',    icon: <IntelIcon />,    label: 'Intelligence' },
    { id: 'social',   icon: <SocialIcon />,   label: 'Saved & Notifications' },
    { id: 'settings', icon: <SettingsIcon />, label: 'Settings' },
  ]

  return (
    <aside className="hidden md:flex w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-white/10 shrink-0 overflow-hidden">
      {/* Rail */}
      <div className="w-14 shrink-0 flex flex-col items-center py-3 gap-1 border-r border-gray-100 dark:border-white/5">
        {mainSections.map(s => (
          <RailBtn
            key={s.id}
            icon={s.icon}
            label={s.label}
            active={section === s.id}
            onClick={() => setSection(s.id)}
          />
        ))}
        <div className="flex-1" />
        <div className="pb-2 opacity-40">
          <Image src="/logo-icon.png" alt="EIB" width={20} height={20} />
        </div>
      </div>

      {/* Sub-nav */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {section === 'home' && (
            <>
              <SubLabel label="Overview" />
              <NavLink href="/dashboard" label="Dashboard" icon={<SmHomeIcon />} active={pathname === '/dashboard'} />
            </>
          )}
          {section === 'briefs' && (
            <>
              <SubLabel label="Briefs" />
              <NavLink href="/briefs" label="All Briefs" icon={<SmDocIcon />} active={pathname === '/briefs'} />
            </>
          )}
          {section === 'intel' && (
            <>
              <SubLabel label="Intelligence" />
              <NavLink href="/company-news" label="Company News"   icon={<SmNewsIcon />}     active={pathname === '/company-news'} />
              <NavLink href="/internal"     label="Internal Intel" icon={<SmInternalIcon />} active={pathname === '/internal'} />
            </>
          )}
          {section === 'social' && (
            <>
              <SubLabel label="My Activity" />
              <NavLink href="/me"            label="My Page"        icon={<SmUsersIcon />} active={pathname === '/me'} />
              <NavLink href="/saved"         label="Saved Articles" icon={<SmHeartIcon />} active={pathname === '/saved'} />
              <NavLink href="/notifications" label="Notifications"  icon={<SmBellIcon />}  active={pathname === '/notifications'} />
            </>
          )}
          {section === 'settings' && (
            <>
              <SubLabel label="Settings" />
              <NavLink href="/profile"           label="Company Profile" icon={<SmBuildingIcon />} active={pathname === '/profile'} />
              <NavLink href="/settings/schedule" label="Brief Schedule"  icon={<SmCalIcon />}      active={pathname.startsWith('/settings/schedule')} />
              <NavLink href="/admin"             label="Admin"           icon={<SmAdminIcon />}    active={pathname === '/admin'} />
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
