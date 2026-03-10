import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSessionCompanyId } from '@/lib/get-company'

const service = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const companyId = await getSessionCompanyId()
  if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await service()
    .from('company_locations')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const companyId = await getSessionCompanyId()
  if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { country_code, country_name, city, location_type, headcount, notes } = body

  if (!country_code || !country_name || !location_type) {
    return NextResponse.json({ error: 'country_code, country_name and location_type are required' }, { status: 400 })
  }

  const { data, error } = await service()
    .from('company_locations')
    .insert({
      company_id: companyId,
      country_code: country_code.toUpperCase(),
      country_name,
      city: city || null,
      location_type,
      headcount: headcount ? Number(headcount) : null,
      notes: notes || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: Request) {
  const companyId = await getSessionCompanyId()
  if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await service()
    .from('company_locations')
    .delete()
    .eq('id', id)
    .eq('company_id', companyId)  // ensures ownership

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
