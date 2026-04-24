import { createClient } from '@supabase/supabase-js'
import { synthesizeBrief } from '@/lib/claude/synthesize'
import { generateTrendInsights } from '@/lib/claude/trend-insights'
import { sendBriefEmail } from '@/lib/email'
import { getSessionUser } from '@/lib/get-company'
import { NextResponse } from 'next/server'
import type { Company, CompanyProfile } from '@/lib/types'

function getMondayOfWeek(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

// 5 min — synthesis is synchronous, Vercel Pro supports up to 300s
export const maxDuration = 300

export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const body = await request.json().catch(() => ({}))

    // ── Schedule-triggered path (from cron) ───────────────────────────────────
    if (body?.scheduleId) {
      const authHeader = request.headers.get('authorization')
      const cronSecret = process.env.CRON_SECRET
      if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
      }

      const { data: schedule, error: schedErr } = await supabase
        .from('brief_schedules')
        .select('*, companies(*, company_profiles(*))')
        .eq('id', body.scheduleId)
        .single()

      if (schedErr || !schedule) {
        return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
      }

      const company = schedule.companies as Company & { company_profiles?: CompanyProfile[] }
      const profile = company?.company_profiles?.[0]

      if (!company || !profile) {
        return NextResponse.json({ error: 'Missing company or profile' }, { status: 400 })
      }

      const weekOf = getMondayOfWeek(new Date())

      const { data: existing } = await supabase
        .from('briefs')
        .select('id, status')
        .eq('company_id', company.id)
        .eq('week_of', weekOf)
        .eq('status', 'complete')
        .single()

      if (existing) {
        return NextResponse.json({ briefId: existing.id, status: 'complete', alreadyExists: true })
      }

      const { data: brief, error: briefError } = await supabase
        .from('briefs')
        .insert({ company_id: company.id, status: 'generating', week_of: weekOf })
        .select()
        .single()

      if (briefError || !brief) {
        return NextResponse.json({ error: 'Failed to create brief row' }, { status: 500 })
      }

      try {
        const content = await synthesizeBrief(company, profile)
        const generatedAt = new Date().toISOString()

        const trendInsights = await generateTrendInsights(company.id, content, weekOf)
        if (trendInsights) content.trend_insights = trendInsights

        await supabase
          .from('briefs')
          .update({ status: 'complete', content, generated_at: generatedAt })
          .eq('id', brief.id)

        const recipients: string[] = schedule.recipient_emails ?? []
        if (recipients.length > 0) {
          await sendBriefEmail({
            to: recipients,
            companyName: company.name,
            weekOf,
            briefId: brief.id,
            generatedAt,
            content,
            brandColor: company.brand_color ?? undefined,
            logoUrl: company.logo_url ?? undefined,
          }).catch(err => console.error('[generate] email send failed:', err))
        }

        return NextResponse.json({ briefId: brief.id, status: 'complete' })
      } catch (synthErr) {
        console.error('[generate] schedule synthesis failed:', synthErr)
        await supabase.from('briefs').update({ status: 'failed' }).eq('id', brief.id)
        return NextResponse.json({ error: 'Brief generation failed' }, { status: 500 })
      }
    }

    // ── User-triggered path ───────────────────────────────────────────────────
    const session = await getSessionUser()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { userId, companyId } = session
    if (!companyId) {
      return NextResponse.json({ error: 'Company not found. Set up your profile first.' }, { status: 404 })
    }

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*, company_profiles(*)')
      .eq('id', companyId)
      .single()

    if (companyError || !company) {
      return NextResponse.json({ error: 'Company not found. Set up your profile first.' }, { status: 404 })
    }

    const profile = company.company_profiles?.[0]
    if (!profile) {
      return NextResponse.json({ error: 'Complete your company profile first.' }, { status: 400 })
    }

    const weekOffset = typeof body?.weekOffset === 'number' ? body.weekOffset : 0
    const weekOf = getMondayOfWeek(new Date(Date.now() - weekOffset * 7 * 24 * 60 * 60 * 1000))

    const { data: existing } = await supabase
      .from('briefs')
      .select('id, status')
      .eq('company_id', company.id)
      .eq('week_of', weekOf)
      .single()

    if (existing?.status === 'complete') {
      return NextResponse.json({ briefId: existing.id, status: 'complete', alreadyExists: true })
    }

    if (existing) {
      await supabase.from('briefs').delete().eq('id', existing.id)
    }

    const { data: brief, error: briefError } = await supabase
      .from('briefs')
      .insert({ company_id: company.id, status: 'generating', week_of: weekOf })
      .select()
      .single()

    if (briefError || !brief) {
      return NextResponse.json({ error: 'Failed to create brief' }, { status: 500 })
    }

    try {
      const content = await synthesizeBrief(company as Company, profile as CompanyProfile, userId)

      const trendInsights = await generateTrendInsights(company.id, content, weekOf)
      if (trendInsights) content.trend_insights = trendInsights

      await supabase
        .from('briefs')
        .update({ status: 'complete', content, generated_at: new Date().toISOString() })
        .eq('id', brief.id)

      return NextResponse.json({ briefId: brief.id, status: 'complete' })
    } catch (synthErr) {
      console.error('Brief synthesis failed:', synthErr)
      await supabase.from('briefs').update({ status: 'failed' }).eq('id', brief.id)
      return NextResponse.json({ error: 'Brief generation failed — please try again' }, { status: 500 })
    }

  } catch (err) {
    console.error('[briefs/generate] error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
