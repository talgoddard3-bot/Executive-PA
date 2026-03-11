'use client'

import { useState } from 'react'

interface Props {
  briefId: string
  section: string
  itemIndex: number
  initialRating?: 1 | -1 | null
  initialTag?: string | null
  compact?: boolean
}

export default function FeedbackButtons({
  briefId,
  section,
  itemIndex,
  initialRating = null,
  initialTag = null,
  compact = false,
}: Props) {
  const [rating, setRating] = useState<1 | -1 | null>(initialRating)
  const [tag, setTag] = useState(initialTag ?? '')
  const [showTag, setShowTag] = useState(false)
  const [saving, setSaving] = useState(false)

  async function submit(newRating: 1 | -1) {
    const toggling = rating === newRating  // clicking same button again → remove
    setSaving(true)
    try {
      if (toggling) {
        await fetch('/api/internal/feedback', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ briefId, section, itemIndex }),
        })
        setRating(null)
        setTag('')
        setShowTag(false)
      } else {
        await fetch('/api/internal/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ briefId, section, itemIndex, rating: newRating, tag: tag || null }),
        })
        setRating(newRating)
        if (newRating === 1) setShowTag(true)
      }
    } catch {
      // silent fail — non-critical
    } finally {
      setSaving(false)
    }
  }

  async function saveTag() {
    if (!rating) return
    setSaving(true)
    try {
      await fetch('/api/internal/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ briefId, section, itemIndex, rating, tag: tag.trim() || null }),
      })
      setShowTag(false)
    } catch {
      // silent fail
    } finally {
      setSaving(false)
    }
  }

  const size = compact ? 'h-6 px-1.5 text-[11px]' : 'h-7 px-2 text-xs'

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        {/* Thumbs up */}
        <button
          onClick={() => submit(1)}
          disabled={saving}
          title="Helpful — boost this topic in future briefs"
          className={`inline-flex items-center gap-1 rounded-md border font-medium transition-colors disabled:opacity-50 ${size} ${
            rating === 1
              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
              : 'bg-white border-gray-200 text-gray-400 hover:border-emerald-300 hover:text-emerald-600'
          }`}
        >
          <svg className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill={rating === 1 ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
          {!compact && <span>Helpful</span>}
        </button>

        {/* Thumbs down */}
        <button
          onClick={() => submit(-1)}
          disabled={saving}
          title="Not helpful — deprioritise this topic"
          className={`inline-flex items-center gap-1 rounded-md border font-medium transition-colors disabled:opacity-50 ${size} ${
            rating === -1
              ? 'bg-red-50 border-red-300 text-red-600'
              : 'bg-white border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-500'
          }`}
        >
          <svg className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill={rating === -1 ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
          </svg>
          {!compact && <span>Not helpful</span>}
        </button>

        {/* Tag / label trigger */}
        {rating === 1 && !showTag && (
          <button
            onClick={() => setShowTag(true)}
            className={`inline-flex items-center gap-1 rounded-md border border-dashed border-gray-300 text-gray-400 hover:border-blue-300 hover:text-blue-600 transition-colors ${size}`}
            title="Add a note for your team"
          >
            <svg className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            {!compact && <span>{tag ? tag : 'Add note'}</span>}
          </button>
        )}

        {/* Show existing tag badge */}
        {rating === 1 && !showTag && tag && (
          <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 rounded px-1.5 py-0.5 max-w-[160px] truncate">
            {tag}
          </span>
        )}
      </div>

      {/* Inline tag input */}
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
            placeholder='e.g. "CEO must see this"'
            maxLength={120}
            className="flex-1 text-xs border border-blue-300 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-blue-400 bg-white"
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
            className="text-xs text-gray-400 hover:text-gray-600 px-1"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
