import { createClient } from '@supabase/supabase-js'
import { getSessionCompanyId } from '@/lib/get-company'
import { NextResponse } from 'next/server'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const companyId = await getSessionCompanyId()
  if (!companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

  const { data } = await db()
    .from('brief_schedules')
    .select('*')
    .eq('company_id', companyId)
    .single()

  // Return defaults if no schedule set yet
  return NextResponse.json(data ?? {
    enabled: false,
    days: [1],           // Monday
    hour_utc: 7,         // 07:00 UTC
    recipient_emails: [],
  })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { enabled, days, hour_utc, recipient_emails } = body

  if (!Array.isArray(days) || typeof hour_utc !== 'number') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const companyId = await getSessionCompanyId()
  if (!companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

  const { data, error } = await db()
    .from('brief_schedules')
    .upsert(
      { company_id: companyId, enabled, days, hour_utc, recipient_emails: recipient_emails ?? [], updated_at: new Date().toISOString() },
      { onConflict: 'company_id' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
