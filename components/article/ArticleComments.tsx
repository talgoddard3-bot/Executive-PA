'use client'

import { useState, useEffect, useRef } from 'react'

interface Comment {
  id: string
  user_id: string
  author_name: string
  body: string
  created_at: string
}

interface TeamMember {
  user_id: string
  full_name: string
}

interface Props {
  companyId: string
  briefId: string
  section: string
  itemIndex: number
  headline: string
  teamMembers: TeamMember[]
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function renderBody(text: string) {
  // Replace @[Name](id) with styled mention span
  const parts = text.split(/(@\[[^\]]+\]\([^)]+\))/g)
  return parts.map((part, i) => {
    const m = part.match(/^@\[([^\]]+)\]\(([^)]+)\)$/)
    if (m) {
      return <span key={i} className="font-semibold text-blue-600">@{m[1]}</span>
    }
    return <span key={i}>{part}</span>
  })
}

export default function ArticleComments({ companyId, briefId, section, itemIndex, headline, teamMembers }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showMentions, setShowMentions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionStart, setMentionStart] = useState(-1)
  const [mentionMap, setMentionMap] = useState<Record<string, string>>({})
  const textRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/comments?brief_id=${briefId}&section=${section}&item_index=${itemIndex}&company_id=${companyId}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setComments(d) })
      .finally(() => setLoading(false))
  }, [briefId, section, itemIndex, companyId])

  const filtered = teamMembers.filter(m =>
    mentionQuery === '' || m.full_name.toLowerCase().includes(mentionQuery.toLowerCase())
  )

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    setText(val)
    const cursor = e.target.selectionStart ?? val.length
    // Find last @ before cursor
    const slice = val.slice(0, cursor)
    const atIdx = slice.lastIndexOf('@')
    if (atIdx !== -1 && !slice.slice(atIdx + 1).includes(' ')) {
      setMentionStart(atIdx)
      setMentionQuery(slice.slice(atIdx + 1))
      setShowMentions(true)
    } else {
      setShowMentions(false)
    }
  }

  function insertMention(member: TeamMember) {
    if (mentionStart === -1) return
    const before = text.slice(0, mentionStart)
    const after = text.slice(mentionStart + 1 + mentionQuery.length)
    setText(before + `@${member.full_name} ` + after)
    setMentionMap(prev => ({ ...prev, [member.full_name]: member.user_id }))
    setShowMentions(false)
    textRef.current?.focus()
  }

  function encodeMentions(raw: string): string {
    let result = raw
    for (const [name, id] of Object.entries(mentionMap)) {
      result = result.replace(
        new RegExp(`@${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'),
        `@[${name}](${id})`
      )
    }
    return result
  }

  async function submit() {
    if (!text.trim()) return
    setSubmitting(true)
    const encoded = encodeMentions(text)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: companyId, brief_id: briefId, section, item_index: itemIndex, text: encoded, headline }),
      })
      const data = await res.json()
      if (data.comment) {
        setComments(prev => [...prev, { ...data.comment, author_name: 'You' }])
        setText('')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Team Comments</p>

      {loading && <p className="text-sm text-gray-400">Loading comments&hellip;</p>}

      {!loading && comments.length === 0 && (
        <p className="text-sm text-gray-400 mb-4">No comments yet. Be the first to add context.</p>
      )}

      {comments.length > 0 && (
        <div className="space-y-3 mb-4">
          {comments.map(c => (
            <div key={c.id} className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                {c.author_name[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold text-gray-700">{c.author_name}</span>
                  <span className="text-[10px] text-gray-400">{formatTime(c.created_at)}</span>
                </div>
                <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{renderBody(c.body)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comment input */}
      <div className="relative">
        <textarea
          ref={textRef}
          value={text}
          onChange={handleInput}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              submit()
            }
          }}
          placeholder="Add a comment… use @ to mention a colleague"
          rows={2}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
        />

        {/* Mention dropdown */}
        {showMentions && filtered.length > 0 && (
          <div className="absolute bottom-full mb-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[180px] max-h-40 overflow-y-auto">
            {filtered.map(m => (
              <button
                key={m.user_id}
                type="button"
                onMouseDown={e => { e.preventDefault(); insertMention(m) }}
                className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                  {m.full_name[0]}
                </div>
                {m.full_name}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-2">
          <p className="text-[10px] text-gray-400">&#8984;+Enter to post</p>
          <button
            onClick={submit}
            disabled={submitting || !text.trim()}
            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Posting\u2026' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  )
}
