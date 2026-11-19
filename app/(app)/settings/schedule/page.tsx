'use client'

import { useEffect, useState } from 'react'
import { localScheduleToUtc, utcScheduleToLocal } from '@/lib/schedule'

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
  label: `${String(i).padStart(2, '0')}:00`,
}))

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// The page works in the viewer's own time ("Sunday at 21:00"). The server stores
// UTC weekdays + a UTC hour, so values are converted when loading and saving.
interface Schedule {
  enabled: boolean
  days: number[]        // local weekdays, 0 = Sunday
  hour: number          // local hour
  recipient_emails: string[]
}

function utcOffsetMinutes(): number {
  return -new Date().getTimezoneOffset()
}

function timeZoneLabel(): string {
  const offset = utcOffsetMinutes()
  const sign = offset >= 0 ? '+' : '-'
  const abs = Math.abs(offset)
  const hh = String(Math.floor(abs / 60)).padStart(2, '0')
  const mm = String(abs % 60).padStart(2, '0')
  let zone = ''
  try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '' } catch { /* ignore */ }
  return `${zone ? zone.replace(/_/g, ' ') + ', ' : ''}UTC${sign}${hh}:${mm}`
}

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<Schedule>({ enabled: false, days: [1], hour: 7, recipient_emails: [] })
  const [emailInput, setEmailInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    fetch('/api/settings/schedule')
      .then(r => r.json())
      .then(data => {
        const local = utcScheduleToLocal(data.days ?? [1], data.hour_utc ?? 7, utcOffsetMinutes())
        setSchedule({
          enabled: !!data.enabled,
          days: local.days,
          hour: local.hour,
          recipient_emails: data.recipient_emails ?? [],
        })
        setEmailInput((data.recipient_emails ?? []).join(', '))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // One brief is produced per week, so the schedule is a single day + time.
  function chooseDay(day: number) {
    setSchedule(prev => ({ ...prev, days: [day] }))
    setSaved(false)
  }

  async function save() {
    setSaving(true)
    setSaved(false)
    setSaveError('')
    const recipient_emails = emailInput
      .split(/[\s,;]+/)
      .map(e => e.trim())
      .filter(e => e.includes('@'))
    const utc = localScheduleToUtc(schedule.days, schedule.hour, utcOffsetMinutes())
    try {
      const res = await fetch('/api/settings/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: schedule.enabled, days: utc.days, hour_utc: utc.hour_utc, recipient_emails }),
      })
      if (res.ok) {
        setSaved(true)
      } else {
        const data = await res.json().catch(() => ({}))
        setSaveError((data.error as string) ?? 'Could not save the schedule. Please try again.')
      }
    } catch {
      setSaveError('Network error. The schedule was not saved.')
    } finally {
      setSaving(false)
    }
  }

  const zoneLabel = timeZoneLabel()

  // Listed Monday-first to match the buttons.
  const nextRuns = schedule.enabled && schedule.days.length > 0
    ? DAYS.filter(d => schedule.days.includes(d.value)).map(d => DAY_NAMES[d.value]).join(', ') + ` at ${HOURS[schedule.hour].label}`
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
          Choose the day and time your weekly intelligence brief is generated and emailed.
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
          <p className="text-sm font-semibold text-gray-900 mb-3">Day of the week</p>
          <div className="flex gap-2 flex-wrap">
            {DAYS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => chooseDay(value)}
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
            <p className="text-xs text-amber-600 mt-2">Select a day.</p>
          )}
        </div>

        {/* Time picker */}
        <div>
          <p className="text-sm font-semibold text-gray-900 mb-2">Generation time</p>
          <div className="flex items-center gap-4">
            <select
              value={schedule.hour}
              onChange={e => { setSchedule(prev => ({ ...prev, hour: Number(e.target.value) })); setSaved(false) }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {HOURS.map(h => (
                <option key={h.value} value={h.value}>{h.label}</option>
              ))}
            </select>
            <span className="text-xs text-gray-400">
              Your local time ({zoneLabel})
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
              Your brief is generated every <strong>{nextRuns}</strong> ({zoneLabel}).
            </p>
            <p className="text-xs text-blue-400 mt-1">
              Generation starts within about an hour of this time and takes a few minutes. One brief is produced per week; if a run fails it is retried automatically.
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
        {saveError && (
          <span className="text-sm text-red-600 font-medium">{saveError}</span>
        )}
      </div>

    </div>
  )
}
