import { anthropic } from '@/lib/claude/client'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
  const { name, industry, company_type, website, custom_instructions } = await request.json()

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

If the user provides additional research instructions, treat them as the highest-priority guidance — search the specific sources they name, and weight the profile toward the angle they describe, before filling in anything else generically.

After researching, respond with ONLY the final JSON object as your last message — no commentary before or after it.`,
    messages: [
      {
        role: 'user',
        content: `Company: ${name}
Industry: ${industry}
Business model: ${company_type ?? 'B2B'}
${website ? `Website: ${website}` : ''}
${custom_instructions ? `\nUser's research instructions (follow closely — these override generic defaults below where they conflict):\n${custom_instructions}\n` : ''}
Research this company using web search, then return a JSON object matching this exact schema:

{
  "products": "string — 2-4 sentences describing what the company actually makes, sells, or does, based on real information found",
  "company_notes": "string — 2-5 sentences of real background: founding/history, ownership or public/private status, notable strategic context, dependencies or sensitivities an analyst should know",
  "vision": "string, optional — the company's actual published vision statement, quoted or closely paraphrased from its own investor relations page, annual report, 10-K/20-F front matter, or About page. Omit entirely if you cannot find one actually published by the company — do not invent one.",
  "mission": "string, optional — the company's actual published mission statement, same sourcing rule as vision. Omit entirely rather than inventing one.",
  "ir_page_url": "string, optional — the URL of this company's own official Investor Relations / Financial Results / Shareholder Information page (search for '<company name> investor relations' or '<company name> ir'). Must be a page on the company's own domain, not a third-party finance site (not Yahoo Finance, not a stock screener). Omit entirely if the company is private and has no such page, or if you cannot verify one actually exists.",
  "revenue_countries": [
    { "country": "string", "sector": "string" }
  ],
  "supplier_countries": [
    { "country": "string", "materials": "string" }
  ],
  "competitors": [
    { "name": "string", "ticker": "string, optional — see ticker format rule below", "notes": "string" }
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
- vision, mission: only include if you find the company's own actual published wording (investor relations, annual report, About page). A company that doesn't publish these — common for smaller or private companies — should simply have these fields omitted, not filled with a guess.
- ir_page_url: only include a real, verified URL on the company's own domain. Never guess a URL pattern (e.g. do not assume {domain}/investors exists without having actually found it) — omit the field if you didn't land on and confirm the page via search.
- locations: real known offices, headquarters, manufacturing sites, or R&D centres — as many as you can verify (often just HQ for a smaller company). location_types must only use the five listed values.
- revenue_countries: 3–5 countries where this company is most likely to sell or invest, sector is the specific vertical within the industry for that market
- competitors: 3–5 real company names that actually compete with it, with a one-line note on each. Include a ticker only if publicly traded and you found it — omit the field entirely for private companies rather than guessing. Ticker format: plain symbol for a US-primary listing (e.g. "MSFT"); for a company listed only on a non-US exchange, use the Finnhub-style dot-suffix format instead of a bare local ticker — e.g. "BIG.TA" for Tel Aviv, "BP.L" for London, "SAP.DE" for Xetra, "0700.HK" for Hong Kong, "7203.T" for Tokyo, "005930.KS" for Korea, "BNP.PA" for Euronext Paris. If unsure of the exact exchange suffix, omit the ticker rather than guessing wrong.
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
