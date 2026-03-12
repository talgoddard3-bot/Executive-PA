'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

interface Message {
  role: 'user' | 'assistant'
  content: string
  pending?: boolean
}

// Extract briefId from pathname like /briefs/[id] or /briefs/[id]/full
function extractBriefId(pathname: string): string | undefined {
  const m = pathname.match(/^\/briefs\/([^/]+)/)
  return m ? m[1] : undefined
}

// ── Page-context action suggestions ───────────────────────────────────────────
const SUGGESTED_QUESTIONS: Record<string, string[]> = {
  '/dashboard': [
    'What is the single most urgent action this week?',
    'What trend is getting worse across recent briefs?',
  ],
  '/briefs': [
    'What is the top risk across all recent briefs?',
    'Which competitor has moved most aggressively?',
  ],
  '/company-news': [
    'How should we respond to any negative coverage?',
    'What coverage should we amplify this week?',
  ],
  default: [
    'What should I act on first this week?',
    'What is the highest-threat competitor move?',
    'Which decision is most time-sensitive?',
    'What is the CFO\'s most pressing issue?',
  ],
}

const BRIEF_ARTICLE_SUGGESTIONS = [
  'What are my concrete options to act on this?',
  'What is the risk of doing nothing here?',
  'Who internally should own this — and by when?',
  'What\'s the upside if we move fast on this?',
]

const BRIEF_OVERVIEW_SUGGESTIONS = [
  'What should I act on first this week?',
  'What is the highest-severity risk and the mitigation?',
  'Which competitor move requires an immediate response?',
  'What decisions are most time-sensitive?',
]

function getSuggestions(pathname: string): string[] {
  if (/^\/briefs\/[^/]+\/article\//.test(pathname)) return BRIEF_ARTICLE_SUGGESTIONS
  if (/^\/briefs\/[^/]+/.test(pathname)) return BRIEF_OVERVIEW_SUGGESTIONS
  for (const key of Object.keys(SUGGESTED_QUESTIONS)) {
    if (pathname.startsWith(key) && key !== '/briefs') return SUGGESTED_QUESTIONS[key]
  }
  return SUGGESTED_QUESTIONS.default
}

// ── Markdown renderer ─────────────────────────────────────────────────────────

function inlineBold(text: string): React.ReactNode {
  if (!text.includes('**')) return text
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} className="font-semibold text-blue-800 dark:text-blue-300">{part}</strong>
      : part
  )
}

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  const listItems: string[] = []
  let key = 0

  function flushList() {
    if (listItems.length === 0) return
    elements.push(
      <ul key={key++} className="space-y-1 my-1.5 ml-0.5">
        {listItems.map((item, i) => (
          <li key={i} className="flex gap-1.5 text-xs text-gray-700 dark:text-gray-300 leading-snug">
            <span className="text-blue-500 shrink-0 font-bold mt-0.5">·</span>
            <span>{inlineBold(item)}</span>
          </li>
        ))}
      </ul>
    )
    listItems.length = 0
  }

  for (const raw of lines) {
    const line = raw.trimEnd()

    if (line.startsWith('## ')) {
      flushList()
      elements.push(
        <p key={key++} className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-3 mb-1">
          {line.slice(3)}
        </p>
      )
    } else if (line.startsWith('### ')) {
      flushList()
      elements.push(
        <p key={key++} className="text-xs font-semibold text-blue-700 dark:text-blue-400 mt-2 mb-0.5">
          {inlineBold(line.slice(4))}
        </p>
      )
    } else if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
      // Standalone bold line — treat as subheading
      flushList()
      elements.push(
        <p key={key++} className="text-xs font-semibold text-gray-800 dark:text-gray-100 mt-2 mb-0.5">
          {inlineBold(line)}
        </p>
      )
    } else if (line === '---' || line === '***') {
      flushList()
      elements.push(<hr key={key++} className="border-gray-200 dark:border-white/10 my-2" />)
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      listItems.push(line.slice(2))
    } else if (/^\d+\.\s/.test(line)) {
      flushList()
      const num = line.match(/^(\d+)\.\s/)?.[1] ?? ''
      const body = line.replace(/^\d+\.\s/, '')
      elements.push(
        <div key={key++} className="flex gap-1.5 text-xs text-gray-700 dark:text-gray-300 leading-snug my-0.5">
          <span className="text-blue-600 dark:text-blue-400 font-bold shrink-0 w-4">{num}.</span>
          <span>{inlineBold(body)}</span>
        </div>
      )
    } else if (line.trim() === '') {
      flushList()
      if (elements.length > 0) elements.push(<div key={key++} className="h-1" />)
    } else {
      flushList()
      elements.push(
        <p key={key++} className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
          {inlineBold(line)}
        </p>
      )
    }
  }
  flushList()
  return <>{elements}</>
}

