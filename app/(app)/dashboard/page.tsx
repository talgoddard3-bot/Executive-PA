import { createClient } from '@supabase/supabase-js'
import { getSessionCompanyId } from '@/lib/get-company'
import HistoricDashboard from '@/components/dashboard/HistoricDashboard'
import type { BriefAggregate } from '@/components/dashboard/HistoricDashboard'
import type { BriefContent, TrendInsights } from '@/lib/types'

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

    const risks       = c.risk_summary ?? []
    const competitors = c.competitor_intelligence ?? []
    const decisions   = c.decision_framing ?? []
    const geoItems    = c.geopolitical_news ?? []
    const finSignals  = c.financial_signals ?? []
    const companyNews = c.company_news ?? []

    const riskHigh = risks.filter(r => r.severity === 'high').length
    const riskMed  = risks.filter(r => r.severity === 'medium').length
    const riskLow  = risks.filter(r => r.severity === 'low').length

    const topHighRisk = risks.find(r => r.severity === 'high') ?? null
    const topCompetitor = competitors[0] ?? null
    const topDecision   = decisions[0] ?? null
    const topGeo        = geoItems[0] ?? null
    const topFinancial  = finSignals[0] ?? null
    const topCompanyNews = companyNews[0] ?? null

    const snaps = c.market_snapshots ?? {}

    const weekDate  = new Date(b.week_of)
    const weekOf    = weekDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    const weekShort = weekDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

    return {
      id:                   b.id,
      weekOf,
      weekOfDate:           b.week_of,
      weekShort,
      headline:             c.headline ?? '',
      executiveSummary:     c.executive_summary ?? '',
      riskHigh,
      riskMed,
      riskLow,
      topRisks:             risks.filter(r => r.severity === 'high').slice(0, 3).map(r => ({ title: r.title, severity: r.severity })),
      topRiskTitle:         topHighRisk?.title ?? null,
      topRiskDetail:        topHighRisk?.detail?.slice(0, 120) ?? null,
      topRiskTimeframe:     topHighRisk?.timeframe ?? null,
      topCompetitorName:    topCompetitor?.competitor ?? null,
      topCompetitorHeadline: topCompetitor?.headline ?? null,
      topCompetitorThreat:  topCompetitor?.threat_level ?? null,
      topDecisionQuestion:  topDecision?.question ?? null,
      topDecisionContext:   topDecision?.context?.slice(0, 100) ?? null,
      topGeoRegion:         topGeo?.region ?? null,
      topGeoHeadline:       topGeo?.headline ?? null,
      topFinancialCategory: topFinancial?.category ?? null,
      topFinancialHeadline: topFinancial?.headline ?? null,
      topCompanyNewsTitle:  topCompanyNews?.headline ?? null,
      capitalImpactRevenue: c.capital_impact?.revenue_exposure?.slice(0, 120) ?? null,
      competitorCount:      competitors.length,
      maCount:              (c.ma_watch ?? []).length,
      scenarioCount:        (c.scenario_modeling ?? []).length,
      decisionCount:        decisions.length,
      sp500:                snaps['sp500']?.current ?? null,
      dxy:                  snaps['dxy']?.current   ?? null,
      gold:                 snaps['gold']?.current  ?? null,
      // competitor names for recurring detection
      allCompetitorNames:   competitors.map(ci => ci.competitor),
      allHighRiskTitles:    risks.filter(r => r.severity === 'high').map(r => r.title),
      allCompetitorThreats: competitors.map(ci => ({ name: ci.competitor, level: ci.threat_level })),
    }
  })

  const latestBrief = briefs?.[(briefs?.length ?? 0) - 1]
  const trendInsights = latestBrief
    ? ((latestBrief.content as BriefContent)?.trend_insights ?? null) as TrendInsights | null
    : null

  const latestBriefFull = latestBrief
    ? (latestBrief.content as BriefContent)
    : null

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-[1100px] mx-auto">
        <HistoricDashboard
          aggregates={aggregates}
          latestBriefId={latestBrief?.id ?? null}
          companyName={company.name}
          trendInsights={trendInsights}
          latestBriefContent={latestBriefFull}
        />
      </div>
    </div>
  )
}
