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
- Never cite internal company metrics (headcount, employee counts, office sizes) as facts — these change constantly and are not verified. Write the strategic point without the number. Bad: "threatens your 398-employee manufacturing base". Good: "threatens your sole proprietary manufacturing site"
- Location and headcount data is background context only — it tells you WHAT the company does in each country, not the story. Never lead a sentence, item, or headline with a site location or employee number. Use it silently to judge exposure and relevance, then write about the business impact. The story is always the external event and its consequence, not the internal footprint
- Scenarios: plausible given this week's signals only — not textbook risk categories
- Decision framing: the decisions THIS CEO actually faces THIS week. Name each option by its real trade-off, not A/B/C. If the data favours one option, say which and why
- Severity and probability must be calibrated — if it is a quiet week, reflect that. Not everything is high risk
- Headline, TLDR, and executive_summary must lead with the most SPECIFIC and MATERIAL development of the week — a named competitor move, a named customer/tenant event, company-specific news, or a concrete regulatory/geopolitical event tied to this company's real exposure. Do NOT lead with a generic macro data point (a commodity price level, a generic interest-rate reading) unless nothing more specific happened this week AND that macro point is genuinely, materially significant for this company specifically — not merely plausible. If a generic macro point was used as the lead last week too, actively look harder for a more specific angle this week rather than defaulting to it again
- competitor_intelligence: ONLY include a competitor with a CONCRETE news story or announcement from the signals. Do not fabricate. An empty array is preferred over invented items
- customer_intelligence: ONLY include a customer with a CONCRETE news story or development from the signals this week. If a customer's signal says "No major news this week" or similar, SKIP that customer entirely — do not create an entry restating that there's no news. Do not fabricate. An empty array is preferred over filler items
- M&A Watch: surface deals that shift competitive dynamics or create partnership opportunities. Translate every deal into a specific BD or defensive action
- Company News: only articles that directly name this company. exec_note must specify an action (amplify, respond publicly, monitor, escalate) — not an observation
- Source fields: cite the publication type (e.g. "Reuters", "Financial Times", "Bloomberg")
- Citations: signal lines that were fetched from a real source carry a literal "[URL: ...]" token. When the fact behind a section item traces back to a line with a "[URL: ...]" token, copy that URL EXACTLY into that item's "source_url" field and copy a short verbatim excerpt (max ~200 chars) from that line into "source_excerpt". Never invent, guess, or reconstruct a URL. If the item synthesizes multiple signals or none of them carried a "[URL: ...]" token, omit source_url and source_excerpt entirely rather than fabricating one.

━━━ STRICT NO-REPEAT RULES — EACH SECTION HAS ONE JOB ━━━
Each signal or event belongs in EXACTLY ONE section. Never echo the same event, company, or data point in two sections.

