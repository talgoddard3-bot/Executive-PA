import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

async function isAdmin(): Promise<boolean> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data } = await service
    .from('user_profiles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  return data?.is_admin === true
}

export async function GET() {
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profiles, error } = await supabase
    .from('user_profiles')
    .select('user_id, full_name, email, position, language, avatar_url, status, company_name, requested_at, is_admin')
    .order('requested_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Attach company row if linked
  const userIds = (profiles ?? []).map(p => p.user_id)
  const { data: companies } = userIds.length > 0
    ? await supabase.from('companies').select('user_id, name, industry').in('user_id', userIds)
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
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { user_id, position, status } = body

  if (!user_id) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const update: Record<string, string> = {}
  if (position) update.position = position
  if (status) update.status = status

  const { error } = await supabase
    .from('user_profiles')
    .update(update)
    .eq('user_id', user_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
