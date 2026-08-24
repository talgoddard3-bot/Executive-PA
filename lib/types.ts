export type LocationType = 'hq' | 'manufacturing' | 'sales' | 'r&d' | 'office'

export interface CompanyLocation {
  id: string
  company_id: string
  country_code: string
  country_name: string
  city?: string | null
  location_types: LocationType[]
  headcount?: number | null
  notes?: string | null
  created_at: string
}

export interface RevenueCountry {
  country: string
  sector: string
}

export interface SupplierCountry {
  country: string
  materials: string
}

export interface Competitor {
  name: string
  ticker?: string
  notes: string
}

export interface Customer {
  name: string
  notes: string
}

export interface CompanyProfile {
  id: string
  company_id: string
  revenue_countries: RevenueCountry[]
  supplier_countries: SupplierCountry[]
  competitors: Competitor[]
  customers: Customer[]
  keywords: string[]
  commodities: string[]
  products?: string | null
  company_notes?: string | null
  vision?: string | null
  mission?: string | null
  stock_ticker?: string | null
  ir_page_url?: string | null
  ir_last_report_url?: string | null
  ir_last_report_title?: string | null
  ir_last_report_summary?: string | null
  ir_last_checked_at?: string | null
  updated_at: string
}

export interface Company {
  id: string
  user_id: string
  name: string
  industry: string
  company_type?: 'B2B' | 'B2C' | 'B2B2C' | 'NGO' | 'Investor'
  stock_ticker?: string | null
  website?: string | null
  website_url?: string | null
  logo_url?: string | null
  brand_color?: string | null
  created_at: string
  updated_at: string
  company_profiles?: CompanyProfile[]
}

export interface StoredDataPoint {
  date: string
  value: number
}

export interface StoredSparkline {
  label: string
  ticker: string
  unit: string
  data: StoredDataPoint[]
  current: number
  open: number
  pct: number
  up: boolean
}

export interface FinancialNewsItem {
  market: string
  headline: string
  detail: string
  impact: string
  source?: string
  source_url?: string
  source_excerpt?: string
}

export interface GeopoliticalItem {
  region: string
  headline: string
  detail: string
  relevance: string
  source?: string
  source_url?: string
  source_excerpt?: string
}

export interface CompetitorMoveItem {
  competitor: string
  type: 'product_launch' | 'pricing' | 'partnership' | 'expansion' | 'other'
  headline: string
  detail: string
  threat_level: 'low' | 'medium' | 'high'
  source?: string
  source_url?: string
  source_excerpt?: string
}

export interface CustomerIntelItem {
  customer: string
  headline: string
  detail: string
  revenue_impact: string
  signal_type: 'spending_cut' | 'growth' | 'financial_distress' | 'strategic_shift' | 'leadership_change' | 'general'
  sentiment: 'positive' | 'neutral' | 'negative'
  source?: string
  source_url?: string
  source_excerpt?: string
}

export interface RiskItem {
  title: string
  detail: string
  severity: 'low' | 'medium' | 'high'
  timeframe: 'immediate' | 'near-term' | 'long-term'
}

export interface CapitalImpact {
  revenue_exposure: string
  margin_pressure: string
  capex_considerations: string
}

export interface DecisionFrame {
  question: string
  context: string
  options: string[]
}

export interface Scenario {
  title: string
  probability: 'low' | 'medium' | 'high'
  trigger: string
  impact: string
  response: string
}

export interface MarketingOpportunityItem {
  channel: string
  opportunity: string
  rationale: string
  urgency: 'low' | 'medium' | 'high'
}

export interface MarketSegmentItem {
  segment_type: 'audience' | 'channel' | 'lifestyle' | 'needs' | 'value' | 'jobs'
  segment_name: string
  description: string
  size_signal: 'growing' | 'stable' | 'declining'
  differentiation: string
  competitive_vulnerability: string
  signal_source: string
  channel_priority: 'high' | 'medium' | 'low'
  urgency: 'act-now' | 'monitor' | 'awareness'
}

export interface FinancialSignalItem {
  category: string
  headline: string
  detail: string
  cfo_action: string
}

