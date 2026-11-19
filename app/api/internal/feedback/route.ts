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
    .select('id, section, item_index, rating, tag, acted_on, user_id')
    .eq('company_id', user.companyId)
    .eq('brief_id', briefId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // "mine" lets the page restore the signed-in reader's own answers.
  return NextResponse.json((data ?? []).map(row => ({ ...row, mine: row.user_id === user.userId })))
}

// POST /api/internal/feedback  → upsert a rating
// body: { briefId, section, itemIndex, rating (1|-1), tag?, actedOn? }
// actedOn marks an insight that led to a real decision or action.
export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user?.companyId || !user.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { briefId, section, itemIndex, rating, tag, actedOn } = await request.json()
  if (!briefId || !section || itemIndex == null || (rating !== 1 && rating !== -1)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  // The brief must belong to the signed-in user's company.
  const { data: ownBrief } = await service()
    .from('briefs')
    .select('id')
    .eq('id', briefId)
    .eq('company_id', user.companyId)
    .maybeSingle()
  if (!ownBrief) return NextResponse.json({ error: 'Brief not found' }, { status: 404 })

  const acted = rating === 1 && actedOn === true

  const { data, error } = await service()
    .from('article_feedback')
    .upsert({
      company_id: user.companyId,
      brief_id:   briefId,
      user_id:    user.userId,
      section,
      item_index: itemIndex,
      rating,
      tag:        typeof tag === 'string' ? tag.slice(0, 120) : null,
      ...(actedOn === undefined && rating === 1 ? {} : { acted_on: acted, acted_at: acted ? new Date().toISOString() : null }),
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
