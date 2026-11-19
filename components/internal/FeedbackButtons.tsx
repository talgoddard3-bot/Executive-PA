'use client'

import { useEffect, useState } from 'react'

interface Props {
  briefId: string
  section: string
  itemIndex: number
  initialRating?: 1 | -1 | null
  initialTag?: string | null
  initialActedOn?: boolean
  compact?: boolean
}

interface FeedbackRow {
  section: string
  item_index: number
  rating: 1 | -1
  tag: string | null
  acted_on?: boolean
  mine?: boolean
}

// One request per brief, shared by every button group on the page, so a reader's
// earlier answers are shown again after a reload instead of looking unsaved.
const feedbackCache = new Map<string, Promise<FeedbackRow[]>>()

function loadFeedback(briefId: string): Promise<FeedbackRow[]> {
  let pending = feedbackCache.get(briefId)
  if (!pending) {
    pending = fetch(`/api/internal/feedback?briefId=${encodeURIComponent(briefId)}`)
      .then(r => (r.ok ? r.json() : []))
      .then(rows => (Array.isArray(rows) ? (rows as FeedbackRow[]) : []))
      .catch(() => [])
    feedbackCache.set(briefId, pending)
  }
  return pending
}

export default function FeedbackButtons({
  briefId,
  section,
  itemIndex,
  initialRating = null,
  initialTag = null,
  initialActedOn = false,
  compact = false,
}: Props) {
  const [rating, setRating] = useState<1 | -1 | null>(initialRating)
  const [actedOn, setActedOn] = useState(initialActedOn)
  const [tag, setTag] = useState(initialTag ?? '')
  const [showTag, setShowTag] = useState(false)
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    loadFeedback(briefId).then(rows => {
      if (!alive) return
      const mine = rows.find(r => r.mine && r.section === section && r.item_index === itemIndex)
      if (!mine) return
      setRating(mine.rating)
      setActedOn(!!mine.acted_on)
      setTag(mine.tag ?? '')
    })
    return () => { alive = false }
  }, [briefId, section, itemIndex])

  async function save(body: Record<string, unknown>, method: 'POST' | 'DELETE' = 'POST'): Promise<boolean> {
    setSaving(true)
    setFailed(false)
    try {
      const res = await fetch('/api/internal/feedback', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ briefId, section, itemIndex, ...body }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      feedbackCache.delete(briefId)   // next mount re-reads the saved state
      return true
    } catch {
      setFailed(true)
      return false
    } finally {
      setSaving(false)
    }
  }

  async function submit(newRating: 1 | -1) {
    if (rating === newRating && !actedOn) {
      // clicking the active button again clears the answer
      if (await save({}, 'DELETE')) { setRating(null); setTag(''); setShowTag(false) }
      return
    }
    if (await save({ rating: newRating, tag: tag || null, actedOn: false })) {
      setRating(newRating)
      setActedOn(false)
      if (newRating === -1) setShowTag(false)
    }
  }

  async function toggleActedOn() {
    const next = !actedOn
    // "Acted on" implies the insight was useful.
    if (await save({ rating: 1, tag: tag || null, actedOn: next })) {
      setRating(1)
      setActedOn(next)
      if (next) setShowTag(true)
    }
  }

  async function saveTag() {
    if (!rating) return
    if (await save({ rating, tag: tag.trim() || null, actedOn })) setShowTag(false)
  }

  const size = compact ? 'h-6 px-1.5 text-[11px]' : 'h-7 px-2 text-xs'
  const icon = compact ? 'w-3 h-3' : 'w-3.5 h-3.5'
  const idle = 'bg-white border-gray-200 text-gray-400'

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-1">
        {/* Useful */}
        <button
          onClick={() => submit(1)}
          disabled={saving}
          aria-pressed={rating === 1 && !actedOn}
          title="Useful — show more like this"
          className={`inline-flex items-center gap-1 rounded-md border font-medium transition-colors disabled:opacity-50 ${size} ${
            rating === 1 && !actedOn
              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
              : `${idle} hover:border-emerald-300 hover:text-emerald-600`
          }`}
        >
          <svg className={icon} fill={rating === 1 && !actedOn ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
          {!compact && <span>Useful</span>}
        </button>

        {/* Acted on — the signal that an insight changed a decision */}
        <button
          onClick={toggleActedOn}
          disabled={saving}
          aria-pressed={actedOn}
          title="We acted on this — it led to a decision or a concrete step"
          className={`inline-flex items-center gap-1 rounded-md border font-medium transition-colors disabled:opacity-50 ${size} ${
            actedOn
              ? 'bg-blue-600 border-blue-600 text-white'
              : `${idle} hover:border-blue-300 hover:text-blue-600`
          }`}
        >
          <svg className={icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Acted on</span>
        </button>

        {/* Not relevant */}
        <button
          onClick={() => submit(-1)}
          disabled={saving}
          aria-pressed={rating === -1}
          title="Not relevant — show less like this"
          className={`inline-flex items-center gap-1 rounded-md border font-medium transition-colors disabled:opacity-50 ${size} ${
            rating === -1
              ? 'bg-red-50 border-red-300 text-red-600'
              : `${idle} hover:border-red-200 hover:text-red-500`
          }`}
        >
          <svg className={icon} fill={rating === -1 ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
          </svg>
          {!compact && <span>Not relevant</span>}
        </button>

        {/* Note trigger */}
        {rating === 1 && !showTag && (
          <button
            onClick={() => setShowTag(true)}
            className={`inline-flex items-center gap-1 rounded-md border border-dashed border-gray-300 text-gray-400 hover:border-blue-300 hover:text-blue-600 transition-colors ${size}`}
            title={actedOn ? 'Say what you did' : 'Add a note for your team'}
          >
            <svg className={icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            {!compact && <span>{tag ? 'Edit note' : 'Add note'}</span>}
          </button>
        )}

        {rating === 1 && !showTag && tag && (
          <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 rounded px-1.5 py-0.5 max-w-[160px] truncate">
            {tag}
          </span>
        )}

        {failed && <span className="text-[10px] text-red-600">Not saved. Try again.</span>}
      </div>

      {/* Inline note input */}
      {showTag && (
        <div className="flex items-center gap-1.5 ml-0.5">
          <input
            autoFocus
            type="text"
            value={tag}
            onChange={e => setTag(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') saveTag()
              if (e.key === 'Escape') setShowTag(false)
            }}
            placeholder={actedOn ? 'What did you do? e.g. "Called supplier, moved order"' : 'e.g. "CEO must see this"'}
            maxLength={120}
            className="flex-1 text-xs border border-blue-300 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-blue-400 bg-white text-gray-900"
          />
          <button
            onClick={saveTag}
            disabled={saving}
            className="text-xs bg-blue-600 text-white px-2 py-1 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Save
          </button>
          <button
            onClick={() => setShowTag(false)}
            aria-label="Close note"
            className="text-xs text-gray-400 hover:text-gray-600 px-1"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