export interface OperationalAlert {
  area: string
  headline: string
  detail: string
  mitigation: string
}

export interface HRIntelItem {
  category: string
  headline: string
  detail: string
  company_impact: string
  action: string
  signal_type: 'competitor' | 'market' | 'regulatory' | 'economic'
  source?: string
  source_url?: string
  source_excerpt?: string
}

export interface MAItem {
  type: 'acquisition' | 'merger' | 'funding' | 'ipo' | 'divestiture' | 'rumour'
  headline: string
  acquirer?: string
  target: string
  deal_size?: string
  detail: string
  strategic_read: string
  bd_action: string
  relevance: 'direct' | 'adjacent' | 'watch'
  source?: string
  source_url?: string
  source_excerpt?: string
}

export interface TechIntelItem {
  category: string
  headline: string
  detail: string
  cto_action: string
  relevance: 'direct' | 'watch' | 'awareness'
  source?: string
  source_url?: string
  source_excerpt?: string
}

export interface SWOTItem {
  point: string
  source: string
  urgency?: 'low' | 'medium' | 'high'
}

export interface SWOTAnalysis {
  strengths:     SWOTItem[]
  weaknesses:    SWOTItem[]
  opportunities: SWOTItem[]
  threats:       SWOTItem[]
}

// ── Strategic Framework Engine (Phase 1: PESTEL + Five Forces) ─────────────
// Same pattern as SWOT: structured, evidence-required, allowed to be sparse
// or entirely absent when there isn't enough this-week evidence to support it.

export interface PESTELItem {
  point: string
  source: string
}

export interface PESTELAnalysis {
  political?: PESTELItem[]
  economic?: PESTELItem[]
  social?: PESTELItem[]
  technological?: PESTELItem[]
  environmental?: PESTELItem[]
  legal?: PESTELItem[]
}

export interface FiveForcesAssessment {
  force: 'rivalry' | 'new_entrants' | 'supplier_power' | 'buyer_power' | 'substitutes'
  level: 'low' | 'medium' | 'high'
  change: 'up' | 'down' | 'unchanged'
  rationale: string
  source: string
}

export interface FiveForcesAnalysis {
  forces: FiveForcesAssessment[]
}

// ── What Changed — computed in code from the current vs. previous brief,
// never LLM-generated prose. See lib/claude/what-changed.ts.
export interface WhatChangedItem {
  type: 'risk_new' | 'risk_resolved' | 'swot_new' | 'competitor_move' | 'urgency_shift' | 'five_forces_shift'
  title: string
  direction: 'up' | 'down' | 'new' | 'resolved'
  detail: string
}

export interface CompanyNewsItem {
  headline: string
  summary: string
  sentiment: 'positive' | 'neutral' | 'negative'
  category: string
  exec_note: string
  source?: string
  source_url?: string
  source_excerpt?: string
  date?: string
}

export interface WeeklyAction {
  action: string
  owner: 'CEO' | 'CFO' | 'CMO' | 'CTO' | 'CBPO' | 'VP HR' | 'All'
  priority: 'high' | 'medium' | 'low'
  section: string
}

export interface InternalIntelItem {
  category: 'Financials' | 'Sales' | 'Marketing' | 'Legal/Contract' | 'Customer Intel' | 'Risk Flag' | 'Opportunity' | 'General'
  headline: string
  detail: string
  source_type: 'note' | 'document'
  source_title?: string          // note category or document title this was drawn from
  action: string
  urgency: 'high' | 'medium' | 'low'
}

