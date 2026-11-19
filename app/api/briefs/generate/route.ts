import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { synthesizeBrief } from '@/lib/claude/synthesize'
import { generateTrendInsights } from '@/lib/claude/trend-insights'
import { sendBriefEmail } from '@/lib/email'
import { getSessionUser } from '@/lib/get-company'
import { weekOfKey, STUCK_AFTER_MS } from '@/lib/schedule'
import { NextResponse, after } from 'next/server'
import type { Company, CompanyProfile, BriefContent } from '@/lib/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any, any, any>

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

// Cross-week trend narrative is a second, separate Claude call — real value,
// but not worth risking the core brief for. Runs after the core brief is
// already saved as 'complete', so a slow or killed background continuation
// can never take the whole week's brief down with it.
function scheduleTrendInsights(supabase: Db, briefId: string, companyId: string, content: BriefContent, weekOf: string) {
  after(async () => {
    try {
      const trendInsights = await generateTrendInsights(companyId, content, weekOf)
      if (!trendInsights) return
      await supabase
        .from('briefs')
        .update({ content: { ...content, trend_insights: trendInsights } })
        .eq('id', briefId)
    } catch (err) {
      console.error('[generate] background trend-insights update failed:', err)
    }
  })
}

function errorText(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  return msg.slice(0, 500)
}

interface GenerateOptions {
  userId?: string
  recipients?: string[]
  source: 'schedule' | 'user'
}

/**
 * Generate (or re-generate) one company's brief for one week.
 * Shared by the scheduled path and the "Generate" button so both get the same
 * guarantees: one brief per week, no duplicate concurrent runs, and a recorded
 * failure reason + attempt count the scheduler can act on.
 */
async function generateForWeek(
  supabase: Db,
  company: Company,
  profile: CompanyProfile,
  weekOf: string,
  opts: GenerateOptions,
): Promise<NextResponse> {
  const { data: existing } = await supabase
    .from('briefs')
    .select('id, status, created_at, attempts')
    .eq('company_id', company.id)
    .eq('week_of', weekOf)
    .maybeSingle()

  if (existing?.status === 'complete') {
    return NextResponse.json({ briefId: existing.id, status: 'complete', alreadyExists: true })
  }

  // Another run is already writing this brief — don't start a second one.
  if (existing?.status === 'generating' && Date.now() - new Date(existing.created_at).getTime() < STUCK_AFTER_MS) {
    return NextResponse.json({ briefId: existing.id, status: 'generating', inProgress: true }, { status: 202 })
  }

  // A stale 'generating' or 'failed' row would collide with the unique
  // (company_id, week_of) index — clear it, but carry its attempt count forward.
  const attempts = (existing?.attempts ?? 0) + 1
  if (existing) {
    await supabase.from('briefs').delete().eq('id', existing.id)
  }

  const { data: brief, error: briefError } = await supabase
    .from('briefs')
    .insert({ company_id: company.id, status: 'generating', week_of: weekOf, attempts })
    .select()
    .single()

  if (briefError || !brief) {
    console.error('[generate] failed to create brief row:', briefError)
    return NextResponse.json({ error: 'Failed to create brief', detail: briefError?.message }, { status: 500 })
  }

  try {
    const content = await synthesizeBrief(company, profile, opts.userId)
    const generatedAt = new Date().toISOString()

    const { error: updateErr } = await supabase
      .from('briefs')
      .update({ status: 'complete', content, generated_at: generatedAt, error: null })
      .eq('id', brief.id)

    if (updateErr) throw new Error(`Failed to persist completed brief: ${updateErr.message}`)

    scheduleTrendInsights(supabase, brief.id, company.id, content, weekOf)

    const recipients = (opts.recipients ?? []).filter(Boolean)
    let emailed = 0
    if (recipients.length > 0) {
      try {
        await sendBriefEmail({
          to: recipients,
          companyName: company.name,
          weekOf,
          briefId: brief.id,
          generatedAt,
          content,
          brandColor: company.brand_color ?? undefined,
          logoUrl: company.logo_url ?? undefined,
        })
        emailed = recipients.length
      } catch (err) {
        // The brief itself is saved — record the delivery problem without failing the run.
        console.error('[generate] email send failed:', err)
        await supabase.from('briefs').update({ error: `Brief generated, but the email failed: ${errorText(err)}` }).eq('id', brief.id)
      }
    }

    console.log('[generate] complete:', { company: company.name, weekOf, source: opts.source, attempts, emailed })
    return NextResponse.json({ briefId: brief.id, status: 'complete', emailed })
  } catch (synthErr) {
    console.error(`[generate] ${opts.source} synthesis failed:`, synthErr)
    await supabase.from('briefs').update({ status: 'failed', error: errorText(synthErr) }).eq('id', brief.id)
    return NextResponse.json(
      { error: opts.source === 'user' ? 'Brief generation failed — please try again' : 'Brief generation failed', detail: errorText(synthErr) },
      { status: 500 },
    )
  }
}

// 5 min — synthesis is synchronous; 300s is the function ceiling on this plan
export const maxDuration = 300

export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const body = await request.json().catch(() => ({}))

    // ── Schedule-triggered path (from the scheduler in /api/briefs/cron) ──────
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
        console.error('[generate] schedule lookup failed:', { scheduleId: body.scheduleId, schedErr })
        return NextResponse.json({ error: 'Schedule not found', detail: schedErr?.message }, { status: 404 })
      }

      const company = schedule.companies as Company & { company_profiles?: CompanyProfile[] }
      const profile = company?.company_profiles?.[0]

      if (!company || !profile) {
        return NextResponse.json({ error: 'Missing company or profile' }, { status: 400 })
      }

      // weekOffset lets an operator back-fill an earlier week (0 = this week).
      const weekOffset = Number.isInteger(body?.weekOffset) && body.weekOffset > 0 ? Math.min(body.weekOffset, 8) : 0
      const weekOf = weekOfKey(new Date(Date.now() - weekOffset * WEEK_MS))

      return await generateForWeek(supabase, company, profile, weekOf, {
        recipients: schedule.recipient_emails ?? [],
        source: 'schedule',
      })
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

    const weekOffset = typeof body?.weekOffset === 'number' && body.weekOffset > 0 ? Math.min(Math.trunc(body.weekOffset), 8) : 0
    const weekOf = weekOfKey(new Date(Date.now() - weekOffset * WEEK_MS))

    return await generateForWeek(supabase, company as Company, profile as CompanyProfile, weekOf, {
      userId,
      source: 'user',
    })
  } catch (err) {
    console.error('[briefs/generate] error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
