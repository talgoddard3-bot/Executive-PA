'use client'

import { useEffect, useState } from 'react'
import type {
  DashboardVisual,
  DashboardVisualsResult,
  StrategicImpactScoreData,
  CompanyExposureMapData,
  RiskHeatmapData,
  OpportunityRadarData,
  DecisionRadarData,
  CompetitivePressureMapData,
  StrategicMomentumTrackerData,
} from '@/lib/types'

// ── Level / severity styling ──────────────────────────────────────────────────

const LEVEL_BADGE: Record<string, string> = {
  high:        'bg-red-100 text-red-700 border-red-200',
  medium:      'bg-amber-100 text-amber-700 border-amber-200',
  low:         'bg-gray-100 text-gray-500 border-gray-200',
}
const LEVEL_BAR: Record<string, string> = {
  high:   'bg-red-500',
  medium: 'bg-amber-400',
  low:    'bg-gray-300',
}
const LEVEL_DOT: Record<string, string> = {
  high:   'bg-red-500',
  medium: 'bg-amber-400',
  low:    'bg-gray-300',
}
const URGENCY_BADGE: Record<string, string> = {
  immediate:    'bg-red-100 text-red-700 border-red-200',
  'decide soon':'bg-amber-100 text-amber-700 border-amber-200',
  monitor:      'bg-blue-50 text-blue-600 border-blue-200',
}
const MOMENTUM_BADGE: Record<string, string> = {
  accelerating: 'bg-emerald-100 text-emerald-700',
  stable:       'bg-gray-100 text-gray-600',
  weakening:    'bg-orange-100 text-orange-700',
}
const MOMENTUM_ICON: Record<string, string> = {
  accelerating: '↑',
  stable:       '→',
  weakening:    '↓',
}

// ── Visual renderers ──────────────────────────────────────────────────────────

