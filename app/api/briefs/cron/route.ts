import { createClient } from '@supabase/supabase-js'
import { synthesizeBrief } from '@/lib/claude/synthesize'
import { sendBriefEmail } from '@/lib/email'
import { NextResponse } from 'next/server'
import type { Company, CompanyProfile } from '@/lib/types'

// Vercel cron invokes GET. Protect with CRON_SECRET.
export const maxDuration = 120

function getMondayOfWeek(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

export async function GET(request: Request) {
  // Verify the request is from Vercel cron or an authorised caller
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch all companies that have a schedule set (or all companies if no schedule table yet)
  const { data: schedules } = await supabase
    .from('brief_schedules')
    .select('*, companies(*,  company_profiles(*))')
    .eq('enabled', true)

  if (!schedules || schedules.length === 0) {
    return NextResponse.json({ message: 'No active schedules found', generated: 0 })
  }

  const now = new Date()
  const currentDayUTC  = now.getUTCDay()   // 0=Sun, 1=Mon … 6=Sat
  const currentHourUTC = now.getUTCHours()

  const results: { companyId: string; status: string; briefId?: string }[] = []

  for (const schedule of schedules) {
    // schedule.days is an array of day numbers [1,2] = Mon+Tue
    // schedule.hour_utc is the UTC hour to generate (e.g. 7 = 07:00 UTC)
    const shouldRun =
      Array.isArray(schedule.days) &&
      schedule.days.includes(currentDayUTC) &&
      Math.abs(currentHourUTC - schedule.hour_utc) <= 1  // ±1h tolerance

    if (!shouldRun) {
      results.push({ companyId: schedule.company_id, status: 'skipped — not scheduled now' })
      continue
    }

    const company = schedule.companies as Company & { company_profiles?: CompanyProfile[] }
    const profile = company?.company_profiles?.[0]

    if (!company || !profile) {
      results.push({ companyId: schedule.company_id, status: 'error — missing profile' })
      continue
    }

    const weekOf = getMondayOfWeek(now)

    // Skip if a complete brief already exists this week
    const { data: existing } = await supabase
      .from('briefs')
      .select('id, status')
      .eq('company_id', company.id)
      .eq('week_of', weekOf)
      .eq('status', 'complete')
      .single()

    if (existing) {
      results.push({ companyId: company.id, status: 'skipped — already complete this week', briefId: existing.id })
      continue
    }

    // Create brief row
    const { data: brief, error: briefError } = await supabase
      .from('briefs')
      .insert({ company_id: company.id, status: 'generating', week_of: weekOf })
      .select()
      .single()

    if (briefError || !brief) {
      results.push({ companyId: company.id, status: 'error — could not create brief row' })
      continue
    }

    try {
      const content = await synthesizeBrief(company, profile)
      const generatedAt = new Date().toISOString()
      await supabase
        .from('briefs')
        .update({ status: 'complete', content, generated_at: generatedAt })
        .eq('id', brief.id)

      // Send email digest if recipients are configured
      const recipients: string[] = schedule.recipient_emails ?? []
      if (recipients.length > 0) {
        await sendBriefEmail({
          to: recipients,
          companyName: company.name,
          weekOf,
          briefId: brief.id,
          generatedAt,
          content,
          brandColor: (company as any).brand_color,
          logoUrl: (company as any).logo_url,
        }).catch(err => console.error('[cron] email send failed:', err))
      }

      results.push({ companyId: company.id, status: 'complete', briefId: brief.id })
    } catch (err) {
      await supabase.from('briefs').update({ status: 'failed' }).eq('id', brief.id)
      console.error('[cron] synthesis failed:', err)
      results.push({ companyId: company.id, status: 'failed', briefId: brief.id })
    }
  }

  console.log('[cron] brief generation run complete:', results)
  return NextResponse.json({ generated: results.filter(r => r.status === 'complete').length, results })
}
