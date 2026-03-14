'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { TrendInsights, BriefContent } from '@/lib/types'
import DashboardAskAI from '@/components/dashboard/DashboardAskAI'

export interface BriefAggregate {
  id: string
  weekOf: string
  weekOfDate: string
  weekShort: string
  headline: string
  executiveSummary: string
  riskHigh: number
  riskMed: number
  riskLow: number
  topRisks: Array<{ title: string; severity: string }>
  topRiskTitle: string | null
  topRiskDetail: string | null
  topRiskTimeframe: string | null
  topCompetitorName: string | null
  topCompetitorHeadline: string | null
  topCompetitorThreat: string | null
  topDecisionQuestion: string | null
  topDecisionContext: string | null
  topGeoRegion: string | null
  topGeoHeadline: string | null
  topFinancialCategory: string | null
  topFinancialHeadline: string | null
  topCompanyNewsTitle: string | null
  capitalImpactRevenue: string | null
  competitorCount: number
  maCount: number
  scenarioCount: number
  decisionCount: number
  sp500: number | null
  dxy: number | null
  gold: number | null
  allCompetitorNames: string[]
  allHighRiskTitles: string[]
  allCompetitorThreats: { name: string; level: 'high' | 'medium' | 'low' }[]
}

interface Props {
  aggregates: BriefAggregate[]
  latestBriefId: string | null
  companyName: string | null
  trendInsights: TrendInsights | null
  latestBriefContent?: BriefContent | null
}

// ── Feed article type ─────────────────────────────────────────────────────────

type FeedArticle = {
  type: 'risk' | 'competitor' | 'geo' | 'financial' | 'marketing' | 'tech' | 'hr' | 'ma' | 'company' | 'ops'
  section: string
  index: number
  headline: string
  snippet: string
  meta: string | null
  badge: string | null
}

// ── Category styles (Bloomberg-style) ────────────────────────────────────────

