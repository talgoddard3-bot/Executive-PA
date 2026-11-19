// Shared scheduling helpers for weekly briefs.
//
// A brief belongs to a week that runs Monday 00:00 UTC → Sunday 23:59 UTC and is
// keyed by that Monday's date (`week_of`). A schedule is a set of UTC weekdays
// (0 = Sunday … 6 = Saturday) plus a UTC hour. The scheduler does not need to fire
// at the exact minute: it asks "has a scheduled slot already passed this week, and
// is this week's brief still missing?" — so a late, retried or skipped cron run
// catches up on its own instead of silently losing the week.

const DAY_MS = 24 * 60 * 60 * 1000

/** Monday 00:00 UTC of the week containing `date`. */
export function mondayOfWeekUTC(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const dow = d.getUTCDay()                 // 0 = Sunday
  const daysSinceMonday = (dow + 6) % 7     // Monday → 0, Sunday → 6
  return new Date(d.getTime() - daysSinceMonday * DAY_MS)
}

/** `week_of` key (YYYY-MM-DD of the Monday) for the week containing `date`. */
export function weekOfKey(date: Date): string {
  return mondayOfWeekUTC(date).toISOString().split('T')[0]
}

/**
 * The most recent scheduled slot of the current week that is at or before `now`,
 * or null when no slot of this week has come round yet.
 */
export function latestSlotThisWeek(days: number[], hourUtc: number, now: Date): Date | null {
  if (!Array.isArray(days) || days.length === 0) return null
  const hour = Number.isFinite(hourUtc) ? Math.min(23, Math.max(0, Math.trunc(hourUtc))) : 7
  const monday = mondayOfWeekUTC(now).getTime()

  let latest: Date | null = null
  for (const day of days) {
    if (!Number.isInteger(day) || day < 0 || day > 6) continue
    const offsetDays = (day + 6) % 7
    const slot = new Date(monday + offsetDays * DAY_MS + hour * 60 * 60 * 1000)
    if (slot.getTime() <= now.getTime() && (!latest || slot.getTime() > latest.getTime())) {
      latest = slot
    }
  }
  return latest
}

/** How many times the scheduler retries a failed brief before waiting for next week. */
export const MAX_BRIEF_ATTEMPTS = 3

/** A 'generating' row older than this is treated as a crashed run. */
export const STUCK_AFTER_MS = 12 * 60 * 1000

export type DueDecision =
  | { due: true; reason: 'missing' | 'retry-failed' | 'retry-stuck' }
  | { due: false; reason: 'not-yet' | 'complete' | 'in-progress' | 'gave-up' }

export interface WeekBriefState {
  status: string
  created_at: string
  attempts?: number | null
}

/** Decide whether a schedule needs a brief generated right now. */
export function decideDue(
  schedule: { days: number[]; hour_utc: number },
  thisWeeksBrief: WeekBriefState | null,
  now: Date,
  opts: { force?: boolean } = {},
): DueDecision {
  if (!opts.force && !latestSlotThisWeek(schedule.days, schedule.hour_utc, now)) return { due: false, reason: 'not-yet' }
  if (!thisWeeksBrief) return { due: true, reason: 'missing' }
  if (thisWeeksBrief.status === 'complete') return { due: false, reason: 'complete' }

  const ageMs = now.getTime() - new Date(thisWeeksBrief.created_at).getTime()
  // A forced (operator) run is allowed to retry past the automatic limit.
  const attempts = opts.force ? 0 : thisWeeksBrief.attempts ?? 0

  if (thisWeeksBrief.status === 'generating' || thisWeeksBrief.status === 'pending') {
    if (ageMs < STUCK_AFTER_MS) return { due: false, reason: 'in-progress' }
    return attempts >= MAX_BRIEF_ATTEMPTS ? { due: false, reason: 'gave-up' } : { due: true, reason: 'retry-stuck' }
  }

  // failed
  return attempts >= MAX_BRIEF_ATTEMPTS ? { due: false, reason: 'gave-up' } : { due: true, reason: 'retry-failed' }
}

// ── Local-time ⇄ UTC conversion for the schedule settings page ──────────────
// The database stores UTC weekdays + a UTC hour. People think in their own time
// ("Sunday night"), so the UI converts using the browser's UTC offset.

function mod(n: number, m: number): number {
  return ((n % m) + m) % m
}

// Half-hour time zones (India, Newfoundland…) can't be stored exactly in a whole
// UTC hour, so local → UTC rounds down and UTC → local rounds up. That keeps a
// save-then-reload round trip stable on the hour the person picked.

/** Convert UTC weekdays + hour into the viewer's local weekdays + hour. */
export function utcScheduleToLocal(daysUtc: number[], hourUtc: number, offsetMinutes: number): { days: number[]; hour: number } {
  const totalHours = Math.ceil((hourUtc * 60 + offsetMinutes) / 60)
  const shift = Math.floor(totalHours / 24)
  const days = [...new Set(daysUtc.map(d => mod(d + shift, 7)))].sort((a, b) => a - b)
  return { days, hour: mod(totalHours, 24) }
}

/** Convert the viewer's local weekdays + hour into UTC weekdays + hour. */
export function localScheduleToUtc(daysLocal: number[], hourLocal: number, offsetMinutes: number): { days: number[]; hour_utc: number } {
  const totalHours = Math.floor((hourLocal * 60 - offsetMinutes) / 60)
  const shift = Math.floor(totalHours / 24)
  const days = [...new Set(daysLocal.map(d => mod(d + shift, 7)))].sort((a, b) => a - b)
  return { days, hour_utc: mod(totalHours, 24) }
}
