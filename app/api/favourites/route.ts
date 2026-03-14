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

// GET /api/favourites  — list all saved articles for the current user
export async function GET(req: NextRequest) {
  const session = await getSessionUser()
  const userId = session?.userId ?? DEV_USER_ID
  const companyId = req.nextUrl.searchParams.get('company_id') ?? session?.companyId

  const q = sb()
    .from('article_favourites')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  const query = companyId ? q.eq('company_id', companyId) : q

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/favourites — toggle (add/remove) a favourite
export async function POST(req: NextRequest) {
  const userId = await getUserId()
  const body = await req.json()
  const { company_id, brief_id, section, item_index, headline, section_label, brief_week_of } = body

  // Check if already favourited
  const { data: existing } = await sb()
    .from('article_favourites')
    .select('id')
    .eq('user_id', userId)
    .eq('brief_id', brief_id)
    .eq('section', section)
    .eq('item_index', item_index)
    .single()

  if (existing) {
    // Remove
    await sb().from('article_favourites').delete().eq('id', existing.id)
    return NextResponse.json({ saved: false })
  } else {
    // Add
    await sb().from('article_favourites').insert({
      user_id: userId, company_id, brief_id, section, item_index,
      headline, section_label, brief_week_of
    })
    return NextResponse.json({ saved: true })
  }
}
