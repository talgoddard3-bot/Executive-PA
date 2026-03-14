import type { CompanyLocation, LocationType } from './types'
import { fetchCountryRSS, fetchGDELT } from './rss-fetcher'
import type { RSSItem } from './rss-fetcher'

// ── Location type → topic keywords + GDELT query ─────────────────────────────
const LOCATION_TOPICS: Record<LocationType, { keywords: string; gdelt: string }> = {
  manufacturing: {
    keywords: 'manufacturing factory workers labor strike energy industrial production',
    gdelt:    'manufacturing workers strike labor energy factory industrial',
  },
  sales: {
    keywords: 'consumer spending economy retail demand trade tariffs regulations',
    gdelt:    'consumer economy retail trade regulations market',
  },
  hq: {
    keywords: 'economy business investment regulation government policy central bank',
    gdelt:    'economy business policy investment government',
  },
  'r&d': {
    keywords: 'technology research innovation talent university skills investment',
    gdelt:    'technology research innovation talent university',
  },
  office: {
    keywords: 'economy employment business regulations labour real estate cost',
    gdelt:    'economy employment labour business regulations',
  },
}

const TYPE_LABELS: Record<LocationType, string> = {
  manufacturing: 'Manufacturing Plant',
  sales:         'Sales Office',
  hq:            'Headquarters',
  'r&d':         'R&D Centre',
  office:        'Regional Office',
}

function fmt(a: RSSItem): string {
  const desc = a.description ? ` ${a.description.slice(0, 150)}` : ''
  return `${a.source}: "${a.title}".${desc}`
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function buildCountrySignals(locations: CompanyLocation[]): Promise<string> {
  if (locations.length === 0) return ''

  const lines: string[] = []
  lines.push('[OPERATIONAL COUNTRY SIGNALS — live RSS + GDELT feeds from countries where this company operates]')
  lines.push('Signals are tagged by site type. Use to assess labour, regulatory, energy, FX, and logistics risk at each location.')

  const fetches = locations.map(async (loc) => {
    const locType = loc.location_types?.[0] ?? 'office'
    const topic = LOCATION_TOPICS[locType]
    const label = TYPE_LABELS[locType]
    const tag   = loc.city ? `${loc.city}, ${loc.country_name}` : loc.country_name

    // Parallel: country RSS feeds + GDELT operational query
    const [rssItems, gdeltItems] = await Promise.all([
      fetchCountryRSS(loc.country_code, loc.country_name, topic.keywords, 5),
      fetchGDELT(`${loc.country_name} ${topic.gdelt}`, loc.country_code, 3),
    ])

    // Merge, deduplicate
    const seen  = new Set<string>()
    const items: RSSItem[] = []
    for (const a of [...rssItems, ...gdeltItems]) {
      if (!seen.has(a.title) && a.title.length > 10) {
        seen.add(a.title)
        items.push(a)
      }
    }

    return { loc, label, tag, items }
  })

  const results = await Promise.all(fetches)

  for (const { loc, label, tag, items } of results) {
    const headcount = loc.headcount ? ` · ${loc.headcount.toLocaleString()} employees` : ''
    lines.push(`\n${tag} — ${label}${headcount}:`)
    if (items.length > 0) {
      items.slice(0, 5).forEach(a => lines.push(`  - ${fmt(a)}`))
    } else {
      lines.push(`  No significant local developments detected this week.`)
    }
    if (loc.notes) lines.push(`  [Site context: ${loc.notes}]`)
  }

  return lines.join('\n')
}
