import { anthropic } from '@/lib/claude/client'
import { createClient } from '@supabase/supabase-js'
import { getSessionCompanyId } from '@/lib/get-company'
import type { BriefContent } from '@/lib/types'

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ── Compact context builders ──────────────────────────────────────────────────

function compressBrief(c: BriefContent): string {
  const risks = (c.risk_summary ?? [])
    .map(r => `[${r.severity.toUpperCase()}] ${r.title}: ${r.detail}`).join('\n')
  const competitors = (c.competitor_intelligence ?? [])
    .map(x => `${x.competitor} (${x.threat_level}): ${x.headline}`).join('\n')
  const opportunities = (c.marketing_opportunities ?? [])
    .map(x => `${x.channel}: ${x.opportunity}`).join('\n')
  const swot = c.swot ? [
    `Strengths: ${c.swot.strengths?.map(s => s.point.replace(/\*\*/g, '')).join(' | ') ?? ''}`,
    `Weaknesses: ${c.swot.weaknesses?.map(s => s.point.replace(/\*\*/g, '')).join(' | ') ?? ''}`,
    `Opportunities: ${c.swot.opportunities?.map(s => s.point.replace(/\*\*/g, '')).join(' | ') ?? ''}`,
    `Threats: ${c.swot.threats?.map(s => s.point.replace(/\*\*/g, '')).join(' | ') ?? ''}`,
  ].join('\n') : ''
  const maDeals = (c.ma_watch ?? [])
    .map(m => `${m.headline} — BD Action: ${m.bd_action}`).join('\n')
  const geo = (c.geopolitical_news ?? [])
    .map(g => `${g.region}: ${g.headline} — ${g.relevance}`).join('\n')
  const decisions = (c.decision_framing ?? [])
    .map(d => `Decision: ${d.question} — Options: ${d.options.join(' / ')}`).join('\n')
  const capital = c.capital_impact
    ? `Revenue: ${c.capital_impact.revenue_exposure}\nMargin: ${c.capital_impact.margin_pressure}\nCapex: ${c.capital_impact.capex_considerations}`
    : ''
  const companyNews = (c.company_news ?? [])
    .map(n => `[${n.sentiment}] ${n.headline}: ${n.exec_note}`).join('\n')

  return [
    `Headline: ${c.headline}`,
    `Summary: ${c.executive_summary}`,
    swot ? `\nSWOT:\n${swot}` : '',
    risks ? `\nRisks:\n${risks}` : '',
    competitors ? `\nCompetitors:\n${competitors}` : '',
    opportunities ? `\nOpportunities:\n${opportunities}` : '',
    geo ? `\nGeopolitical:\n${geo}` : '',
    maDeals ? `\nM&A:\n${maDeals}` : '',
    decisions ? `\nDecisions:\n${decisions}` : '',
    capital ? `\nCapital Impact:\n${capital}` : '',
    companyNews ? `\nCompany News:\n${companyNews}` : '',
  ].filter(Boolean).join('\n')
}

async function buildContext(companyId: string, briefId?: string): Promise<{ context: string; companyName: string; industry: string }> {
  const db = supabase()
  const { data: company } = await db
    .from('companies')
    .select('id, name, industry, company_type')
    .eq('id', companyId)
    .single()

  const companyCtx = company
    ? `Company: ${company.name} | Industry: ${company.industry} | Type: ${company.company_type ?? 'B2B'}`
    : ''

  let briefCtx = ''
  const query = db.from('briefs').select('content, week_of').eq('company_id', company?.id ?? '')

  const { data: brief } = briefId
    ? await query.eq('id', briefId).single()
    : await query.eq('status', 'complete').order('week_of', { ascending: false }).limit(1).single()

  if (brief?.content) {
    const weekOf = new Date(brief.week_of).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    briefCtx = `\n\nBRIEF DATA (Week of ${weekOf}):\n${compressBrief(brief.content as BriefContent)}`
  }

  return {
    context: [companyCtx, briefCtx].filter(Boolean).join('\n'),
    companyName: company?.name ?? 'the company',
    industry: company?.industry ?? 'business',
  }
}

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const companyId = await getSessionCompanyId()
    if (!companyId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const { message, briefId } = await request.json()
    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: 'No message provided' }), { status: 400 })
    }

    const { context, companyName, industry } = await buildContext(companyId, briefId)

    const systemPrompt = `You are a strategic intelligence advisor for ${companyName} (${industry}).

STRICT RULES — NO EXCEPTIONS:
- Maximum 4 bullet points per response. Never more.
- Each bullet: one sentence, under 20 words.
- No prose paragraphs. No introductions. No summaries.
- Bold **one** key term per bullet — the number, name, or action.
- If multiple topics: use one short heading (## Topic), then max 3 bullets.
- End with "**→ Action:**" — one sentence, one verb, one owner.
- If not in the brief: "Not covered — " then one sentence of guidance.

BRIEF DATA:
${context}`

    const stream = new ReadableStream({
      async start(controller) {
        const response = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 600,
          stream: true,
          system: systemPrompt,
          messages: [{ role: 'user', content: message }],
        })

        for await (const event of response) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(new TextEncoder().encode(event.delta.text))
          }
        }
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (err) {
    console.error('[api/ask] error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