function TypingIndicator() {
  return (
    <div className="flex gap-1 items-center px-1 py-1">
      {[0, 1, 2].map(i => (
        <span key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  )
}

export default function AIChatbot() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const briefId = extractBriefId(pathname)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  useEffect(() => {
    setMessages([])
  }, [briefId])

  async function send(text?: string) {
    const content = (text ?? input).trim()
    if (!content || streaming) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content }])
    setStreaming(true)
    setMessages(prev => [...prev, { role: 'assistant', content: '', pending: true }])

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, briefId }),
      })

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }))
        setMessages(prev => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', content: err.error ?? 'Something went wrong.' }
          return next
        })
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        const final = accumulated
        setMessages(prev => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', content: final, pending: false }
          return next
        })
      }
    } catch {
      setMessages(prev => {
        const next = [...prev]
        next[next.length - 1] = { role: 'assistant', content: 'Connection error. Please try again.' }
        return next
      })
    } finally {
      setStreaming(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const suggestions = getSuggestions(pathname)
  const isEmpty = messages.length === 0

  // Panel size
  const panelW = expanded ? 'md:w-[580px]' : 'md:w-[390px]'
  const panelH = expanded ? '620px' : '480px'

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`fixed bottom-[72px] right-4 md:bottom-6 md:right-6 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
          open ? 'bg-gray-900 rotate-90' : 'bg-gray-900 hover:bg-gray-700'
        }`}
        title="Ask AI"
        aria-label="Toggle AI assistant"
      >
        {open ? (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className={`fixed z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 flex flex-col overflow-hidden animate-fadeIn
            inset-x-3 bottom-[140px] md:inset-x-auto md:bottom-[80px] md:right-6 ${panelW} transition-all duration-200`}
          style={{ height: panelH }}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 bg-gray-900 shrink-0">
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-none">Intelligence Assistant</p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {briefId ? 'Context: this brief' : 'Context: latest brief'} · Claude Haiku
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className="text-[10px] text-gray-400 hover:text-white transition-colors"
                >
                  Clear
                </button>
              )}
              {/* Expand/collapse toggle — desktop only */}
              <button
                onClick={() => setExpanded(e => !e)}
                className="hidden md:flex text-gray-400 hover:text-white transition-colors p-0.5"
                title={expanded ? 'Compact view' : 'Expand view'}
              >
                {expanded ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9L4 4m0 0h5m-5 0v5M15 9l5-5m0 0h-5m5 0v5M9 15l-5 5m0 0h5m-5 0v-5M15 15l5 5m0 0h-5m5 0v-5" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {isEmpty ? (
              <div className="space-y-3">
                <p className="text-xs text-gray-400 text-center pt-2">
                  Ask me anything about this week&apos;s intelligence data.
                </p>
                <div className="space-y-1.5">
                  {suggestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => send(q)}
                      className="w-full text-left text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300 border border-gray-200 dark:border-white/10 hover:border-blue-200 rounded-lg px-3 py-2 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'user' ? (
                    <div className="max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed bg-gray-900 text-white rounded-br-sm">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="max-w-[95%] rounded-xl px-3 py-2.5 bg-gray-50 dark:bg-gray-700/60 border border-gray-100 dark:border-white/10 rounded-bl-sm">
                      {msg.pending ? <TypingIndicator /> : renderMarkdown(msg.content)}
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-gray-100 dark:border-white/10 shrink-0">
            <div className="flex items-end gap-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 focus-within:border-gray-400 dark:focus-within:border-white/30 transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about risks, options, decisions…"
                rows={1}
                disabled={streaming}
                className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 resize-none outline-none min-h-[20px] max-h-[80px] disabled:opacity-60"
                style={{ lineHeight: '20px' }}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || streaming}
                className="shrink-0 w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {streaming ? (
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-[9px] text-gray-400 text-center mt-1.5">Enter to send · Shift+Enter for newline</p>
          </div>
        </div>
      )}
    </>
  )
}
