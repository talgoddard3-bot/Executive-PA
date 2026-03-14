import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSessionUser } from '@/lib/get-company'

const DEV_USER_ID = '00000000-0000-0000-0000-000000000001'

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function getUserId(): Promise<string> {
  try {
    const session = await getSessionUser()
    return session?.userId ?? DEV_USER_ID
  } catch {
    return DEV_USER_ID
  }
}

// GET /api/notifications — list for current user (pass ?unread=true for unread only)
export async function GET(req: NextRequest) {
  const userId = await getUserId()
  const unreadOnly = req.nextUrl.searchParams.get('unread') === 'true'
  let q = sb()
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (unreadOnly) q = q.eq('read', false)
  const { data, error } = await q

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch sender names
  const senderIds = [...new Set((data ?? []).filter(n => n.from_user_id).map(n => n.from_user_id))]
  let names: Record<string, string> = {}
  if (senderIds.length > 0) {
    const { data: profiles } = await sb()
      .from('user_profiles')
      .select('user_id, full_name')
      .in('user_id', senderIds)
    if (profiles) {
      names = Object.fromEntries(profiles.map(p => [p.user_id, p.full_name ?? 'Team member']))
    }
  }

  return NextResponse.json((data ?? []).map(n => ({ ...n, from_name: names[n.from_user_id] ?? 'Team member' })))
}

// PATCH /api/notifications — mark all as read, or specific id
export async function PATCH(req: NextRequest) {
  const userId = await getUserId()
  const body = await req.json().catch(() => ({}))
  const id = body.id

  let q = sb().from('notifications').update({ read: true }).eq('user_id', userId)
  if (id) q = q.eq('id', id)
  const { error } = await q

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
