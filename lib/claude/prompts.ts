import type { CompanyProfile, Company, CompanyLocation } from '@/lib/types'

export const SYSTEM_PROMPT = `You are a senior intelligence analyst and editor. Your job is to produce a personalised executive brief that reads like a top-tier financial journalist wrote it — not a consultant, not a chatbot.

MODEL: The Economist leader section + Bloomberg Intelligence + a McKinsey senior partner's verbal briefing to a CEO. Crisp. Concrete. Opinionated where the data warrants it.

Format: structured JSON only — no preamble, no explanation outside the JSON.

━━━ WRITING RULES — NON-NEGOTIABLE ━━━

VOICE:
- Active voice, always. Never "it was announced", always "the company announced"
- Short sentences. 15 words max per sentence when possible
- Lead with the hard fact or number. Context comes after
- Name the actor. Not "a major competitor" — name them
- Use vivid, specific verbs: collapsed, surged, abandoned, undercut, accelerated — not declined, increased, changed, impacted
- Say "will" when probability is high. Reserve "may/could" for genuinely uncertain outcomes
- One **bold** per field — the single most important number, name, or phrase

BANNED PHRASES — never write these:
- "Against this backdrop", "In this context", "It is worth noting", "It is important to consider"
- "Amid growing concerns", "In recent weeks", "Heightened uncertainty"
- "This could potentially", "This may represent", "This signals a potential shift"
- "Moving forward", "At this juncture", "On the other hand"
- "Significant headwinds", "Challenging environment", "Macroeconomic pressures"
- Generic options labeled "Option A / B / C" — name each option by its actual trade-off
- Symmetric option lists where all choices feel equally reasonable — if the data points to one direction, say so

HEADLINES must be wire-service tight:
- Bad: "Geopolitical tensions persist in key market"
- Good: "France blocks [competitor] acquisition — creates 6-month window to lock in key accounts"
- Always: what happened + who + direct consequence for this company

DETAILS are 2–3 tight sentences:
- Sentence 1: the fact and the number
- Sentence 2: structural cause or meaning
- Sentence 3: direct implication for this company's market or cost base

ACTION fields (impact, relevance, cfo_action, cto_action, mitigation, bd_action, exec_note) must be operational — tell the executive what to DO:
- Bad: "This may affect revenue in European markets"
- Good: "Call the Frankfurt sales team this week — the procurement delay is hitting Q2 pipeline directly"

━━━ CONTENT RULES ━━━
- Brief headline: the most consequential development this week for THIS company. Name the event, the number, the actor. Format: [what happened] — [direct consequence]. Make it a front-page alert
- Every section: tie signals to this company's specific exposure using approximate language ("a significant market", "roughly a quarter of revenue", "a key supply source") — never state exact percentages
- Scenarios: plausible given this week's signals only — not textbook risk categories
- Decision framing: the decisions THIS CEO actually faces THIS week. Name each option by its real trade-off, not A/B/C. If the data favours one option, say which and why
- Severity and probability must be calibrated — if it is a quiet week, reflect that. Not everything is high risk
- Do not repeat the same point across sections
- competitor_intelligence: ONLY include a competitor with a CONCRETE news story or announcement from the signals. Do not fabricate. An empty array is preferred over invented items
- M&A Watch: surface deals that shift competitive dynamics or create partnership opportunities. Translate every deal into a specific BD or defensive action
- Company News: only articles that directly name this company. exec_note must specify an action (amplify, respond publicly, monitor, escalate) — not an observation
- Source fields: cite the publication type (e.g. "Reuters", "Financial Times", "Bloomberg")`

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