function StrategicImpactScore({ data }: { data: StrategicImpactScoreData }) {
  const dirIcon = data.direction === 'rising' ? '↑' : data.direction === 'falling' ? '↓' : '→'
  const dirColor = data.direction === 'rising' ? 'text-red-500' : data.direction === 'falling' ? 'text-emerald-500' : 'text-gray-500'
  const scoreColor = data.score >= 8 ? 'text-red-600' : data.score >= 6 ? 'text-amber-600' : 'text-gray-700'
  return (
    <div className="space-y-4">
      <div className="flex items-end gap-4">
        <div className="flex items-end gap-1">
          <span className={`text-5xl font-black tabular-nums ${scoreColor}`}>{data.score.toFixed(1)}</span>
          <span className="text-lg text-gray-400 mb-1">/10</span>
        </div>
        <span className={`text-2xl font-bold mb-1 ${dirColor}`}>{dirIcon}</span>
        <div className="mb-1 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${LEVEL_BADGE[data.confidence]}`}>
              {data.confidence} confidence
            </span>
            <span className="text-[10px] text-gray-400 font-medium">{data.time_horizon}</span>
          </div>
        </div>
      </div>
      {/* Score bar */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${data.score >= 8 ? 'bg-red-500' : data.score >= 6 ? 'bg-amber-400' : 'bg-blue-400'}`}
          style={{ width: `${(data.score / 10) * 100}%` }}
        />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{data.primary_theme}</p>
        <p className="text-xs text-gray-600 leading-relaxed">{data.rationale}</p>
      </div>
    </div>
  )
}

function CompanyExposureMap({ data }: { data: CompanyExposureMapData }) {
  return (
    <div className="space-y-3">
      {data.exposures.map((e, i) => (
        <div key={i} className="flex gap-3 items-start">
          <div className="mt-0.5 flex flex-col items-center gap-1 shrink-0">
            <span className={`w-2.5 h-2.5 rounded-full ${LEVEL_DOT[e.level]}`} />
            {i < data.exposures.length - 1 && <span className="w-px h-4 bg-gray-200" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="text-xs font-semibold text-gray-900">{e.area}</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide ${LEVEL_BADGE[e.level]}`}>
                {e.level}
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-snug">{e.why}</p>
            {e.entities && e.entities.length > 0 && (
              <div className="flex gap-1 mt-1 flex-wrap">
                {e.entities.map((ent, j) => (
                  <span key={j} className="text-[9px] font-semibold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                    {ent}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function RiskHeatmap({ data }: { data: RiskHeatmapData }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {data.risks.map((r, i) => (
        <div key={i} className={`rounded-lg p-2.5 border ${
          r.severity === 'high' ? 'bg-red-50 border-red-200' :
          r.severity === 'medium' ? 'bg-amber-50 border-amber-200' :
          'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${LEVEL_DOT[r.severity]}`} />
            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">{r.category}</span>
          </div>
          <p className="text-[10px] text-gray-600 leading-snug">{r.why}</p>
        </div>
      ))}
    </div>
  )
}

function OpportunityRadar({ data }: { data: OpportunityRadarData }) {
  return (
    <div className="space-y-2.5">
      {data.opportunities.map((o, i) => (
        <div key={i} className="flex gap-3 items-start">
          <div className="mt-1 shrink-0">
            <div className={`w-8 h-1.5 rounded-full ${
              o.strength === 'high' ? 'bg-emerald-500' :
              o.strength === 'medium' ? 'bg-emerald-300' :
              'bg-emerald-200'
            }`} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-semibold text-gray-900">{o.area}</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                o.strength === 'high' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                o.strength === 'medium' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                'bg-gray-50 text-gray-500 border-gray-200'
              }`}>
                {o.strength}
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-snug">{o.why}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function DecisionRadar({ data }: { data: DecisionRadarData }) {
  return (
    <div className="space-y-3">
      {data.decisions.map((d, i) => (
        <div key={i} className={`rounded-lg border p-3 ${
          d.urgency === 'immediate' ? 'bg-red-50 border-red-200' :
          d.urgency === 'decide soon' ? 'bg-amber-50 border-amber-200' :
          'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide ${URGENCY_BADGE[d.urgency]}`}>
              {d.urgency}
            </span>
            <span className="text-[9px] text-gray-500 font-medium">{d.function}</span>
          </div>
          <p className="text-xs font-semibold text-gray-900 leading-snug mb-1">{d.issue}</p>
          <p className="text-[10px] text-gray-600 leading-snug">{d.why}</p>
        </div>
      ))}
    </div>
  )
}

function CompetitivePressureMap({ data }: { data: CompetitivePressureMapData }) {
  return (
    <div className="space-y-2.5">
      {data.pressures.map((p, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="shrink-0 w-24 pt-0.5">
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${LEVEL_BAR[p.level]}`}
                style={{ width: p.level === 'high' ? '90%' : p.level === 'medium' ? '55%' : '25%' }}
              />
            </div>
            <span className="text-[9px] text-gray-400">{p.level}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-gray-900 mb-0.5">{p.competitor}</p>
            <p className="text-[10px] text-gray-500 leading-snug">{p.why}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function StrategicMomentumTracker({ data }: { data: StrategicMomentumTrackerData }) {
  return (
    <div className="space-y-3">
      {data.momentum_items.map((m, i) => (
        <div key={i} className="flex gap-3 items-start">
          <span className={`shrink-0 w-6 h-6 rounded flex items-center justify-center text-sm font-bold ${MOMENTUM_BADGE[m.momentum]}`}>
            {MOMENTUM_ICON[m.momentum]}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="text-xs font-semibold text-gray-900">{m.theme}</span>
              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide ${MOMENTUM_BADGE[m.momentum]}`}>
                {m.momentum}
              </span>
            </div>
            <p className="text-[10px] text-gray-500 leading-snug">{m.why}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Visual card wrapper ───────────────────────────────────────────────────────

const VISUAL_ICON: Record<string, string> = {
  'Strategic Impact Score':      '⚡',
  'Company Exposure Map':        '🗺',
  'Risk Heatmap':                '🔥',
  'Opportunity Radar':           '↗',
  'Decision Radar':              '⚑',
  'Competitive Pressure Map':    '⚔',
  'Strategic Momentum Tracker':  '📈',
}

function VisualCard({ visual }: { visual: DashboardVisual }) {
  const [showWhy, setShowWhy] = useState(false)
  const icon = VISUAL_ICON[visual.visual_type] ?? '◉'
  const isPrimary = visual.priority === 1

  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${isPrimary ? 'border-gray-300' : 'border-gray-200'}`}>
      <div className={`px-4 py-2.5 flex items-center justify-between ${isPrimary ? 'bg-gray-900' : 'bg-gray-50 border-b border-gray-100'}`}>
        <div className="flex items-center gap-2">
          <span className="text-sm">{icon}</span>
          <span className={`text-xs font-bold uppercase tracking-widest ${isPrimary ? 'text-white' : 'text-gray-600'}`}>
            {visual.title}
          </span>
          {isPrimary && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/20 text-white/80 uppercase tracking-wide">
              Primary
            </span>
          )}
        </div>
        <button
          onClick={() => setShowWhy(!showWhy)}
          className={`text-[10px] ${isPrimary ? 'text-white/50 hover:text-white/80' : 'text-gray-300 hover:text-gray-600'} transition-colors`}
          title="Why this visual?"
        >
          {showWhy ? '✕' : 'Why?'}
        </button>
      </div>
      {showWhy && (
        <div className="px-4 py-2.5 bg-blue-50 border-b border-blue-100">
          <p className="text-[10px] text-blue-700 leading-snug">{visual.why_selected}</p>
        </div>
      )}
      <div className="p-4">
        {visual.visual_type === 'Strategic Impact Score' && (
          <StrategicImpactScore data={visual.data as StrategicImpactScoreData} />
        )}
        {visual.visual_type === 'Company Exposure Map' && (
          <CompanyExposureMap data={visual.data as CompanyExposureMapData} />
        )}
        {visual.visual_type === 'Risk Heatmap' && (
          <RiskHeatmap data={visual.data as RiskHeatmapData} />
        )}
        {visual.visual_type === 'Opportunity Radar' && (
          <OpportunityRadar data={visual.data as OpportunityRadarData} />
        )}
        {visual.visual_type === 'Decision Radar' && (
          <DecisionRadar data={visual.data as DecisionRadarData} />
        )}
        {visual.visual_type === 'Competitive Pressure Map' && (
          <CompetitivePressureMap data={visual.data as CompetitivePressureMapData} />
        )}
        {visual.visual_type === 'Strategic Momentum Tracker' && (
          <StrategicMomentumTracker data={visual.data as StrategicMomentumTrackerData} />
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DashboardVisuals({ briefId }: { briefId: string }) {
  const [result, setResult] = useState<DashboardVisualsResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)

  async function load() {
    try {
      const res = await fetch(`/api/briefs/${briefId}/dashboard-visuals`)
      if (res.ok) setResult(await res.json())
    } catch {}
    setLoading(false)
  }

  async function regenerate() {
    setRegenerating(true)
    try {
      const res = await fetch(`/api/briefs/${briefId}/dashboard-visuals`, { method: 'POST' })
      if (res.ok) setResult(await res.json())
    } catch {}
    setRegenerating(false)
  }

  useEffect(() => { load() }, [briefId])

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Strategic Visuals</span>
          <span className="w-3 h-3 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
          <span className="text-[10px] text-gray-400">Analysing…</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 h-40 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!result || result.dashboard_visuals.length === 0) return null

  const sorted = [...result.dashboard_visuals].sort((a, b) => a.priority - b.priority)
  const primary = sorted[0]
  const supporting = sorted.slice(1)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Strategic Visuals</p>
        <button
          onClick={regenerate}
          disabled={regenerating}
          className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40 flex items-center gap-1"
        >
          {regenerating && <span className="w-2.5 h-2.5 border border-gray-400 border-t-transparent rounded-full animate-spin" />}
          Refresh
        </button>
      </div>

      {/* Primary visual — full width */}
      <VisualCard visual={primary} />

      {/* Supporting visuals — side by side */}
      {supporting.length > 0 && (
        <div className={`grid gap-3 ${supporting.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
          {supporting.map(v => <VisualCard key={v.priority} visual={v} />)}
        </div>
      )}
    </div>
  )
}