SECTION SCOPE — HARD BOUNDARIES:
- financial_news: macro/sector market events per geography only (PMI, GDP, interest rate decisions, sector downturns). NOT capital markets instruments — those go to financial_signals.
- financial_signals: CFO-level capital market instruments ONLY — FX rates, commodity prices, credit spreads, equity indices. NOT macro news events. RELEVANCE GATE: only include a commodity, FX pair, rate, or index move if this company has a genuinely material, specific exposure to it — check the actual commodities/keywords/business-model context, not a generic "this could theoretically raise costs somewhere" link. A retailer or real-estate company does not need weekly oil-price commentary just because facilities use energy — every company uses energy. Omit an item entirely rather than including a weak or generic one; an empty or short financial_signals array is preferred over padding it with marginal data points.
- geopolitical_news: political events, trade policy, sanctions, regulatory decisions ONLY. Do NOT include competitor moves or M&A here.
- competitor_intelligence: competitor-specific news ONLY. The same competitor event must NOT appear in marketing_opportunities.
- marketing_opportunities: channel/BD opportunities from market gaps, customer signals, or trend shifts. Must NOT reference competitors already covered in competitor_intelligence.
- market_segmentation: dynamic segment analysis driven by THIS WEEK's signals. Six types: audience (who buys), channel (how they're reached), lifestyle (psychographic values), needs (unmet functional needs), value (price/LTV tier), jobs (jobs-to-be-done outcome). Each segment must explain what makes this company SPECIFICALLY different vs. named competitors, identify the competitive vulnerability or gap, and anchor the insight in a concrete signal from this week's news. Do NOT repeat competitor moves, financial signals, or marketing opportunities already covered in their own sections — this section is about market STRUCTURE and positioning gaps.
- ma_watch: M&A, funding rounds, IPOs ONLY. Do NOT appear in geopolitical_news or competitor_intelligence.
- risk_summary: a consolidated risk register — each item must draw from a DIFFERENT source section. Do NOT introduce new facts — just crystallise the top risks already covered.
- capital_impact: pure financial consequence narrative — no new facts, only synthesise what is already in financial_news and financial_signals.
- swot: strategic synthesis only — each point must reference its source section. Do NOT introduce new events.
- pestel: macro-environment synthesis only, drawn from geopolitical_news, financial_news, and financial_signals. Only include a dimension (political/economic/social/technological/environmental/legal) when this week's signals actually support it — omit dimensions with no evidence rather than filling every one. Do NOT introduce new events.
- five_forces: industry-structure synthesis only, drawn from competitor_intelligence, ma_watch, and market_segmentation. Only assess a force when there is a concrete signal behind it — omit forces with no evidence. If a force's level hasn't materially changed this week, set "change" to "unchanged" rather than forcing a direction. Do NOT introduce new events.
- hr_intelligence: talent market, hiring trends, workforce signals ONLY. No overlap with operational_intelligence.
- tech_intelligence: technology product/platform/infrastructure developments ONLY. No overlap with competitor_intelligence.
- scenario_modeling: forward-looking what-if analysis ONLY. Do NOT describe events already reported in other sections — only their future consequences.
- decision_framing: current CEO decision points ONLY. Must NOT repeat scenario descriptions from scenario_modeling.
- internal_intelligence: sourced EXCLUSIVELY from the INTERNAL SIGNALS block (company-provided notes and documents) — never from web/news signals. This is the one section explicitly marked as internally-sourced to the reader, so it must never contain anything that isn't actually present in that block. If the INTERNAL SIGNALS block is empty or absent, return an empty array — do not invent internal data to fill this section. Other sections may still be quietly informed by internal context, but internal_intelligence is the only place it is surfaced and attributed as internal.`

