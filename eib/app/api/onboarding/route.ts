import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  // Get authenticated user
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { full_name, email, company_name, position } = await request.json()

  if (!full_name?.trim() || !company_name?.trim() || !position) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Use service role to bypass RLS
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await service
    .from('user_profiles')
    .upsert({
      user_id: user.id,
      full_name: full_name.trim(),
      email: email?.trim() ?? user.email ?? '',
      company_name: company_name.trim(),
      position,
      status: 'pending',
      requested_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
