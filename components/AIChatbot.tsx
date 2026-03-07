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

const SUGGESTED_QUESTIONS: Record<string, string[]> = {
  '/briefs': ['What are the top risks this week?', 'Summarise competitor activity'],
  '/dashboard': ['What trends stand out?', 'How have risks changed week over week?'],
  '/company-news': ['How should we respond to negative coverage?', 'What coverage should we amplify?'],
  '/profile': ['What does our revenue exposure look like?', 'Who are our key competitors?'],
  default: [
    'What are the biggest risks this week?',
    'What opportunities should we act on?',
    'Summarise this week\'s M&A activity',
    'What decisions are pressing?',
  ],
}

function getSuggestions(pathname: string): string[] {
  const briefMatch = pathname.match(/^\/briefs\/[^/]+$/)
  if (briefMatch) return ['What are the top risks?', 'Any high-urgency opportunities?', 'Summarise competitor moves', 'What decisions need a response?']
  for (const key of Object.keys(SUGGESTED_QUESTIONS)) {
    if (pathname.startsWith(key) && key !== '/briefs') return SUGGESTED_QUESTIONS[key]
  }
  return SUGGESTED_QUESTIONS.default
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
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const briefId = extractBriefId(pathname)

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  // Reset messages when navigating to a different brief
  useEffect(() => {
    setMessages([])
  }, [briefId])

  async function send(text?: string) {
    const content = (text ?? input).trim()
    if (!content || streaming) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content }])
    setStreaming(true)

    // Add pending assistant message
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

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
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
        <div className="fixed bottom-22 right-6 z-50 w-[380px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 flex flex-col overflow-hidden animate-fadeIn"
          style={{ height: '520px', bottom: '80px' }}>

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
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="ml-auto text-[10px] text-gray-400 hover:text-white transition-colors"
              >
                Clear
              </button>
            )}
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
                      className="w-full text-left text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gray-900 text-white rounded-br-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm'
                  }`}>
                    {msg.pending ? <TypingIndicator /> : msg.content}
                  </div>
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
                placeholder="Ask about risks, opportunities, decisions…"
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