// Shared context block used by both the core-content call and the
// strategic-frameworks call — they run in parallel (see synthesize.ts) so
// wall-clock time is bounded by the larger of the two instead of their sum,
// which matters on Vercel Hobby's 300s function ceiling.
function buildContextBlock(
  company: Company,
  profile: CompanyProfile,
  signals: string,
  language: string,
  locations: CompanyLocation[],
  previousBriefContext: string
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
        : companyTypeLabel === 'NGO'
          ? 'Non-governmental organisation — consider grant funding cycles, donor relations, impact measurement, and policy/advocacy channels.'
          : companyTypeLabel === 'Investor'
            ? 'Investment firm — consider portfolio company performance, deal pipeline and fund flows, LP relations, and sector/allocation shifts rather than direct product sales.'
            : 'Enterprise sales — consider partnership channels, key account dynamics, and sector-specific procurement cycles.'

  const languageInstruction = language && language !== 'English'
    ? `\nOUTPUT LANGUAGE: Generate ALL text fields in ${language}. The JSON keys must remain in English, but all values (headlines, summaries, details, impacts, notes, etc.) must be written in ${language}.\n`
    : ''

  const locationLines = locations.length > 0
    ? locations.map(l => {
        const city = l.city ? `${l.city}, ` : ''
        const head = l.headcount ? ` (${l.headcount.toLocaleString()} employees)` : ''
        const note = l.notes ? ` — ${l.notes}` : ''
        const types = (l.location_types ?? []).map(t => t.toUpperCase()).join('+') || 'OFFICE'
        return `  - ${city}${l.country_name}: ${types}${head}${note}`
      }).join('\n')
    : '  (none specified)'

  const productsLine = profile.products?.trim()
    ? `\nProducts / Services:\n${profile.products.trim()}`
    : ''

  const notesBlock = profile.company_notes?.trim()
    ? `\n---\nANALYST BACKGROUND NOTES (verified internal knowledge — treat as authoritative context for this company):\n${profile.company_notes.trim()}\n---`
    : ''

  const visionMissionLines = [
    profile.vision?.trim() ? `Vision: ${profile.vision.trim()}` : '',
    profile.mission?.trim() ? `Mission: ${profile.mission.trim()}` : '',
  ].filter(Boolean).join('\n')
  const visionMissionBlock = visionMissionLines
    ? `\nCorporate Identity (this company's own stated direction — decision_framing and scenario_modeling should note when a recommendation directly serves or conflicts with this):\n${visionMissionLines}\n`
    : ''

  return `${languageInstruction}COMPANY PROFILE
Company: ${company.name}
Industry: ${company.industry}
Business Model: ${companyTypeLabel} — ${marketingContext}
Keywords: ${profile.keywords.join(', ')}${productsLine}${visionMissionBlock}${notesBlock}

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

${previousBriefContext ? `---
LAST WEEK'S BRIEF (for differentiation only — do NOT repeat):
${previousBriefContext}

DIFFERENTIATION REQUIREMENT: Compare this week's signals against last week's brief above. For any risk, theme, or event that is ongoing but has NO new development this week, write ONE line: "[Topic] — ongoing, no new development this week." Do not repeat the full analysis. Lead every section with what is NEW or has materially changed. The headline and TLDR must reflect this week's most important CHANGE, not a continuation of last week's framing.
---
` : ''}---
SIGNALS THIS WEEK:
${signals}
`
}

const ITEM_CAP_NOTE = 'HARD CAP: every array-type section below may contain AT MOST 3 items, ranked most-important-first — never more, even if more signals exist. Pick the most consequential items and skip the rest. A short, sharp brief is the goal, not exhaustive coverage.'

// ── Split into four smaller, focused calls (plus the frameworks call below)
// that run concurrently — see synthesize.ts. Each call only has to write a
// few hundred to ~2000 tokens, so wall-clock time is bounded by the slowest
// of five small calls instead of one call writing the whole brief.

