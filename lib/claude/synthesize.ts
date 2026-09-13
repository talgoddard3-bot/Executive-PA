import { anthropic } from './client'
import { SYSTEM_PROMPT, buildCoreUserPrompt, buildFrameworksUserPrompt } from './prompts'
import { buildLiveSignals } from '@/lib/live-signals'
import { fetchLiveMarketData } from '@/lib/live-market-data'
import { buildInternalSignals } from '@/lib/internal-signals'
import { formatIRBlock } from '@/lib/investor-relations'
import { computeWhatChanged } from './what-changed'
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
  const cappedSignals = signals.length > 40000 ? signals.slice(0, 40000) + '\n[signals truncated]' : signals
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

  const coreUserPrompt = buildCoreUserPrompt(company, profile, signalsWithInternal, language, locations, previousBriefContext)
  const frameworksUserPrompt = buildFrameworksUserPrompt(company, profile, signalsWithInternal, language, locations, previousBriefContext)

  // Core content and strategic frameworks run as two parallel Claude calls
  // instead of one sequential mega-call — same total content, but wall-clock
  // time is bounded by the larger of the two rather than their sum. This
  // matters on Vercel Hobby's 300s function ceiling.
  const [coreMessage, frameworksMessage] = await Promise.all([
    anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 10000,
      system: SYSTEM_PROMPT,
      tools: [
        {
          name: 'generate_brief_core',
          description: 'Output the core sections of the weekly intelligence brief as structured JSON.',
          input_schema: {
            type: 'object' as const,
            properties: { brief: { type: 'object', description: 'The core BriefContent fields (everything except swot/pestel/five_forces)' } },
            required: ['brief'],
          },
        },
      ],
      tool_choice: { type: 'tool', name: 'generate_brief_core' },
      messages: [{ role: 'user', content: coreUserPrompt }],
    }),
    anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      tools: [
        {
          name: 'generate_brief_frameworks',
          description: 'Output the strategic framework sections (SWOT, PESTEL, Five Forces) as structured JSON.',
          input_schema: {
            type: 'object' as const,
            properties: { brief: { type: 'object', description: 'An object with swot, pestel, and five_forces fields' } },
            required: ['brief'],
          },
        },
      ],
      tool_choice: { type: 'tool', name: 'generate_brief_frameworks' },
      messages: [{ role: 'user', content: frameworksUserPrompt }],
    }),
  ])

  console.log('[synthesize] tokens used:', {
    company: company.name,
    core_input_tokens: coreMessage.usage.input_tokens,
    core_output_tokens: coreMessage.usage.output_tokens,
    frameworks_input_tokens: frameworksMessage.usage.input_tokens,
    frameworks_output_tokens: frameworksMessage.usage.output_tokens,
    estimated_cost_usd: (
      ((coreMessage.usage.input_tokens + frameworksMessage.usage.input_tokens) * 0.000003) +
      ((coreMessage.usage.output_tokens + frameworksMessage.usage.output_tokens) * 0.000015)
    ).toFixed(4),
  })

  const coreToolBlock = coreMessage.content.find(b => b.type === 'tool_use')
  if (!coreToolBlock || coreToolBlock.type !== 'tool_use') {
    throw new Error('Claude did not return a tool_use block for core content')
  }
  const frameworksToolBlock = frameworksMessage.content.find(b => b.type === 'tool_use')
  if (!frameworksToolBlock || frameworksToolBlock.type !== 'tool_use') {
    throw new Error('Claude did not return a tool_use block for strategic frameworks')
  }

  const coreBrief = (coreToolBlock.input as { brief: Omit<BriefContent, 'swot' | 'pestel' | 'five_forces'> }).brief
  const frameworks = (frameworksToolBlock.input as { brief: Pick<BriefContent, 'swot' | 'pestel' | 'five_forces'> }).brief

  const content: BriefContent = {
    ...coreBrief,
    swot: frameworks.swot,
    pestel: frameworks.pestel,
    five_forces: frameworks.five_forces,
  }

  if (Object.keys(marketSnapshots).length > 0) {
    content.market_snapshots = marketSnapshots
  }

  content.what_changed = computeWhatChanged(content, previousBriefContent)

  return content
}
