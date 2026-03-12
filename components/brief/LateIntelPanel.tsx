'use client'

import { useState } from 'react'

interface LateNote {
  category: string
  content: string
  created_at: string
}

interface LateDoc {
  title: string
  description: string
  processed_content: string | null
  file_type: string
  created_at: string
}

interface Props {
  briefId: string
  notes: LateNote[]
  docs: LateDoc[]
  existingPatch: string | null
  patchSignalCount: number
}

const CATEGORY_COLORS: Record<string, string> = {
  'Sales Signal':   'bg-blue-50 text-blue-700',
  'Customer Intel': 'bg-violet-50 text-violet-700',
  'Risk Flag':      'bg-red-50 text-red-700',
  'Opportunity':    'bg-emerald-50 text-emerald-700',
  'General':        'bg-gray-100 text-gray-600',
}

export default function LateIntelPanel({ briefId, notes, docs, existingPatch, patchSignalCount }: Props) {
  const [patch, setPatch]             = useState<string | null>(existingPatch)
  const [signalCount, setSignalCount] = useState(patchSignalCount)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [expanded, setExpanded]       = useState(!!existingPatch)

  const totalSignals = notes.length + docs.length

  async function consolidate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/internal/consolidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ briefId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed'); return }
      setPatch(data.summary)
      setSignalCount(data.signal_count)
      setExpanded(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-amber-50 rounded-xl border border-amber-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-amber-200">
        <div className="flex items-center gap-2">
          <span className="text-amber-600 text-sm">⚡</span>
          <p className="text-sm font-semibold text-amber-900">Late Intelligence</p>
          <span className="text-xs font-medium bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
            {totalSignals} signal{totalSignals !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {patch && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-xs text-amber-700 hover:text-amber-900 transition-colors"
            >
              {expanded ? 'Hide analysis' : 'Show analysis'}
            </button>
          )}
          <button
            onClick={consolidate}
            disabled={loading}
            className="text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Analysing…' : patch ? 'Re-consolidate' : 'Consolidate'}
          </button>
        </div>
      </div>

      {/* Signals list */}
      <div className="px-5 py-3 space-y-2">
        {notes.map((n, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 mt-0.5 ${CATEGORY_COLORS[n.category] ?? 'bg-gray-100 text-gray-600'}`}>
              {n.category}
            </span>
            <p className="text-xs text-amber-900 leading-relaxed">{n.content}</p>
          </div>
        ))}
        {docs.map((d, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded shrink-0 mt-0.5 uppercase">
              {d.file_type}
            </span>
            <div>
              <p className="text-xs font-semibold text-amber-900">{d.title}</p>
              {(d.processed_content || d.description) && (
                <p className="text-xs text-amber-700 mt-0.5 leading-relaxed line-clamp-2">
                  {d.processed_content || d.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="px-5 pb-3">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* AI consolidation result */}
      {patch && expanded && (
        <div className="border-t border-amber-200 px-5 py-4 bg-white/60">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-2">
            AI Consolidation · {signalCount} signal{signalCount !== 1 ? 's' : ''}
          </p>
          <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{patch}</div>
        </div>
      )}
    </div>
  )
}
