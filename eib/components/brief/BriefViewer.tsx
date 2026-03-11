'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import Image from 'next/image'
import type { BriefContent, RiskItem, Scenario, MarketingOpportunityItem, FinancialSignalItem, OperationalAlert, TechIntelItem, HRIntelItem, MAItem, CustomerIntelItem, CompanyNewsItem } from '@/lib/types'
import { getFlag } from '@/lib/flags'
import { MACRO_CHARTS, SPARKLINES, CFO_CHART_MAP } from '@/lib/market-data'
import type { StoredSparkline, SWOTItem } from '@/lib/types'
import MarketMiniChart from './MarketMiniChart'
import BriefTOC, { AUDIENCE_COLORS, type TOCSection } from './BriefTOC'
import FeedbackButtons from '@/components/internal/FeedbackButtons'

// ── Styling ──────────────────────────────────────────────────────────────────

const severityBadge: Record<string, string> = {
  high:   'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low:    'bg-gray-100 text-gray-600 border-gray-200',
}
const probabilityDot: Record<string, string> = {
  high:   'bg-red-500',
  medium: 'bg-amber-400',
  low:    'bg-gray-400',
}
const threatBadge: Record<string, string> = {
  high:   'text-red-600 bg-red-50 border-red-200',
  medium: 'text-amber-600 bg-amber-50 border-amber-200',
  low:    'text-gray-500 bg-gray-50 border-gray-200',
}
const urgencyBadge: Record<string, string> = {
  high:   'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low:    'bg-gray-100 text-gray-600 border-gray-200',
}
const typeLabel: Record<string, string> = {
  product_launch: 'NEW PRODUCT',
  pricing:        'PRICING',
  partnership:    'PARTNERSHIP',
  expansion:      'EXPANSION',
  other:          'MOVE',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function RichText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return (
    <span className={className}>
      {parts.map((part, i) =>
        i % 2 === 1
          ? <strong key={i} className="font-semibold text-gray-900">{part}</strong>
          : part
      )}
    </span>
  )
}

function SourceTag({ source }: { source?: string }) {
  if (!source) return null
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 mt-1.5">
      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
      {source}
    </span>
  )
}

function CountryLabel({ name }: { name: string }) {
  const country = name.split('—')[0].split('·')[0].trim()
  const flag = getFlag(country)
  return (
    <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
      {flag && <span className="mr-1">{flag}</span>}
      {name}
    </span>
  )
}

// ── Collapsible section ───────────────────────────────────────────────────────

function CollapsibleSection({
  id, label, audience, children, defaultExpanded = false,
}: {
  id: string; label: string; audience: string
  children: React.ReactNode; defaultExpanded?: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const audienceColor = AUDIENCE_COLORS[audience] ?? 'text-gray-500 bg-gray-50'

  return (
    <section id={id} className="rounded-lg border border-gray-200 bg-white overflow-hidden scroll-mt-4">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50/60">
        <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-gray-500">{label}</span>
        <div className="flex items-center gap-2">
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${audienceColor}`}>
            {audience}
          </span>
          <button onClick={() => setExpanded(!expanded)}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors text-[10px]">
            {expanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="p-4">{children}</div>
      ) : (
        <button onClick={() => setExpanded(true)}
          className="w-full px-4 py-2.5 text-left text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-between">
          <span>Expand section</span>
          <span>↓</span>
        </button>
      )}
    </section>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function RiskCard({ risk }: { risk: RiskItem }) {
  return (
    <div className="flex items-start gap-2.5 py-2.5 border-b border-gray-100 last:border-0">
      <span className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${probabilityDot[risk.severity] ?? 'bg-gray-400'}`} />
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-900">{risk.title}</span>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border uppercase tracking-wide ${severityBadge[risk.severity]}`}>
            {risk.severity}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{risk.detail}</p>
        <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide">{risk.timeframe}</p>
      </div>
    </div>
  )
}

