'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell,
} from 'recharts'
import type { TrendInsights } from '@/lib/types'

export interface BriefAggregate {
  id: string
  weekOf: string        // "3 Mar 2026" (display)
  weekOfDate: string    // ISO "2026-03-03" (sort)
  weekShort: string     // "3 Mar" (chart axis)
  headline: string
  riskHigh: number
  riskMed: number
  riskLow: number
  swotStrengths: number
  swotWeaknesses: number
  swotOpportunities: number
  swotThreats: number
  competitorCount: number
  scenarioCount: number
  decisionCount: number
  sp500: number | null
  dxy: number | null
  gold: number | null
}

interface Props {
  aggregates: BriefAggregate[]   // sorted oldest → newest
  latestBriefId: string | null
  companyName: string | null
  trendInsights: TrendInsights | null
}

type MarketKey = 'sp500' | 'dxy' | 'gold'
const MARKET_LABELS: Record<MarketKey, string> = { sp500: 'S&P 500', dxy: 'DXY', gold: 'Gold' }
const MARKET_COLORS: Record<MarketKey, string> = { sp500: '#2563eb', dxy: '#d97706', gold: '#16a34a' }

// ── W/W delta card ─────────────────────────────────────────────────────────────
function DeltaCard({ label, current, previous, unit = '', invert = false }: {
  label: string; current: number | null; previous: number | null; unit?: string; invert?: boolean
}) {
  if (current == null || previous == null) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">{label}</p>
        <p className="text-lg font-mono font-bold text-gray-900 dark:text-white">—</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">No prior data</p>
      </div>
    )
  }
  const delta = current - previous
  const pct = previous !== 0 ? ((delta / previous) * 100).toFixed(1) : null
  const isUp = delta > 0
  // invert: for risks, "up" is bad
  const isGood = invert ? !isUp : isUp
  const colorClass = delta === 0 ? 'text-gray-500' : isGood ? 'text-green-600' : 'text-red-600'

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">{label}</p>
      <p className="text-lg font-mono font-bold text-gray-900 dark:text-white">{unit}{typeof current === 'number' && current >= 1000 ? current.toLocaleString() : current}</p>
      <p className={`text-xs font-medium ${colorClass}`}>
        {delta === 0 ? 'No change' : `${isUp ? '▲' : '▼'} ${Math.abs(delta)}${pct ? ` (${Math.abs(parseFloat(pct))}%)` : ''} vs prev week`}
      </p>
    </div>
  )
}

const DIRECTION_ICON: Record<string, string> = { up: '▲', down: '▼', stable: '→' }
const DIRECTION_COLOR: Record<string, string> = { up: 'text-red-600', down: 'text-emerald-600', stable: 'text-gray-500' }

