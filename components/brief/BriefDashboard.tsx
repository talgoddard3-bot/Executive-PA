'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { BriefContent } from '@/lib/types'
import DashboardVisuals from '@/components/dashboard/DashboardVisuals'
import SWOTPanel from '@/components/brief/SWOTPanel'

interface Props {
  briefId: string
  content: BriefContent
  weekOf: string
  generatedAt?: string | null
  companyName?: string | null
}

// ── Inline bold renderer ───────────────────────────────────────────────────────
function boldify(text: string): React.ReactNode {
  if (!text.includes('**')) return text
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} className="font-semibold text-gray-900 dark:text-white">{part}</strong>
      : part
  )
}

// ── Feed item shape ────────────────────────────────────────────────────────────

interface FeedItem {
  id: string
  priority: number
  section: string
  sectionColor: string
  severity?: string
  severityColor?: string
  title: string
  excerpt: string
  href: string
}

function buildFeed(briefId: string, content: BriefContent): FeedItem[] {
  const items: FeedItem[] = []

  // Risks
  ;(content.risk_summary ?? []).forEach((r, i) => {
    const p = r.severity === 'high' ? 10 : r.severity === 'medium' ? 7 : 3
    items.push({
      id: `risk-${i}`, priority: p,
      section: 'Risk', sectionColor: 'bg-red-50 text-red-700',
      severity: r.severity,
      severityColor: r.severity === 'high' ? 'bg-red-100 text-red-700' : r.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700',
      title: r.title, excerpt: r.detail,
      href: `/briefs/${briefId}/article/risk_summary/${i}`,
    })
  })

  // Competitors
  ;(content.competitor_intelligence ?? []).forEach((c, i) => {
    const p = c.threat_level === 'high' ? 9 : c.threat_level === 'medium' ? 6 : 3
    items.push({
      id: `comp-${i}`, priority: p,
      section: 'Competitor', sectionColor: 'bg-orange-50 text-orange-700',
      severity: c.threat_level,
      severityColor: c.threat_level === 'high' ? 'bg-red-100 text-red-700' : c.threat_level === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700',
      title: `${c.competitor} — ${c.headline}`,
      excerpt: c.detail.replace(/\*\*/g, ''),
      href: `/briefs/${briefId}/article/competitor_intelligence/${i}`,
    })
  })

  // Marketing opportunities
  ;(content.marketing_opportunities ?? []).forEach((o, i) => {
    const p = o.urgency === 'high' ? 8 : o.urgency === 'medium' ? 5 : 2
    items.push({
      id: `opp-${i}`, priority: p,
      section: 'Opportunity', sectionColor: 'bg-emerald-50 text-emerald-700',
      severity: o.urgency,
      severityColor: o.urgency === 'high' ? 'bg-emerald-100 text-emerald-700' : o.urgency === 'medium' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600',
      title: o.channel, excerpt: o.opportunity,
      href: `/briefs/${briefId}/article/marketing_opportunities/${i}`,
    })
  })

  // Geopolitical
  ;(content.geopolitical_news ?? []).forEach((g, i) => {
    items.push({
      id: `geo-${i}`, priority: 6,
      section: 'Geopolitical', sectionColor: 'bg-violet-50 text-violet-700',
      title: `${g.region} — ${g.headline}`,
      excerpt: g.relevance,
      href: `/briefs/${briefId}/article/geopolitical_news/${i}`,
    })
  })

  // Financial news
  ;(content.financial_news ?? []).forEach((f, i) => {
    items.push({
      id: `fin-${i}`, priority: 5,
      section: 'Financial', sectionColor: 'bg-blue-50 text-blue-700',
      title: `${f.market} — ${f.headline}`,
      excerpt: f.impact,
      href: `/briefs/${briefId}/article/financial_news/${i}`,
    })
  })

  // M&A
  ;(content.ma_watch ?? []).forEach((m, i) => {
    const p = m.relevance === 'direct' ? 8 : m.relevance === 'adjacent' ? 5 : 3
    items.push({
      id: `ma-${i}`, priority: p,
      section: 'M&A', sectionColor: 'bg-indigo-50 text-indigo-700',
      title: m.headline, excerpt: m.strategic_read,
      href: `/briefs/${briefId}/article/ma_watch/${i}`,
    })
  })

  // Company news
  ;(content.company_news ?? []).forEach((n, i) => {
    const p = n.sentiment === 'negative' ? 7 : n.sentiment === 'neutral' ? 4 : 3
    items.push({
      id: `cnews-${i}`, priority: p,
      section: 'Company News',
      sectionColor: n.sentiment === 'negative' ? 'bg-red-50 text-red-700' : n.sentiment === 'positive' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-600',
      title: n.headline, excerpt: n.exec_note,
      href: `/briefs/${briefId}/article/company_news/${i}`,
    })
  })

  return items.sort((a, b) => b.priority - a.priority)
}

