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
  updated_at: string
}

export interface Company {
  id: string
  user_id: string
  name: string
  industry: string
  company_type?: 'B2B' | 'B2C' | 'B2B2C'
  stock_ticker?: string | null
  website?: string | null
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
}

export interface GeopoliticalItem {
  region: string
  headline: string
  detail: string
  relevance: string
  source?: string
}

export interface CompetitorMoveItem {
  competitor: string
  type: 'product_launch' | 'pricing' | 'partnership' | 'expansion' | 'other'
  headline: string
  detail: string
  threat_level: 'low' | 'medium' | 'high'
}

export interface CustomerIntelItem {
  customer: string
  headline: string
  detail: string
  revenue_impact: string
  signal_type: 'spending_cut' | 'growth' | 'financial_distress' | 'strategic_shift' | 'leadership_change' | 'general'
  sentiment: 'positive' | 'neutral' | 'negative'
  source?: string
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
}

export interface TechIntelItem {
  category: string
  headline: string
  detail: string
  cto_action: string
  relevance: 'direct' | 'watch' | 'awareness'
  source?: string
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

export interface CompanyNewsItem {
  headline: string
  summary: string
  sentiment: 'positive' | 'neutral' | 'negative'
  category: string
  exec_note: string
  source?: string
  source_url?: string
  date?: string
}

export interface WeeklyAction {
  action: string
  owner: 'CEO' | 'CFO' | 'CMO' | 'CTO' | 'CBPO' | 'VP HR' | 'All'
  priority: 'high' | 'medium' | 'low'
  section: string
}

export interface BriefContent {
  headline: string
  tldr?: string
  executive_summary: string
  swot: SWOTAnalysis
  financial_news: FinancialNewsItem[]
  geopolitical_news: GeopoliticalItem[]
  competitor_intelligence: CompetitorMoveItem[]
  marketing_opportunities: MarketingOpportunityItem[]
  financial_signals: FinancialSignalItem[]
  operational_intelligence: OperationalAlert[]
  risk_summary: RiskItem[]
  capital_impact: CapitalImpact
  tech_intelligence: TechIntelItem[]
  hr_intelligence: HRIntelItem[]
  ma_watch: MAItem[]
  company_news: CompanyNewsItem[]
  customer_intelligence: CustomerIntelItem[]
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

export type DashboardVisualData =
  | StrategicImpactScoreData
  | CompanyExposureMapData
  | RiskHeatmapData
  | OpportunityRadarData
  | DecisionRadarData
  | CompetitivePressureMapData
  | StrategicMomentumTrackerData

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
