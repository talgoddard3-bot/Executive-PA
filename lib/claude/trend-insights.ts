import { anthropic } from './client'
import { createClient } from '@supabase/supabase-js'
import type { BriefContent, TrendInsights } from '@/lib/types'

interface BriefSnapshot {
  weekOf: string
  risks: string[]
  competitors: string[]
  geo: string[]
  financial: string[]
  tech: string[]
  decisions: string[]
  companyNews: string[]
  ma: string[]
  ops: string[]
}

function extractSnapshot(content: BriefContent, weekOf: string): BriefSnapshot {
  return {
    weekOf,
    risks: (content.risk_summary ?? [])
      .map(r => `[${r.severity?.toUpperCase()}] ${r.title} — ${r.detail?.slice(0, 120) ?? ''}`)
      .slice(0, 5),
    competitors: (content.competitor_intelligence ?? [])
      .map(c => `${c.competitor}: ${c.headline?.slice(0, 120) ?? ''} (threat: ${c.threat_level ?? '?'})`)
      .slice(0, 5),
    geo: (content.geopolitical_news ?? [])
      .map(g => `${g.region}: ${g.headline?.slice(0, 120) ?? ''} — ${g.detail?.slice(0, 100) ?? ''}`)
      .slice(0, 5),
    financial: [
      ...(content.financial_signals ?? []).map(f => `${f.headline?.slice(0, 120) ?? ''} — ${f.detail?.slice(0, 100) ?? ''}`),
      ...(content.financial_news ?? []).map(f => `${f.headline?.slice(0, 120) ?? ''} — ${f.detail?.slice(0, 100) ?? ''}`),
    ].filter(Boolean).slice(0, 6),
    tech: (content.tech_intelligence ?? [])
      .map(t => `${t.headline?.slice(0, 120) ?? ''} — ${t.detail?.slice(0, 80) ?? ''}`)
      .filter(Boolean)
      .slice(0, 3),
    decisions: (content.decision_framing ?? [])
      .map(d => d.question?.slice(0, 120) ?? '')
      .filter(Boolean)
      .slice(0, 3),
    companyNews: (content.company_news ?? [])
      .map(n => `${n.headline?.slice(0, 120) ?? ''} — ${n.summary?.slice(0, 80) ?? ''}`)
      .filter(Boolean)
      .slice(0, 3),
    ma: (content.ma_watch ?? [])
      .map(m => `${m.headline?.slice(0, 120) ?? ''} (${m.type ?? ''}) — ${m.detail?.slice(0, 80) ?? ''}`)
      .filter(Boolean)
      .slice(0, 3),
    ops: (content.operational_intelligence ?? [])
      .map(o => `${o.headline?.slice(0, 120) ?? ''} — ${o.detail?.slice(0, 80) ?? ''}`)
      .filter(Boolean)
      .slice(0, 3),
  }
}

function formatSnapshot(s: BriefSnapshot): string {
  const lines: string[] = [`=== WEEK ${s.weekOf} ===`]
  const add = (label: string, items: string[]) => {
    if (items.length) lines.push(`${label}:\n${items.map(x => `  • ${x}`).join('\n')}`)
  }
  add('RISKS', s.risks)
  add('COMPETITORS', s.competitors)
  add('GEOPOLITICAL', s.geo)
  add('FINANCIAL SIGNALS', s.financial)
  add('TECHNOLOGY', s.tech)
  add('KEY DECISIONS', s.decisions)
  add('COMPANY NEWS', s.companyNews)
  add('M&A', s.ma)
  add('OPERATIONS', s.ops)
  return lines.join('\n')
}

export async function generateTrendInsights(
  companyId: string,
  currentContent: BriefContent,
  currentWeekOf: string
): Promise<TrendInsights | null> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: prevBriefs } = await supabase
      .from('briefs')
      .select('content, week_of')
      .eq('company_id', companyId)
      .eq('status', 'complete')
      .lt('week_of', currentWeekOf)
      .order('week_of', { ascending: false })
      .limit(4)

    if (!prevBriefs || prevBriefs.length === 0) return null

    const current = extractSnapshot(currentContent, currentWeekOf)
    const history = prevBriefs.map(b =>
      extractSnapshot(b.content as BriefContent, b.week_of)
    )

    const allWeeks = [current, ...history]
    const briefData = allWeeks.map(formatSnapshot).join('\n\n')

    const prompt = `You are an elite strategic analyst. You have intelligence briefs from ${allWeeks.length} consecutive weeks. Your job is NOT to describe what changed — it is to find the non-obvious connections and tell the executive what they should DO or WATCH as a result.

Think like this example: "Japan's yen has weakened significantly across 3 weeks of financial signals, while geopolitical briefs flag Japanese industrial restructuring. For a company that sources from Japan, this creates a short procurement window — components are effectively cheaper right now, but currency stabilisation is likely within 60-90 days."

That is the level of insight required: specific, named, connected across signal types, with a business implication.

INTELLIGENCE BRIEFS (most recent first):
${briefData}

INSTRUCTIONS:
1. Read across ALL weeks and ALL signal categories simultaneously
2. Find 2–4 themes where signals from DIFFERENT categories (e.g. financial + geopolitical, competitor + regulatory) connect to tell a story
3. Name specific countries, currencies, companies, technologies, regulations — never use vague terms
4. Every theme must answer: "So what should the executive do or watch because of this?"
5. Only include a theme if you can trace it across at least 2 weeks OR if it combines 2+ signal types into a non-obvious conclusion
6. SKIP: pure count changes, single-week events with no trajectory, anything with no direct business implication

Return ONLY this JSON (no preamble, no markdown):
{
  "summary": "2-3 sentences. The single most important strategic narrative emerging from these weeks. Be specific — name the actual forces and what they mean for the company.",
  "themes": [
    {
      "title": "5-8 word punchy theme title — specific, not generic",
      "analysis": "2-3 sentences. What is the pattern, how has it evolved, and what is the specific business implication or action. Name specific entities.",
      "signal": "escalating | recurring | emerging | resolving"
    }
  ],
  "watch_items": [
    "Specific forward-looking action or watch point. Start with a verb. Name the specific thing to monitor and why it matters to this company."
  ]
}

themes: 2–4 items only. watch_items: 2–3 items only.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.warn('[trend-insights] No valid JSON returned')
      return null
    }

    const parsed = JSON.parse(jsonMatch[0])

    return {
      generated_at: new Date().toISOString(),
      briefs_compared: allWeeks.length,
      summary: parsed.summary ?? '',
      themes: parsed.themes ?? [],
      watch_items: parsed.watch_items ?? [],
    } satisfies TrendInsights

  } catch (err) {
    console.warn('[trend-insights] Failed to generate:', err)
    return null
  }
}
