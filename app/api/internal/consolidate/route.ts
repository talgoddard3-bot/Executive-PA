import { createClient } from '@supabase/supabase-js'
import { getSessionUser } from '@/lib/get-company'
import { NextResponse } from 'next/server'
import { anthropic } from '@/lib/claude/client'
import type { BriefContent } from '@/lib/types'

export const maxDuration = 30

function service() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user?.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { briefId } = await request.json()
  if (!briefId) return NextResponse.json({ error: 'briefId required' }, { status: 400 })

  const db = service()

  const { data: brief } = await db
    .from('briefs')
    .select('id, week_of, content')
    .eq('id', briefId)
    .eq('company_id', user.companyId)
    .single()

  if (!brief?.content) return NextResponse.json({ error: 'Brief not found' }, { status: 404 })

  const [notesRes, docsRes] = await Promise.all([
    db.from('internal_notes')
      .select('category, content, created_at')
      .eq('company_id', user.companyId)
      .eq('target_brief_id', briefId)
      .order('created_at', { ascending: false }),
    db.from('uploaded_documents')
      .select('title, description, processed_content, file_type, created_at')
      .eq('company_id', user.companyId)
      .eq('target_brief_id', briefId)
      .order('created_at', { ascending: false }),
  ])

  const notes = notesRes.data ?? []
  const docs  = docsRes.data ?? []
  const totalSignals = notes.length + docs.length

  if (totalSignals === 0) {
    return NextResponse.json({ error: 'No signals tagged to this brief' }, { status: 400 })
  }

  const content = brief.content as BriefContent
  const briefContext = [
    content.executive_summary ? `EXECUTIVE SUMMARY:\n${content.executive_summary}` : '',
    content.financial_signals?.length
      ? `FINANCIAL SIGNALS:\n${JSON.stringify(content.financial_signals.slice(0, 3))}` : '',
    content.risk_summary?.length
      ? `RISKS:\n${JSON.stringify(content.risk_summary.slice(0, 3))}` : '',
    content.operational_intelligence?.length
      ? `OPERATIONS:\n${JSON.stringify(content.operational_intelligence.slice(0, 2))}` : '',
  ].filter(Boolean).join('\n\n').slice(0, 4000)

  const signalLines = [
    ...notes.map(n => `[${n.category}] ${n.content}`),
    ...docs.map(d => `[Document: ${d.title}] ${d.processed_content || d.description || '(no description)'}`),
  ]

  const weekOf = new Date(brief.week_of).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    system: 'You are a senior business intelligence analyst writing for C-suite executives. Be direct, specific, and action-oriented. Every sentence must carry information.',
    messages: [{
      role: 'user',
      content: `Week of ${weekOf} brief context:\n${briefContext}\n\nNEW INTERNAL SIGNALS received after this brief was generated:\n${signalLines.join('\n')}\n\nWrite a concise "Late Intelligence Update" (2-3 paragraphs) that:\n1. Connects these new signals to what the brief already identified\n2. Highlights any changes to the risk or opportunity picture\n3. Ends with 1-2 specific recommended actions`,
    }],
  })

  const summary = msg.content
    .filter(b => b.type === 'text')
    .map(b => (b as { text: string }).text)
    .join('')

  await db.from('brief_intel_patches').upsert({
    company_id:   user.companyId,
    brief_id:     briefId,
    summary,
    signal_count: totalSignals,
    updated_at:   new Date().toISOString(),
  }, { onConflict: 'company_id,brief_id' })

  return NextResponse.json({ summary, signal_count: totalSignals })
}
