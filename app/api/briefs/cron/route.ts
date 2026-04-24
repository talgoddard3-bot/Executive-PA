import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Vercel cron invokes GET. Returns immediately after dispatching — synthesis runs in generate route.
export const maxDuration = 60


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

  const { data: schedules } = await supabase
    .from('brief_schedules')
    .select('id, company_id, days, hour_utc, enabled')
    .eq('enabled', true)

  if (!schedules || schedules.length === 0) {
    return NextResponse.json({ message: 'No active schedules found', dispatched: 0 })
  }

  const now = new Date()
  const currentDayUTC  = now.getUTCDay()
  const currentHourUTC = now.getUTCHours()

  // Clean up briefs stuck in 'generating' for more than 10 minutes
  const stuckCutoff = new Date(now.getTime() - 10 * 60 * 1000).toISOString()
  await supabase
    .from('briefs')
    .update({ status: 'failed' })
    .eq('status', 'generating')
    .lt('created_at', stuckCutoff)

  const results: { companyId: string; status: string }[] = []
  const generateUrl = new URL('/api/briefs/generate', request.url).toString()

  for (const schedule of schedules) {
    const shouldRun =
      Array.isArray(schedule.days) &&
      schedule.days.includes(currentDayUTC) &&
      Math.abs(currentHourUTC - schedule.hour_utc) <= 1

    if (!shouldRun) {
      results.push({ companyId: schedule.company_id, status: 'skipped' })
      continue
    }

    // Fire and forget — each company gets its own 300s serverless invocation
    fetch(generateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${cronSecret}`,
      },
      body: JSON.stringify({ scheduleId: schedule.id }),
    }).catch(err => console.error('[cron] dispatch failed for', schedule.company_id, err))

    results.push({ companyId: schedule.company_id, status: 'dispatched' })
  }

  const dispatched = results.filter(r => r.status === 'dispatched').length
  console.log('[cron] dispatched', dispatched, 'brief generations:', results)
  return NextResponse.json({ dispatched, results })
}
