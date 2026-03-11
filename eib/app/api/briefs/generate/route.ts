import { createClient } from '@supabase/supabase-js'
import { synthesizeBrief } from '@/lib/claude/synthesize'
import { generateTrendInsights } from '@/lib/claude/trend-insights'
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

export async function POST() {
  try {
    const session = await getSessionUser()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { userId, companyId } = session
    if (!companyId) {
      return NextResponse.json({ error: 'Company not found. Set up your profile first.' }, { status: 404 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch company + profile
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

    const weekOf = getMondayOfWeek(new Date())

    // Check for existing brief this week
    const { data: existing } = await supabase
      .from('briefs')
      .select('id, status')
      .eq('company_id', company.id)
      .eq('week_of', weekOf)
      .single()

    if (existing?.status === 'complete') {
      return NextResponse.json({ briefId: existing.id, status: 'complete', alreadyExists: true })
    }

    // Delete any failed/stuck brief so we can recreate cleanly
    if (existing) {
      await supabase.from('briefs').delete().eq('id', existing.id)
    }

    // Create the brief row
    const { data: brief, error: briefError } = await supabase
      .from('briefs')
      .insert({ company_id: company.id, status: 'generating', week_of: weekOf })
      .select()
      .single()

    if (briefError || !brief) {
      return NextResponse.json({ error: 'Failed to create brief' }, { status: 500 })
    }

    // Run synthesis synchronously — Vercel kills background tasks after response is sent,
    // so fire-and-forget does not work in production. maxDuration = 300 gives 5 min.
    try {
      const content = await synthesizeBrief(company as Company, profile as CompanyProfile, userId)

      // Generate trend insights via Haiku (cheap, stored once per brief)
      const trendInsights = await generateTrendInsights(company.id, content, weekOf)
      if (trendInsights) {
        content.trend_insights = trendInsights
      }

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
