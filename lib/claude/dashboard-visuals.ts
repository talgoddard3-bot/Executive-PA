import { anthropic } from './client'
import type { BriefContent, DashboardVisualsResult } from '@/lib/types'

const SYSTEM_PROMPT = `You are the strategic visualization engine for an executive intelligence platform.

Your job is to decide which 1–3 dashboard visuals should be shown this week for executives, based on all available intelligence.

ANTI-BLOAT RULE: If only one visual is truly justified, return only one. Do not force multiple visuals. Quality over coverage.

DASHBOARD PLACEMENT LOGIC:
- Prefer one primary visual (priority 1) and at most two supporting visuals.
- Priority 1 must represent the single most important executive takeaway of the week.
- Only add priority 2 or 3 if they communicate something materially different from priority 1.

VISUAL SELECTION RESTRICTIONS:
- Only use Strategic Impact Score when there is a clearly dominant signal.
- Only use Company Exposure Map when company-specific affected areas are concrete and named.
- Only use Decision Radar when leadership action is directly implied, not merely interesting.

AVAILABLE VISUAL TYPES (choose only from these):
1. Strategic Impact Score — one dominant signal with business importance score
2. Company Exposure Map — specific company domains/customers/geographies exposed
3. Risk Heatmap — multiple risks building across categories
4. Opportunity Radar — multiple positive developments
5. Decision Radar — leadership action required
6. Competitive Pressure Map — competitor actions are strategically important
7. Strategic Momentum Tracker — main value is trend direction over time

Return valid JSON only. No markdown. No explanation outside JSON.

OUTPUT SCHEMA:
{
  "dashboard_visuals": [
    {
      "visual_type": "...",
      "priority": 1,
      "title": "short executive-friendly title",
      "why_selected": "1-2 sentence explanation",
      "data": { ... structured data for this visual type ... }
    }
  ]
}

DATA STRUCTURES:

Strategic Impact Score: { "score": 8.7, "direction": "rising", "time_horizon": "near-term", "confidence": "medium", "primary_theme": "...", "rationale": "..." }
Company Exposure Map: { "exposures": [{ "area": "...", "level": "high", "why": "...", "entities": ["..."] }] }
Risk Heatmap: { "risks": [{ "category": "regulation|supply_chain|competition|demand|geopolitics|technology|currency|talent", "severity": "high", "why": "..." }] }
Opportunity Radar: { "opportunities": [{ "area": "...", "strength": "high", "why": "..." }] }
Decision Radar: { "decisions": [{ "issue": "...", "urgency": "immediate|decide soon|monitor", "function": "CEO / Strategy", "why": "..." }] }
Competitive Pressure Map: { "pressures": [{ "competitor": "...", "level": "high", "why": "..." }] }
Strategic Momentum Tracker: { "momentum_items": [{ "theme": "...", "momentum": "accelerating|stable|weakening", "why": "..." }] }`

export async function generateDashboardVisuals(
  content: BriefContent,
  companyName: string
): Promise<DashboardVisualsResult | null> {
  try {
    const briefSummary = buildBriefSummary(content, companyName)

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Company: ${companyName}

WEEKLY INTELLIGENCE BRIEF SUMMARY:
${briefSummary}

Select the 1–3 highest-value dashboard visuals for this week's executive overview. Remember: if only one is truly justified, return only one.`
      }],
    })

    const text = message.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.warn('[dashboard-visuals] No valid JSON returned')
      return null
    }

    const parsed = JSON.parse(jsonMatch[0])
    return {
      generated_at: new Date().toISOString(),
      dashboard_visuals: parsed.dashboard_visuals ?? [],
    } satisfies DashboardVisualsResult

  } catch (err) {
    console.warn('[dashboard-visuals] Failed:', err)
    return null
  }
}

function buildBriefSummary(content: BriefContent, companyName: string): string {
  const lines: string[] = []

  lines.push(`HEADLINE: ${content.headline}`)
  if (content.tldr) lines.push(`TL;DR: ${content.tldr}`)
  lines.push(`EXECUTIVE SUMMARY: ${content.executive_summary}`)

  const add = (label: string, items: string[]) => {
    if (items.length) lines.push(`\n${label}:\n${items.map(x => `  • ${x}`).join('\n')}`)
  }

  add('RISKS', (content.risk_summary ?? []).map(r =>
    `[${r.severity.toUpperCase()}] ${r.title} — ${r.detail.slice(0, 120)}`
  ).slice(0, 5))

  add('COMPETITORS', (content.competitor_intelligence ?? []).map(c =>
    `${c.competitor}: ${c.headline} (threat: ${c.threat_level})`
  ).slice(0, 4))

  add('GEOPOLITICAL', (content.geopolitical_news ?? []).map(g =>
    `${g.region}: ${g.headline} — ${g.relevance?.slice(0, 80) ?? ''}`
  ).slice(0, 4))

  add('FINANCIAL', [
    ...(content.financial_news ?? []).map(f => `${f.market}: ${f.headline} — ${f.impact?.slice(0, 80) ?? ''}`),
    ...(content.financial_signals ?? []).map(f => `${f.category}: ${f.headline}`),
  ].slice(0, 5))

  add('OPPORTUNITIES', (content.marketing_opportunities ?? []).map(o =>
    `[${o.urgency}] ${o.channel}: ${o.opportunity}`
  ).slice(0, 3))

  add('M&A', (content.ma_watch ?? []).map(m =>
    `${m.type.toUpperCase()}: ${m.headline} (${m.relevance})`
  ).slice(0, 3))

  add('DECISIONS', (content.decision_framing ?? []).map(d =>
    d.question
  ).slice(0, 3))

  add('SWOT SIGNALS', [
    ...(content.swot?.opportunities ?? []).slice(0, 2).map(i => `[OPP] ${i.point.slice(0, 100)}`),
    ...(content.swot?.threats ?? []).slice(0, 2).map(i => `[THREAT] ${i.point.slice(0, 100)}`),
  ])

  if (content.capital_impact) {
    lines.push(`\nCAPITAL IMPACT: ${content.capital_impact.revenue_exposure} | ${content.capital_impact.margin_pressure}`)
  }

  return lines.join('\n')
}
