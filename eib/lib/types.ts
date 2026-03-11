export type LocationType = 'hq' | 'manufacturing' | 'sales' | 'r&d' | 'office'

export interface CompanyLocation {
  id: string
  company_id: string
  country_code: string   // ISO 3166-1 alpha-2: 'IL', 'GB', 'FR'
  country_name: string
  city?: string | null
  location_type: LocationType
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
  notes: string
}

export interface Customer {
  name: string
  notes: string   // what they buy, relationship type, sector
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
  stock_ticker?: string | null   // e.g. "AAPL", "TSLA" — empty if private
  logo_url?: string | null
  brand_color?: string | null   // hex e.g. "#2563eb", extracted from logo
  created_at: string
  updated_at: string
  company_profiles?: CompanyProfile[]
}

// ── Market data snapshots (stored inside brief content) ──────────────────────

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

// ── Brief Content Schema ────────────────────────────────────────────────────

export interface FinancialNewsItem {
  market: string          // e.g. "Germany — Automotive"
  headline: string        // one punchy sentence
  detail: string          // 2–3 sentence explanation with **bold** on key figures
  impact: string          // direct business impact for this company
  source?: string         // e.g. "Reuters", "Financial Times"
}

export interface GeopoliticalItem {
  region: string          // e.g. "Taiwan" or "EU–US Trade"
  headline: string
  detail: string          // with **bold** on key figures
  relevance: string       // why it matters to this company specifically
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
  customer: string          // customer name from profile
  headline: string          // what is happening with this customer
  detail: string            // 2–3 sentences with **bold** on key figure or development
  revenue_impact: string    // direct impact on our revenue/relationship with this customer
  signal_type: 'spending_cut' | 'growth' | 'financial_distress' | 'strategic_shift' | 'leadership_change' | 'general'
  sentiment: 'positive' | 'neutral' | 'negative'   // for our business relationship
  source?: string
}

export interface RiskItem {
  title: string
  detail: string
  severity: 'low' | 'medium' | 'high'
  timeframe: 'immediate' | 'near-term' | 'long-term'
}

export interface CapitalImpact {
  revenue_exposure: string      // how current signals affect revenue
  margin_pressure: string       // cost / pricing pressure
  capex_considerations: string  // investment timing / decisions
}

export interface DecisionFrame {
  question: string      // the decision that needs to be made
  context: string       // why it's pressing now
  options: string[]     // 2–3 concrete options
}

export interface Scenario {
  title: string
  probability: 'low' | 'medium' | 'high'
  trigger: string       // what would cause this scenario
  impact: string        // consequence for the business
  response: string      // how to prepare or respond
}

export interface MarketingOpportunityItem {
  channel: string           // e.g. "Enterprise Sales — APAC" or "D2C — US Market"
  opportunity: string       // the specific opportunity this week's signals create
  rationale: string         // why this signal makes this opportunity timely
  urgency: 'low' | 'medium' | 'high'
}

export interface FinancialSignalItem {
  category: string          // "FX Risk" | "Interest Rates" | "Credit Markets" | "Commodity Pricing" | "Equity Sentiment"
  headline: string
  detail: string
  cfo_action: string        // specific CFO action or consideration
}

export interface OperationalAlert {
  area: string              // "Logistics" | "Procurement" | "Vendor Risk" | "Production" | "Inventory"
  headline: string
  detail: string
  mitigation: string        // concrete action to address this
}

export interface HRIntelItem {
  category: string          // "Talent Market" | "Competitor Hiring" | "Executive Move" | "Workforce Restructuring" | "Compensation Trends" | "Skills Gap" | "Labour Relations"
  headline: string
  detail: string            // 2–3 sentences with **bold** on key figure or company
  company_impact: string    // what this means for our company's talent strategy
  action: string            // specific HR action or consideration
  signal_type: 'competitor' | 'market' | 'regulatory' | 'economic'
  source?: string
}

export interface MAItem {
  type: 'acquisition' | 'merger' | 'funding' | 'ipo' | 'divestiture' | 'rumour'
  headline: string
  acquirer?: string           // buyer / lead investor
  target: string              // company being acquired / funded / divested
  deal_size?: string          // e.g. "$2.4B" or "undisclosed"
  detail: string              // 2–3 sentences with **bold** on key figure or implication
  strategic_read: string      // what this deal signals about sector dynamics
  bd_action: string           // specific BD opportunity or defence for this company
  relevance: 'direct' | 'adjacent' | 'watch'   // how close to our space
  source?: string
}

export interface TechIntelItem {
  category: string          // "AI / LLM" | "Hardware" | "Software" | "Semiconductors" | "Cybersecurity" | "Emerging Tech"
  headline: string
  detail: string            // 2–3 sentences with **bold** on key product/company/figure
  cto_action: string        // specific action or consideration for the CTO
  relevance: 'direct' | 'watch' | 'awareness'   // how relevant to this company
  source?: string
}

export interface SWOTItem {
  point: string         // one sentence with **bold** on the key phrase
  source: string        // which section it came from e.g. "Competitor Intel"
  urgency?: 'low' | 'medium' | 'high'
}

export interface SWOTAnalysis {
  strengths:     SWOTItem[]
  weaknesses:    SWOTItem[]
  opportunities: SWOTItem[]
  threats:       SWOTItem[]
}

export interface CompanyNewsItem {
  headline: string          // article headline
  summary: string           // 2–3 sentence summary of the article
  sentiment: 'positive' | 'neutral' | 'negative'
  category: string          // "Product Launch" | "Partnership" | "Financial Results" | "Leadership" | "Legal / Regulatory" | "Brand / PR" | "General Coverage"
  exec_note: string         // why leadership should care about this coverage
  source?: string           // publication name
  source_url?: string       // publication homepage URL e.g. https://bloomberg.com
  date?: string             // publication date if known
}

export interface BriefContent {
  headline: string                      // one editorial headline for the week
  executive_summary: string             // 3–4 sentence lede
  swot: SWOTAnalysis                    // visual summary — rendered first
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
  market_snapshots?: Record<string, StoredSparkline>  // live data attached at generation time
  trend_insights?: TrendInsights        // generated once post-brief via Haiku
}

export interface TrendInsight {
  metric: string      // e.g. "High Risks", "Competitor Signals"
  direction: 'up' | 'down' | 'stable'
  delta: string       // e.g. "+3 vs last week"
  insight: string     // one-sentence narrative
}

export interface TrendInsights {
  generated_at: string
  briefs_compared: number    // how many briefs were analysed
  summary: string            // 2–3 sentence overall trend narrative
  trends: TrendInsight[]     // per-metric trend lines
  watch_items: string[]      // 2–3 bullet points of things to watch
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
