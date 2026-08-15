import { anthropic } from '@/lib/claude/client'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
  const { name, industry, company_type, website } = await request.json()

  if (!name || !industry) {
    return NextResponse.json({ error: 'name and industry are required' }, { status: 400 })
  }

  const hasPhysicalSupplyChain = company_type !== 'Investor'

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    tools: [
      { type: 'web_search_20250305', name: 'web_search', max_uses: 8 },
    ],
    system: `You are a business intelligence analyst building a company profile from real, verifiable public information — not from memory alone.

Before answering, use the web_search tool to research the actual company: search its Wikipedia page, its official website, and recent press coverage. Verify real facts — actual headquarters city/country, actual office/manufacturing/R&D locations, actual named competitors, actual named customers or clients, actual history and business description — rather than inventing plausible-sounding but generic ones. If the company is small or has limited web presence, search harder (try the company name plus "wikipedia", plus "headquarters", plus "customers", plus "competitors") before falling back to informed industry-typical estimates, and only fall back when search genuinely turns up nothing.

Judge the real shape of the business from its name, industry, and business model — do not default to a "manufacturer" archetype unless the industry actually is manufacturing (e.g. an investment firm has portfolio companies and LPs, not suppliers and factories; a software company has cloud infrastructure costs, not raw materials).

After researching, respond with ONLY the final JSON object as your last message — no commentary before or after it.`,
    messages: [
      {
        role: 'user',
        content: `Company: ${name}
Industry: ${industry}
Business model: ${company_type ?? 'B2B'}
${website ? `Website: ${website}` : ''}

Research this company using web search, then return a JSON object matching this exact schema:

{
  "products": "string — 2-4 sentences describing what the company actually makes, sells, or does, based on real information found",
  "company_notes": "string — 2-5 sentences of real background: founding/history, ownership or public/private status, notable strategic context, dependencies or sensitivities an analyst should know",
  "revenue_countries": [
    { "country": "string", "sector": "string" }
  ],
  "supplier_countries": [
    { "country": "string", "materials": "string" }
  ],
  "competitors": [
    { "name": "string", "notes": "string" }
  ],
  "customers": [
    { "name": "string", "notes": "string" }
  ],
  "keywords": ["string"],
  "commodities": ["string"],
  "locations": [
    { "city": "string", "country_name": "string", "country_code": "2-letter ISO code, e.g. IL, US, DE", "location_types": ["one or more of: hq, manufacturing, sales, r&d, office"], "notes": "string, optional" }
  ]
}

Rules:
- products, company_notes: grounded in what you actually found — prefer specific, real detail over generic filler. If little is found, keep it short rather than inventing detail.
- locations: real known offices, headquarters, manufacturing sites, or R&D centres — as many as you can verify (often just HQ for a smaller company). location_types must only use the five listed values.
- revenue_countries: 3–5 countries where this company is most likely to sell or invest, sector is the specific vertical within the industry for that market
- competitors: 3–5 real company names that actually compete with it, with a one-line note on each
- customers: 3–5 real or realistic examples of who this company serves — for an investor/fund, use notable portfolio companies or LP types instead of buyers; otherwise use real company names that would plausibly buy from it, with a note on what they buy or why they're a customer
- keywords: 5–8 terms specific to this company's actual focus areas (products, technology, or — for an investor — investment thesis and sector focus)
${hasPhysicalSupplyChain ? `- supplier_countries: 2–4 countries with realistic materials or components sourced from there
- commodities: 3–6 raw materials or commodities that are key input costs or supply chain risks (e.g. Copper, Lithium, Silicon, Oil — use exact commodity market names)` : `- supplier_countries: return an empty array — this business model has no physical supply chain
- commodities: return an empty array — this business model has no physical commodity exposure`}

Return only the JSON object as your final message.`,
      },
    ],
  })

  const text = message.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return NextResponse.json({ error: 'Failed to parse suggestions' }, { status: 500 })
  }

  const suggestions = JSON.parse(jsonMatch[0])
  return NextResponse.json(suggestions)

  } catch (err) {
    console.error('[profile/suggest] error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
