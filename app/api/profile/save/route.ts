import { createClient } from '@supabase/supabase-js'
import { getSessionUser } from '@/lib/get-company'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const session = await getSessionUser()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { userId, companyId: sessionCompanyId } = session

    const body = await request.json()
    const { companyId, name, industry, company_type, stock_ticker, website, revenue_countries, supplier_countries, competitors, customers, keywords, commodities, products, company_notes, locations } = body

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let cId = companyId ?? sessionCompanyId

    if (!cId) {
      // Upsert on user_id to avoid duplicate constraint when a company already exists
      const { data: company, error: cErr } = await supabase
        .from('companies')
        .upsert(
          { user_id: userId, name, industry, company_type, stock_ticker: stock_ticker ?? null, website: website ?? null },
          { onConflict: 'user_id' }
        )
        .select()
        .single()

      if (cErr || !company) {
        console.error('companies upsert error:', cErr)
        return NextResponse.json({ error: cErr?.message ?? 'Failed to save company' }, { status: 500 })
      }
      cId = company.id

      // Link company_id onto user_profiles so getSessionUser() works going forward
      await supabase
        .from('user_profiles')
        .update({ company_id: cId })
        .eq('user_id', userId)
    } else {
      await supabase.from('companies').update({ name, industry, company_type, stock_ticker: stock_ticker ?? null, website: website ?? null }).eq('id', cId)
    }

    const { error: profileErr } = await supabase
      .from('company_profiles')
      .upsert(
        { company_id: cId, revenue_countries, supplier_countries, competitors, customers: customers ?? [], keywords, commodities: commodities ?? [], products: products ?? null, company_notes: company_notes ?? null, updated_at: new Date().toISOString() },
        { onConflict: 'company_id' }
      )

    if (profileErr) {
      console.error('company_profiles upsert error:', profileErr)
      return NextResponse.json({ error: profileErr.message }, { status: 500 })
    }

    // AI-suggested locations reviewed at profile creation time — inserted once,
    // client only sends these right after a fresh suggestion so this won't duplicate on later edits.
    if (Array.isArray(locations) && locations.length > 0) {
      const rows = locations
        .filter((l: { country_name?: string; country_code?: string }) => l.country_name && l.country_code)
        .map((l: { city?: string; country_name: string; country_code: string; location_types?: string[]; notes?: string }) => ({
          company_id: cId,
          country_code: l.country_code.toUpperCase(),
          country_name: l.country_name,
          city: l.city || null,
          location_type: l.location_types?.[0] ?? 'office',   // legacy NOT NULL column
          location_types: l.location_types?.length ? l.location_types : ['office'],
          notes: l.notes || null,
        }))

      if (rows.length > 0) {
        const { error: locErr } = await supabase.from('company_locations').insert(rows)
        if (locErr) console.error('company_locations insert error:', locErr)
      }
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
