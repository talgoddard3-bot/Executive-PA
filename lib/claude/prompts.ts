import type { CompanyProfile, Company, CompanyLocation } from '@/lib/types'

export const SYSTEM_PROMPT = `You are a senior strategic intelligence editor producing a personalised executive briefing — think The Economist meets McKinsey, written specifically for one CEO.

Tone: precise, direct, analytical. No fluff. Every sentence earns its place.
Format: structured JSON only — no preamble, no explanation outside the JSON.
Perspective: always tie signals back to this specific company's exposure, not the world in general.

Rules:
- The brief headline is the single most consequential development of the week for this company — the one thing every executive must know. It must name a real event, a real number, or a real actor. It should feel like a front-page alert, not a theme statement. Bad: "Macroeconomic headwinds persist". Good: "German factory orders fall 8% MoM as key automotive clients delay Q2 procurement — direct revenue risk for [Company]". Always reference the company's specific exposure.
- Section headlines must be specific and newsworthy — not generic ("Markets volatile") but precise ("German automotive PMI hits 3-year low as EV transition stalls")
- Details must be 2–3 sentences maximum
- Impact and relevance statements must reference the company's exposure by country/sector — use approximate language like "a significant market", "roughly a quarter of revenue", "a key supply source" — never state exact revenue percentages (e.g. do NOT write "24% of revenue")
- Scenarios must be genuinely plausible given the signals — not theoretical
- Decision framing must present real options, not obvious platitudes
- Do not repeat the same point across sections
- Severity and probability must be calibrated — not everything is high risk
- Use **bold** around the single most important figure or phrase in each detail/impact field (e.g. "**EUR/USD fell 1.4%** this week")
- For source fields, cite the type of publication that would cover this story (e.g. "Reuters", "Financial Times", "Bloomberg", "Wall Street Journal", "The Economist")
- M&A Watch must surface deals that are strategically relevant — acquisitions, funding rounds, or IPOs that shift competitive dynamics, open partnership opportunities, or signal where the market is consolidating. Always translate the deal into a concrete BD or competitive action for this company.
- Company News must include only articles that directly name or are about this company — media coverage, press mentions, analyst commentary. Calibrate sentiment honestly. The exec_note must explain what leadership should do with this coverage (e.g. "respond publicly", "amplify via owned channels", "monitor for brand risk").
- competitor_intelligence: ONLY include a competitor if there is a CONCRETE news story or announcement about them in the signals this week. Do not fabricate moves, do not pad with general knowledge. If a listed competitor has no news, omit them entirely. An empty array is acceptable and preferred over invented items.`