// A. Executive narrative — headline through weekly actions
export function buildNarrativeUserPrompt(
  company: Company, profile: CompanyProfile, signals: string,
  language = 'English', locations: CompanyLocation[] = [], previousBriefContext = ''
): string {
  const context = buildContextBlock(company, profile, signals, language, locations, previousBriefContext)
  return `${context}
---
Produce ONLY the executive-narrative sections of the brief as a single JSON object. Return ONLY the JSON — no markdown, no explanation.

${ITEM_CAP_NOTE}

{
  "headline": "8–12 words maximum. A punchy, specific wire-service headline that captures the single dominant theme of this week for this company. Name the actor or event and the stakes. Bad: 'Multiple risks identified across supply chain and competitive landscape'. Good: 'ASML Export Controls Squeeze VPG Sensor Demand at Peak Cycle'. Never vague, never generic.",
  "sector_tags": ["2–4 short topic tags, lowercase, from: macro, markets, competitive, regulatory, technology, talent, capital, geopolitical, supply-chain, consumer, ai, cybersecurity, energy, trade."],
  "region_tags": ["2–3 geographic regions, from: US, EU, UK, APAC, MENA, LatAm, Global."],
  "urgency": "One of: 'act-now' (regulatory deadline, fast-moving competitive event requiring this-week action), 'monitor' (trend developing over 30–90 days), 'awareness' (background context). Be calibrated — not every brief is act-now.",
  "read_time": 6,
  "tldr": "One sentence. The absolute bottom line this week. No caveats. Just the verdict.",
  "executive_summary": "3–4 sentence lede. Lead with the dominant risk or opportunity, then market context, then company-specific implication, then decision pressure. Reference specific figures, competitor names, and market data.",
  "so_what": "The most important paragraph in the brief. 3–5 sentences. Directly address the CEO: what does this week's intelligence mean RIGHT NOW? Be opinionated. Name the single most important action this week.",
  "risk_summary": [
    { "title": "Short risk title", "detail": "One sentence describing the risk", "severity": "low or medium or high", "timeframe": "immediate or near-term or long-term" }
  ],
  "capital_impact": {
    "revenue_exposure": "How this week's signals affect revenue outlook. Specific markets and magnitudes.",
    "margin_pressure": "Cost pressures, pricing dynamics, or currency movements affecting margins.",
    "capex_considerations": "Whether signals argue for accelerating, deferring, or redirecting capital investment."
  },
  "decision_framing": [
    { "question": "The specific decision this CEO faces", "context": "Why it is pressing right now", "options": ["Option A with its real trade-off", "Option B with its real trade-off"] }
  ],
  "scenario_modeling": [
    { "title": "Scenario name", "probability": "low or medium or high", "trigger": "What specific event would cause this to materialise", "impact": "Business consequence", "response": "Concrete preparation action" }
  ],
  "weekly_actions": [
    { "action": "A SMART objective — specific, measurable, time-bound, achievable for this company's actual size. E.g. 'Call Frankfurt sales lead by Friday to quantify Q2 pipeline impact' — not 'Review European exposure'.", "owner": "CEO or CFO or CMO or CTO or CBPO or VP HR or All", "priority": "high or medium or low", "section": "Which topic triggered this action" }
  ]
}`
}

// B. Market & financial intelligence
export function buildMarketUserPrompt(
  company: Company, profile: CompanyProfile, signals: string,
  language = 'English', locations: CompanyLocation[] = [], previousBriefContext = ''
): string {
  const context = buildContextBlock(company, profile, signals, language, locations, previousBriefContext)
  return `${context}
---
Produce ONLY the market and financial intelligence sections of the brief as a single JSON object. Return ONLY the JSON — no markdown, no explanation.

${ITEM_CAP_NOTE} market_segmentation specifically: at most 2 items.

{
  "financial_news": [
    { "market": "Country — Sector", "headline": "Specific, factual headline", "detail": "2–3 sentences with **bold** on the key figure", "impact": "Direct impact on this company's revenue or costs", "source": "Publication name", "source_url": "Exact URL from a [URL: ...] token, or omit", "source_excerpt": "Short verbatim excerpt (~200 chars), or omit" }
  ],
  "geopolitical_news": [
    { "region": "Country or trade bloc", "headline": "Specific, factual headline", "detail": "2–3 sentences with **bold** on the key fact", "relevance": "Why this matters to this company's specific exposure", "source": "Publication name", "source_url": "Exact URL from a [URL: ...] token, or omit", "source_excerpt": "Short verbatim excerpt, or omit" }
  ],
  "financial_signals": [
    { "category": "FX Risk or Interest Rates or Credit Markets or Commodity Pricing or Equity Sentiment", "headline": "What changed in capital markets this week", "detail": "1–2 sentences of context relevant to this company", "cfo_action": "Specific CFO action — hedging, refinancing, working capital timing" }
  ],
  "operational_intelligence": [
    { "area": "Logistics or Procurement or Vendor Risk or Production or Inventory", "headline": "The operational risk or opportunity", "detail": "1–2 sentences", "mitigation": "Concrete immediate action" }
  ],
  "market_segmentation": [
    { "segment_type": "One of: audience | channel | lifestyle | needs | value | jobs", "segment_name": "Short, vivid name", "description": "1 sentence.", "size_signal": "growing | stable | declining", "differentiation": "1 sentence: what makes THIS company stronger for this segment vs. a named competitor.", "competitive_vulnerability": "1 sentence: name the competitor who dominates and their weakness.", "signal_source": "The specific signal from THIS WEEK.", "channel_priority": "high | medium | low", "urgency": "act-now | monitor | awareness" }
  ],
  "marketing_opportunities": [
    { "channel": "Channel type or market segment", "opportunity": "The specific opportunity this week's signals create", "rationale": "Why this is timely — reference specific data", "urgency": "low or medium or high" }
  ]
}`
}

