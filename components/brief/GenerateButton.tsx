'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const PHASES = [
  'Analysing your company profile…',
  'Gathering this week\'s market signals…',
  'Processing financial indicators…',
  'Reviewing geopolitical developments…',
  'Scanning competitor intelligence…',
  'Identifying marketing opportunities…',
  'Modelling risk scenarios…',
  'Framing executive decisions…',
  'Finalising your brief…',
]

function GeneratingCard() {
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Cycle through phases every 4 seconds
    const phaseTimer = setInterval(() => {
      setPhaseIndex((i) => (i + 1) % PHASES.length)
    }, 4000)

    // Smooth progress bar — fills to ~85% over ~3 minutes, slows near the end
    const start = Date.now()
    const progressTimer = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000
      // Asymptotic curve: approaches 85% without reaching it (time constant = 120s)
      const p = 85 * (1 - Math.exp(-elapsed / 120))
      setProgress(Math.min(p, 85))
    }, 500)

    return () => {
      clearInterval(phaseTimer)
      clearInterval(progressTimer)
    }
  }, [])

  return (
    <div className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 p-6">
      <div className="flex items-start gap-4">
        {/* Animated AI icon */}
        <div className="shrink-0 mt-0.5">
          <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center">
            <svg className="w-4 h-4 text-white animate-pulse" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
            </svg>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">
            Generating your intelligence brief
          </p>
          {/* Cycling phase message */}
          <p key={phaseIndex} className="text-xs text-gray-500 dark:text-gray-400 animate-fadeIn">
            {PHASES[phaseIndex]}
          </p>

          {/* Progress bar */}
          <div className="mt-4 h-1 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-gray-900 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="mt-2 text-[10px] text-gray-400 uppercase tracking-wide">
            Claude AI · this may take a few minutes
          </p>
        </div>
      </div>
    </div>
  )
}

export default function GenerateButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [existingId, setExistingId] = useState<string | null>(null)
  const router = useRouter()

  async function pollStatus(briefId: string) {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/briefs/${briefId}/status`)
        const data = await res.json()
        if (data.status === 'complete') {
          clearInterval(interval)
          setLoading(false)
          router.refresh()
        } else if (data.status === 'failed') {
          clearInterval(interval)
          setLoading(false)
          setError('Brief generation failed — check the terminal for details')
        }
      } catch {
        // network hiccup — keep polling
      }
    }, 3000)
  }

  async function generate() {
    setLoading(true)
    setError('')
    setExistingId(null)

    let data: Record<string, unknown> = {}
    try {
      const res = await fetch('/api/briefs/generate', { method: 'POST' })
      data = await res.json()

      if (!res.ok) {
        setError((data.error as string) ?? 'Failed to generate brief')
        setLoading(false)
        return
      }
    } catch {
      setError('Network error — check the terminal for details')
      setLoading(false)
      return
    }

    if (data.alreadyExists) {
      setLoading(false)
      setExistingId(data.briefId as string)
      return
    }

    // Synthesis runs in background on server — poll until complete
    pollStatus(data.briefId as string)
  }

  if (loading) {
    return <GeneratingCard />
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={generate}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
      >
        Generate this week&apos;s brief
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {existingId && (
        <p className="text-xs text-gray-500">
          Brief already exists for this week.{' '}
          <Link href={`/briefs/${existingId}`} className="underline underline-offset-2 hover:text-gray-900">
            Read it →
          </Link>
          {' '}or delete it to regenerate.
        </p>
      )}
    </div>
  )
}
