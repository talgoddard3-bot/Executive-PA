import type { CompanyLocation, LocationType } from './types'

const NEWS_API_BASE = 'https://newsapi.org/v2/top-headlines'
const NEWSDATA_BASE = 'https://newsdata.io/api/1/latest'

interface Article {
  title: string
  description?: string
  source: { name: string }
}

// ── NewsAPI top-headlines by country + category ──────────────────────────────
async function fetchByCountry(
  countryCode: string,
  q: string,
  category = 'business',
  pageSize = 3
): Promise<Article[]> {
  const key = process.env.NEWS_API_KEY
  if (!key) return []

  const url = new URL(NEWS_API_BASE)
  url.searchParams.set('country', countryCode.toLowerCase())
  url.searchParams.set('category', category)
  url.searchParams.set('q', q)
  url.searchParams.set('pageSize', String(pageSize))
  url.searchParams.set('apiKey', key)

  try {
    const res = await fetch(url.toString(), { cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json()
    return (data.articles ?? []).filter((a: Article) => a.title && a.title !== '[Removed]')
  } catch {
    return []
  }
}

// ── Newsdata.io by country code — broader coverage, Yahoo Finance, Reuters ──
async function fetchNewsdataByCountry(
  countryCode: string,
  q: string,
  category = 'business',
  size = 3
): Promise<Article[]> {
  const key = process.env.NEWSDATA_API_KEY
  if (!key) return []

  const url = new URL(NEWSDATA_BASE)
  url.searchParams.set('apikey', key)
  url.searchParams.set('country', countryCode.toLowerCase())
  url.searchParams.set('q', q)
  url.searchParams.set('language', 'en')
  url.searchParams.set('category', category)
  url.searchParams.set('size', String(size))

  try {
    const res = await fetch(url.toString(), { cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json()
    return (data.results ?? [])
      .filter((a: Record<string, string>) => a.title && a.title !== 'N/A')
      .map((a: Record<string, string>) => ({
        title: a.title,
        description: a.description ?? undefined,
        source: { name: a.source_name ?? a.source_id ?? 'Newsdata.io' },
      }))
  } catch {
    return []
  }
}

function fmt(a: Article): string {
  const desc = a.description ? ` ${a.description}` : ''
  return `${a.source.name}: "${a.title}".${desc}`
}

// ── Map location type → search keywords ─────────────────────────────────────
const LOCATION_QUERIES: Record<LocationType, { keywords: string; category: string }> = {
  manufacturing: {
    keywords: 'manufacturing factory workers labor strike energy industrial production',
    category: 'business',
  },
  sales: {
    keywords: 'consumer spending economy retail demand trade regulations market',
    category: 'business',
  },
  hq: {
    keywords: 'economy business investment regulation government policy',
    category: 'business',
  },
  'r&d': {
    keywords: 'technology research innovation talent university skills',
    category: 'technology',
  },
  office: {
    keywords: 'economy employment business regulations labour talent',
    category: 'business',
  },
}

// ── Location type → human label ──────────────────────────────────────────────
const TYPE_LABELS: Record<LocationType, string> = {
  manufacturing: 'Manufacturing Plant',
  sales: 'Sales Office',
  hq: 'Headquarters',
  'r&d': 'R&D Centre',
  office: 'Regional Office',
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function buildCountrySignals(locations: CompanyLocation[]): Promise<string> {
  if (locations.length === 0) return ''

  const lines: string[] = []
  lines.push('[OPERATIONAL COUNTRY SIGNALS — news from countries where this company operates]')
  lines.push('These signals are tagged by the type of operation affected. Use them to assess labour, regulatory, energy, FX, and logistics risk for each site.')

  const fetches = locations.map(async (loc) => {
    const q = LOCATION_QUERIES[loc.location_type]
    const label = TYPE_LABELS[loc.location_type]
    const tag = loc.city ? `${loc.city}, ${loc.country_name}` : loc.country_name

    const [newsApiResults, newsdataResults] = await Promise.all([
      fetchByCountry(loc.country_code, q.keywords, q.category, 3),
      fetchNewsdataByCountry(loc.country_code, q.keywords, q.category, 2),
    ])

    const seen = new Set<string>()
    const articles: Article[] = []
    for (const a of [...newsApiResults, ...newsdataResults]) {
      if (!seen.has(a.title)) {
        seen.add(a.title)
        articles.push(a)
      }
    }

    return { loc, label, tag, articles }
  })

  const results = await Promise.all(fetches)

  for (const { loc, label, tag, articles } of results) {
    const headcount = loc.headcount ? ` · ${loc.headcount.toLocaleString()} employees` : ''
    lines.push(`\n${tag} — ${label}${headcount}:`)
    if (articles.length > 0) {
      articles.slice(0, 4).forEach(a => lines.push(`  - ${fmt(a)}`))
    } else {
      lines.push(`  No significant local developments detected this week.`)
    }
    if (loc.notes) {
      lines.push(`  [Context: ${loc.notes}]`)
    }
  }

  return lines.join('\n')
}