// C. Competitive & commercial intelligence
export function buildCompetitiveUserPrompt(
  company: Company, profile: CompanyProfile, signals: string,
  language = 'English', locations: CompanyLocation[] = [], previousBriefContext = ''
): string {
  const context = buildContextBlock(company, profile, signals, language, locations, previousBriefContext)
  return `${context}
---
Produce ONLY the competitive and commercial intelligence sections of the brief as a single JSON object. Return ONLY the JSON — no markdown, no explanation.

${ITEM_CAP_NOTE}

{
  "competitor_intelligence": [
    { "competitor": "Competitor name", "type": "product_launch or pricing or partnership or expansion or other", "headline": "What they did", "detail": "2–3 sentences of context", "threat_level": "low or medium or high", "source": "Publication name", "source_url": "Exact URL from a [URL: ...] token, or omit", "source_excerpt": "Short verbatim excerpt, or omit" }
  ],
  "ma_watch": [
    { "type": "acquisition or merger or funding or ipo or divestiture or rumour", "headline": "What happened — who acquired or funded whom", "acquirer": "Buyer or lead investor (omit if n/a)", "target": "Company being acquired/funded/listed", "deal_size": "$Xbn or undisclosed", "detail": "2–3 sentences with **bold** on the key figure or rationale", "strategic_read": "What this signals about capital/consolidation flow", "bd_action": "One concrete BD or defensive action", "relevance": "direct or adjacent or watch", "source": "Publication name", "source_url": "Exact URL from a [URL: ...] token, or omit", "source_excerpt": "Short verbatim excerpt, or omit" }
  ],
  "customer_intelligence": [
    { "customer": "Customer name from the Key Customers list", "headline": "What is happening with this customer", "detail": "2–3 sentences with **bold** on the key development", "revenue_impact": "Concrete impact on revenue or relationship", "signal_type": "spending_cut or growth or financial_distress or strategic_shift or leadership_change or general", "sentiment": "positive or neutral or negative", "source": "Publication name", "source_url": "Exact URL from a [URL: ...] token, or omit", "source_excerpt": "Short verbatim excerpt, or omit" }
  ],
  "company_news": [
    { "headline": "Article headline, as published", "summary": "2–3 sentence summary including quotes/figures mentioned", "sentiment": "positive or neutral or negative", "category": "Product Launch or Partnership or Financial Results or Leadership or Legal / Regulatory or Brand / PR or General Coverage", "exec_note": "Why leadership should care — specific action (amplify, respond, monitor, escalate)", "source": "Publication name", "source_url": "Exact URL from a [URL: ...] token for THIS article, or omit — never invent one", "source_excerpt": "Short verbatim excerpt, or omit", "date": "Date if known" }
  ]
}`
}

