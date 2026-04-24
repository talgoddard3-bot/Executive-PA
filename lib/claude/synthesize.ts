import { anthropic } from './client'
import { SYSTEM_PROMPT, buildUserPrompt } from './prompts'
import { buildLiveSignals } from '@/lib/live-signals'
import { fetchLiveMarketData } from '@/lib/live-market-data'
import { buildInternalSignals } from '@/lib/internal-signals'
import { supabaseAdmin as supabase } from '@/lib/supabase/server'
import type { Company, CompanyProfile, BriefContent } from '@/lib/types'

export async function synthesizeBrief(
  company: Company,
  profile: CompanyProfile,
  userId?: string
): Promise<BriefContent> {
  const revenueCountries = profile.revenue_countries.map(r => r.country)

  // Fetch operational locations for country-level signals
  const { data: locationsData } = await supabase
    .from('company_locations')
    .select('*')
    .eq('company_id', company.id)
  const locations = locationsData ?? []

  const locationCountryNames = locations.map((l: { country_name: string }) => l.country_name)

  // Fetch most recent completed brief for differentiation context
  const { data: prevBriefs } = await supabase
    .from('briefs')
    .select('content, week_of')
    .eq('company_id', company.id)
    .eq('status', 'complete')
    .order('week_of', { ascending: false })
    .limit(1)

  let previousBriefContext = ''
  if (prevBriefs && prevBriefs.length > 0) {
    const prev = prevBriefs[0]
    const prevContent = prev.content as BriefContent
    const riskTitles = (prevContent.risk_summary ?? [])
      .slice(0, 4)
      .map((r: { title: string }) => `  - ${r.title}`)
      .join('\n')
    previousBriefContext = [
      `Week of ${prev.week_of}`,
      `Headline: ${prevContent.headline ?? '(none)'}`,
      `TLDR: ${prevContent.tldr ?? '(none)'}`,
      riskTitles ? `Risks flagged:\n${riskTitles}` : '',
    ].filter(Boolean).join('\n')
  }

  // Signals first — market data fetch needs them for context-aware chart selection
  const [signals, userProfileResult, internalSignals] = await Promise.all([
    buildLiveSignals(company, profile, locations),
    userId
      ? supabase.from('user_profiles').select('language').eq('user_id', userId).single()
      : Promise.resolve({ data: null }),
    buildInternalSignals(company.id).catch(err => {
      console.warn('[internal-signals] failed, skipping:', err)
      return ''
    }),
  ])

  const language = userProfileResult.data?.language ?? 'English'
  const cappedSignals = signals.length > 40000 ? signals.slice(0, 40000) + '\n[signals truncated]' : signals
  const signalsWithInternal = internalSignals ? internalSignals + cappedSignals : cappedSignals

  const marketSnapshots = await fetchLiveMarketData(revenueCountries, {
    stockTicker: company.stock_ticker ?? undefined,
    companyName: company.name,
    competitors: profile.competitors,
    commodities: profile.commodities,
    locationCountryNames,
    customers: profile.customers ?? [],
    signals: signalsWithInternal,
  }).catch(err => {
    console.error('[market-data] failed, using empty snapshots:', err)
    return {} as Record<string, import('@/lib/types').StoredSparkline>
  })

  const userPrompt = buildUserPrompt(company, profile, signalsWithInternal, language, locations, previousBriefContext)

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 12000,
    system: SYSTEM_PROMPT,
    tools: [
      {
        name: 'generate_brief',
        description: 'Output the complete weekly intelligence brief as structured JSON.',
        input_schema: {
          type: 'object' as const,
          properties: { brief: { type: 'object', description: 'The full BriefContent object' } },
          required: ['brief'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'generate_brief' },
    messages: [{ role: 'user', content: userPrompt }],
  })

  console.log('[synthesize] tokens used:', {
    company: company.name,
    input_tokens: message.usage.input_tokens,
    output_tokens: message.usage.output_tokens,
    estimated_cost_usd: (
      (message.usage.input_tokens * 0.000003) +
      (message.usage.output_tokens * 0.000015)
    ).toFixed(4),
  })

  const toolBlock = message.content.find(b => b.type === 'tool_use')
  if (!toolBlock || toolBlock.type !== 'tool_use') {
    throw new Error('Claude did not return a tool_use block')
  }
  const content = (toolBlock.input as { brief: BriefContent }).brief

  if (Object.keys(marketSnapshots).length > 0) {
    content.market_snapshots = marketSnapshots
  }

  return content
}