function buildTopSignals(briefId: string, content: BriefContent): FeedItem[] {
  const all = buildFeed(briefId, content)
  const seen = new Set<string>()
  const top: FeedItem[] = []
  for (const item of all) {
    if (top.length >= 6) break
    if (!seen.has(item.section)) { seen.add(item.section); top.push(item) }
    else if (item.priority >= 9) top.push(item)
  }
  return top.slice(0, 6)
}

const SWOT_SECTORS = [
  {
    key: 'strengths', label: 'Strengths', abbr: 'S',
    fill: '#059669', stroke: '#059669', itemColor: 'text-emerald-700',
    path: 'M 100 100 L 100 20 A 80 80 0 0 1 180 100 Z',
    tx: 143, ty: 62,
  },
  {
    key: 'threats', label: 'Threats', abbr: 'T',
    fill: '#d97706', stroke: '#d97706', itemColor: 'text-amber-700',
    path: 'M 100 100 L 180 100 A 80 80 0 0 1 100 180 Z',
    tx: 143, ty: 138,
  },
  {
    key: 'weaknesses', label: 'Weaknesses', abbr: 'W',
    fill: '#dc2626', stroke: '#dc2626', itemColor: 'text-red-700',
    path: 'M 100 100 L 100 180 A 80 80 0 0 1 20 100 Z',
    tx: 57, ty: 138,
  },
  {
    key: 'opportunities', label: 'Opportunities', abbr: 'O',
    fill: '#2563eb', stroke: '#2563eb', itemColor: 'text-blue-700',
    path: 'M 100 100 L 20 100 A 80 80 0 0 1 100 20 Z',
    tx: 57, ty: 62,
  },
]

