import { anthropic } from './client'
import {
  SYSTEM_PROMPT,
  buildNarrativeUserPrompt,
  buildMarketUserPrompt,
  buildCompetitiveUserPrompt,
  buildPeopleTechUserPrompt,
  buildFrameworksUserPrompt,
} from './prompts'
import { buildLiveSignals } from '@/lib/live-signals'
import { fetchLiveMarketData } from '@/lib/live-market-data'
import { buildInternalSignals } from '@/lib/internal-signals'
import { formatIRBlock } from '@/lib/investor-relations'
import { computeWhatChanged } from './what-changed'
import { supabaseAdmin as supabase } from '@/lib/supabase/server'
import type { Company, CompanyProfile, BriefContent } from '@/lib/types'

interface BriefSlice {
  name: string
  prompt: string
  maxTokens: number
}

async function generateSlice(slice: BriefSlice): Promise<{ name: string; brief: Record<string, unknown>; inputTokens: number; outputTokens: number }> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: slice.maxTokens,
    system: SYSTEM_PROMPT,
    tools: [
      {
        name: `generate_${slice.name}`,
        description: `Output the ${slice.name} sections of the weekly intelligence brief as structured JSON.`,
        input_schema: {
          type: 'object' as const,
          properties: { brief: { type: 'object', description: 'The relevant BriefContent fields for this slice' } },
          required: ['brief'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: `generate_${slice.name}` },
    messages: [{ role: 'user', content: slice.prompt }],
  })

  if (message.stop_reason === 'max_tokens') {
    throw new Error(`Brief slice "${slice.name}" was truncated at the max_tokens limit (${message.usage.output_tokens} tokens) — raise maxTokens for this slice in synthesize.ts`)
  }

  const toolBlock = message.content.find(b => b.type === 'tool_use')
  if (!toolBlock || toolBlock.type !== 'tool_use') {
    throw new Error(`Claude did not return a tool_use block for brief slice "${slice.name}"`)
  }

  const brief = (toolBlock.input as { brief?: Record<string, unknown> }).brief
  if (!brief) throw new Error(`Brief slice "${slice.name}" tool call had no brief field`)

  return { name: slice.name, brief, inputTokens: message.usage.input_tokens, outputTokens: message.usage.output_tokens }
}

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
  let previousBriefContent: BriefContent | null = null
  if (prevBriefs && prevBriefs.length > 0) {
    const prev = prevBriefs[0]
    const prevContent = prev.content as BriefContent
    previousBriefContent = prevContent
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

  // IR reports are checked by a separate daily cron (app/api/investor-relations/check)
  // so a slow/large annual report never risks pushing this synthesis call past
  // Vercel's function time limit — just read whatever it last cached here.
  const irReportBlock = profile.ir_last_report_summary
    ? formatIRBlock(company.name, profile.ir_last_report_title, profile.ir_last_report_summary)
    : ''

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
  const cappedSignals = signals.length > 25000 ? signals.slice(0, 25000) + '\n[signals truncated]' : signals
  const signalsWithInternal = (internalSignals || '') + cappedSignals + irReportBlock

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

  // The brief is split into five small, focused Claude calls that all run
  // concurrently instead of one call writing the whole thing sequentially.
  // Each call only has to write a few hundred to ~2000 tokens, so wall-clock
  // time is bounded by the slowest of five small calls, not one huge one —
  // this is what actually keeps generation reliably under Vercel Hobby's
  // 300s function ceiling.
  const argsForSlices = [company, profile, signalsWithInternal, language, locations, previousBriefContext] as const
  const slices: BriefSlice[] = [
    { name: 'narrative', prompt: buildNarrativeUserPrompt(...argsForSlices), maxTokens: 4000 },
    { name: 'market_intelligence', prompt: buildMarketUserPrompt(...argsForSlices), maxTokens: 3000 },
    { name: 'competitive_intelligence', prompt: buildCompetitiveUserPrompt(...argsForSlices), maxTokens: 3000 },
    { name: 'people_tech_internal', prompt: buildPeopleTechUserPrompt(...argsForSlices), maxTokens: 4500 },
    { name: 'strategic_frameworks', prompt: buildFrameworksUserPrompt(...argsForSlices), maxTokens: 3000 },
  ]

  const results = await Promise.all(slices.map(generateSlice))

  console.log('[synthesize] tokens used:', {
    company: company.name,
    slices: results.map(r => ({ name: r.name, input_tokens: r.inputTokens, output_tokens: r.outputTokens })),
    estimated_cost_usd: results.reduce(
      (sum, r) => sum + (r.inputTokens * 0.000003) + (r.outputTokens * 0.000015),
      0
    ).toFixed(4),
  })

  const content = Object.assign({}, ...results.map(r => r.brief)) as BriefContent

  if (Object.keys(marketSnapshots).length > 0) {
    content.market_snapshots = marketSnapshots
  }

  content.what_changed = computeWhatChanged(content, previousBriefContent)

  return content
}
