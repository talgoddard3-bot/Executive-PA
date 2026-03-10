'use client'

import { useEffect, useState } from 'react'

const DAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
]

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${String(i).padStart(2, '0')}:00 UTC`,
}))

interface Schedule {
  enabled: boolean
  days: number[]
  hour_utc: number
  recipient_emails: string[]
}

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<Schedule>({ enabled: false, days: [1], hour_utc: 7, recipient_emails: [] })
  const [emailInput, setEmailInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/settings/schedule')
      .then(r => r.json())
      .then(data => {
        setSchedule(data)
        setEmailInput((data.recipient_emails ?? []).join(', '))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function toggleDay(day: number) {
    setSchedule(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day].sort((a, b) => a - b),
    }))
    setSaved(false)
  }

  async function save() {
    setSaving(true)
    setSaved(false)
    const recipient_emails = emailInput
      .split(/[\s,;]+/)
      .map(e => e.trim())
      .filter(e => e.includes('@'))
    try {
      const res = await fetch('/api/settings/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...schedule, recipient_emails }),
      })
      if (res.ok) setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  // Local time equivalent
  const localHour = new Date(Date.UTC(2000, 0, 1, schedule.hour_utc)).toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit',
  })

  const nextRuns = schedule.enabled && schedule.days.length > 0
    ? schedule.days.map(d => DAYS.find(x => x.value === d)?.label).join(', ') + ` at ${HOURS[schedule.hour_utc].label}`
    : null

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-4 bg-gray-100 rounded animate-pulse w-40" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Brief Schedule</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Configure when your weekly intelligence brief is automatically generated.
        </p>
      </div>

      {/* Enable toggle */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Automatic generation</p>
            <p className="text-xs text-gray-400 mt-0.5">
              When enabled, briefs are generated on your chosen schedule.
            </p>
          </div>
          <button
            onClick={() => { setSchedule(prev => ({ ...prev, enabled: !prev.enabled })); setSaved(false) }}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              schedule.enabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              schedule.enabled ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>
      </div>

      {/* Day picker */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
        <div>
          <p className="text-sm font-semibold text-gray-900 mb-3">Days of the week</p>
          <div className="flex gap-2 flex-wrap">
            {DAYS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => toggleDay(value)}
                className={`w-12 h-12 rounded-xl text-sm font-semibold transition-colors ${
                  schedule.days.includes(value)
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {schedule.days.length === 0 && (
            <p className="text-xs text-amber-600 mt-2">Select at least one day.</p>
          )}
        </div>

        {/* Time picker */}
        <div>
          <p className="text-sm font-semibold text-gray-900 mb-2">Generation time</p>
          <div className="flex items-center gap-4">
            <select
              value={schedule.hour_utc}
              onChange={e => { setSchedule(prev => ({ ...prev, hour_utc: Number(e.target.value) })); setSaved(false) }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {HOURS.map(h => (
                <option key={h.value} value={h.value}>{h.label}</option>
              ))}
            </select>
            <span className="text-xs text-gray-400">
              ≈ {localHour} your local time (based on browser timezone)
            </span>
          </div>
        </div>
      </div>

      {/* Next run summary */}
      {nextRuns && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-blue-800">Scheduled runs</p>
            <p className="text-xs text-blue-600 mt-0.5">
              Brief will be automatically generated every <strong>{nextRuns}</strong>.
            </p>
            <p className="text-xs text-blue-400 mt-1">
              Runs are powered by Vercel Cron. The system checks every hour and generates if it matches your schedule.
            </p>
          </div>
        </div>
      )}

      {/* Email recipients */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">Email digest recipients</p>
          <p className="text-xs text-gray-400 mt-0.5">
            When a brief is generated, a digest email is sent to these addresses.
          </p>
        </div>
        <textarea
          value={emailInput}
          onChange={e => { setEmailInput(e.target.value); setSaved(false) }}
          placeholder="ceo@company.com, cfo@company.com"
          rows={3}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder-gray-300"
        />
        <p className="text-xs text-gray-400">Separate multiple addresses with commas.</p>
      </div>

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving || schedule.days.length === 0}
          className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving…' : 'Save Schedule'}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Saved
          </span>
        )}
      </div>

      {/* DB setup note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700 space-y-1">
        <p className="font-semibold">Database setup required</p>
        <p>Run this SQL in Supabase to create the schedule table:</p>
        <pre className="bg-amber-100 rounded p-2 mt-1 overflow-x-auto text-[11px]">{`CREATE TABLE brief_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  days INTEGER[] NOT NULL DEFAULT '{1}',
  hour_utc INTEGER NOT NULL DEFAULT 7,
  recipient_emails TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);`}</pre>
      </div>
    </div>
  )
}
