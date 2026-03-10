import { anthropic } from './client'
import { createClient } from '@supabase/supabase-js'
import type { BriefContent, TrendInsights } from '@/lib/types'

interface BriefMetrics {
  weekOf: string
  riskHigh: number
  riskMed: number
  riskLow: number
  competitors: number
  opportunities: number
  maDeals: number
  swotStrengths: number
  swotWeaknesses: number
  swotOpportunities: number
  swotThreats: number
  headline: string
}

function extractMetrics(content: BriefContent, weekOf: string): BriefMetrics {
  const risks = content.risk_summary ?? []
  const swot  = content.swot ?? { strengths: [], weaknesses: [], opportunities: [], threats: [] }
  return {
    weekOf,
    riskHigh:         risks.filter(r => r.severity === 'high').length,
    riskMed:          risks.filter(r => r.severity === 'medium').length,
    riskLow:          risks.filter(r => r.severity === 'low').length,
    competitors:      (content.competitor_intelligence ?? []).length,
    opportunities:    (content.marketing_opportunities ?? []).length,
    maDeals:          (content.ma_watch ?? []).length,
    swotStrengths:    swot.strengths?.length ?? 0,
    swotWeaknesses:   swot.weaknesses?.length ?? 0,
    swotOpportunities:swot.opportunities?.length ?? 0,
    swotThreats:      swot.threats?.length ?? 0,
    headline:         content.headline ?? '',
  }
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

    // Fetch last 4 complete briefs before this one
    const { data: prevBriefs } = await supabase
      .from('briefs')
      .select('content, week_of')
      .eq('company_id', companyId)
      .eq('status', 'complete')
      .lt('week_of', currentWeekOf)
      .order('week_of', { ascending: false })
      .limit(4)

    if (!prevBriefs || prevBriefs.length === 0) {
      // No history to compare against
      return null
    }

    const current = extractMetrics(currentContent, currentWeekOf)
    const history: BriefMetrics[] = prevBriefs.map(b =>
      extractMetrics(b.content as BriefContent, b.week_of)
    )

    // Build a compact data table for Haiku
    const allWeeks = [current, ...history]
    const dataTable = allWeeks.map(m =>
      `Week ${m.weekOf}: risks(H${m.riskHigh}/M${m.riskMed}/L${m.riskLow}) competitors(${m.competitors}) opportunities(${m.opportunities}) M&A(${m.maDeals}) SWOT(S${m.swotStrengths}/W${m.swotWeaknesses}/O${m.swotOpportunities}/T${m.swotThreats})`
    ).join('\n')

    const prompt = `You are a strategic analyst. Compare these weekly intelligence brief metrics (newest first) and produce a trend analysis.

DATA (newest first):
${dataTable}

Latest brief headline: "${current.headline}"

Produce a JSON object:
{
  "summary": "2-3 sentence narrative of the key trends across these ${allWeeks.length} briefs. Be specific about directions and magnitudes.",
  "trends": [
    { "metric": "High Risks", "direction": "up or down or stable", "delta": "e.g. +2 vs last week", "insight": "one sentence why this matters" },
    { "metric": "Competitor Signals", "direction": "up or down or stable", "delta": "...", "insight": "..." },
    { "metric": "Opportunities", "direction": "up or down or stable", "delta": "...", "insight": "..." },
    { "metric": "M&A Activity", "direction": "up or down or stable", "delta": "...", "insight": "..." },
    { "metric": "SWOT Balance", "direction": "up or down or stable", "delta": "e.g. threats +3 vs 2 weeks ago", "insight": "..." }
  ],
  "watch_items": [
    "Specific thing to watch based on trend 1",
    "Specific thing to watch based on trend 2",
    "Specific thing to watch based on trend 3"
  ]
}

Return ONLY valid JSON. No preamble.`

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.warn('[trend-insights] Haiku did not return valid JSON')
      return null
    }

    const parsed = JSON.parse(jsonMatch[0])

    return {
      generated_at: new Date().toISOString(),
      briefs_compared: allWeeks.length,
      summary: parsed.summary ?? '',
      trends: parsed.trends ?? [],
      watch_items: parsed.watch_items ?? [],
    } satisfies TrendInsights

  } catch (err) {
    console.warn('[trend-insights] Failed to generate:', err)
    return null
  }
}