export function buildUserPrompt(
  company: Company,
  profile: CompanyProfile,
  signals: string,
  language = 'English',
  locations: CompanyLocation[] = []
): string {
  const revenueLines = profile.revenue_countries
    .map((r) => `  - ${r.country} (${r.sector})`)
    .join('\n')

  const supplierLines = profile.supplier_countries
    .map((s) => `  - ${s.country} (${s.materials})`)
    .join('\n')

  const competitorLines = profile.competitors
    .map((c) => `  - ${c.name}${c.notes ? ` — ${c.notes}` : ''}`)
    .join('\n')

  const profileCustomers = (profile as CompanyProfile & { customers?: { name: string; notes: string }[] }).customers ?? []
  const customerLines = profileCustomers.length > 0
    ? profileCustomers.map((c) => `  - ${c.name}${c.notes ? ` — ${c.notes}` : ''}`).join('\n')
    : '  (none specified)'

  const companyTypeLabel = company.company_type ?? 'B2B'
  const marketingContext =
    companyTypeLabel === 'B2C'
      ? 'Consumer-facing — consider direct-to-consumer channels, retail partnerships, and brand sentiment.'
      : companyTypeLabel === 'B2B2C'
        ? 'Hybrid model — consider both enterprise sales cycles and downstream consumer demand signals.'
        : 'Enterprise sales — consider partnership channels, key account dynamics, and sector-specific procurement cycles.'

  const languageInstruction = language && language !== 'English'
    ? `\nOUTPUT LANGUAGE: Generate ALL text fields in ${language}. The JSON keys must remain in English, but all values (headlines, summaries, details, impacts, notes, etc.) must be written in ${language}.\n`
    : ''

  const locationLines = locations.length > 0
    ? locations.map(l => {
        const city = l.city ? `${l.city}, ` : ''
        const head = l.headcount ? ` (${l.headcount.toLocaleString()} employees)` : ''
        const note = l.notes ? ` — ${l.notes}` : ''
        return `  - ${city}${l.country_name}: ${l.location_type.toUpperCase()}${head}${note}`
      }).join('\n')
    : '  (none specified)'

  return `${languageInstruction}COMPANY PROFILE
Company: ${company.name}
Industry: ${company.industry}
Business Model: ${companyTypeLabel} — ${marketingContext}
Keywords: ${profile.keywords.join(', ')}

Operational Locations (physical sites — consider local labour, energy, regulation, and logistics impacts):
${locationLines}

Revenue Exposure:
${revenueLines}

Supplier Countries:
${supplierLines}

Key Competitors:
${competitorLines}

Key Customers:
${customerLines}

---
SIGNALS THIS WEEK:
${signals}

---
Produce a strategic intelligence brief as a single JSON object. Return ONLY the JSON — no markdown, no explanation.

{
  "headline": "The single most consequential event or development of this week for this company. Must name the specific event, number, or actor — not a theme. Format: [What happened] — [direct impact on this company]. Example: 'Eurozone manufacturing PMI hits 18-month low as German orders collapse — 40% revenue exposure at risk as procurement cycles stall'. Never be vague. This is the one line every executive in the company must read.",

  "executive_summary": "3–4 sentence lede. Lead with the dominant risk or opportunity, then the market context, then the company-specific implication, then the decision pressure it creates. Reference specific revenue percentages, competitor names, and market figures from the signals.",

  "swot": {
    "strengths": [
      { "point": "Company advantage this week with **bold** on the key asset", "source": "Section it came from" }
    ],
    "weaknesses": [
      { "point": "Exposed vulnerability with **bold** on the key risk factor", "source": "Section it came from" }
    ],
    "opportunities": [
      { "point": "Specific opportunity with **bold** on the key action", "source": "Section it came from", "urgency": "high or medium or low" }
    ],
    "threats": [
      { "point": "Specific threat with **bold** on the key danger", "source": "Section it came from", "urgency": "high or medium or low" }
    ]
  },

  "financial_news": [
    {
      "market": "Country — Sector",
      "headline": "Specific, factual headline",
      "detail": "2–3 sentences with **bold** on the key figure",
      "impact": "Direct impact on this company's revenue or costs in that market",
      "source": "Publication name e.g. Reuters"
    }
  ],

  "geopolitical_news": [
    {
      "region": "Country or trade bloc",
      "headline": "Specific, factual headline",
      "detail": "2–3 sentences with **bold** on the key fact",
      "relevance": "Why this matters to this company's specific exposure",
      "source": "Publication name e.g. Financial Times"
    }
  ],

  "competitor_intelligence": [
    {
      "competitor": "Competitor name",
      "type": "product_launch or pricing or partnership or expansion or other",
      "headline": "What they did",
      "detail": "2–3 sentences of context",
      "threat_level": "low or medium or high"
    }
  ],

  "marketing_opportunities": [
    {
      "channel": "Channel type or market segment (e.g. Enterprise Sales — APAC, D2C — US, Retail — UK)",
      "opportunity": "The specific marketing, sales, or channel opportunity this week's signals create",
      "rationale": "Why these signals make this opportunity timely and actionable right now — reference specific data",
      "urgency": "low or medium or high"
    }
  ],

  "financial_signals": [
    {
      "category": "FX Risk or Interest Rates or Credit Markets or Commodity Pricing or Equity Sentiment",
      "headline": "What changed in capital markets this week",
      "detail": "1–2 sentences of context relevant to this company",
      "cfo_action": "Specific action or decision consideration for the CFO — hedging, refinancing, working capital timing, etc."
    }
  ],

  "operational_intelligence": [
    {
      "area": "Logistics or Procurement or Vendor Risk or Production or Inventory",
      "headline": "The operational risk or opportunity",
      "detail": "1–2 sentences of context",
      "mitigation": "Concrete immediate action to address or exploit this — be specific"
    }
  ],

  "hr_intelligence": [
    {
      "category": "Talent Market or Competitor Hiring or Executive Move or Workforce Restructuring or Compensation Trends or Skills Gap or Labour Relations",
      "headline": "What happened in the talent or workforce space",
      "detail": "2–3 sentences with **bold** on the key figure, company, or number. What is materially new.",
      "company_impact": "How this affects our company's ability to attract, retain, or develop talent — specific to this industry and our markets",
      "action": "Specific HR or people-strategy action to consider — compensation review, headcount planning, talent pipeline, retention programme, etc.",
      "signal_type": "competitor or market or regulatory or economic",
      "source": "Publication name e.g. Financial Times, Bloomberg, HR Dive"
    }
  ],

  "tech_intelligence": [
    {
      "category": "AI / LLM or Hardware or Software or Semiconductors or Cybersecurity or Emerging Tech",
      "headline": "What was released, announced, or changed",
      "detail": "2–3 sentences with **bold** on the key product, model name, or capability. Focus on what is new and why it matters technically.",
      "cto_action": "Specific technology decision or evaluation the CTO should consider — adopt, pilot, monitor, or defend against",
      "relevance": "direct (affects our stack/operations now) or watch (worth evaluating in 6 months) or awareness (good to know)",
      "source": "Publication name e.g. TechCrunch, Wired, MIT Technology Review"
    }
  ],

  "ma_watch": [
    {
      "type": "acquisition or merger or funding or ipo or divestiture or rumour",
      "headline": "What happened — who acquired or funded whom, at what valuation",
      "acquirer": "Buyer or lead investor (omit field if not applicable)",
      "target": "Company being acquired, funded, or listed",
      "deal_size": "$Xbn or undisclosed",
      "detail": "2–3 sentences with **bold** on the key figure, valuation, or strategic rationale. What does the acquirer get? What changes in the market?",
      "strategic_read": "What this deal signals about where capital and consolidation is flowing in this sector — name the trend explicitly",
      "bd_action": "One concrete BD, partnership, or defensive action our company should consider given this deal — be specific and actionable",
      "relevance": "direct (our exact market or customer base), adjacent (related space we operate in or sell to), or watch (sector signal)",
      "source": "Publication name e.g. Bloomberg, Financial Times, TechCrunch, Reuters"
    }
  ],

  "customer_intelligence": [
    {
      "customer": "Customer name from the Key Customers list",
      "headline": "What is happening with this customer that could affect our relationship or revenue",
      "detail": "2–3 sentences with **bold** on the key figure or development. What is this customer doing that matters to us?",
      "revenue_impact": "Concrete impact on our revenue or relationship — are they cutting spend, expanding, under financial stress, or growing into new markets we serve?",
      "signal_type": "spending_cut or growth or financial_distress or strategic_shift or leadership_change or general",
      "sentiment": "positive or neutral or negative (for our business relationship)",
      "source": "Publication name e.g. Bloomberg, Reuters"
    }
  ],

  "company_news": [
    {
      "headline": "Article headline — exactly as published or close to it",
      "summary": "2–3 sentence summary of what the article says about the company. Include any quotes, figures, or analyst commentary mentioned.",
      "sentiment": "positive or neutral or negative",
      "category": "Product Launch or Partnership or Financial Results or Leadership or Legal / Regulatory or Brand / PR or General Coverage",
      "exec_note": "Why leadership should care — reputational implication, investor signal, or PR action required. Be specific.",
      "source": "Publication name e.g. Bloomberg, TechCrunch, Forbes",
      "source_url": "Homepage URL of the publication e.g. https://bloomberg.com, https://techcrunch.com, https://ft.com",
      "date": "Date if known e.g. 3 Mar 2026"
    }
  ],

  "risk_summary": [
    {
      "title": "Short risk title",
      "detail": "One sentence describing the risk",
      "severity": "low or medium or high",
      "timeframe": "immediate or near-term or long-term"
    }
  ],

  "capital_impact": {
    "revenue_exposure": "How this week's signals affect the company's revenue outlook. Be specific about which markets and magnitudes.",
    "margin_pressure": "Cost pressures, pricing dynamics, or currency movements affecting margins.",
    "capex_considerations": "Whether current signals argue for accelerating, deferring, or redirecting capital investment."
  },

  "decision_framing": [
    {
      "question": "The specific decision this CEO faces",
      "context": "Why it is pressing right now based on this week's signals",
      "options": [
        "Option A with its trade-off",
        "Option B with its trade-off",
        "Option C with its trade-off"
      ]
    }
  ],

  "scenario_modeling": [
    {
      "title": "Scenario name",
      "probability": "low or medium or high",
      "trigger": "What specific event would cause this scenario to materialise",
      "impact": "Business consequence — revenue, margin, operations",
      "response": "Concrete preparation or response action"
    }
  ]
}`
}
