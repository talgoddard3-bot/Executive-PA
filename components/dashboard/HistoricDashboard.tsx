'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'
import type { TrendInsights } from '@/lib/types'

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
  swotStrengths: number
  swotWeaknesses: number
  swotOpportunities: number
  swotThreats: number
  competitorCount: number
  maCount: number
  scenarioCount: number
  decisionCount: number
  sp500: number | null
  dxy: number | null
  gold: number | null
}

interface Props {
  aggregates: BriefAggregate[]
  latestBriefId: string | null
  companyName: string | null
  trendInsights: TrendInsights | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function trendArrow(values: number[]): { arrow: string; color: string; label: string } {
  if (values.length < 2) return { arrow: '→', color: 'text-gray-400', label: 'Only one data point' }
  const first = values[0]
  const last  = values[values.length - 1]
  const delta = last - first
  if (Math.abs(delta) <= 0.5) return { arrow: '→', color: 'text-gray-400', label: 'Stable' }
  if (delta > 0) return { arrow: '▲', color: 'text-red-500', label: `+${delta} over period` }
  return { arrow: '▼', color: 'text-emerald-500', label: `${delta} over period` }
}

function weekTrend(vals: number[], invert = false): string {
  if (vals.length < 2) return ''
  const delta = vals[vals.length - 1] - vals[vals.length - 2]
  if (delta === 0) return 'No change'
  const sign = delta > 0 ? '▲' : '▼'
  const good = invert ? delta < 0 : delta > 0
  return `${sign} ${Math.abs(delta)} vs prev`
}

function buildTrendSummary(last4: BriefAggregate[]): string {
  if (last4.length < 2) return ''
  const lines: string[] = []

  const risks = last4.map(a => a.riskHigh)
  const latest = risks[risks.length - 1]
  const prev   = risks[risks.length - 2]
  if (latest > prev) lines.push(`High-risk items rose to ${latest} this week (up from ${prev})`)
  else if (latest < prev) lines.push(`High-risk items fell to ${latest} this week (down from ${prev})`)
  else lines.push(`High-risk count held steady at ${latest}`)

  const comps = last4.map(a => a.competitorCount)
  const maxComp = Math.max(...comps)
  const latestComp = comps[comps.length - 1]
  if (latestComp === maxComp && last4.length > 1) lines.push(`Competitor activity is at its highest in the period (${latestComp} moves)`)
  else if (latestComp < comps[comps.length - 2]) lines.push(`Competitor moves eased to ${latestComp} this week`)

  const decisions = last4.map(a => a.decisionCount)
  const latestDec = decisions[decisions.length - 1]
  if (latestDec >= 3) lines.push(`${latestDec} decisions require executive attention this week`)

  const ma = last4.map(a => a.maCount)
  const latestMa = ma[ma.length - 1]
  const prevMa = ma[ma.length - 2]
  if (latestMa > prevMa) lines.push(`M&A activity increased (${latestMa} items vs ${prevMa} last week)`)

  return lines.join('. ') + (lines.length ? '.' : '')
}

// ── Scorecard cell ─────────────────────────────────────────────────────────────
function ScorecardCell({ value, max, invert }: { value: number; max: number; invert?: boolean }) {
  const intensity = max > 0 ? value / max : 0
  const bg = invert
    ? intensity > 0.7 ? 'bg-red-100 text-red-800' : intensity > 0.3 ? 'bg-amber-50 text-amber-800' : 'bg-gray-50 text-gray-600'
    : intensity > 0.7 ? 'bg-blue-100 text-blue-800' : intensity > 0.3 ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-600'
  return (
    <td className="text-center py-2.5 px-2">
      <span className={`inline-block min-w-[28px] text-sm font-semibold px-2 py-0.5 rounded ${bg}`}>{value}</span>
    </td>
  )
}

const DIRECTION_ICON: Record<string, string> = { up: '▲', down: '▼', stable: '→' }
const DIRECTION_COLOR: Record<string, string> = { up: 'text-red-600', down: 'text-emerald-600', stable: 'text-gray-500' }

// ── Main ──────────────────────────────────────────────────────────────────────

export default function HistoricDashboard({ aggregates, latestBriefId, companyName, trendInsights }: Props) {
  const [expanded, setExpanded] = useState(false)

  const latest   = aggregates[aggregates.length - 1]
  const previous = aggregates[aggregates.length - 2]
  const last4    = aggregates.slice(-4)
  const chartData = aggregates.slice(-12)

  const trendSummary = buildTrendSummary(last4)

  const METRICS = [
    { label: '🔴 High Risks',       key: 'riskHigh'       as const, invert: true  },
    { label: '🟡 Med Risks',        key: 'riskMed'        as const, invert: true  },
    { label: '🏢 Competitor Moves', key: 'competitorCount'as const, invert: false },
    { label: '🔀 M&A Items',        key: 'maCount'        as const, invert: false },
    { label: '⚡ Decisions',        key: 'decisionCount'  as const, invert: false },
  ]

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Intelligence Dashboard</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {companyName ?? 'Company'} · {aggregates.length} brief{aggregates.length !== 1 ? 's' : ''}
          </p>
        </div>
        {latestBriefId && (
          <Link
            href={`/briefs/${latestBriefId}`}
            className="shrink-0 text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl transition-colors whitespace-nowrap"
          >
            Latest Brief →
          </Link>
        )}
      </div>

      {aggregates.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16 text-center">
          <p className="text-gray-400 text-sm">No briefs yet. Generate your first brief to start tracking trends.</p>
          <Link href="/briefs" className="mt-4 inline-block text-sm text-blue-600 hover:underline">Go to Briefs →</Link>
        </div>
      ) : (
        <>
          {/* ── Latest Brief Hero ─────────────────────────────────────────────── */}
          {latest && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 pt-5 pb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                  Latest Brief · {latest.weekOf}
                </p>
                <h2 className="text-base font-bold text-gray-900 leading-snug mb-3">{latest.headline}</h2>
                {latest.executiveSummary && (
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    {expanded ? latest.executiveSummary : latest.executiveSummary.slice(0, 220) + (latest.executiveSummary.length > 220 ? '…' : '')}
                    {latest.executiveSummary.length > 220 && (
                      <button
                        onClick={() => setExpanded(e => !e)}
                        className="ml-1.5 text-blue-500 hover:text-blue-700 text-xs font-medium"
                      >
                        {expanded ? 'less' : 'more'}
                      </button>
                    )}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  {latest.riskHigh > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-full">
                      🔴 {latest.riskHigh} high risk{latest.riskHigh !== 1 ? 's' : ''}
                      {previous && latest.riskHigh > previous.riskHigh && <span className="text-red-400 text-[10px]">▲</span>}
                    </span>
                  )}
                  {latest.competitorCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-1 rounded-full">
                      🏢 {latest.competitorCount} competitor move{latest.competitorCount !== 1 ? 's' : ''}
                    </span>
                  )}
                  {latest.decisionCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full">
                      ⚡ {latest.decisionCount} decision{latest.decisionCount !== 1 ? 's' : ''}
                    </span>
                  )}
                  {latest.maCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full">
                      🔀 {latest.maCount} M&A
                    </span>
                  )}
                </div>
                {latest.topRisks.length > 0 && (
                  <div className="mt-4 space-y-1">
                    {latest.topRisks.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        {r.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── 4-Week Scorecard ──────────────────────────────────────────────── */}
          {last4.length >= 2 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 pt-4 pb-3 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-700">
                  {last4.length}-Week Intelligence Scorecard
                </p>
                {trendSummary && (
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{trendSummary}</p>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 w-36">Metric</th>
                      {last4.map(a => (
                        <th key={a.id} className="text-center px-2 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">
                          {a.weekShort}
                          {a.id === latest?.id && <span className="ml-1 text-blue-500">●</span>}
                        </th>
                      ))}
                      <th className="text-center px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {METRICS.map(({ label, key, invert }) => {
                      const vals = last4.map(a => a[key])
                      const max = Math.max(...vals, 1)
                      const trend = trendArrow(vals)
                      return (
                        <tr key={key} className="hover:bg-gray-50/50">
                          <td className="px-5 py-2.5 text-xs font-medium text-gray-600 whitespace-nowrap">{label}</td>
                          {last4.map(a => (
                            <ScorecardCell key={a.id} value={a[key]} max={max} invert={invert} />
                          ))}
                          <td className="text-center px-3 py-2.5">
                            <span className={`text-sm font-bold ${trend.color}`} title={trend.label}>{trend.arrow}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── AI Trend Insights ─────────────────────────────────────────────── */}
          {trendInsights && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <p className="text-xs font-semibold text-gray-700">AI Trend Analysis</p>
                <span className="text-[10px] font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5">
                  {trendInsights.briefs_compared} briefs · Haiku
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{trendInsights.summary}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                {trendInsights.trends.map((t, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-gray-50">
                    <span className={`text-sm font-bold shrink-0 ${DIRECTION_COLOR[t.direction] ?? 'text-gray-500'}`}>
                      {DIRECTION_ICON[t.direction] ?? '→'}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{t.metric}</p>
                      <p className="text-xs font-medium text-gray-700">{t.delta}</p>
                      <p className="text-[11px] text-gray-500 leading-snug mt-0.5">{t.insight}</p>
                    </div>
                  </div>
                ))}
              </div>
              {trendInsights.watch_items.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Watch</p>
                  <ul className="space-y-1">
                    {trendInsights.watch_items.map((w, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                        <span className="text-amber-500 shrink-0 mt-0.5">●</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* ── Risk Trend Chart (only useful with ≥ 3 briefs) ────────────────── */}
          {aggregates.length >= 3 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-700 mb-4">Risk Intensity Over Time</p>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="weekShort" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={20} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                  <Area type="monotone" dataKey="riskHigh" stackId="1" stroke="#dc2626" fill="#fee2e2" name="High"   strokeWidth={1.5} />
                  <Area type="monotone" dataKey="riskMed"  stackId="1" stroke="#d97706" fill="#fef3c7" name="Medium" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="riskLow"  stackId="1" stroke="#16a34a" fill="#dcfce7" name="Low"    strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── Brief History ─────────────────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-700">Brief History</p>
            </div>
            <div className="divide-y divide-gray-50">
              {[...aggregates].reverse().slice(0, 8).map(a => (
                <Link
                  key={a.id}
                  href={`/briefs/${a.id}`}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-16 shrink-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{a.weekShort}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-blue-700 transition-colors">{a.headline}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {a.riskHigh > 0 && (
                      <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded">{a.riskHigh}H</span>
                    )}
                    {a.competitorCount > 0 && (
                      <span className="text-[10px] bg-gray-100 text-gray-600 font-medium px-1.5 py-0.5 rounded">{a.competitorCount} comp</span>
                    )}
                    <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
