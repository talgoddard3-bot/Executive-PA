import { createClient } from '@supabase/supabase-js'
import { getSessionCompanyId } from '@/lib/get-company'
import { NextResponse } from 'next/server'

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const companyId = await getSessionCompanyId()
  if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { data, error } = await supabase()
    .from('briefs')
    .select('id, status')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Brief not found' }, { status: 404 })
  }

  return NextResponse.json({ briefId: data.id, status: data.status })
}
