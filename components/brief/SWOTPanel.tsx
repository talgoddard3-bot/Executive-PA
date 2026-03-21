'use client'

import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { BriefContent } from '@/lib/types'

const SWOT_CONFIG = {
  strengths:     { label: 'Strengths',     icon: '↑', color: '#10b981', badge: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500', ring: 'ring-emerald-300', activeBg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  weaknesses:    { label: 'Weaknesses',    icon: '↓', color: '#f97316', badge: 'bg-orange-100 text-orange-800',   dot: 'bg-orange-400',  ring: 'ring-orange-300',  activeBg: 'bg-orange-50 dark:bg-orange-900/20' },
  opportunities: { label: 'Opportunities', icon: '↗', color: '#3b82f6', badge: 'bg-blue-100 text-blue-800',       dot: 'bg-blue-500',    ring: 'ring-blue-300',    activeBg: 'bg-blue-50 dark:bg-blue-900/20' },
  threats:       { label: 'Threats',       icon: '⚠', color: '#ef4444', badge: 'bg-red-100 text-red-800',         dot: 'bg-red-500',     ring: 'ring-red-300',     activeBg: 'bg-red-50 dark:bg-red-900/20' },
}

const urgencyBadge: Record<string, string> = {
  high:   'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low:    'bg-gray-100 text-gray-600 border-gray-200',
}

function RichText({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1
          ? <strong key={i} className="font-semibold text-gray-900 dark:text-white">{part}</strong>
          : part
      )}
    </>
  )
}

export default function SWOTPanel({ swot, brandColor }: { swot: BriefContent['swot']; brandColor?: string | null }) {
  const [activeQ, setActiveQ] = useState<keyof typeof SWOT_CONFIG | null>(null)
  const accent = brandColor ?? '#111827'
  const quadrants = ['strengths', 'opportunities', 'weaknesses', 'threats'] as const

  const chartData = quadrants
    .map(q => ({ name: SWOT_CONFIG[q].label, value: (swot?.[q] ?? []).length, key: q, color: SWOT_CONFIG[q].color }))
    .filter(d => d.value > 0)

  const totalItems = chartData.reduce((s, d) => s + d.value, 0)

  const allItems = quadrants.flatMap(q =>
    (swot?.[q] ?? []).map(item => ({ ...item, quadrant: q as keyof typeof SWOT_CONFIG }))
  )
  const displayItems = activeQ ? allItems.filter(i => i.quadrant === activeQ) : allItems

  return (
    <div id="brief-swot" className="rounded-xl border-2 overflow-hidden bg-white dark:bg-gray-800" style={{ borderColor: accent + '33' }}>
      {/* Header */}
      <div className="px-5 py-3 flex items-center justify-between" style={{ background: accent + '0d' }}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: accent }}>
            SWOT Analysis — This Week
          </span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{totalItems} signals</span>
        </div>
        <span className="text-[10px] text-gray-400 dark:text-gray-500">Synthesised from all signals · click to filter</span>
      </div>

      <div className="p-5 flex flex-col lg:flex-row gap-6">

        {/* ── Donut chart + legend ── */}
        <div className="shrink-0 flex flex-col items-center gap-4">
          <div className="relative w-48 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%" cy="50%"
                  innerRadius={56} outerRadius={78}
                  paddingAngle={3}
                  dataKey="value"
                  onClick={(d) => setActiveQ(activeQ === d.key ? null : d.key as keyof typeof SWOT_CONFIG)}
                  cursor="pointer"
                  strokeWidth={0}
                >
                  {chartData.map((d) => (
                    <Cell key={d.key} fill={d.color} opacity={activeQ && activeQ !== d.key ? 0.25 : 1} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number | undefined, name: string | undefined) => [`${v ?? 0} signal${(v ?? 0) !== 1 ? 's' : ''}`, name ?? '']}
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb', padding: '4px 10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              {activeQ ? (
                <>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">{(swot?.[activeQ] ?? []).length}</span>
                  <span className="text-[9px] text-gray-500 dark:text-gray-400 font-medium">{SWOT_CONFIG[activeQ].label}</span>
                </>
              ) : (
                <>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">{totalItems}</span>
                  <span className="text-[9px] text-gray-500 dark:text-gray-400 font-medium">signals</span>
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
                      : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10'
                  } ${count === 0 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  disabled={count === 0}
                >
                  <span className="text-base leading-none">{cfg.icon}</span>
                  <span className="text-gray-700 dark:text-gray-300">{cfg.label}</span>
                  <span className="ml-auto text-gray-400 dark:text-gray-500 font-normal tabular-nums">{count}</span>
                </button>
              )
            })}
          </div>

          {activeQ && (
            <button
              onClick={() => setActiveQ(null)}
              className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline underline-offset-2"
            >
              Show all quadrants
            </button>
          )}
        </div>

        {/* ── Items list ── */}
        <div className="flex-1 min-w-0 space-y-3 max-h-[32rem] overflow-y-auto pr-1">
          {displayItems.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 italic">No signals in this quadrant this week.</p>
          )}
          {displayItems.map((item, i) => {
            const cfg = SWOT_CONFIG[item.quadrant]
            return (
              <div key={i} className={`flex gap-3 items-start p-3 rounded-lg border transition-colors ${
                activeQ === item.quadrant || !activeQ
                  ? cfg.activeBg + ' border-transparent'
                  : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 opacity-60'
              }`}>
                <span className={`mt-0.5 shrink-0 w-5 h-5 rounded flex items-center justify-center text-sm font-bold ${cfg.badge}`}>
                  {cfg.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-800 dark:text-gray-200 leading-snug font-medium">
                    <RichText text={item.point} />
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {item.urgency && (item.quadrant === 'opportunities' || item.quadrant === 'threats') && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${urgencyBadge[item.urgency]}`}>
                        {item.urgency}
                      </span>
                    )}
                    {item.source && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        {item.source}
                      </span>
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