const CAT_STYLE: Record<string, { label: string; badge: string; dot: string }> = {
  risk:       { label: 'RISK',        badge: 'bg-red-600 text-white',      dot: 'bg-red-500' },
  competitor: { label: 'COMPETITOR',  badge: 'bg-orange-600 text-white',   dot: 'bg-orange-500' },
  geo:        { label: 'GEOPOLITICAL',badge: 'bg-slate-700 text-white',    dot: 'bg-slate-500' },
  financial:  { label: 'FINANCIAL',   badge: 'bg-blue-700 text-white',     dot: 'bg-blue-500' },
  marketing:  { label: 'MARKETING',   badge: 'bg-emerald-700 text-white',  dot: 'bg-emerald-500' },
  tech:       { label: 'TECH',        badge: 'bg-violet-700 text-white',   dot: 'bg-violet-500' },
  hr:         { label: 'HR',          badge: 'bg-pink-600 text-white',     dot: 'bg-pink-500' },
  ma:         { label: 'M&A',         badge: 'bg-indigo-700 text-white',   dot: 'bg-indigo-500' },
  company:    { label: 'COMPANY',     badge: 'bg-gray-700 text-white',     dot: 'bg-gray-500' },
  ops:        { label: 'OPERATIONS',  badge: 'bg-teal-700 text-white',     dot: 'bg-teal-500' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function trendArrow(values: number[]): { arrow: string; color: string; label: string } {
  if (values.length < 2) return { arrow: '→', color: 'text-gray-400', label: '' }
  const delta = values[values.length - 1] - values[0]
  if (Math.abs(delta) <= 0.5) return { arrow: '→', color: 'text-gray-400', label: 'Stable' }
  if (delta > 0) return { arrow: '▲', color: 'text-red-500', label: `+${delta}` }
  return { arrow: '▼', color: 'text-emerald-500', label: `${delta}` }
}

const THREAT_SCORE: Record<string, number> = { high: 2, medium: 1, low: 0 }
const THREAT_DOT: Record<string, string> = {
  high: 'bg-red-500', medium: 'bg-amber-400', low: 'bg-gray-300',
}

function buildCompetitorPressure(aggregates: BriefAggregate[]): {
  name: string
  weeks: (string | null)[]
  trend: 'rising' | 'falling' | 'stable'
}[] {
  const last4 = aggregates.slice(-4)
  const names = new Set<string>()
  for (const a of last4) for (const t of a.allCompetitorThreats) names.add(t.name)

  return [...names].map(name => {
    const weeks = last4.map(a => {
      const hit = a.allCompetitorThreats.find(t => t.name === name)
      return hit ? hit.level : null
    })
    const scores = weeks.filter(Boolean).map(l => THREAT_SCORE[l!])
    const trend: 'rising' | 'falling' | 'stable' =
      scores.length < 2 ? 'stable'
      : scores[scores.length - 1] > scores[0] ? 'rising'
      : scores[scores.length - 1] < scores[0] ? 'falling'
      : 'stable'
    return { name, weeks, trend }
  })
    .filter(c => c.weeks.filter(Boolean).length >= 2)
    .sort((a, b) => {
      const aMax = Math.max(...a.weeks.filter(Boolean).map(l => THREAT_SCORE[l!]))
      const bMax = Math.max(...b.weeks.filter(Boolean).map(l => THREAT_SCORE[l!]))
      return bMax - aMax
    })
}

function findRecurring(aggregates: BriefAggregate[]): { competitors: string[]; risks: string[] } {
  const compCount: Record<string, number> = {}
  const riskCount: Record<string, number> = {}
  for (const a of aggregates) {
    for (const name of a.allCompetitorNames) {
      compCount[name] = (compCount[name] ?? 0) + 1
    }
    for (const title of a.allHighRiskTitles) {
      const key = title.split(' ').slice(0, 4).join(' ').toLowerCase()
      riskCount[key] = (riskCount[key] ?? 0) + 1
    }
  }
  const competitors = Object.entries(compCount).filter(([, n]) => n >= 2).map(([k]) => k)
  const risks = Object.entries(riskCount).filter(([, n]) => n >= 2).map(([k]) => k)
  return { competitors, risks }
}

const THREAT_COLOR: Record<string, string> = {
  high:   'text-red-600 bg-red-50 border-red-200',
  medium: 'text-amber-600 bg-amber-50 border-amber-200',
  low:    'text-green-600 bg-green-50 border-green-200',
}



// ── Sub-components ────────────────────────────────────────────────────────────

function WeekCell({ label, sub, badge, badgeStyle }: {
  label: string | null
  sub?: string | null
  badge?: string | null
  badgeStyle?: string
}) {
  if (!label) return <td className="px-3 py-3 text-xs text-gray-300 text-center">—</td>
  return (
    <td className="px-3 py-3 align-top max-w-[180px]">
      {badge && (
        <span className={`inline-block text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border mb-1 ${badgeStyle ?? 'bg-gray-50 text-gray-500 border-gray-200'}`}>
          {badge}
        </span>
      )}
      <p className="text-xs font-medium text-gray-800 leading-snug">{label}</p>
      {sub && <p className="text-[11px] text-gray-400 leading-snug mt-0.5 line-clamp-2">{sub}</p>}
    </td>
  )
}

// ── FeedCard (NYT/Bloomberg style) ───────────────────────────────────────────

function FeedCard({ article, briefId }: { article: FeedArticle; briefId: string | null }) {
  const cat = CAT_STYLE[article.type]
  const href = briefId ? `/briefs/${briefId}/article/${article.section}/${article.index}` : undefined
  return (
    <div className="py-4 border-b border-gray-100 last:border-0 group">
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-widest uppercase ${cat.badge}`}>
          {cat.label}
        </span>
        {article.meta && (
          <span className="text-[10px] text-gray-400 font-medium">{article.meta}</span>
        )}
        {article.badge && article.type === 'risk' && (
          <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
            article.badge === 'high'   ? 'bg-red-100 text-red-700' :
            article.badge === 'medium' ? 'bg-amber-100 text-amber-700' :
            'bg-gray-100 text-gray-600'
          }`}>{article.badge}</span>
        )}
        {article.badge && article.type === 'competitor' && (
          <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
            article.badge === 'high'   ? 'bg-red-100 text-red-700' :
            article.badge === 'medium' ? 'bg-amber-100 text-amber-700' :
            'bg-gray-100 text-gray-600'
          }`}>{article.badge} threat</span>
        )}
      </div>
      {href ? (
        <Link href={href}>
          <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors leading-snug mb-1">
            {article.headline}
          </h3>
        </Link>
      ) : (
        <h3 className="text-sm font-bold text-gray-900 leading-snug mb-1">{article.headline}</h3>
      )}
      {article.snippet && (
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{article.snippet}</p>
      )}
      {href && (
        <Link href={href} className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors">
          Full analysis
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
          </svg>
        </Link>
      )}
    </div>
  )
}

// ── Build feed articles from brief content ────────────────────────────────────

function buildFeedArticles(content: BriefContent): FeedArticle[] {
  const articles: FeedArticle[] = []

  // Risks — sorted high first
  const risks = [...(content.risk_summary ?? [])].sort((a, b) => {
    const order: Record<string, number> = { high: 0, medium: 1, low: 2 }
    return (order[a.severity] ?? 3) - (order[b.severity] ?? 3)
  })
  risks.forEach((r, i) => articles.push({
    type: 'risk',
    section: 'risk-summary',
    index: i,
    headline: r.title,
    snippet: r.detail,
    meta: r.timeframe ?? null,
    badge: r.severity,
  }))

  // Competitors
  ;(content.competitor_intelligence ?? []).forEach((c, i) => articles.push({
    type: 'competitor',
    section: 'competitor-intelligence',
    index: i,
    headline: c.headline,
    snippet: c.detail,
    meta: c.competitor,
    badge: c.threat_level,
  }))

  // Geopolitical
  ;(content.geopolitical_news ?? []).forEach((g, i) => articles.push({
    type: 'geo',
    section: 'geopolitical-news',
    index: i,
    headline: g.headline,
    snippet: g.detail,
    meta: g.region,
    badge: null,
  }))

  // Financial news
  ;(content.financial_news ?? []).forEach((f, i) => articles.push({
    type: 'financial',
    section: 'financial-news',
    index: i,
    headline: f.headline,
    snippet: f.detail,
    meta: f.market ?? null,
    badge: null,
  }))

  // M&A
  ;(content.ma_watch ?? []).forEach((m, i) => articles.push({
    type: 'ma',
    section: 'ma-watch',
    index: i,
    headline: m.headline,
    snippet: m.detail,
    meta: m.type ?? null,
    badge: null,
  }))

  // Tech
  ;(content.tech_intelligence ?? []).forEach((t, i) => articles.push({
    type: 'tech',
    section: 'tech-intelligence',
    index: i,
    headline: t.headline,
    snippet: t.detail,
    meta: t.category ?? null,
    badge: null,
  }))

  // Company news
  ;(content.company_news ?? []).forEach((cn, i) => articles.push({
    type: 'company',
    section: 'company-news',
    index: i,
    headline: cn.headline,
    snippet: cn.summary,
    meta: cn.category ?? null,
    badge: null,
  }))

  // Operational
  ;(content.operational_intelligence ?? []).forEach((o, i) => articles.push({
    type: 'ops',
    section: 'operational-intelligence',
    index: i,
    headline: o.headline,
    snippet: o.detail,
    meta: o.area ?? null,
    badge: null,
  }))

  // HR
  ;(content.hr_intelligence ?? []).forEach((h, i) => articles.push({
    type: 'hr',
    section: 'hr-intelligence',
    index: i,
    headline: h.headline,
    snippet: h.detail,
    meta: h.category ?? null,
    badge: null,
  }))

  // Marketing
  ;(content.marketing_opportunities ?? []).forEach((mk, i) => articles.push({
    type: 'marketing',
    section: 'marketing-opportunities',
    index: i,
    headline: mk.opportunity,
    snippet: mk.rationale,
    meta: mk.channel ?? null,
    badge: mk.urgency ?? null,
  }))

  return articles
}

// ── Market value formatting ───────────────────────────────────────────────────

function fmtMarket(val: number | null, label: string, prev: number | null) {
  if (val === null) return null
  const up = prev !== null ? val >= prev : null
  return { label, value: val.toLocaleString('en-US', { maximumFractionDigits: 2 }), up }
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, trend, trendUp, color,
}: {
  label: string
  value: string | number
  sub?: string
  trend?: string
  trendUp?: boolean | null
  color?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-1">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
      <div className="flex items-end gap-2">
        <span className={`text-2xl font-black ${color ?? 'text-gray-900'}`}>{value}</span>
        {trend && (
          <span className={`text-xs font-bold mb-1 ${
            trendUp === true ? 'text-red-500' : trendUp === false ? 'text-emerald-500' : 'text-gray-400'
          }`}>
            {trendUp === true ? '▲' : trendUp === false ? '▼' : '→'} {trend}
          </span>
        )}
      </div>
      {sub && <p className="text-xs text-gray-500 leading-snug">{sub}</p>}
    </div>
  )
}

// ── Section Tile (Bloomberg "Your News" style) ────────────────────────────────

function SectionTile({
  title, color, items, briefId, sectionKey, anchor,
}: {
  title: string
  color: string
  items: Array<{ headline: string; meta?: string | null; badge?: string | null; badgeStyle?: string; index: number }>
  briefId: string | null
  sectionKey: string
  anchor: string
}) {
  if (items.length === 0) return null
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
      <div className={`px-4 py-2.5 ${color}`}>
        <h3 className="text-[11px] font-black uppercase tracking-widest text-white">{title}</h3>
      </div>
      <div className="flex-1 divide-y divide-gray-100">
        {items.slice(0, 4).map((item, i) => (
          <div key={i} className="px-4 py-3 hover:bg-gray-50 transition-colors group">
            {item.meta && (
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{item.meta}</p>
            )}
            {briefId ? (
              <Link href={`/briefs/${briefId}/article/${sectionKey}/${item.index}`}>
                <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors leading-snug">
                  {item.headline}
                </p>
              </Link>
            ) : (
              <p className="text-sm font-semibold text-gray-900 leading-snug">{item.headline}</p>
            )}
            {item.badge && (
              <span className={`mt-1 inline-block text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${item.badgeStyle ?? 'bg-gray-100 text-gray-600'}`}>
                {item.badge}
              </span>
            )}
          </div>
        ))}
      </div>
      {briefId && items.length > 0 && (
        <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/40">
          <Link href={`/briefs/${briefId}/full#${anchor}`} className="text-xs text-blue-600 font-semibold hover:text-blue-800 transition-colors">
            See all {items.length} →
          </Link>
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function HistoricDashboard({ aggregates, latestBriefId, companyName, trendInsights, latestBriefContent }: Props) {
  const [historyOpen, setHistoryOpen] = useState(false)

  const latest    = aggregates[aggregates.length - 1]
  const previous  = aggregates[aggregates.length - 2]
  const last4     = aggregates.slice(-4)
  const chartData = aggregates.slice(-12)

  const recurring = findRecurring(aggregates.slice(-4))
  const competitorPressure = buildCompetitorPressure(aggregates)

  const feedArticles = latestBriefContent ? buildFeedArticles(latestBriefContent) : []

  const SCORECARD_METRICS = [
    { label: 'High Risks',        key: 'riskHigh'        as const, invert: true  },
    { label: 'Competitor Moves',  key: 'competitorCount' as const, invert: false },
    { label: 'Decisions',         key: 'decisionCount'   as const, invert: false },
    { label: 'M&A Items',         key: 'maCount'         as const, invert: false },
  ]

  if (aggregates.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16 text-center">
        <p className="text-gray-400 text-sm">No briefs yet. Generate your first brief to start tracking trends.</p>
        <Link href="/briefs" className="mt-4 inline-block text-sm text-blue-600 hover:underline">Go to Briefs →</Link>
      </div>
    )
  }

  // Market data from latest aggregate
  const markets = [
    fmtMarket(latest?.sp500 ?? null, 'S&P 500', previous?.sp500 ?? null),
    fmtMarket(latest?.dxy ?? null,   'DXY',     previous?.dxy ?? null),
    fmtMarket(latest?.gold ?? null,  'Gold',    previous?.gold ?? null),
  ].filter(Boolean) as { label: string; value: string; up: boolean | null }[]

  // Top 3 high-severity risks for sidebar
  const topRisksForSidebar = (latestBriefContent?.risk_summary ?? [])
    .filter(r => r.severity === 'high')
    .slice(0, 3)

  return (
    <div className="space-y-6">

      {/* ── 1. KPI Strip ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="High Risks"
          value={latest.riskHigh}
          color={latest.riskHigh > 0 ? 'text-red-600' : 'text-gray-900'}
          trend={previous ? `${latest.riskHigh > previous.riskHigh ? '+' : ''}${latest.riskHigh - previous.riskHigh} vs prior` : undefined}
          trendUp={previous ? (latest.riskHigh > previous.riskHigh ? true : latest.riskHigh < previous.riskHigh ? false : null) : null}
          sub={latest.topRiskTitle ?? undefined}
        />
        <KpiCard
          label="Competitor Moves"
          value={latest.competitorCount}
          trend={previous ? `${latest.competitorCount > previous.competitorCount ? '+' : ''}${latest.competitorCount - previous.competitorCount} vs prior` : undefined}
          trendUp={previous ? (latest.competitorCount > previous.competitorCount ? null : null) : null}
          sub={latest.topCompetitorName ? `${latest.topCompetitorName}: ${latest.topCompetitorThreat ?? ''} threat` : undefined}
        />
        <KpiCard
          label="Open Decisions"
          value={latest.decisionCount}
          sub={latest.topDecisionQuestion?.slice(0, 60) ?? undefined}
        />
        <KpiCard
          label="M&A Pipeline"
          value={latest.maCount}
          sub={latest.maCount > 0 ? `${latest.maCount} deal${latest.maCount !== 1 ? 's' : ''} tracked` : 'No active deals'}
        />
      </div>

      {/* ── 2. AI Brief Digest + Ask AI + Market Data ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Brief Digest (left 2/3) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 bg-gray-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Intelligence Brief</span>
                <span className="text-[10px] text-gray-500">·</span>
                <span className="text-[10px] text-gray-400">{latest.weekOf}</span>
                {companyName && (
                  <>
                    <span className="text-[10px] text-gray-500">·</span>
                    <span className="text-[10px] text-gray-400">{companyName}</span>
                  </>
                )}
              </div>
              {latestBriefId && (
                <Link href={`/briefs/${latestBriefId}/full`} className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                  Read Full Brief →
                </Link>
              )}
            </div>
            <div className="px-5 py-4">
              <h2 className="text-lg font-black text-gray-900 leading-tight tracking-tight mb-2">
                {latest.headline}
              </h2>
              {latestBriefContent?.tldr && (
                <div className="mb-3 px-3 py-2 bg-gray-50 rounded-lg border-l-4 border-gray-900">
                  <p className="text-sm font-medium text-gray-800">{latestBriefContent.tldr}</p>
                </div>
              )}
              {latest.executiveSummary && (
                <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{latest.executiveSummary}</p>
              )}
            </div>
            {latest.capitalImpactRevenue && (
              <div className="px-5 py-2.5 border-t border-gray-100 bg-amber-50/40 flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Revenue Exposure</span>
                <span className="text-xs text-gray-600">{latest.capitalImpactRevenue}</span>
              </div>
            )}
          </div>

          {/* Trend charts: Risk intensity + Competitor pressure */}
          {chartData.length >= 3 && (
            <div className="grid grid-cols-2 gap-3">
              {/* Risk Intensity Chart */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Risk Intensity (12 wks)</p>
                <ResponsiveContainer width="100%" height={80}>
                  <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                    <YAxis domain={[0, 'dataMax + 1']} hide />
                    <Tooltip
                      contentStyle={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, border: '1px solid #e5e7eb' }}
                      labelFormatter={(_, p) => p?.[0]?.payload?.weekShort ?? ''}
                      formatter={(v: number | undefined) => [v ?? 0, 'High Risks']}
                    />
                    <Area type="monotone" dataKey="riskHigh" stroke="#ef4444" fill="#fee2e2" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {/* Competitor Count Chart */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Competitor Activity (12 wks)</p>
                <ResponsiveContainer width="100%" height={80}>
                  <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                    <YAxis domain={[0, 'dataMax + 1']} hide />
                    <Tooltip
                      contentStyle={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, border: '1px solid #e5e7eb' }}
                      labelFormatter={(_, p) => p?.[0]?.payload?.weekShort ?? ''}
                      formatter={(v: number | undefined) => [v ?? 0, 'Moves']}
                    />
                    <Area type="monotone" dataKey="competitorCount" stroke="#f97316" fill="#ffedd5" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-3">
          {/* Ask AI */}
          <DashboardAskAI />

          {/* Markets */}
          {markets.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Markets</p>
              <div className="space-y-2">
                {markets.map(m => (
                  <div key={m.label} className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">{m.label}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono text-gray-900">{m.value}</span>
                      {m.up !== null && (
                        <span className={`text-[10px] font-bold ${m.up ? 'text-green-600' : 'text-red-500'}`}>
                          {m.up ? '▲' : '▼'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Risks */}
          {topRisksForSidebar.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-3">Top Risks</p>
              <div className="space-y-2">
                {topRisksForSidebar.map((r, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                    <p className="text-xs text-gray-700 leading-snug">{r.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Competitor pressure */}
          {competitorPressure.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Competitor Pressure</p>
              <div className="space-y-2">
                {competitorPressure.slice(0, 5).map(c => (
                  <div key={c.name} className="flex items-center gap-2">
                    <span className="text-xs text-gray-700 truncate flex-1">{c.name}</span>
                    <div className="flex gap-0.5">
                      {c.weeks.map((level, wi) => (
                        <div key={wi} className={`w-2 h-2 rounded-sm ${level ? THREAT_DOT[level] : 'bg-gray-100'}`} />
                      ))}
                    </div>
                    <span className={`text-[10px] font-bold ${
                      c.trend === 'rising' ? 'text-red-500' :
                      c.trend === 'falling' ? 'text-emerald-500' : 'text-gray-400'
                    }`}>
                      {c.trend === 'rising' ? '▲' : c.trend === 'falling' ? '▼' : '→'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 3. Intelligence Tiles ─────────────────────────────────────────────── */}
      {latestBriefContent && (() => {
        const tiles = [
          {
            title: 'Competitor Intelligence',
            color: 'bg-orange-600',
            sectionKey: 'competitor_intelligence',
            anchor: 'brief-comp',
            items: (latestBriefContent.competitor_intelligence ?? []).map((c, i) => ({
              headline: c.headline, meta: c.competitor, index: i,
              badge: c.threat_level + ' threat',
              badgeStyle: c.threat_level === 'high' ? 'bg-red-100 text-red-700' : c.threat_level === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600',
            })),
          },
          {
            title: 'Risk Summary',
            color: 'bg-red-600',
            sectionKey: 'risk_summary',
            anchor: 'brief-risk',
            items: (latestBriefContent.risk_summary ?? []).map((r, i) => ({
              headline: r.title, meta: r.timeframe ?? null, index: i,
              badge: r.severity,
              badgeStyle: r.severity === 'high' ? 'bg-red-100 text-red-700' : r.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600',
            })),
          },
          {
            title: 'Geopolitical Signals',
            color: 'bg-slate-700',
            sectionKey: 'geopolitical_news',
            anchor: 'brief-geo',
            items: (latestBriefContent.geopolitical_news ?? []).map((g, i) => ({ headline: g.headline, meta: g.region, index: i })),
          },
          {
            title: 'Financial News',
            color: 'bg-blue-700',
            sectionKey: 'financial_news',
            anchor: 'brief-fin-news',
            items: (latestBriefContent.financial_news ?? []).map((f, i) => ({ headline: f.headline, meta: f.market, index: i })),
          },
          {
            title: 'M&A Watch',
            color: 'bg-indigo-700',
            sectionKey: 'ma_watch',
            anchor: 'brief-ma',
            items: (latestBriefContent.ma_watch ?? []).map((m, i) => ({ headline: m.headline, meta: m.type, index: i })),
          },
          {
            title: 'Tech Intelligence',
            color: 'bg-violet-700',
            sectionKey: 'tech_intelligence',
            anchor: 'brief-tech',
            items: (latestBriefContent.tech_intelligence ?? []).map((t, i) => ({ headline: t.headline, meta: t.category, index: i })),
          },
          {
            title: 'Company News',
            color: 'bg-gray-700',
            sectionKey: 'company_news',
            anchor: 'brief-company-news',
            items: (latestBriefContent.company_news ?? []).map((n, i) => ({ headline: n.headline, meta: n.source ?? null, index: i })),
          },
          {
            title: 'HR Intelligence',
            color: 'bg-pink-600',
            sectionKey: 'hr_intelligence',
            anchor: 'brief-hr',
            items: (latestBriefContent.hr_intelligence ?? []).map((h, i) => ({ headline: h.headline, meta: h.category, index: i })),
          },
        ].filter(t => t.items.length > 0)

        if (tiles.length === 0) return null
        return (
          <div>
            <div className="flex items-center gap-3 mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Intelligence Breakdown</p>
              <div className="flex-1 border-t border-gray-200" />
              {latestBriefId && (
                <Link href={`/briefs/${latestBriefId}/full`} className="text-xs text-blue-600 font-semibold hover:text-blue-800">
                  View full brief →
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {tiles.map(tile => (
                <SectionTile key={tile.sectionKey} {...tile} briefId={latestBriefId} />
              ))}
            </div>
          </div>
        )
      })()}

      {/* ── 4. Historical Section (collapsible) ───────────────────────────────── */}
      <div>
        <button
          onClick={() => setHistoryOpen(h => !h)}
          className="w-full flex items-center gap-2 text-xs text-gray-400 hover:text-gray-700 transition-colors mb-3"
        >
          <div className="flex-1 border-t border-gray-100" />
          <span className="font-semibold uppercase tracking-widest px-2">
            {historyOpen ? '▲ Hide historical data' : '▼ Show historical data'}
          </span>
          <div className="flex-1 border-t border-gray-100" />
        </button>

        {historyOpen && (
          <div className="space-y-4">

            {/* 4-Week Comparison Table */}
            {last4.length >= 2 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-700">{last4.length}-Week Intelligence Comparison</p>
                  <p className="text-[10px] text-gray-400">● = this week</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/40">
                        <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 w-28">Category</th>
                        {last4.map(a => (
                          <th key={a.id} className="text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">
                            {a.weekShort}{a.id === latest?.id && <span className="ml-1 text-blue-500">●</span>}
                          </th>
                        ))}
                        <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Trend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">

                      <tr className="hover:bg-gray-50/40">
                        <td className="px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-gray-400 align-top">Top Risk</td>
                        {last4.map(a => (
                          <WeekCell
                            key={a.id}
                            label={a.topRiskTitle}
                            sub={a.topRiskDetail}
                            badge={a.topRiskTimeframe ?? undefined}
                            badgeStyle="bg-red-50 text-red-600 border-red-200"
                          />
                        ))}
                        <td className="text-center px-3 align-middle">
                          <span className={`text-sm font-bold ${trendArrow(last4.map(a => a.riskHigh)).color}`}>
                            {trendArrow(last4.map(a => a.riskHigh)).arrow}
                          </span>
                        </td>
                      </tr>

                      <tr className="hover:bg-gray-50/40">
                        <td className="px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-gray-400 align-top">Competitor</td>
                        {last4.map(a => (
                          <WeekCell
                            key={a.id}
                            label={a.topCompetitorHeadline}
                            sub={a.topCompetitorName ?? undefined}
                            badge={a.topCompetitorThreat ?? undefined}
                            badgeStyle={THREAT_COLOR[a.topCompetitorThreat ?? ''] ?? 'bg-gray-50 text-gray-500 border-gray-200'}
                          />
                        ))}
                        <td className="text-center px-3 align-middle">
                          <span className={`text-sm font-bold ${trendArrow(last4.map(a => a.competitorCount)).color}`}>
                            {trendArrow(last4.map(a => a.competitorCount)).arrow}
                          </span>
                        </td>
                      </tr>

                      <tr className="hover:bg-gray-50/40">
                        <td className="px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-gray-400 align-top">Decision</td>
                        {last4.map(a => (
                          <WeekCell
                            key={a.id}
                            label={a.topDecisionQuestion}
                            sub={a.topDecisionContext}
                          />
                        ))}
                        <td className="text-center px-3 align-middle">
                          <span className={`text-sm font-bold ${trendArrow(last4.map(a => a.decisionCount)).color}`}>
                            {trendArrow(last4.map(a => a.decisionCount)).arrow}
                          </span>
                        </td>
                      </tr>

                      <tr className="hover:bg-gray-50/40">
                        <td className="px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-gray-400 align-top">Geopolitical</td>
                        {last4.map(a => (
                          <WeekCell
                            key={a.id}
                            label={a.topGeoHeadline}
                            sub={a.topGeoRegion}
                          />
                        ))}
                        <td className="px-3" />
                      </tr>

                      <tr className="hover:bg-gray-50/40">
                        <td className="px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-gray-400 align-top">Markets</td>
                        {last4.map(a => (
                          <WeekCell
                            key={a.id}
                            label={a.topFinancialHeadline}
                            sub={a.topFinancialCategory}
                          />
                        ))}
                        <td className="px-3" />
                      </tr>

                    </tbody>
                  </table>
                </div>

                {/* Numeric scorecard footer */}
                <div className="border-t border-gray-100 bg-gray-50/40">
                  <table className="w-full text-xs">
                    <tbody>
                      <tr>
                        <td className="px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-gray-400 w-28">Counts</td>
                        {last4.map(a => (
                          <td key={a.id} className="px-3 py-2">
                            <div className="flex gap-2 flex-wrap">
                              {SCORECARD_METRICS.map(m => (
                                <span
                                  key={m.key}
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    m.invert && a[m.key] > 0
                                      ? 'bg-red-100 text-red-700'
                                      : a[m.key] > 0 ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-400'
                                  }`}
                                >
                                  {a[m.key]} {m.label.split(' ')[0]}
                                </span>
                              ))}
                            </div>
                          </td>
                        ))}
                        <td className="px-3" />
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Recurring Signals */}
            {(recurring.competitors.length > 0 || recurring.risks.length > 0) && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-2.5">Recurring Signals (last 4 weeks)</p>
                <div className="flex flex-wrap gap-4">
                  {recurring.competitors.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-wide mb-1">Competitors</p>
                      <div className="flex flex-wrap gap-1.5">
                        {recurring.competitors.map(c => (
                          <span key={c} className="text-xs font-medium bg-white border border-amber-200 text-amber-800 px-2 py-0.5 rounded-full">{c}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {recurring.risks.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-wide mb-1">Risk Themes</p>
                      <div className="flex flex-wrap gap-1.5">
                        {recurring.risks.map(r => (
                          <span key={r} className="text-xs font-medium bg-white border border-amber-200 text-amber-800 px-2 py-0.5 rounded-full capitalize">{r}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Competitor Pressure Trend */}
            {competitorPressure.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-xs font-semibold text-gray-700 mb-3">Competitor Pressure Trend</p>
                <div className="space-y-2.5">
                  {competitorPressure.map(c => (
                    <div key={c.name} className="flex items-center gap-3">
                      <p className="text-xs font-medium text-gray-700 w-36 shrink-0 truncate">{c.name}</p>
                      <div className="flex items-center gap-1.5">
                        {c.weeks.map((level, wi) => (
                          <div key={wi} title={level ?? 'not mentioned'}
                            className={`w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                              level ? THREAT_DOT[level] : 'bg-gray-100'
                            }`}
                          />
                        ))}
                      </div>
                      <span className={`text-[10px] font-bold ml-1 ${
                        c.trend === 'rising'  ? 'text-red-500' :
                        c.trend === 'falling' ? 'text-emerald-500' :
                                                'text-gray-400'
                      }`}>
                        {c.trend === 'rising' ? '▲ Rising' : c.trend === 'falling' ? '▼ Falling' : '→ Stable'}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-3">
                  Dots = weekly threat level · <span className="text-red-400">●</span> high &nbsp;
                  <span className="text-amber-400">●</span> medium &nbsp;
                  <span className="text-gray-300">●</span> low &nbsp;
                  ○ not mentioned
                </p>
              </div>
            )}

            {/* Risk Intensity Over Time */}
            {aggregates.length >= 3 && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-xs font-semibold text-gray-700 mb-4">Risk Intensity Over Time</p>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="weekShort" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={20} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                    <Area type="monotone" dataKey="riskHigh" stroke="#dc2626" fill="#fee2e2" name="High"   strokeWidth={1.5} />
                    <Area type="monotone" dataKey="riskMed"  stroke="#d97706" fill="#fef3c7" name="Medium" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

          </div>
        )}
      </div>

      {/* ── 5. Trend Insights ─────────────────────────────────────────────────── */}
      {trendInsights && (trendInsights.themes?.length > 0 || trendInsights.summary) && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Strategic Trend Analysis</p>
              <p className="text-xs text-gray-400 mt-0.5">Patterns across {trendInsights.briefs_compared} briefs — what the data is really saying</p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100 rounded px-2 py-1">AI Analysis</span>
          </div>

          {/* Summary */}
          {trendInsights.summary && (
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <p className="text-sm text-gray-700 leading-relaxed">{trendInsights.summary}</p>
            </div>
          )}

          {/* Themes */}
          {trendInsights.themes?.length > 0 && (
            <div className="divide-y divide-gray-100">
              {trendInsights.themes.map((theme, i) => {
                const signalConfig = {
                  escalating: { label: 'Escalating', color: 'bg-red-50 text-red-700 border-red-200' },
                  recurring:  { label: 'Recurring',  color: 'bg-amber-50 text-amber-700 border-amber-200' },
                  emerging:   { label: 'Emerging',   color: 'bg-blue-50 text-blue-700 border-blue-100' },
                  resolving:  { label: 'Resolving',  color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                }[theme.signal] ?? { label: theme.signal, color: 'bg-gray-100 text-gray-600 border-gray-200' }
                return (
                  <div key={i} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <p className="text-sm font-semibold text-gray-900 leading-snug">{theme.title}</p>
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border shrink-0 ${signalConfig.color}`}>
                        {signalConfig.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{theme.analysis}</p>
                  </div>
                )
              })}
            </div>
          )}

          {/* Watch items */}
          {trendInsights.watch_items?.length > 0 && (
            <div className="px-5 py-4 bg-amber-50/50 border-t border-amber-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-2">Watch Closely</p>
              <ul className="space-y-1.5">
                {trendInsights.watch_items.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-amber-500 shrink-0 mt-1 text-xs">▸</span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
