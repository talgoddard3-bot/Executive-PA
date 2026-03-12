import { createClient } from '@supabase/supabase-js'
import { getSessionUser } from '@/lib/get-company'
import { NextResponse } from 'next/server'

function service() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/internal/notes  → active notes for the company
export async function GET() {
  const user = await getSessionUser()
  if (!user?.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await service()
    .from('internal_notes')
    .select('id, category, content, expires_at, created_at, user_id')
    .eq('company_id', user.companyId)
    .eq('archived', false)
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST /api/internal/notes  → create a note
// body: { category, content, expiresInDays? }
export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user?.companyId || !user.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { category, content, expiresInDays = 60, briefId } = await request.json()
  if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 })
  if (content.trim().length > 1000) return NextResponse.json({ error: 'Note must be 1000 characters or fewer' }, { status: 400 })

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + Math.min(expiresInDays, 180))

  const { data, error } = await service()
    .from('internal_notes')
    .insert({
      company_id: user.companyId,
      user_id:    user.userId,
      category:        category ?? 'General',
      content:         content.trim(),
      expires_at:      expiresAt.toISOString(),
      target_brief_id: briefId ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
