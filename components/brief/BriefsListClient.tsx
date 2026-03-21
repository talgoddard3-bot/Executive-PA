'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { Brief } from '@/lib/types'

const FILTER_PILLS = [
  { key: 'all',          label: 'All' },
  { key: 'macro',        label: 'Macro' },
  { key: 'competitive',  label: 'Competitive' },
  { key: 'regulatory',   label: 'Regulatory' },
  { key: 'technology',   label: 'Technology' },
  { key: 'talent',       label: 'Talent' },
  { key: 'capital',      label: 'Capital' },
  { key: 'geopolitical', label: 'Geopolitical' },
] as const

type FilterKey = typeof FILTER_PILLS[number]['key']

const URGENCY_CONFIG = {
  'act-now':   { label: 'Act Now',   dot: 'bg-red-500',   badge: 'bg-red-50 text-red-700 border-red-200',     icon: '🔴' },
  'monitor':   { label: 'Monitor',   dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200', icon: '🟡' },
  'awareness': { label: 'Awareness', dot: 'bg-green-500', badge: 'bg-green-50 text-green-700 border-green-200', icon: '🟢' },
}

function UrgencyBadge({ urgency }: { urgency?: string }) {
  if (!urgency) return null
  const cfg = URGENCY_CONFIG[urgency as keyof typeof URGENCY_CONFIG]
  if (!cfg) return null
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function ReadTime({ minutes }: { minutes?: number }) {
  if (!minutes) return null
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {minutes} min read
    </span>
  )
}

function SectorTags({ tags }: { tags?: string[] }) {
  if (!tags?.length) return null
  return (
    <div className="flex flex-wrap gap-1">
      {tags.slice(0, 3).map(tag => (
        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 font-medium capitalize">
          {tag}
        </span>
      ))}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 p-4 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-3 w-16 bg-gray-200 dark:bg-white/10 rounded" />
        <div className="h-3 w-12 bg-gray-200 dark:bg-white/10 rounded" />
      </div>
      <div className="h-5 w-3/4 bg-gray-200 dark:bg-white/10 rounded mb-2" />
      <div className="h-4 w-full bg-gray-100 dark:bg-white/5 rounded mb-1" />
      <div className="h-4 w-5/6 bg-gray-100 dark:bg-white/5 rounded mb-3" />
      <div className="flex gap-1 mb-3">
        <div className="h-4 w-12 bg-gray-100 dark:bg-white/5 rounded" />
        <div className="h-4 w-14 bg-gray-100 dark:bg-white/5 rounded" />
      </div>
      <div className="pt-3 border-t border-gray-100 dark:border-white/5 flex justify-end gap-2">
        <div className="h-7 w-20 bg-gray-100 dark:bg-white/5 rounded-lg" />
        <div className="h-7 w-24 bg-blue-100 dark:bg-blue-900/20 rounded-lg" />
      </div>
    </div>
  )
}

interface ArchiveBriefCardProps {
  brief: Brief
  isAdmin?: boolean
}

function ArchiveBriefCard({ brief }: ArchiveBriefCardProps) {
  const [hovered, setHovered] = useState(false)
  const weekOf = new Date(brief.week_of).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const headline = brief.content?.headline ?? ''
  const sep = headline.indexOf(' — ')
  const title = sep !== -1 ? headline.slice(0, sep) : headline
  const tagline = sep !== -1 ? headline.slice(sep + 3) : null
  const high = brief.content?.risk_summary?.filter(r => r.severity === 'high').length ?? 0
  const med  = brief.content?.risk_summary?.filter(r => r.severity === 'medium').length ?? 0
  const urgency = brief.content?.urgency
  const readTime = brief.content?.read_time
  const sectorTags = brief.content?.sector_tags

  const daysOld = Math.floor((Date.now() - new Date(brief.week_of).getTime()) / (1000 * 60 * 60 * 24))
  const isOld = daysOld > 7

  return (
    <div
      className={`group rounded-xl border bg-white dark:bg-gray-800 p-4 transition-all duration-200 cursor-pointer ${
        hovered
          ? 'border-blue-200 dark:border-blue-700/50 shadow-md translate-y-[-1px]'
          : 'border-gray-200 dark:border-white/10 shadow-sm'
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top row */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{weekOf}</span>
        {isOld && (
          <span className="text-[10px] text-gray-400 dark:text-gray-500 italic">{daysOld}d ago</span>
        )}
        <UrgencyBadge urgency={urgency} />
        <ReadTime minutes={readTime} />
        {high > 0 && <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded">{high}H</span>}
        {med  > 0 && <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded">{med}M</span>}
      </div>

      {/* Headline */}
      {title && (
        <div className="mb-2">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
            {title}
          </h3>
          {tagline && !hovered && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug line-clamp-1">{tagline}</p>
          )}
          {hovered && tagline && (
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-snug">{tagline}</p>
          )}
        </div>
      )}

      {/* Sector tags */}
      <SectorTags tags={sectorTags} />

      {/* CTA — revealed on hover */}
      <div className={`flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-white/5 transition-opacity duration-150 ${hovered ? 'opacity-100' : 'opacity-0'}`}>
        <Link
          href={`/briefs/${brief.id}`}
          onClick={e => e.stopPropagation()}
          className="text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 px-3 py-1.5 rounded-lg transition-colors"
        >
          Overview
        </Link>
        <Link
          href={`/briefs/${brief.id}/full`}
          onClick={e => e.stopPropagation()}
          className="flex items-center gap-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors"
        >
          Read brief →
        </Link>
      </div>
    </div>
  )
}

interface BriefsListClientProps {
  briefs: Brief[]
  isAdmin?: boolean
}

export default function BriefsListClient({ briefs }: BriefsListClientProps) {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')

  const filtered = useMemo(() => {
    return briefs.filter(b => {
      const content = b.content
      if (!content) return true

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase()
        const headline = (content.headline ?? '').toLowerCase()
        const tags = [...(content.sector_tags ?? []), ...(content.region_tags ?? [])].join(' ').toLowerCase()
        const summary = (content.executive_summary ?? '').toLowerCase()
        if (!headline.includes(q) && !tags.includes(q) && !summary.includes(q)) return false
      }

      // Pill filter
      if (activeFilter !== 'all') {
        const tags = content.sector_tags ?? []
        if (!tags.some(t => t.toLowerCase().includes(activeFilter))) return false
      }

      return true
    })
  }, [briefs, search, activeFilter])

  return (
    <div className="space-y-4">
      {/* Search + filter bar */}
      <div className="space-y-2">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by topic, sector, or keyword…"
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex gap-1.5 flex-wrap">
          {FILTER_PILLS.map(pill => (
            <button
              key={pill.key}
              onClick={() => setActiveFilter(pill.key)}
              className={`text-xs font-medium px-3 py-1 rounded-full border transition-colors ${
                activeFilter === pill.key
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-blue-600/50 hover:text-blue-700 dark:hover:text-blue-400'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      {(search || activeFilter !== 'all') && (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {filtered.length === 0
            ? 'No briefs match your search. Try a broader term.'
            : `${filtered.length} brief${filtered.length !== 1 ? 's' : ''} found`}
        </p>
      )}

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-3">
          {filtered.map(b => (
            <ArchiveBriefCard key={b.id} brief={b} />
          ))}
        </div>
      ) : (search || activeFilter !== 'all') ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-white/10 p-10 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">No briefs match your search.</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Try a broader term or clear the filters.</p>
          <button
            onClick={() => { setSearch(''); setActiveFilter('all') }}
            className="mt-3 text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : null}
    </div>
  )
}

export { SkeletonCard }
