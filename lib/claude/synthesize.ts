import { anthropic } from './client'
import { SYSTEM_PROMPT, buildUserPrompt } from './prompts'
import { buildLiveSignals } from '@/lib/live-signals'
import { fetchLiveMarketData } from '@/lib/live-market-data'
import { createClient } from '@supabase/supabase-js'
import type { Company, CompanyProfile, BriefContent } from '@/lib/types'

export async function synthesizeBrief(
  company: Company,
  profile: CompanyProfile,
  userId?: string
): Promise<BriefContent> {
  // Fetch live signals, market data, and user language preference in parallel
  const revenueCountries = profile.revenue_countries.map(r => r.country)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch operational locations for country-level signals
  const { data: locationsData } = await supabase
    .from('company_locations')
    .select('*')
    .eq('company_id', company.id)
  const locations = locationsData ?? []

  const [signals, marketSnapshots, userProfileResult] = await Promise.all([
    buildLiveSignals(company, profile, locations),
    fetchLiveMarketData(revenueCountries, {
      stockTicker: company.stock_ticker ?? undefined,
      companyName: company.name,
      competitors: profile.competitors,
      commodities: profile.commodities,
    }).catch(err => {
      console.error('[market-data] failed, using empty snapshots:', err)
      return {} as Record<string, import('@/lib/types').StoredSparkline>
    }),
    userId
      ? supabase.from('user_profiles').select('language').eq('user_id', userId).single()
      : Promise.resolve({ data: null }),
  ])

  const language = userProfileResult.data?.language ?? 'English'
  const userPrompt = buildUserPrompt(company, profile, signals, language, locations)

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 16000,
    messages: [{ role: 'user', content: userPrompt }],
    system: SYSTEM_PROMPT,
  })

  if (message.stop_reason === 'max_tokens') {
    console.warn('[synthesize] Response hit max_tokens — output may be truncated')
  }

  const text = message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('')

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    console.error('[synthesize] Raw Claude output (first 500 chars):', text.slice(0, 500))
    throw new Error('Claude did not return valid JSON. Check server logs for raw output.')
  }

  let content: BriefContent
  try {
    content = JSON.parse(jsonMatch[0])
  } catch (parseErr) {
    console.error('[synthesize] JSON.parse failed. Raw match (first 500 chars):', jsonMatch[0].slice(0, 500))
    throw new Error(`Brief JSON was malformed: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`)
  }

  // Attach real market snapshots so charts use live data
  if (Object.keys(marketSnapshots).length > 0) {
    content.market_snapshots = marketSnapshots
  }

  return content
}
