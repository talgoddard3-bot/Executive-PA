import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const DEV_USER_ID = '00000000-0000-0000-0000-000000000001'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', DEV_USER_ID)
    .single()

  if (!company) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: brief } = await supabase
    .from('briefs')
    .select('id, status')
    .eq('id', id)
    .eq('company_id', company.id)
    .single()

  if (!brief) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(brief)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', DEV_USER_ID)
    .single()

  if (!company) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { error } = await supabase
    .from('briefs')
    .delete()
    .eq('id', id)
    .eq('company_id', company.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
