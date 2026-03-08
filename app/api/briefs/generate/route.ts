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

// Increase default response timeout for this route
export const maxDuration = 120

export async function POST() {
  try {
    const session = await getSessionUser()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { userId, companyId } = session

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

    if (existing) {
      if (existing.status === 'complete') {
        return NextResponse.json({ briefId: existing.id, status: 'complete', alreadyExists: true })
      }
      if (existing.status === 'generating') {
        return NextResponse.json({ briefId: existing.id, status: 'generating', alreadyExists: true })
      }
      // failed or pending → delete and recreate
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

    // Fire-and-forget synthesis — runs in background so navigation doesn't abort it
    const briefId = brief.id
    void (async () => {
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
          .eq('id', briefId)
      } catch (synthErr) {
        console.error('Brief synthesis failed:', synthErr)
        await supabase.from('briefs').update({ status: 'failed' }).eq('id', briefId)
      }
    })()

    // Return immediately — client polls for status
    return NextResponse.json({ briefId, status: 'generating' })

  } catch (err) {
    console.error('[briefs/generate] error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