function ScenarioCard({ scenario }: { scenario: Scenario }) {
  return (
    <div className="rounded-lg border border-gray-200 p-3.5 space-y-2 bg-gray-50/40">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-gray-900">{scenario.title}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`w-2 h-2 rounded-full ${probabilityDot[scenario.probability] ?? 'bg-gray-400'}`} />
          <span className="text-[10px] text-gray-400 uppercase tracking-wide">{scenario.probability} prob.</span>
        </div>
      </div>
      <div className="space-y-1 text-xs">
        <p><span className="font-semibold text-gray-700">Trigger: </span><span className="text-gray-600">{scenario.trigger}</span></p>
        <p><span className="font-semibold text-gray-700">Impact: </span><span className="text-gray-600">{scenario.impact}</span></p>
        <p><span className="font-semibold text-gray-700">Response: </span><span className="text-gray-600">{scenario.response}</span></p>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

// ── SWOT panel ────────────────────────────────────────────────────────────────

const SWOT_CONFIG = {
  strengths:     { label: 'Strengths',     icon: '↑', color: '#10b981', badge: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500', ring: 'ring-emerald-300', activeBg: 'bg-emerald-50' },
  weaknesses:    { label: 'Weaknesses',    icon: '↓', color: '#f97316', badge: 'bg-orange-100 text-orange-800',   dot: 'bg-orange-400',  ring: 'ring-orange-300',  activeBg: 'bg-orange-50' },
  opportunities: { label: 'Opportunities', icon: '↗', color: '#3b82f6', badge: 'bg-blue-100 text-blue-800',       dot: 'bg-blue-500',    ring: 'ring-blue-300',    activeBg: 'bg-blue-50' },
  threats:       { label: 'Threats',       icon: '⚠', color: '#ef4444', badge: 'bg-red-100 text-red-800',         dot: 'bg-red-500',     ring: 'ring-red-300',     activeBg: 'bg-red-50' },
}

// Map SWOT source text → brief section IDs for scroll-links
function sourceToSectionId(source: string): string | null {
  const s = source.toLowerCase()
  if (s.includes('financial news') || s.includes('market news')) return 'brief-fin-news'
  if (s.includes('geopolit') || s.includes('political'))          return 'brief-geo'
  if (s.includes('competitor') || s.includes('competition'))      return 'brief-comp'
  if (s.includes('marketing') || s.includes('channel'))           return 'brief-mktg'
  if (s.includes('risk'))                                          return 'brief-risk'
  if (s.includes('capital') || s.includes('fx') || s.includes('financial signal')) return 'brief-fin-signals'
  if (s.includes('operat') || s.includes('supply') || s.includes('logistic'))      return 'brief-ops'
  if (s.includes('tech') || s.includes('ai ') || s.includes('software'))           return 'brief-tech'
  if (s.includes('hr') || s.includes('talent') || s.includes('workforce') || s.includes('hiring')) return 'brief-hr'
  if (s.includes('m&a') || s.includes('acquisition') || s.includes('merger') || s.includes('deal') || s.includes('funding') || s.includes('ipo')) return 'brief-ma'
  if (s.includes('decision'))                                      return 'brief-decisions'
  if (s.includes('scenario'))                                      return 'brief-scenarios'
  return null
}

function SWOTPanel({ swot, brandColor }: { swot: BriefContent['swot']; brandColor?: string | null }) {
  const [activeQ, setActiveQ] = useState<keyof typeof SWOT_CONFIG | null>(null)
  const accent = brandColor ?? '#111827'
  const quadrants = ['strengths', 'opportunities', 'weaknesses', 'threats'] as const

  const chartData = quadrants
    .map(q => ({ name: SWOT_CONFIG[q].label, value: (swot?.[q] ?? []).length, key: q, color: SWOT_CONFIG[q].color }))
    .filter(d => d.value > 0)

  const totalItems = chartData.reduce((s, d) => s + d.value, 0)

  const visibleQuadrants = activeQ ? [activeQ] : quadrants
  const allItems = quadrants.flatMap(q =>
    (swot?.[q] ?? []).map(item => ({ ...item, quadrant: q as keyof typeof SWOT_CONFIG }))
  )
  const displayItems = activeQ
    ? allItems.filter(i => i.quadrant === activeQ)
    : allItems

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div id="brief-swot" className="rounded-xl border-2 overflow-hidden bg-white" style={{ borderColor: accent + '33' }}>
      {/* Header */}
      <div className="px-5 py-3 flex items-center justify-between" style={{ background: accent + '0d' }}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: accent }}>
            SWOT Analysis — This Week
          </span>
          <span className="text-[10px] text-gray-400 font-medium">{totalItems} signals</span>
        </div>
        <span className="text-[10px] text-gray-400">Synthesised from all signals below · click to filter</span>
      </div>

      <div className="p-5 flex flex-col lg:flex-row gap-6">

        {/* ── Donut chart + legend ── */}
        <div className="shrink-0 flex flex-col items-center gap-4">
          <div className="relative w-44 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%" cy="50%"
                  innerRadius={52} outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                  onClick={(d) => setActiveQ(activeQ === d.key ? null : d.key as keyof typeof SWOT_CONFIG)}
                  cursor="pointer"
                  strokeWidth={0}
                >
                  {chartData.map((d) => (
                    <Cell
                      key={d.key}
                      fill={d.color}
                      opacity={activeQ && activeQ !== d.key ? 0.25 : 1}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number | undefined, name: string | undefined) => [`${v ?? 0} signal${(v ?? 0) !== 1 ? 's' : ''}`, name ?? '']}
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb', padding: '4px 10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              {activeQ ? (
                <>
                  <span className="text-2xl font-bold text-gray-900">{(swot?.[activeQ] ?? []).length}</span>
                  <span className="text-[10px] text-gray-500 font-medium">{SWOT_CONFIG[activeQ].label}</span>
                </>
              ) : (
                <>
                  <span className="text-2xl font-bold text-gray-900">{totalItems}</span>
                  <span className="text-[10px] text-gray-500 font-medium">signals</span>
                </>
              )}
            </div>
          </div>

          {/* Legend / filter buttons */}
          <div className="grid grid-cols-2 gap-1.5 w-full">
            {quadrants.map(q => {
              const cfg = SWOT_CONFIG[q]
              const count = (swot?.[q] ?? []).length
              const isActive = activeQ === q
              return (
                <button
                  key={q}
                  onClick={() => setActiveQ(isActive ? null : q)}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left transition-all text-xs font-medium border ${
                    isActive
                      ? `${cfg.activeBg} ring-2 ${cfg.ring} border-transparent`
                      : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                  } ${count === 0 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  disabled={count === 0}
                >
                  <span className="text-base leading-none">{cfg.icon}</span>
                  <span className="text-gray-700">{cfg.label}</span>
                  <span className="ml-auto text-gray-400 font-normal tabular-nums">{count}</span>
                </button>
              )
            })}
          </div>

          {activeQ && (
            <button
              onClick={() => setActiveQ(null)}
              className="text-[11px] text-gray-400 hover:text-gray-600 underline underline-offset-2"
            >
              Show all quadrants
            </button>
          )}
        </div>

        {/* ── Items list ── */}
        <div className="flex-1 min-w-0 space-y-3 max-h-72 overflow-y-auto pr-1">
          {displayItems.length === 0 && (
            <p className="text-xs text-gray-400 italic">No signals in this quadrant this week.</p>
          )}
          {displayItems.map((item, i) => {
            const cfg = SWOT_CONFIG[item.quadrant]
            const sectionId = sourceToSectionId(item.source)
            return (
              <div key={i} className={`flex gap-3 items-start p-3 rounded-lg border transition-colors ${
                activeQ === item.quadrant || !activeQ ? cfg.activeBg + ' border-transparent' : 'bg-gray-50 border-gray-100 opacity-60'
              }`}>
                <span className={`mt-0.5 shrink-0 w-5 h-5 rounded flex items-center justify-center text-sm font-bold ${cfg.badge}`}>
                  {cfg.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-800 leading-snug font-medium">
                    <RichText text={item.point} />
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {/* Urgency badge */}
                    {item.urgency && (item.quadrant === 'opportunities' || item.quadrant === 'threats') && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${urgencyBadge[item.urgency]}`}>
                        {item.urgency}
                      </span>
                    )}
                    {/* Source → scroll link */}
                    {sectionId ? (
                      <button
                        onClick={() => scrollTo(sectionId)}
                        className="inline-flex items-center gap-1 text-[10px] text-gray-400 hover:text-blue-600 transition-colors group"
                      >
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        <span className="group-hover:underline underline-offset-2">{item.source}</span>
                        <svg className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    ) : (
                      <span className="text-[10px] text-gray-400">{item.source}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Role filter config ────────────────────────────────────────────────────────

const ROLES = ['All', 'CEO', 'COO', 'CFO', 'CMO', 'CBPO', 'CTO', 'VP HR', 'BD'] as const
type Role = typeof ROLES[number]

// Which audience tags are visible for each role ('all' = show everything)
const ROLE_MAP: Record<Role, string[] | 'all'> = {
  'All':   'all',
  'CEO':   ['CEO'],
  'COO':   ['CEO', 'CBPO'],
  'CFO':   ['CFO', 'CEO'],
  'CMO':   ['CMO'],
  'CBPO':  ['CBPO'],
  'CTO':   ['CTO'],
  'VP HR': ['HR', 'CEO', 'CBPO'],
  'BD':    ['BD', 'CEO', 'CMO'],  // BD: M&A watch + strategic + competitor context
}

const ROLE_COLORS: Record<Role, string> = {
  'All':   'bg-gray-900 text-white',
  'CEO':   'bg-violet-600 text-white',
  'COO':   'bg-indigo-600 text-white',
  'CFO':   'bg-blue-600 text-white',
  'CMO':   'bg-emerald-600 text-white',
  'CBPO':  'bg-orange-500 text-white',
  'CTO':   'bg-cyan-600 text-white',
  'VP HR': 'bg-pink-600 text-white',
  'BD':    'bg-indigo-600 text-white',
}
const ROLE_IDLE: Record<Role, string> = {
  'All':   'bg-gray-100 text-gray-600 hover:bg-gray-200',
  'CEO':   'bg-violet-50 text-violet-600 hover:bg-violet-100',
  'COO':   'bg-indigo-50 text-indigo-600 hover:bg-indigo-100',
  'CFO':   'bg-blue-50 text-blue-600 hover:bg-blue-100',
  'CMO':   'bg-emerald-50 text-emerald-600 hover:bg-emerald-100',
  'CBPO':  'bg-orange-50 text-orange-600 hover:bg-orange-100',
  'CTO':   'bg-cyan-50 text-cyan-600 hover:bg-cyan-100',
  'VP HR': 'bg-pink-50 text-pink-600 hover:bg-pink-100',
  'BD':    'bg-indigo-50 text-indigo-600 hover:bg-indigo-100',
}

export default function BriefViewer({
  content, weekOf, generatedAt, companyName, logoUrl, brandColor, briefId,
}: {
  content: BriefContent
  weekOf?: string
  generatedAt?: string | null
  companyName?: string
  logoUrl?: string | null
  brandColor?: string | null
  briefId?: string
}) {
  const [roleFilter, setRoleFilter] = useState<Role>('All')
  const accent = brandColor ?? '#111827'

  function showSection(audience: string): boolean {
    const allowed = ROLE_MAP[roleFilter]
    if (allowed === 'all') return true
    return allowed.includes(audience)
  }

  // Prefer real stored snapshots; fall back to simulated
  function getChart(key: string): StoredSparkline | undefined {
    return (content.market_snapshots?.[key] ?? SPARKLINES[key]) as StoredSparkline | undefined
  }
  // Company stock + competitor stocks + commodity charts from market_snapshots
  const companyStockChart = content.market_snapshots?.['company_stock'] as StoredSparkline | undefined
  const competitorCharts = Object.entries(content.market_snapshots ?? {})
    .filter(([k]) => k.startsWith('competitor_'))
    .map(([, v]) => v as StoredSparkline)
  const commodityCharts = Object.entries(content.market_snapshots ?? {})
    .filter(([k]) => k.startsWith('commodity_'))
    .map(([, v]) => v as StoredSparkline)

  // Build personalized masthead: show the most relevant charts for this week
  // Priority: company stock > FX pairs with biggest moves > macro context
  const fxKeys = ['eurusd', 'gbpusd', 'usdjpy', 'usdcny', 'usdils']
  const fxCharts = fxKeys
    .map(k => content.market_snapshots?.[k] as StoredSparkline | undefined)
    .filter(Boolean) as StoredSparkline[]
  // Sort FX by absolute % move so the most relevant ones appear first
  const fxSorted = [...fxCharts].sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct))
  const macroFills = ['sp500', 'dxy', 'gold', 'oil']
    .map(k => getChart(k))
    .filter(Boolean) as StoredSparkline[]
  const mastheadCharts: StoredSparkline[] = [
    ...(companyStockChart ? [companyStockChart] : []),
    ...fxSorted,
    ...macroFills,
  ].slice(0, 8)
  const mastheadFinal = mastheadCharts.length >= 2 ? mastheadCharts : MACRO_CHARTS

  const allowedAudiences = ROLE_MAP[roleFilter]
  const allTocSections: TOCSection[] = [
    { id: 'brief-summary',    label: 'Executive Summary',      audience: 'CEO',  audienceColor: AUDIENCE_COLORS.CEO },
    { id: 'brief-swot',       label: 'SWOT Snapshot',          audience: 'CEO',  audienceColor: AUDIENCE_COLORS.CEO },
    ...(content.financial_news?.length       ? [{ id: 'brief-fin-news',    label: 'Financial News',           audience: 'CFO',  audienceColor: AUDIENCE_COLORS.CFO }] : []),
    ...(content.geopolitical_news?.length    ? [{ id: 'brief-geo',         label: 'Geopolitical Signals',     audience: 'CEO',  audienceColor: AUDIENCE_COLORS.CEO }] : []),
    ...(content.competitor_intelligence?.length ? [{ id: 'brief-comp',     label: 'Competitor Intelligence',  audience: 'CMO',  audienceColor: AUDIENCE_COLORS.CMO }] : []),
    ...(content.marketing_opportunities?.length ? [{ id: 'brief-mktg',    label: 'Marketing Opportunities',  audience: 'CMO',  audienceColor: AUDIENCE_COLORS.CMO }] : []),
    ...(content.scenario_modeling?.length    ? [{ id: 'brief-scenarios',   label: 'Scenario Modeling',        audience: 'CEO',  audienceColor: AUDIENCE_COLORS.CEO }] : []),
    ...(content.risk_summary?.length         ? [{ id: 'brief-risk',        label: 'Risk Summary',             audience: 'CEO',  audienceColor: AUDIENCE_COLORS.CEO }] : []),
    ...(content.capital_impact               ? [{ id: 'brief-capital',     label: 'Capital Impact',           audience: 'CFO',  audienceColor: AUDIENCE_COLORS.CFO }] : []),
    ...(content.financial_signals?.length    ? [{ id: 'brief-fin-signals', label: 'Financial Signals',        audience: 'CFO',  audienceColor: AUDIENCE_COLORS.CFO }] : []),
    ...(content.operational_intelligence?.length ? [{ id: 'brief-ops',    label: 'Operational Intelligence', audience: 'CBPO', audienceColor: AUDIENCE_COLORS.CBPO }] : []),
    ...(content.tech_intelligence?.length    ? [{ id: 'brief-tech',        label: 'Tech Intelligence',        audience: 'CTO',  audienceColor: AUDIENCE_COLORS.CTO  }] : []),
    ...(content.hr_intelligence?.length     ? [{ id: 'brief-hr',          label: 'HR Intelligence',           audience: 'HR',   audienceColor: AUDIENCE_COLORS.HR   }] : []),
    ...(content.ma_watch?.length            ? [{ id: 'brief-ma',           label: 'M&A Watch',                audience: 'BD',   audienceColor: AUDIENCE_COLORS.BD   }] : []),
    ...(content.customer_intelligence?.length ? [{ id: 'brief-customers',  label: 'Customer Intelligence',    audience: 'CEO',  audienceColor: AUDIENCE_COLORS.CEO }] : []),
    ...(content.company_news?.length        ? [{ id: 'brief-company-news', label: 'Company News',             audience: 'CMO',  audienceColor: AUDIENCE_COLORS.CMO }] : []),
    ...(content.decision_framing?.length     ? [{ id: 'brief-decisions',   label: 'Decision Framing',         audience: 'CEO',  audienceColor: AUDIENCE_COLORS.CEO }] : []),
  ]

  // Filter TOC to match visible sections
  const tocSections = allTocSections.filter(
    s => allowedAudiences === 'all' || allowedAudiences.includes(s.audience) || s.id === 'brief-summary' || s.id === 'brief-swot'
  )

  return (
    <div className="font-sans flex gap-8 items-start">

      {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* Masthead */}
        <div className="border-b-2 pb-5" style={{ borderColor: accent }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              {logoUrl && (
                <Image src={logoUrl} alt={companyName ?? 'Logo'} width={20} height={20}
                  className="rounded object-contain" unoptimized />
              )}
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-500">
                Executive Intelligence Brief
              </span>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-[10px] text-gray-400">
                {weekOf && `Week of ${weekOf}`}{companyName && ` · ${companyName}`}
              </span>
              {generatedAt && (
                <span className="text-[10px] text-gray-300 flex items-center gap-1">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Generated {new Date(generatedAt).toLocaleString('en-GB', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short',
                  })}
                </span>
              )}
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-3">{content.headline}</h1>
          <p className="text-sm text-gray-700 leading-relaxed border-l-2 border-gray-300 pl-3">
            <RichText text={content.executive_summary} />
          </p>
        </div>

        {/* ── Role filter bar ─────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mr-1">View as</span>
          {ROLES.map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors ${
                roleFilter === role ? ROLE_COLORS[role] : ROLE_IDLE[role]
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        {/* Market strip: FX pairs + company stock + macro context */}
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {mastheadFinal.map((s: StoredSparkline) => (
              <MarketMiniChart key={s.ticker} sparkline={s as Parameters<typeof MarketMiniChart>[0]['sparkline']} compact />
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5">
            {content.market_snapshots
              ? `✓ Live market data · fetched at brief generation`
              : '⚠ Simulated market data — regenerate brief to fetch live data.'}
          </p>
        </div>

        {/* Competitor stocks + commodities */}
        {(competitorCharts.length > 0 || commodityCharts.length > 0) && (
          <div className="space-y-2">
            {competitorCharts.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Competitor Stocks</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {competitorCharts.map((s: StoredSparkline) => (
                    <MarketMiniChart key={s.ticker} sparkline={s as Parameters<typeof MarketMiniChart>[0]['sparkline']} compact />
                  ))}
                </div>
              </div>
            )}
            {commodityCharts.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Relevant Commodities</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {commodityCharts.map((s: StoredSparkline) => (
                    <MarketMiniChart key={s.ticker} sparkline={s as Parameters<typeof MarketMiniChart>[0]['sparkline']} compact />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SWOT snapshot */}
        {content.swot && <SWOTPanel swot={content.swot} brandColor={brandColor} />}

        {/* Main 2/3 + 1/3 grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-4">

            {content.financial_news?.length > 0 && showSection('CFO') && (
              <CollapsibleSection id="brief-fin-news" label="Financial News" audience="CFO" defaultExpanded>
                <div className="space-y-5">
                  {content.financial_news.map((item, i) => (
                    <div key={i} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                      <CountryLabel name={item.market} />
                      {briefId ? (
                        <Link href={`/briefs/${briefId}/article/financial_news/${i}`} className="group">
                          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors leading-snug mt-1 mb-1">{item.headline}</h3>
                        </Link>
                      ) : (
                        <h3 className="text-sm font-semibold text-gray-900 leading-snug mt-1 mb-1">{item.headline}</h3>
                      )}
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-2"><RichText text={item.detail} /></p>
                      {item.detail.length > 140 && briefId && (
                        <Link href={`/briefs/${briefId}/article/financial_news/${i}`} className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full transition-colors">Full analysis <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg></Link>
                      )}
                      <SourceTag source={item.source} />
                      {briefId && <div className="mt-2"><FeedbackButtons briefId={briefId} section="financial_news" itemIndex={i} compact /></div>}
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {content.geopolitical_news?.length > 0 && showSection('CEO') && (
              <CollapsibleSection id="brief-geo" label="Geopolitical Signals" audience="CEO" defaultExpanded>
                <div className="space-y-5">
                  {content.geopolitical_news.map((item, i) => (
                    <div key={i} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                      <CountryLabel name={item.region} />
                      {briefId ? (
                        <Link href={`/briefs/${briefId}/article/geopolitical_news/${i}`} className="group">
                          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors leading-snug mt-1 mb-1">{item.headline}</h3>
                        </Link>
                      ) : (
                        <h3 className="text-sm font-semibold text-gray-900 leading-snug mt-1 mb-1">{item.headline}</h3>
                      )}
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-2"><RichText text={item.detail} /></p>
                      {item.detail.length > 140 && briefId && (
                        <Link href={`/briefs/${briefId}/article/geopolitical_news/${i}`} className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full transition-colors">Full analysis <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg></Link>
                      )}
                      <SourceTag source={item.source} />
                      {briefId && <div className="mt-2"><FeedbackButtons briefId={briefId} section="geopolitical_news" itemIndex={i} compact /></div>}
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {content.competitor_intelligence?.length > 0 && showSection('CMO') && (
              <CollapsibleSection id="brief-comp" label="Competitor Intelligence" audience="CMO" defaultExpanded>
                <div className="space-y-5">
                  {content.competitor_intelligence.map((item, i) => (
                    <div key={i} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{item.competitor}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-900 text-white tracking-wide">
                          {typeLabel[item.type] ?? item.type.toUpperCase()}
                        </span>
                        <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded border ${threatBadge[item.threat_level]}`}>
                          {item.threat_level} threat
                        </span>
                      </div>
                      {briefId ? (
                        <Link href={`/briefs/${briefId}/article/competitor_intelligence/${i}`} className="group">
                          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors leading-snug mb-1">{item.headline}</h3>
                        </Link>
                      ) : (
                        <h3 className="text-sm font-semibold text-gray-900 leading-snug mb-1">{item.headline}</h3>
                      )}
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-2"><RichText text={item.detail} /></p>
                      {item.detail.length > 140 && briefId && (
                        <Link href={`/briefs/${briefId}/article/competitor_intelligence/${i}`} className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full transition-colors">Full analysis <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg></Link>
                      )}
                      {briefId && <div className="mt-2"><FeedbackButtons briefId={briefId} section="competitor_intelligence" itemIndex={i} compact /></div>}
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {content.marketing_opportunities?.length > 0 && showSection('CMO') && (
              <CollapsibleSection id="brief-mktg" label="Marketing Opportunities" audience="CMO">
                <div className="space-y-4">
                  {content.marketing_opportunities.map((item: MarketingOpportunityItem, i) => (
                    <div key={i} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{item.channel}</span>
                        <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded border ${urgencyBadge[item.urgency]}`}>
                          {item.urgency} urgency
                        </span>
                      </div>
                      {briefId ? (
                        <Link href={`/briefs/${briefId}/article/marketing_opportunities/${i}`} className="group">
                          <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors leading-snug mb-1">{item.opportunity}</p>
                        </Link>
                      ) : (
                        <p className="text-sm font-semibold text-gray-900 leading-snug mb-1">{item.opportunity}</p>
                      )}
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{item.rationale}</p>
                      {item.rationale.length > 140 && briefId && (
                        <Link href={`/briefs/${briefId}/article/marketing_opportunities/${i}`} className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full transition-colors">Full analysis <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg></Link>
                      )}
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {content.tech_intelligence?.length > 0 && showSection('CTO') && (
              <CollapsibleSection id="brief-tech" label="Tech Intelligence" audience="CTO">
                <div className="space-y-4">
                  {content.tech_intelligence.map((item: TechIntelItem, i) => (
                    <div key={i} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{item.category}</span>
                        <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                          item.relevance === 'direct'    ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                          item.relevance === 'watch'     ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                          'bg-gray-50 text-gray-500 border-gray-200'
                        }`}>
                          {item.relevance}
                        </span>
                      </div>
                      {briefId ? (
                        <Link href={`/briefs/${briefId}/article/tech_intelligence/${i}`} className="group">
                          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors leading-snug mb-1">{item.headline}</h3>
                        </Link>
                      ) : (
                        <h3 className="text-sm font-semibold text-gray-900 leading-snug mb-1">{item.headline}</h3>
                      )}
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-2"><RichText text={item.detail} /></p>
                      {item.detail.length > 140 && briefId && (
                        <Link href={`/briefs/${briefId}/article/tech_intelligence/${i}`} className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full transition-colors">Full analysis <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg></Link>
                      )}
                      <SourceTag source={item.source} />
                      {briefId && <div className="mt-2"><FeedbackButtons briefId={briefId} section="tech_intelligence" itemIndex={i} compact /></div>}
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {content.hr_intelligence?.length > 0 && showSection('HR') && (
              <CollapsibleSection id="brief-hr" label="HR Intelligence" audience="HR">
                <div className="space-y-4">
                  {content.hr_intelligence.map((item: HRIntelItem, i) => (
                    <div key={i} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{item.category}</span>
                        <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                          item.signal_type === 'competitor' ? 'bg-pink-50 text-pink-700 border-pink-200' :
                          item.signal_type === 'market'     ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          item.signal_type === 'regulatory' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                              'bg-gray-50 text-gray-500 border-gray-200'
                        }`}>
                          {item.signal_type}
                        </span>
                      </div>
                      {briefId ? (
                        <Link href={`/briefs/${briefId}/article/hr_intelligence/${i}`} className="group">
                          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors leading-snug mb-1">{item.headline}</h3>
                        </Link>
                      ) : (
                        <h3 className="text-sm font-semibold text-gray-900 leading-snug mb-1">{item.headline}</h3>
                      )}
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-2"><RichText text={item.detail} /></p>
                      {item.detail.length > 140 && briefId && (
                        <Link href={`/briefs/${briefId}/article/hr_intelligence/${i}`} className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full transition-colors">Full analysis <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg></Link>
                      )}
                      <SourceTag source={item.source} />
                      {briefId && <div className="mt-2"><FeedbackButtons briefId={briefId} section="hr_intelligence" itemIndex={i} compact /></div>}
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {content.ma_watch?.length > 0 && showSection('BD') && (
              <CollapsibleSection id="brief-ma" label="M&A Watch" audience="BD">
                <div className="space-y-5">
                  {content.ma_watch.map((item: MAItem, i) => (
                    <div key={i} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${
                          item.type === 'acquisition' ? 'bg-indigo-900 text-white' :
                          item.type === 'merger'      ? 'bg-indigo-700 text-white' :
                          item.type === 'funding'     ? 'bg-violet-600 text-white' :
                          item.type === 'ipo'         ? 'bg-blue-600 text-white' :
                          item.type === 'divestiture' ? 'bg-orange-600 text-white' :
                                                        'bg-gray-500 text-white'
                        }`}>
                          {item.type.toUpperCase()}
                        </span>
                        {item.deal_size && (
                          <span className="text-[10px] font-bold text-gray-500">{item.deal_size}</span>
                        )}
                        <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                          item.relevance === 'direct'   ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          item.relevance === 'adjacent' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                          'bg-gray-50 text-gray-500 border-gray-200'
                        }`}>
                          {item.relevance}
                        </span>
                      </div>
                      {briefId ? (
                        <Link href={`/briefs/${briefId}/article/ma_watch/${i}`} className="group">
                          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors leading-snug mb-1">{item.headline}</h3>
                        </Link>
                      ) : (
                        <h3 className="text-sm font-semibold text-gray-900 leading-snug mb-1">{item.headline}</h3>
                      )}
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-2"><RichText text={item.detail} /></p>
                      {item.detail.length > 140 && briefId && (
                        <Link href={`/briefs/${briefId}/article/ma_watch/${i}`} className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full transition-colors">Full analysis <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg></Link>
                      )}
                      <SourceTag source={item.source} />
                      {briefId && <div className="mt-2"><FeedbackButtons briefId={briefId} section="ma_watch" itemIndex={i} compact /></div>}
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {content.customer_intelligence?.length > 0 && showSection('CEO') && (
              <CollapsibleSection id="brief-customers" label="Customer Intelligence" audience="CEO">
                <div className="space-y-5">
                  {content.customer_intelligence.map((item: CustomerIntelItem, i) => (
                    <div key={i} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                          item.sentiment === 'positive' ? 'bg-emerald-100 text-emerald-700' :
                          item.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                                                          'bg-gray-100 text-gray-600'
                        }`}>{item.customer}</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border capitalize ${
                          item.sentiment === 'positive' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          item.sentiment === 'negative' ? 'bg-red-50 text-red-700 border-red-200' :
                                                          'bg-gray-50 text-gray-500 border-gray-200'
                        }`}>{item.signal_type.replace(/_/g, ' ')}</span>
                      </div>
                      {briefId ? (
                        <Link href={`/briefs/${briefId}/article/customer_intelligence/${i}`} className="group">
                          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors leading-snug mb-1">{item.headline}</h3>
                        </Link>
                      ) : (
                        <h3 className="text-sm font-semibold text-gray-900 leading-snug mb-1">{item.headline}</h3>
                      )}
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-2"><RichText text={item.detail} /></p>
                      {item.detail.length > 140 && briefId && (
                        <Link href={`/briefs/${briefId}/article/customer_intelligence/${i}`} className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full transition-colors">Full analysis <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg></Link>
                      )}
                      <div className="mt-2">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-0.5">Revenue Impact</div>
                        <p className="text-xs text-gray-700"><RichText text={item.revenue_impact} /></p>
                      </div>
                      <SourceTag source={item.source} />
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {content.company_news?.length > 0 && showSection('CMO') && (
              <CollapsibleSection id="brief-company-news" label="Company News" audience="CMO">
                <div className="space-y-5">
                  {content.company_news.map((item: CompanyNewsItem, i) => (
                    <div key={i} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{item.category}</span>
                        <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded capitalize ${
                          item.sentiment === 'positive' ? 'bg-emerald-100 text-emerald-700' :
                          item.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                                                          'bg-gray-100 text-gray-600'
                        }`}>{item.sentiment}</span>
                      </div>
                      {briefId ? (
                        <Link href={`/briefs/${briefId}/article/company_news/${i}`} className="group">
                          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors leading-snug mb-1">{item.headline}</h3>
                        </Link>
                      ) : (
                        <h3 className="text-sm font-semibold text-gray-900 leading-snug mb-1">{item.headline}</h3>
                      )}
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{item.summary}</p>
                      {item.summary.length > 140 && briefId && (
                        <Link href={`/briefs/${briefId}/article/company_news/${i}`} className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full transition-colors">Full analysis <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg></Link>
                      )}
                      <div className="mt-2">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-0.5">Exec Note</div>
                        <p className="text-xs text-gray-700">{item.exec_note}</p>
                      </div>
                      <SourceTag source={item.source} />
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {content.scenario_modeling?.length > 0 && showSection('CEO') && (
              <CollapsibleSection id="brief-scenarios" label="Scenario Modeling" audience="CEO">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {content.scenario_modeling.map((s: Scenario, i) => (
                    <ScenarioCard key={i} scenario={s} />
                  ))}
                </div>
              </CollapsibleSection>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-4">

            {content.risk_summary?.length > 0 && showSection('CEO') && (
              <CollapsibleSection id="brief-risk" label="Risk Summary" audience="CEO" defaultExpanded>
                {/* Legend */}
                <div className="flex items-center gap-4 mb-3 pb-2.5 border-b border-gray-100">
                  {[
                    { color: 'bg-red-500',   label: 'High',   def: 'Requires action this week' },
                    { color: 'bg-amber-400', label: 'Medium', def: 'Monitor closely' },
                    { color: 'bg-gray-400',  label: 'Low',    def: 'Awareness only' },
                  ].map(({ color, label, def }) => (
                    <div key={label} className="flex items-center gap-1.5 group relative">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${color}`} />
                      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
                      <span className="hidden group-hover:block absolute left-0 top-5 bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">{def}</span>
                    </div>
                  ))}
                </div>
                {content.risk_summary.map((r: RiskItem, i) => <RiskCard key={i} risk={r} />)}
              </CollapsibleSection>
            )}

            {content.capital_impact && showSection('CFO') && (
              <CollapsibleSection id="brief-capital" label="Capital Impact" audience="CFO" defaultExpanded>
                <div className="space-y-4">
                  {[
                    { label: 'Revenue Exposure', value: content.capital_impact.revenue_exposure },
                    { label: 'Margin Pressure',  value: content.capital_impact.margin_pressure },
                    { label: 'Capex',            value: content.capital_impact.capex_considerations },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-0.5">{label}</div>
                      <p className="text-xs text-gray-700 leading-relaxed"><RichText text={value} /></p>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {content.financial_signals?.length > 0 && showSection('CFO') && (
              <CollapsibleSection id="brief-fin-signals" label="Financial Signals" audience="CFO" defaultExpanded>
                {/* Charts for first 2 signals — prefer live data */}
                <div className="space-y-2 mb-3">
                  {content.financial_signals.slice(0, 2).map((item: FinancialSignalItem, i) => {
                    const chartKey = CFO_CHART_MAP[item.category.toLowerCase()]
                    const sparkline = chartKey ? getChart(chartKey) : null
                    return sparkline ? <MarketMiniChart key={i} sparkline={sparkline as Parameters<typeof MarketMiniChart>[0]['sparkline']} /> : null
                  })}
                </div>
                <div>
                  {content.financial_signals.map((item: FinancialSignalItem, i) => (
                    <div key={i} className="py-2.5 border-b border-gray-100 last:border-0">
                      <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-0.5">{item.category}</div>
                      {briefId ? (
                        <Link href={`/briefs/${briefId}/article/financial_signals/${i}`} className="group">
                          <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors leading-snug">{item.headline}</p>
                        </Link>
                      ) : (
                        <p className="text-sm font-semibold text-gray-900 leading-snug">{item.headline}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2"><RichText text={item.detail} /></p>
                      {item.detail.length > 140 && briefId && (
                        <Link href={`/briefs/${briefId}/article/financial_signals/${i}`} className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full transition-colors">Full analysis <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg></Link>
                      )}
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {content.operational_intelligence?.length > 0 && showSection('CBPO') && (
              <CollapsibleSection id="brief-ops" label="Operational Intelligence" audience="CBPO">
                {content.operational_intelligence.map((item: OperationalAlert, i) => (
                  <div key={i} className="py-2.5 border-b border-gray-100 last:border-0">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-0.5">{item.area}</div>
                    {briefId ? (
                      <Link href={`/briefs/${briefId}/article/operational_intelligence/${i}`} className="group">
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors leading-snug">{item.headline}</p>
                      </Link>
                    ) : (
                      <p className="text-sm font-semibold text-gray-900 leading-snug">{item.headline}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2"><RichText text={item.detail} /></p>
                    {item.detail.length > 140 && briefId && (
                      <Link href={`/briefs/${briefId}/article/operational_intelligence/${i}`} className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full transition-colors">Full analysis <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg></Link>
                    )}
                  </div>
                ))}
              </CollapsibleSection>
            )}

            {content.decision_framing?.length > 0 && showSection('CEO') && (
              <CollapsibleSection id="brief-decisions" label="Decision Framing" audience="CEO" defaultExpanded>
                <div className="space-y-5">
                  {content.decision_framing.map((d, i) => (
                    <div key={i}>
                      <p className="text-sm font-semibold text-gray-900 leading-snug">{d.question}</p>
                      <p className="text-xs text-gray-500 mt-1 mb-2">{d.context}</p>
                      <ul className="space-y-1">
                        {d.options.map((opt, j) => (
                          <li key={j} className="flex gap-2 text-xs text-gray-700">
                            <span className="shrink-0 font-bold text-gray-400">{String.fromCharCode(65 + j)}.</span>
                            <span>{opt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

          </div>
        </div>
      </div>

      {/* ── TOC SIDEBAR ──────────────────────────────────────────── */}
      <div className="hidden xl:block w-52 shrink-0 sticky top-6 self-start max-h-[calc(100vh-5rem)] overflow-y-auto">
        <BriefTOC sections={tocSections} />
      </div>

    </div>
  )
}