function SwotCircleViz({ swot }: { swot: SWOTAnalysis }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const sectors = SWOT_SECTORS.map(s => ({
    ...s,
    items: (swot[s.key as keyof SWOTAnalysis] ?? []) as Array<{ point: string }>,
  }))
  const total = sectors.reduce((n, s) => n + s.items.length, 0)

  function toggleItem(key: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">
        SWOT Analysis
      </p>
      <div className="flex gap-6 items-start">

        {/* ── Circle ── */}
        <div className="shrink-0">
          <svg viewBox="0 0 200 200" className="w-44 h-44">
            {sectors.map(s => (
              <path
                key={s.key}
                d={s.path}
                fill={s.fill}
                fillOpacity={0.12}
                stroke="white"
                strokeWidth="4"
              />
            ))}

            {/* Radial dividers */}
            <line x1="100" y1="20" x2="100" y2="180" stroke="white" strokeWidth="4" />
            <line x1="20" y1="100" x2="180" y2="100" stroke="white" strokeWidth="4" />

            {/* Outer ring accent */}
            <circle cx="100" cy="100" r="80" fill="none" stroke="#f1f5f9" strokeWidth="1.5" />

            {/* Center donut hole */}
            <circle cx="100" cy="100" r="34" fill="white" />

            {/* Center text */}
            <text x="100" y="95" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#6b7280" letterSpacing="1.5">
              SWOT
            </text>
            <text x="100" y="109" textAnchor="middle" fontSize="8" fill="#9ca3af">
              {total} signals
            </text>

            {/* Sector labels: letter + count */}
            {sectors.map(s => (
              <g key={s.key + '-lbl'}>
                <text x={s.tx} y={s.ty - 2} textAnchor="middle" fontSize="13" fontWeight="800" fill={s.stroke}>
                  {s.abbr}
                </text>
                <text x={s.tx} y={s.ty + 12} textAnchor="middle" fontSize="9" fontWeight="600" fill={s.stroke} opacity="0.7">
                  {s.items.length}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* ── Items 2×2 grid ── */}
        <div className="flex-1 grid grid-cols-2 gap-x-5 gap-y-4 min-w-0">
          {sectors.map(s => (
            <div key={s.key}>
              <p className={`text-[9px] font-bold uppercase tracking-widest mb-1.5 ${s.itemColor}`}>
                {s.label}
              </p>
              <div className="space-y-1.5">
                {s.items.slice(0, 2).map((item, i) => {
                  const k = `${s.key}-${i}`
                  const isExpanded = expanded.has(k)
                  const text = item.point.replace(/\*\*/g, '')
                  const long = text.length > 100
                  return (
                    <div key={i}>
                      <p className={`text-[11px] text-gray-600 dark:text-gray-400 leading-snug ${!isExpanded && long ? 'line-clamp-2' : ''}`}>
                        {text}
                      </p>
                      {long && (
                        <button
                          onClick={() => toggleItem(k)}
                          className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline mt-0.5"
                        >
                          {isExpanded ? 'Read less' : 'Read more →'}
                        </button>
                      )}
                    </div>
                  )
                })}
                {s.items.length === 0 && (
                  <p className="text-[11px] text-gray-300 dark:text-gray-600 italic">None identified</p>
                )}
                {s.items.length > 2 && (
                  <p className={`text-[10px] font-semibold ${s.itemColor} opacity-60`}>
                    +{s.items.length - 2} more
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SwotPill({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {label}: {count}
    </span>
  )
}

function SignalCard({ item }: { item: FeedItem }) {
  return (
    <Link href={item.href} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-4 hover:border-gray-300 dark:hover:border-white/20 hover:shadow-md transition-all block">
      <div className="flex items-center gap-1.5 mb-2">
        <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${item.sectionColor}`}>{item.section}</span>
        {item.severityColor && item.severity && (
          <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${item.severityColor}`}>{item.severity}</span>
        )}
      </div>
      <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2 mb-1">{item.title}</p>
      <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug line-clamp-2">{item.excerpt}</p>
    </Link>
  )
}

export default function BriefDashboard({ briefId, content, weekOf, generatedAt, companyName }: Props) {
  const swot = content.swot ?? { strengths: [], weaknesses: [], opportunities: [], threats: [] }
  const topSignals = buildTopSignals(briefId, content)

  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [sendError, setSendError] = useState('')

  async function sendBrief() {
    setSending(true)
    setSendError('')
    const res = await fetch(`/api/briefs/${briefId}/send`, { method: 'POST' })
    if (res.ok) {
      setSent(true)
      setTimeout(() => setSent(false), 4000)
    } else {
      const d = await res.json().catch(() => ({}))
      setSendError(d.error ?? 'Failed to send')
    }
    setSending(false)
  }

  return (
    <div className="space-y-5 p-6 max-w-5xl">

      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
          <Link href="/briefs" className="hover:text-gray-700 transition-colors">Intelligence Briefs</Link>
          <span>/</span>
          <span className="text-gray-600">Week of {weekOf}</span>
          {generatedAt && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              · Generated {new Date(generatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={sendBrief}
            disabled={sending || sent}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 bg-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {sent ? (
              <>
                <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Sent
              </>
            ) : sending ? (
              <>
                <span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Brief
              </>
            )}
          </button>
          {sendError && <span className="text-xs text-red-600">{sendError}</span>}
          <Link href={`/briefs/${briefId}/full`}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
            Read Full Brief →
          </Link>
        </div>
      </div>

      {/* ── 1. AI Weekly Summary ──────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="p-5 pb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
            {companyName ?? 'Company'} · Week of {weekOf}
          </p>
          {content.headline ? (
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-snug mb-3">
              {content.headline}
            </h1>
          ) : (
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-snug mb-3">
              {companyName ?? 'Company'} — Weekly Intelligence Brief
            </h1>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {boldify(content.executive_summary)}
          </p>
        </div>
      </div>

      {/* ── 2. SWOT ──────────────────────────────────────────────────────── */}
      <SWOTPanel swot={content.swot} />

      {/* ── 3. AI Strategic Visuals ───────────────────────────────────────── */}
      <DashboardVisuals briefId={briefId} />

      {/* ── 4. Top Signals This Week ──────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Top Signals This Week</p>
        <div className="grid grid-cols-3 gap-3">
          {topSignals.map(item => <SignalCard key={item.id} item={item} />)}
          {topSignals.length === 0 && (
            <p className="col-span-3 text-sm text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-white/10 p-6 text-center">
              No signals yet. Generate a new brief.
            </p>
          )}
        </div>
      </div>

      {/* ── 4. Read Full Brief CTA ───────────────────────────────────────── */}
      <Link
        href={`/briefs/${briefId}/full`}
        className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm px-5 py-4 hover:border-blue-200 hover:shadow-md transition-all group"
      >
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-700 transition-colors">Read the Full Brief</p>
          <p className="text-xs text-gray-400 mt-0.5">All intelligence sections — filtered by role, with in-depth analysis</p>
        </div>
        <svg className="w-5 h-5 text-gray-300 group-hover:text-blue-500 shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  )
}