// D. People, technology & internal intelligence
export function buildPeopleTechUserPrompt(
  company: Company, profile: CompanyProfile, signals: string,
  language = 'English', locations: CompanyLocation[] = [], previousBriefContext = ''
): string {
  const context = buildContextBlock(company, profile, signals, language, locations, previousBriefContext)
  return `${context}
---
Produce ONLY the people, technology, and internal intelligence sections of the brief as a single JSON object. Return ONLY the JSON — no markdown, no explanation.

${ITEM_CAP_NOTE}

{
  "hr_intelligence": [
    { "category": "Talent Market or Competitor Hiring or Executive Move or Workforce Restructuring or Compensation Trends or Skills Gap or Labour Relations", "headline": "What happened", "detail": "2–3 sentences with **bold** on the key figure or company. What is materially new.", "company_impact": "How this affects this company's ability to attract/retain/develop talent", "action": "Specific HR/people-strategy action", "signal_type": "competitor or market or regulatory or economic", "source": "Publication name", "source_url": "Exact URL from a [URL: ...] token, or omit", "source_excerpt": "Short verbatim excerpt, or omit" }
  ],
  "tech_intelligence": [
    { "category": "AI / LLM or Hardware or Software or Semiconductors or Cybersecurity or Emerging Tech", "headline": "What was released, announced, or changed", "detail": "2–3 sentences with **bold** on the key product or capability", "cto_action": "Specific tech decision — adopt, pilot, monitor, defend against", "relevance": "direct or watch or awareness", "source": "Publication name", "source_url": "Exact URL from a [URL: ...] token, or omit", "source_excerpt": "Short verbatim excerpt, or omit" }
  ],
  "internal_intelligence": [
    { "category": "Financials or Sales or Marketing or Legal/Contract or Customer Intel or Risk Flag or Opportunity or General", "headline": "What this internal signal says — plain statement of fact", "detail": "2–3 sentences. If it connects to an external event, say so — but don't restate that event's headline verbatim.", "source_type": "note or document", "source_title": "The note's category, or the document's title", "action": "Specific action this calls for", "urgency": "high or medium or low" }
  ]
}

IMPORTANT: internal_intelligence must be sourced EXCLUSIVELY from the INTERNAL SIGNALS block above (company-provided notes/documents) — never from web/news signals. If that block is empty or absent, return an empty array — do not invent internal data.`
}

// ── Strategic frameworks call — SWOT / PESTEL / Five Forces, run in
// parallel with the core content call above (see synthesize.ts). Needs the
// same company/signals context to synthesize independently from real
// evidence, but a much smaller output budget.
export function buildFrameworksUserPrompt(
  company: Company,
  profile: CompanyProfile,
  signals: string,
  language = 'English',
  locations: CompanyLocation[] = [],
  previousBriefContext = ''
): string {
  const context = buildContextBlock(company, profile, signals, language, locations, previousBriefContext)
  return `${context}
---
Produce ONLY the strategic-framework sections below as a single JSON object, synthesised from the signals above — do not introduce new events beyond what the signals support. Return ONLY the JSON — no markdown, no explanation.

HARD CAP: each SWOT quadrant (strengths/weaknesses/opportunities/threats) may contain AT MOST 2 items. PESTEL: at most 1 item per dimension. Five Forces: assess at most the 2 most relevant forces, not all 5. Pick the most consequential, skip the rest.

{
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

  "pestel": {
    "_instructions": "Only include dimensions with real evidence from this week's signals. Omit any dimension entirely (do not include the key) if there's nothing to say. If NONE of the six dimensions have evidence, omit the whole pestel key.",
    "political": [{ "point": "Political/regulatory development with **bold** on the key fact", "source": "Section or signal it came from" }],
    "economic": [{ "point": "Macroeconomic development with **bold** on the key figure", "source": "Section or signal it came from" }],
    "social": [{ "point": "Social/demographic shift with **bold** on the key fact", "source": "Section or signal it came from" }],
    "technological": [{ "point": "Technology shift with **bold** on the key fact", "source": "Section or signal it came from" }],
    "environmental": [{ "point": "Environmental/climate development with **bold** on the key fact — only if it materially affects regulation, capex, supply chain, or customers", "source": "Section or signal it came from" }],
    "legal": [{ "point": "Legal/compliance development with **bold** on the key fact", "source": "Section or signal it came from" }]
  },

  "five_forces": {
    "_instructions": "Only assess a force when this week's signals (or the known competitor list) actually support a read. If fewer than 2 competitors are known and there's no supplier/buyer signal, omit the whole five_forces key.",
    "forces": [
      {
        "force": "rivalry or new_entrants or supplier_power or buyer_power or substitutes",
        "level": "low or medium or high",
        "change": "up or down or unchanged — versus what you'd reasonably assess a few weeks ago based on this week's evidence",
        "rationale": "1–2 sentences of concrete evidence, not a generic industry statement",
        "source": "Section or signal it came from"
      }
    ]
  }
}`
}
