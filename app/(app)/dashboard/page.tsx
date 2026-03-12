import { createClient } from '@supabase/supabase-js'
import { getSessionCompanyId } from '@/lib/get-company'
import HistoricDashboard from '@/components/dashboard/HistoricDashboard'
import type { BriefAggregate } from '@/components/dashboard/HistoricDashboard'
import type { Brief, BriefContent, TrendInsights } from '@/lib/types'

export default async function DashboardPage() {
  const companyId = await getSessionCompanyId()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: company } = companyId
    ? await supabase.from('companies').select('id, name').eq('id', companyId).single()
    : { data: null }

  if (!company) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Set up your company profile first.
      </div>
    )
  }

  const { data: briefs } = await supabase
    .from('briefs')
    .select('id, week_of, content, generated_at')
    .eq('company_id', company.id)
    .eq('status', 'complete')
    .not('content', 'is', null)
    .order('week_of', { ascending: true })
    .limit(16)

  const aggregates: BriefAggregate[] = (briefs ?? []).map((b) => {
    const c = b.content as BriefContent

    const risks = c.risk_summary ?? []
    const riskHigh = risks.filter(r => r.severity === 'high').length
    const riskMed  = risks.filter(r => r.severity === 'medium').length
    const riskLow  = risks.filter(r => r.severity === 'low').length

    const snaps = c.market_snapshots ?? {}

    const weekDate = new Date(b.week_of)
    const weekOf = weekDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    const weekShort = weekDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

    return {
      id:                  b.id,
      weekOf,
      weekOfDate:          b.week_of,
      weekShort,
      headline:            c.headline ?? '',
      executiveSummary:    c.executive_summary ?? '',
      riskHigh,
      riskMed,
      riskLow,
      topRisks:            risks.filter(r => r.severity === 'high').slice(0, 3).map(r => ({ title: r.title, severity: r.severity })),
      swotStrengths:       c.swot?.strengths?.length     ?? 0,
      swotWeaknesses:      c.swot?.weaknesses?.length    ?? 0,
      swotOpportunities:   c.swot?.opportunities?.length ?? 0,
      swotThreats:         c.swot?.threats?.length       ?? 0,
      competitorCount:     (c.competitor_intelligence ?? []).length,
      maCount:             (c.ma_watch ?? []).length,
      scenarioCount:       (c.scenario_modeling ?? []).length,
      decisionCount:       (c.decision_framing ?? []).length,
      sp500:               snaps['sp500']?.current ?? null,
      dxy:                 snaps['dxy']?.current   ?? null,
      gold:                snaps['gold']?.current  ?? null,
    }
  })

  const latestBrief = briefs?.[(briefs?.length ?? 0) - 1]
  const trendInsights = latestBrief
    ? ((latestBrief.content as BriefContent)?.trend_insights ?? null) as TrendInsights | null
    : null

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-[1100px] mx-auto">
        <HistoricDashboard
          aggregates={aggregates}
          latestBriefId={latestBrief?.id ?? null}
          companyName={company.name}
          trendInsights={trendInsights}
        />
      </div>
    </div>
  )
}
