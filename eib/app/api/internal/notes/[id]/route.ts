import { createClient } from '@supabase/supabase-js'
import { getSessionUser } from '@/lib/get-company'
import { NextResponse } from 'next/server'

function service() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// DELETE /api/internal/notes/[id]  → archive a note
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user?.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const { error } = await service()
    .from('internal_notes')
    .update({ archived: true })
    .eq('id', id)
    .eq('company_id', user.companyId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
