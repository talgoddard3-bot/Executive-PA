import { anthropic } from '@/lib/claude/client'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
  const { name, industry } = await request.json()

  if (!name || !industry) {
    return NextResponse.json({ error: 'name and industry are required' }, { status: 400 })
  }

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: `You are a business intelligence analyst. Given a company name and industry, suggest a realistic company profile for a mid-sized global manufacturer ($50M–$500M revenue). Be specific and realistic — use real country names, real competitor names, and realistic percentages.`,
    messages: [
      {
        role: 'user',
        content: `Company: ${name}
Industry: ${industry}

Suggest a realistic company profile. Return only a JSON object matching this exact schema:

{
  "revenue_countries": [
    { "country": "string", "pct": number, "sector": "string" }
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
  "commodities": ["string"]
}

Rules:
- revenue_countries: 3–5 countries, percentages must sum to 100, sector is the specific vertical within the industry for that market
- supplier_countries: 2–4 countries with realistic materials or components sourced from there
- competitors: 3–5 real company names that compete in this industry, with a one-line note on each
- customers: 3–5 realistic example customers — real company names that would plausibly buy from a company like this, with a note on what they buy or why they're a customer
- keywords: 5–8 product or technology keywords specific to this company's likely product range
- commodities: 3–6 raw materials or commodities that are key input costs or supply chain risks (e.g. Copper, Lithium, Silicon, Oil — use exact commodity market names)

Return only the JSON object.`,
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
