import { createClient } from '@supabase/supabase-js'
import { getSessionCompanyId } from '@/lib/get-company'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const companyId = await getSessionCompanyId()
    if (!companyId) {
      return NextResponse.json({ ok: true })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const company = { id: companyId }

    // Delete company_profiles, briefs, then companies (cascade order)
    await supabase.from('company_profiles').delete().eq('company_id', company.id)
    await supabase.from('briefs').delete().eq('company_id', company.id)
    await supabase.from('companies').delete().eq('id', company.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[profile/reset] error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
