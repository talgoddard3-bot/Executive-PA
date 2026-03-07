import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const ADMIN_SECRET = process.env.ADMIN_SECRET

function isAuthorised(request: Request): boolean {
  if (!ADMIN_SECRET) return true // dev: no secret set = open
  const auth = request.headers.get('x-admin-secret')
  return auth === ADMIN_SECRET
}

export async function GET(request: Request) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profiles, error } = await supabase
    .from('user_profiles')
    .select('user_id, full_name, email, position, language, avatar_url')
    .order('full_name')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Attach company info from companies table (joined on user_id)
  const userIds = (profiles ?? []).map(p => p.user_id)
  const { data: companies } = userIds.length > 0
    ? await supabase
        .from('companies')
        .select('user_id, name, industry')
        .in('user_id', userIds)
    : { data: [] }

  const companyMap = Object.fromEntries(
    (companies ?? []).map(c => [c.user_id, { name: c.name, industry: c.industry }])
  )

  const users = (profiles ?? []).map(p => ({
    ...p,
    company: companyMap[p.user_id] ?? null,
  }))

  return NextResponse.json({ users })
}

export async function PATCH(request: Request) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { user_id, position } = await request.json()
  if (!user_id || !position) {
    return NextResponse.json({ error: 'user_id and position are required' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabase
    .from('user_profiles')
    .upsert({ user_id, position }, { onConflict: 'user_id' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
