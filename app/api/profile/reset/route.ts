import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const DEV_USER_ID = '00000000-0000-0000-0000-000000000001'

export async function POST() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch the company first
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', DEV_USER_ID)
      .single()

    if (!company) {
      return NextResponse.json({ ok: true })
    }

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
