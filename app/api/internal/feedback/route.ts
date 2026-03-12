import { createClient } from '@supabase/supabase-js'
import { getSessionUser } from '@/lib/get-company'
import { NextResponse } from 'next/server'

function service() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/internal/feedback?briefId=xxx  → all feedback for a brief
export async function GET(request: Request) {
  const user = await getSessionUser()
  if (!user?.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const briefId = searchParams.get('briefId')
  if (!briefId) return NextResponse.json({ error: 'briefId required' }, { status: 400 })

  const { data, error } = await service()
    .from('article_feedback')
    .select('id, section, item_index, rating, tag, user_id')
    .eq('company_id', user.companyId)
    .eq('brief_id', briefId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST /api/internal/feedback  → upsert a rating
// body: { briefId, section, itemIndex, rating (1|-1), tag? }
export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user?.companyId || !user.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { briefId, section, itemIndex, rating, tag } = await request.json()
  if (!briefId || !section || itemIndex == null || (rating !== 1 && rating !== -1)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { data, error } = await service()
    .from('article_feedback')
    .upsert({
      company_id: user.companyId,
      brief_id:   briefId,
      user_id:    user.userId,
      section,
      item_index: itemIndex,
      rating,
      tag:        tag ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'company_id,brief_id,section,item_index,user_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/internal/feedback  → remove a rating
// body: { briefId, section, itemIndex }
export async function DELETE(request: Request) {
  const user = await getSessionUser()
  if (!user?.companyId || !user.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { briefId, section, itemIndex } = await request.json()

  const { error } = await service()
    .from('article_feedback')
    .delete()
    .eq('company_id', user.companyId)
    .eq('brief_id', briefId)
    .eq('section', section)
    .eq('item_index', itemIndex)
    .eq('user_id', user.userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
