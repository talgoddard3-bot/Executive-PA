import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  const supabase = await createClient()
  const { error, data } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error?.message ?? 'unknown')}`
    )
  }

  // Password reset flow — skip profile check, go straight to reset page
  if (next === '/reset-password') {
    return NextResponse.redirect(`${origin}/reset-password`)
  }

  // Check profile status
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await service
    .from('user_profiles')
    .select('status, is_admin')
    .eq('user_id', data.user.id)
    .single()

  if (!profile) return NextResponse.redirect(`${origin}/onboarding`)
  if (profile.is_admin) return NextResponse.redirect(`${origin}/dashboard`)
  if (profile.status === 'pending') return NextResponse.redirect(`${origin}/pending`)
  if (profile.status === 'rejected') {
    return NextResponse.redirect(`${origin}/login?error=Your+access+request+was+not+approved.`)
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
