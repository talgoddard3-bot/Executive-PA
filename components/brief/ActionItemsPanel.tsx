'use client'

import { useEffect, useState } from 'react'
import type { WeeklyAction } from '@/lib/types'

const OWNER_COLORS: Record<string, string> = {
  CEO:    'bg-violet-100 text-violet-700',
  CFO:    'bg-blue-100 text-blue-700',
  CMO:    'bg-emerald-100 text-emerald-700',
  CTO:    'bg-cyan-100 text-cyan-700',
  CBPO:   'bg-orange-100 text-orange-700',
  'VP HR':'bg-pink-100 text-pink-700',
  All:    'bg-gray-100 text-gray-600',
}

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }

interface Props {
  briefId: string
  actions: WeeklyAction[]
}

export default function ActionItemsPanel({ briefId, actions }: Props) {
  const storageKey = `actions-done-${briefId}`
  const [done, setDone] = useState<Set<number>>(new Set())
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) ?? '[]') as number[]
      setDone(new Set(stored))
    } catch { /* ignore */ }
  }, [storageKey])

  function toggle(idx: number) {
    setDone(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      try { localStorage.setItem(storageKey, JSON.stringify([...next])) } catch { /* ignore */ }
      return next
    })
  }

  const sorted = [...actions].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
  const doneCount = sorted.filter((_, i) => done.has(i)).length
  const allDone = doneCount === sorted.length

  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${allDone ? 'border-emerald-200' : 'border-blue-200'}`}>
      <button
        onClick={() => setCollapsed(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-900">This Week&apos;s Actions</span>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
            allDone ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-50 text-blue-600'
          }`}>
            {doneCount}/{sorted.length} done
          </span>
          {sorted.filter(a => a.priority === 'high' && !done.has(sorted.indexOf(a))).length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600">
              {sorted.filter(a => a.priority === 'high').length} high priority
            </span>
          )}
        </div>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${collapsed ? '' : 'rotate-180'}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {!collapsed && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {sorted.map((action, i) => (
            <div
              key={i}
              onClick={() => toggle(i)}
              className={`flex items-start gap-3 px-5 py-3 cursor-pointer transition-colors ${
                done.has(i) ? 'bg-gray-50/60' : 'hover:bg-blue-50/30'
              }`}
            >
              {/* Checkbox */}
              <div className={`mt-0.5 shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                done.has(i) ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
              }`}>
                {done.has(i) && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${done.has(i) ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                  {action.action}
                </p>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${OWNER_COLORS[action.owner] ?? 'bg-gray-100 text-gray-600'}`}>
                    {action.owner}
                  </span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                    action.priority === 'high'   ? 'bg-red-50 text-red-600 border-red-200' :
                    action.priority === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                                   'bg-gray-50 text-gray-500 border-gray-200'
                  }`}>
                    {action.priority}
                  </span>
                  <span className="text-[10px] text-gray-400">{action.section}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