export default function HistoricDashboard({ aggregates, latestBriefId, companyName, trendInsights }: Props) {
  const [marketKey, setMarketKey] = useState<MarketKey>('sp500')

  // oldest → newest already
  const chartData = aggregates.slice(-12)
  const latest  = aggregates[aggregates.length - 1]
  const previous = aggregates[aggregates.length - 2]

  const hasMarketData = aggregates.some(a => a[marketKey] != null)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Intelligence Dashboard</h1>
          <p className="text-xs md:text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            {companyName ?? 'Company'} · {aggregates.length} brief{aggregates.length !== 1 ? 's' : ''} · Last {latest?.weekOf ?? '—'}
          </p>
        </div>
        {latestBriefId && (
          <Link
            href={`/briefs/${latestBriefId}`}
            className="shrink-0 text-xs md:text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl transition-colors whitespace-nowrap"
          >
            Latest Brief →
          </Link>
        )}
      </div>

      {aggregates.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-16 text-center">
          <p className="text-gray-400 dark:text-gray-500 text-sm">No briefs generated yet. Generate your first brief to start tracking trends.</p>
          <Link href="/briefs" className="mt-4 inline-block text-sm text-blue-600 hover:underline">Go to Briefs →</Link>
        </div>
      ) : (
        <>
          {/* W/W Comparison (requires ≥2 briefs) */}
          {aggregates.length >= 2 && latest && previous && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Week-over-Week Change</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <DeltaCard label="High Risks"         current={latest.riskHigh}         previous={previous.riskHigh}         invert />
                <DeltaCard label="Competitor Moves"   current={latest.competitorCount}   previous={previous.competitorCount} />
                <DeltaCard label="Opportunities"      current={latest.decisionCount}     previous={previous.decisionCount} />
                <DeltaCard label="S&P 500"            current={latest.sp500}             previous={previous.sp500}           unit="" />
              </div>
            </div>
          )}

          {/* AI Trend Insights */}
          {trendInsights && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">AI Trend Analysis</p>
                <span className="text-[10px] font-medium text-gray-400 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-white/10 rounded px-1.5 py-0.5">
                  {trendInsights.briefs_compared} briefs · Generated by Claude Haiku
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">{trendInsights.summary}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                {trendInsights.trends.map((t, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <span className={`text-sm font-bold shrink-0 ${DIRECTION_COLOR[t.direction] ?? 'text-gray-500'}`}>
                      {DIRECTION_ICON[t.direction] ?? '→'}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">{t.metric}</p>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{t.delta}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug mt-0.5">{t.insight}</p>
                    </div>
                  </div>
                ))}
              </div>
              {trendInsights.watch_items.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5">Watch</p>
                  <ul className="space-y-1">
                    {trendInsights.watch_items.map((w, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                        <span className="text-amber-500 shrink-0 mt-0.5">●</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Trend Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Risk Trend */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-4">Risk Trend</p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="weekShort" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                  <Area type="monotone" dataKey="riskHigh"   stackId="1" stroke="#dc2626" fill="#fee2e2" name="High"   strokeWidth={1.5} />
                  <Area type="monotone" dataKey="riskMed"    stackId="1" stroke="#d97706" fill="#fef3c7" name="Medium" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="riskLow"    stackId="1" stroke="#16a34a" fill="#dcfce7" name="Low"    strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Market Indicator */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-gray-700">Market Indicator</p>
                <div className="flex gap-1">
                  {(['sp500', 'dxy', 'gold'] as MarketKey[]).map(k => (
                    <button
                      key={k}
                      onClick={() => setMarketKey(k)}
                      className={`text-[10px] px-2 py-0.5 rounded font-medium transition-colors ${marketKey === k ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                    >
                      {MARKET_LABELS[k]}
                    </button>
                  ))}
                </div>
              </div>
              {hasMarketData ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="weekShort" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={40}
                      tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
                      formatter={(v: number | undefined) => [(v ?? 0) >= 1000 ? (v ?? 0).toLocaleString() : (v ?? 0).toFixed(2), MARKET_LABELS[marketKey]]} />
                    <Line type="monotone" dataKey={marketKey} stroke={MARKET_COLORS[marketKey]}
                      strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-xs text-gray-400">
                  Market data available from the next generated brief
                </div>
              )}
            </div>
          </div>

          {/* SWOT Balance Over Time */}
          {aggregates.length >= 2 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-4">SWOT Balance Over Time</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="weekShort" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="swotStrengths"     name="Strengths"     stackId="a" fill="#16a34a" opacity={0.8} />
                  <Bar dataKey="swotOpportunities" name="Opportunities" stackId="a" fill="#2563eb" opacity={0.8} />
                  <Bar dataKey="swotWeaknesses"    name="Weaknesses"    stackId="b" fill="#dc2626" opacity={0.8} />
                  <Bar dataKey="swotThreats"       name="Threats"       stackId="b" fill="#d97706" opacity={0.8} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Brief Activity Timeline */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 dark:border-white/10">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Brief History</p>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-white/5">
              {[...aggregates].reverse().slice(0, 8).map(a => (
                <Link
                  key={a.id}
                  href={`/briefs/${a.id}`}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="w-20 shrink-0">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{a.weekShort}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{a.headline}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {a.riskHigh > 0 && (
                      <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded">
                        {a.riskHigh}H
                      </span>
                    )}
                    {a.riskMed > 0 && (
                      <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded">
                        {a.riskMed}M
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">{a.competitorCount} comp.</span>
                    <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
