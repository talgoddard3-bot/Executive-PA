import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const DEV_USER_ID = '00000000-0000-0000-0000-000000000001'

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const { data, error } = await supabase()
    .from('user_profiles')
    .select('*')
    .eq('user_id', DEV_USER_ID)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? { user_id: DEV_USER_ID, full_name: '', position: '', email: '', avatar_url: null, language: 'English' })
}

export async function POST(req: Request) {
  const body = await req.json()
  const { full_name, email, avatar_url, language } = body

  const { data, error } = await supabase()
    .from('user_profiles')
    .upsert({
      user_id: DEV_USER_ID,
      full_name: full_name ?? '',
      email: email ?? '',
      language: language ?? 'English',
      ...(avatar_url !== undefined ? { avatar_url } : {}),
    }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
