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

  const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user_id)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // When approving, auto-create the company row and link it to the user profile
  if (status === 'active' && isValidUUID) {
    // Fetch current profile to get company_name, plan, and check if company already exists
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('company_name, company_id, plan')
      .eq('user_id', user_id)
      .single()

    if (profile && !profile.company_id) {
      const companyName = profile.company_name?.trim() || 'My Company'

      if (profile.plan === 'team') {
        // For team, find existing company by name or create new
        const { data: existingCompany } = await supabase
          .from('companies')
          .select('id')
          .eq('name', companyName)
          .single()

        if (existingCompany) {
          // Link to existing company
          const { error } = await supabase
            .from('user_profiles')
            .update({
              status: 'active',
              company_id: existingCompany.id,
              ...(position ? { position } : {}),
            })
            .eq('user_id', user_id)

          if (error) return NextResponse.json({ error: error.message }, { status: 500 })
          return NextResponse.json({ ok: true })
        }
      }

      // Create the company row (for solo or first team user)
      const { data: newCompany, error: companyErr } = await supabase
        .from('companies')
        .upsert(
          { user_id, name: companyName, industry: 'Unknown' },
          { onConflict: 'user_id' }
        )
        .select()
        .single()

      if (companyErr || !newCompany) {
        return NextResponse.json({ error: companyErr?.message ?? 'Failed to create company' }, { status: 500 })
      }

      // Link company_id + activate
      const { error } = await supabase
        .from('user_profiles')
        .update({
          status: 'active',
          company_id: newCompany.id,
          ...(position ? { position } : {}),
        })
        .eq('user_id', user_id)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }
  }

  // For all other updates (position change, reject, etc.)
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

export async function POST(request: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { email, full_name, position, company_name } = body

  if (!email || !full_name || !company_name) {
    return NextResponse.json({ error: 'email, full_name, and company_name are required' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Invite the user
  const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { full_name },
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/get-started`,
  })

  if (inviteError || !inviteData.user) {
    return NextResponse.json({ error: inviteError?.message ?? 'Failed to invite user' }, { status: 500 })
  }

  const userId = inviteData.user.id

  // Insert into user_profiles
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      user_id: userId,
      full_name,
      email,
      position: position || 'Chief Executive Officer',
      language: 'en',
      avatar_url: null,
      status: 'pending',
      company_name,
      requested_at: new Date().toISOString(),
      is_admin: false,
    })

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, user_id: userId })
}