export interface BriefContent {
  headline: string
  tldr?: string
  sector_tags?: string[]        // e.g. ["fintech", "regulation", "AI"]
  region_tags?: string[]        // e.g. ["US", "EU", "APAC"]
  read_time?: number            // estimated minutes
  urgency?: 'act-now' | 'monitor' | 'awareness'   // 🔴🟡🟢
  so_what?: string              // 1-paragraph opinionated decision-maker insight
  executive_summary: string
  swot: SWOTAnalysis
  pestel?: PESTELAnalysis
  five_forces?: FiveForcesAnalysis
  what_changed?: WhatChangedItem[]
  financial_news: FinancialNewsItem[]
  geopolitical_news: GeopoliticalItem[]
  competitor_intelligence: CompetitorMoveItem[]
  marketing_opportunities: MarketingOpportunityItem[]
  market_segmentation: MarketSegmentItem[]
  financial_signals: FinancialSignalItem[]
  operational_intelligence: OperationalAlert[]
  risk_summary: RiskItem[]
  capital_impact: CapitalImpact
  tech_intelligence: TechIntelItem[]
  hr_intelligence: HRIntelItem[]
  ma_watch: MAItem[]
  company_news: CompanyNewsItem[]
  customer_intelligence: CustomerIntelItem[]
  internal_intelligence?: InternalIntelItem[]
  decision_framing: DecisionFrame[]
  scenario_modeling: Scenario[]
  weekly_actions?: WeeklyAction[]
  market_snapshots?: Record<string, StoredSparkline>
  trend_insights?: TrendInsights
  dashboard_visuals?: DashboardVisualsResult
}

export interface TrendTheme {
  title: string                                           // 4–7 word punchy title
  analysis: string                                        // 2–3 substantive sentences
  signal: 'escalating' | 'recurring' | 'emerging' | 'resolving'
}

export interface TrendInsights {
  generated_at: string
  briefs_compared: number
  summary: string
  themes: TrendTheme[]
  watch_items: string[]
  // legacy compat
  trends?: unknown[]
}

// ── Dashboard Visuals ─────────────────────────────────────────────────────────

export type DashboardVisualType =
  | 'Strategic Impact Score'
  | 'Company Exposure Map'
  | 'Risk Heatmap'
  | 'Opportunity Radar'
  | 'Decision Radar'
  | 'Competitive Pressure Map'
  | 'Strategic Momentum Tracker'
  | 'BCG Growth-Share Matrix'

export interface StrategicImpactScoreData {
  score: number
  direction: 'rising' | 'stable' | 'falling'
  time_horizon: 'immediate' | 'near-term' | 'long-term'
  confidence: 'low' | 'medium' | 'high'
  primary_theme: string
  rationale: string
}
export interface CompanyExposureMapData {
  exposures: { area: string; level: 'low' | 'medium' | 'high'; why: string; entities?: string[] }[]
}
export interface RiskHeatmapData {
  risks: { category: string; severity: 'low' | 'medium' | 'high'; why: string }[]
}
export interface OpportunityRadarData {
  opportunities: { area: string; strength: 'low' | 'medium' | 'high'; why: string }[]
}
export interface DecisionRadarData {
  decisions: { issue: string; urgency: 'monitor' | 'decide soon' | 'immediate'; function: string; why: string }[]
}
export interface CompetitivePressureMapData {
  pressures: { competitor: string; level: 'low' | 'medium' | 'high'; why: string }[]
}
export interface StrategicMomentumTrackerData {
  momentum_items: { theme: string; momentum: 'accelerating' | 'stable' | 'weakening'; why: string }[]
}
export interface BCGGrowthShareMatrixData {
  items: {
    name: string
    category: 'star' | 'cash-cow' | 'question-mark' | 'dog'
    market_growth: 'high' | 'low'
    relative_market_share: 'high' | 'low'
    why: string
  }[]
}

export type DashboardVisualData =
  | StrategicImpactScoreData
  | CompanyExposureMapData
  | RiskHeatmapData
  | OpportunityRadarData
  | DecisionRadarData
  | CompetitivePressureMapData
  | StrategicMomentumTrackerData
  | BCGGrowthShareMatrixData

export interface DashboardVisual {
  visual_type: DashboardVisualType
  priority: number
  title: string
  why_selected: string
  data: DashboardVisualData
}

export interface DashboardVisualsResult {
  generated_at: string
  dashboard_visuals: DashboardVisual[]
}

export interface Brief {
  id: string
  company_id: string
  status: 'pending' | 'generating' | 'complete' | 'failed'
  content: BriefContent | null
  generated_at: string | null
  week_of: string
  created_at: string
}
