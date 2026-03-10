import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Dev mode: fixed user ID used when auth is disabled
const DEV_USER_ID = '00000000-0000-0000-0000-000000000001'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { companyId, name, industry, company_type, stock_ticker, revenue_countries, supplier_countries, competitors, customers, keywords, commodities } = body

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let cId = companyId

    if (!cId) {
      // Upsert on user_id to avoid duplicate constraint when a company already exists
      const { data: company, error: cErr } = await supabase
        .from('companies')
        .upsert(
          { user_id: DEV_USER_ID, name, industry, company_type, stock_ticker: stock_ticker ?? null },
          { onConflict: 'user_id' }
        )
        .select()
        .single()

      if (cErr || !company) {
        console.error('companies upsert error:', cErr)
        return NextResponse.json({ error: cErr?.message ?? 'Failed to save company' }, { status: 500 })
      }
      cId = company.id
    } else {
      await supabase.from('companies').update({ name, industry, company_type, stock_ticker: stock_ticker ?? null }).eq('id', cId)
    }

    const { error: profileErr } = await supabase
      .from('company_profiles')
      .upsert(
        { company_id: cId, revenue_countries, supplier_countries, competitors, customers: customers ?? [], keywords, commodities: commodities ?? [], updated_at: new Date().toISOString() },
        { onConflict: 'company_id' }
      )

    if (profileErr) {
      console.error('company_profiles upsert error:', profileErr)
      return NextResponse.json({ error: profileErr.message }, { status: 500 })
    }

    return NextResponse.json({ companyId: cId })
  } catch (err) {
    console.error('[profile/save] error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
