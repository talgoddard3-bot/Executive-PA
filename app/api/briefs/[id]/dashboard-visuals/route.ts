import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSessionCompanyId } from '@/lib/get-company'
import { generateDashboardVisuals } from '@/lib/claude/dashboard-visuals'
import type { BriefContent } from '@/lib/types'

export const maxDuration = 60

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const companyId = await getSessionCompanyId()
  if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = sb()

  const { data: brief } = await supabase
    .from('briefs')
    .select('id, content, company_id')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (!brief?.content) return NextResponse.json({ error: 'Brief not found' }, { status: 404 })

  const content = brief.content as BriefContent

  // Return cached result if already generated
  if (content.dashboard_visuals) {
    return NextResponse.json(content.dashboard_visuals)
  }

  // Fetch company name
  const { data: company } = await supabase
    .from('companies')
    .select('name')
    .eq('id', companyId)
    .single()

  const result = await generateDashboardVisuals(content, company?.name ?? 'the company')
  if (!result) return NextResponse.json({ error: 'Generation failed' }, { status: 500 })

  // Cache by patching content in DB
  await supabase
    .from('briefs')
    .update({ content: { ...content, dashboard_visuals: result } })
    .eq('id', id)

  return NextResponse.json(result)
}

// POST to force regenerate
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const companyId = await getSessionCompanyId()
  if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = sb()

  const { data: brief } = await supabase
    .from('briefs')
    .select('id, content, company_id')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (!brief?.content) return NextResponse.json({ error: 'Brief not found' }, { status: 404 })

  const { data: company } = await supabase
    .from('companies')
    .select('name')
    .eq('id', companyId)
    .single()

  const content = brief.content as BriefContent
  const result = await generateDashboardVisuals(content, company?.name ?? 'the company')
  if (!result) return NextResponse.json({ error: 'Generation failed' }, { status: 500 })

  await supabase
    .from('briefs')
    .update({ content: { ...content, dashboard_visuals: result } })
    .eq('id', id)

  return NextResponse.json(result)
}
