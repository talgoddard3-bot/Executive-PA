import { createClient } from '@supabase/supabase-js'
import { NextResponse, after } from 'next/server'
import { decideDue, weekOfKey, STUCK_AFTER_MS, type WeekBriefState } from '@/lib/schedule'

// Brief scheduler. Vercel Cron calls this (GET) every hour — see vercel.json.
//
// It does not rely on firing at an exact minute. For every enabled schedule it asks:
// "has a scheduled slot already passed this week, and is this week's brief still
// missing?" If so it starts generation. A late, skipped or failed run is therefore
// picked up by the next tick instead of silently losing the week.
//
// Each company is generated in its own /api/briefs/generate invocation (own 300s
// budget). This function stays alive (via `after`) until those calls return, so the
// hand-off can't be dropped when the response is sent — which is what used to happen.
export const maxDuration = 300

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

/** Public base URL of the app. Deployment URLs (*.vercel.app) sit behind Vercel
 *  Authentication, so internal calls must go to the public domain. */
function appBaseUrl(request: Request): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (explicit && /^https?:\/\//.test(explicit) && !/localhost|127\.0\.0\.1/.test(explicit)) {
    return explicit.replace(/\/+$/, '')
  }
  const requestOrigin = new URL(request.url).origin
  if (/localhost|127\.0\.0\.1/.test(requestOrigin)) return requestOrigin
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  return requestOrigin
}

function sameSite(a: URL, b: URL): boolean {
  const strip = (h: string) => h.replace(/^www\./, '')
  return a.protocol === b.protocol && strip(a.hostname) === strip(b.hostname)
}

/** POST with the cron secret, following redirects by hand. A normal fetch drops the
 *  Authorization header when the apex domain redirects to www, which turns the call
 *  into a 401. The secret is only ever re-sent to the same site. */
async function postWithSecret(url: string, body: unknown, secret: string): Promise<Response> {
  const origin = new URL(url)
  let target = origin
  for (let hop = 0; hop < 4; hop++) {
    const res = await fetch(target, {
      method: 'POST',
      redirect: 'manual',
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${secret}` },
      body: JSON.stringify(body),
    })
    if (![301, 302, 303, 307, 308].includes(res.status)) return res
    const location = res.headers.get('location')
    if (!location) return res
    const next = new URL(location, target)
    if (!sameSite(next, origin)) return res
    target = next
  }
  throw new Error('Too many redirects while dispatching brief generation')
}

interface ScheduleRow {
  id: string
  company_id: string
  days: number[]
  hour_utc: number
  enabled: boolean
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Operator overrides (still require the cron secret):
  //   ?company=<id>     only this company
  //   ?force=1          generate now even if no slot has passed yet this week
  //   ?weekOffset=1     with force: back-fill last week instead of this week
  const params = new URL(request.url).searchParams
  const onlyCompany = params.get('company')
  const force = params.get('force') === '1'
  const rawOffset = Number(params.get('weekOffset') ?? 0)
  const weekOffset = force && Number.isInteger(rawOffset) && rawOffset > 0 ? Math.min(rawOffset, 8) : 0

  const now = new Date()
  const weekOf = weekOfKey(new Date(now.getTime() - weekOffset * WEEK_MS))

  let scheduleQuery = supabase
    .from('brief_schedules')
    .select('id, company_id, days, hour_utc, enabled')
    .eq('enabled', true)
  if (onlyCompany) scheduleQuery = scheduleQuery.eq('company_id', onlyCompany)

  const { data: schedules, error: schedErr } = await scheduleQuery
  if (schedErr) {
    console.error('[cron] could not load schedules:', schedErr)
    return NextResponse.json({ error: 'Could not load schedules', detail: schedErr.message }, { status: 500 })
  }
  if (!schedules || schedules.length === 0) {
    return NextResponse.json({ message: 'No active schedules found', dispatched: 0, weekOf })
  }

  // Runs that died mid-generation: mark them failed so they can be retried.
  const stuckCutoff = new Date(now.getTime() - STUCK_AFTER_MS).toISOString()
  await supabase
    .from('briefs')
    .update({ status: 'failed', error: 'Generation did not finish (timed out or crashed)' })
    .eq('status', 'generating')
    .lt('created_at', stuckCutoff)

  const companyIds = (schedules as ScheduleRow[]).map(s => s.company_id)
  const { data: weekBriefs } = await supabase
    .from('briefs')
    .select('company_id, status, created_at, attempts')
    .eq('week_of', weekOf)
    .in('company_id', companyIds)

  const briefByCompany = new Map<string, WeekBriefState>()
  for (const b of weekBriefs ?? []) briefByCompany.set(b.company_id, b)

  const results: { companyId: string; status: string }[] = []
  const toDispatch: ScheduleRow[] = []

  for (const schedule of schedules as ScheduleRow[]) {
    const existing = briefByCompany.get(schedule.company_id) ?? null
    const decision = decideDue(schedule, existing, now, { force })
    if (decision.due) {
      toDispatch.push(schedule)
      results.push({ companyId: schedule.company_id, status: `dispatched (${decision.reason})` })
    } else {
      results.push({ companyId: schedule.company_id, status: `skipped (${decision.reason})` })
    }
  }

  if (toDispatch.length > 0) {
    const generateUrl = `${appBaseUrl(request)}/api/briefs/generate`

    // Keep this invocation alive until every generate call has answered.
    after(async () => {
      const outcomes = await Promise.allSettled(
        toDispatch.map(async schedule => {
          const res = await postWithSecret(generateUrl, { scheduleId: schedule.id, weekOffset }, cronSecret)
          const text = await res.text().catch(() => '')
          return { schedule, status: res.status, ok: res.ok, text: text.slice(0, 300) }
        })
      )

      for (let i = 0; i < outcomes.length; i++) {
        const outcome = outcomes[i]
        const schedule = toDispatch[i]
        const failure =
          outcome.status === 'rejected'
            ? `Could not reach the generator: ${outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason)}`
            : outcome.value.ok
              ? null
              : `Generator answered HTTP ${outcome.value.status}: ${outcome.value.text}`

        if (!failure) {
          console.log('[cron] generated:', schedule.company_id, outcome.status === 'fulfilled' ? outcome.value.text : '')
          continue
        }

        console.error('[cron] generation failed for', schedule.company_id, failure)

        // If the generator never got far enough to record the failure itself
        // (blocked, 401, unreachable…), record it here so it is visible and retried.
        const { data: row } = await supabase
          .from('briefs')
          .select('id')
          .eq('company_id', schedule.company_id)
          .eq('week_of', weekOf)
          .maybeSingle()
        if (!row) {
          const previousAttempts = briefByCompany.get(schedule.company_id)?.attempts ?? 0
          await supabase.from('briefs').insert({
            company_id: schedule.company_id,
            week_of: weekOf,
            status: 'failed',
            attempts: previousAttempts + 1,
            error: failure.slice(0, 500),
          })
        }
      }
    })
  }

  const dispatched = toDispatch.length
  console.log('[cron]', { now: now.toISOString(), weekOf, force, dispatched, results })
  return NextResponse.json({ now: now.toISOString(), weekOf, dispatched, results })
}
