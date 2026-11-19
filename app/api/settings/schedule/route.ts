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

  const validDays = Array.isArray(days) && days.length > 0 && days.every((d: unknown) => Number.isInteger(d) && (d as number) >= 0 && (d as number) <= 6)
  const validHour = Number.isInteger(hour_utc) && hour_utc >= 0 && hour_utc <= 23
  const validEmails = recipient_emails === undefined || (Array.isArray(recipient_emails) && recipient_emails.length <= 25 && recipient_emails.every((e: unknown) => typeof e === 'string' && /^[^s@]+@[^s@]+.[^s@]+$/.test(e)))
  if (!validDays || !validHour || !validEmails) {
    return NextResponse.json({ error: 'Invalid schedule: pick a day, an hour between 0 and 23, and valid email addresses.' }, { status: 400 })
  }

  const companyId = await getSessionCompanyId()
  if (!companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

  const { data, error } = await db()
    .from('brief_schedules')
    .upsert(
      { company_id: companyId, enabled: enabled === true, days, hour_utc, recipient_emails: recipient_emails ?? [], updated_at: new Date().toISOString() },
      { onConflict: 'company_id' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
