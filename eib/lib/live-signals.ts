import type { Company, CompanyProfile, CompanyLocation } from './types'
import { generateSimulatedSignals } from './claude/signals'
import { fetchCompetitorSignals } from './finnhub'
import { buildFREDMacroSignals } from './fred'
import { buildCountrySignals } from './country-signals'
import { createClient } from '@supabase/supabase-js'

const NEWS_API_BASE = 'https://newsapi.org/v2/everything'
const NEWSDATA_BASE = 'https://newsdata.io/api/1/latest'

interface Article {
  title: string
  description?: string
  source: { name: string }
}

async function fetchNews(q: string, pageSize = 3): Promise<Article[]> {
  const key = process.env.NEWS_API_KEY
  if (!key) return []

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const url = new URL(NEWS_API_BASE)
  url.searchParams.set('q', q)
  url.searchParams.set('language', 'en')
  url.searchParams.set('sortBy', 'publishedAt')
  url.searchParams.set('from', sevenDaysAgo)
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

// Newsdata.io — Yahoo Finance + broader business/tech coverage (200 req/day free)
async function fetchNewsData(q: string, category = 'business', size = 3): Promise<Article[]> {
  const key = process.env.NEWSDATA_API_KEY
  if (!key) return []

  const url = new URL(NEWSDATA_BASE)
  url.searchParams.set('apikey', key)
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

async function fetchRawSignals(companyId: string): Promise<string> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data } = await supabase
      .from('raw_signals')
      .select('signal_type, entity_name, title, summary, source_name')
      .eq('company_id', companyId)
      .gte('fetched_at', since)
      .order('fetched_at', { ascending: false })
      .limit(120)

    if (!data || data.length === 0) return ''

    // Group by signal_type → entity_name
    const groups: Record<string, Record<string, string[]>> = {}
    for (const row of data) {
      const t = row.signal_type as string
      const e = row.entity_name as string
      groups[t] ??= {}
      groups[t][e] ??= []
      const desc = row.summary ? ` ${String(row.summary).slice(0, 120)}` : ''
      groups[t][e].push(`  - ${row.source_name}: "${row.title}".${desc}`)
    }

    const lines: string[] = [
      '[SCRAPED SIGNALS — pre-fetched by weekly Python scraper, covering company, competitors, countries, and industry]',
    ]
    const TYPE_LABELS: Record<string, string> = {
      company:    'Company press coverage',
      competitor: 'Competitor news',
      country:    'Revenue country signals',
      location:   'Operational location signals',
      industry:   'Industry signals',
    }
    for (const [type, entities] of Object.entries(groups)) {
      lines.push(`\n${TYPE_LABELS[type] ?? type}:`)
      for (const [entity, items] of Object.entries(entities)) {
        lines.push(`${entity}:`)
        lines.push(...items.slice(0, 5))
      }
    }

    const result = lines.join('\n')
    console.log(`[signals] Raw signals from DB: ${data.length} rows, ${result.length} chars`)
    return result
  } catch (err) {
    console.warn('[signals] Could not fetch raw_signals:', err)
    return ''
  }
}

export async function buildLiveSignals(company: Company, profile: CompanyProfile, locations: CompanyLocation[] = []): Promise<string> {
  const key = process.env.NEWS_API_KEY
  if (!key) {
    console.log('[signals] NEWS_API_KEY not set — using simulated signals')
    return generateSimulatedSignals(profile)
  }

  const lines: string[] = []

  // ── Pre-fetched scraped signals (Python scraper → raw_signals table) ──────
  const scraped = await fetchRawSignals(company.id)
  if (scraped) lines.push(scraped, '')

  // ── Demand signals: news per revenue market ─────────────────────────────
  lines.push('[DEMAND SIGNALS — sourced from NewsAPI this week]')
  const demandFetches = profile.revenue_countries.slice(0, 4).map(rc =>
    fetchNews(`${rc.country} ${rc.sector} economy business trade`, 2).then(articles => ({ rc, articles }))
  )
  const demandResults = await Promise.all(demandFetches)
  for (const { rc, articles } of demandResults) {
    if (articles.length > 0) {
      lines.push(`\n${rc.country} (${rc.sector}):`)
      articles.forEach(a => lines.push(`  - ${fmt(a)}`))
    } else {
      lines.push(`\n${rc.country} (${rc.sector}): No major news this week in this market.`)
    }
  }

  // ── Supply chain signals ─────────────────────────────────────────────────
  lines.push('\n[SUPPLY CHAIN SIGNALS — sourced from NewsAPI this week]')
  const supplyFetches = profile.supplier_countries.slice(0, 3).map(sc =>
    fetchNews(`${sc.country} supply chain ${sc.materials} export trade logistics`, 2)
      .then(articles => ({ sc, articles }))
  )
  const supplyResults = await Promise.all(supplyFetches)
  for (const { sc, articles } of supplyResults) {
    if (articles.length > 0) {
      lines.push(`\n${sc.country} (${sc.materials}):`)
      articles.forEach(a => lines.push(`  - ${fmt(a)}`))
    } else {
      lines.push(`\n${sc.country} (${sc.materials}): No significant supply chain developments detected.`)
    }
  }

  // ── Competitor signals (Finnhub stock data + news, NewsAPI fallback) ─────
  lines.push('\n[COMPETITIVE SIGNALS — Finnhub live data + NewsAPI this week]')
  const [finnhubCompetitors, newsCompetitorResults] = await Promise.all([
    fetchCompetitorSignals(profile.competitors.slice(0, 4).map(c => c.name)),
    Promise.all(profile.competitors.slice(0, 4).map(comp =>
      fetchNews(`"${comp.name}"`, 2).then(articles => ({ comp, articles }))
    )),
  ])
  for (const sig of finnhubCompetitors) {
    const newsMatch = newsCompetitorResults.find(r => r.comp.name === sig.name)
    lines.push(`\n${sig.name}${sig.symbol ? ` (${sig.symbol})` : ''}:`)
    if (sig.quote && sig.quote.c > 0) {
      const dir = sig.quote.d >= 0 ? '▲' : '▼'
      lines.push(`  Stock: $${sig.quote.c.toFixed(2)} ${dir}${Math.abs(sig.quote.dp).toFixed(1)}% WTD`)
    }
    if (sig.news.length > 0) {
      sig.news.slice(0, 2).forEach(n => lines.push(`  - ${n.source}: "${n.headline}"`))
    } else if (newsMatch && newsMatch.articles.length > 0) {
      newsMatch.articles.forEach(a => lines.push(`  - ${fmt(a)}`))
    } else {
      lines.push(`  No public announcements detected this week.`)
    }
  }

  // ── Customer signals ─────────────────────────────────────────────────────
  const profileCustomers = (profile as CompanyProfile & { customers?: { name: string }[] }).customers ?? []
  if (profileCustomers.length > 0) {
    lines.push('\n[CUSTOMER SIGNALS — news about key customers that affects their spending or relationship with us this week]')
    const customerFetches = profileCustomers.slice(0, 5).map(c =>
      fetchNews(`"${c.name}" earnings results spending budget announcement`, 2).then(articles => ({ c, articles }))
    )
    const customerResults = await Promise.all(customerFetches)
    for (const { c, articles } of customerResults) {
      if (articles.length > 0) {
        lines.push(`\n${c.name}:`)
        articles.forEach(a => lines.push(`  - ${fmt(a)}`))
      } else {
        lines.push(`\n${c.name}: No major news this week.`)
      }
    }
  }

  // ── Commodity signals ────────────────────────────────────────────────────
  const profileCommodities = (profile as CompanyProfile & { commodities?: string[] }).commodities ?? []
  if (profileCommodities.length > 0) {
    lines.push('\n[COMMODITY SIGNALS — price movements and supply/demand news this week]')
    const commodityFetches = profileCommodities.slice(0, 5).map(c =>
      fetchNews(`${c} commodity price supply demand market`, 2).then(articles => ({ c, articles }))
    )
    const commodityResults = await Promise.all(commodityFetches)
    for (const { c, articles } of commodityResults) {
      if (articles.length > 0) {
        lines.push(`\n${c}:`)
        articles.forEach(a => lines.push(`  - ${fmt(a)}`))
      } else {
        lines.push(`\n${c}: No significant price or supply news this week.`)
      }
    }
  }

  // ── Sector keyword signals ───────────────────────────────────────────────
  if (profile.keywords.length > 0) {
    lines.push('\n[SECTOR SIGNALS — sourced from NewsAPI this week]')
    const kwQuery = profile.keywords.slice(0, 4).join(' OR ')
    const kwArticles = await fetchNews(kwQuery, 4)
    kwArticles.forEach(a => lines.push(`  - ${fmt(a)}`))
    if (kwArticles.length === 0) lines.push('  No major sector news this week.')
  }

  // ── Technology intelligence (CTO) ───────────────────────────────────────
  lines.push('\n[TECHNOLOGY SIGNALS — AI, hardware, software this week]')
  const techQueries = [
    `artificial intelligence LLM language model release ${company.industry}`,
    `semiconductor chip hardware enterprise technology`,
    `enterprise software platform release cloud`,
    ...(profile.keywords.slice(0, 2).map(k => `${k} technology software AI`)),
  ]
  const techFetches = techQueries.slice(0, 3).map(q => fetchNews(q, 2))
  const techResults = await Promise.all(techFetches)
  const seenTech = new Set<string>()
  for (const articles of techResults) {
    for (const a of articles) {
      if (!seenTech.has(a.title)) { seenTech.add(a.title); lines.push(`  - ${fmt(a)}`) }
    }
  }
  if (seenTech.size === 0) lines.push('  No major technology announcements detected this week.')

  // ── Financial market news via Newsdata.io (Yahoo Finance, Reuters, etc.) ─
  lines.push('\n[FINANCIAL MARKET NEWS — sourced from Newsdata.io this week]')
  const finQuery = [
    company.industry,
    ...profile.revenue_countries.slice(0, 2).map(r => r.country),
    'stock market earnings',
  ].join(' ')
  const [finBizArticles, finTechArticles] = await Promise.all([
    fetchNewsData(finQuery, 'business', 4),
    fetchNewsData(`${company.industry} technology AI`, 'technology', 2),
  ])
  const seenNewsData = new Set<string>()
  for (const a of [...finBizArticles, ...finTechArticles]) {
    if (!seenNewsData.has(a.title)) {
      seenNewsData.add(a.title)
      lines.push(`  - ${fmt(a)}`)
    }
  }
  if (seenNewsData.size === 0) lines.push('  No additional financial market news this week.')

  // ── FRED macro economic signals ──────────────────────────────────────────
  const fredMacro = await buildFREDMacroSignals(
    profile.revenue_countries.map(r => r.country)
  ).catch(() => '')
  if (fredMacro) lines.push('\n' + fredMacro)

  // ── HR & talent intelligence ─────────────────────────────────────────────
  lines.push('\n[HR & TALENT SIGNALS — workforce, hiring, executive moves this week]')
  const hrQueries = [
    `${company.industry} layoffs hiring freeze workforce reduction`,
    `${company.industry} talent shortage skills gap recruitment`,
    `${company.industry} executive appointment CEO CFO CTO appointed`,
    ...profile.competitors.slice(0, 2).map(c => `"${c.name}" hiring layoffs workforce`),
  ]
  const hrFetches = hrQueries.slice(0, 4).map(q => fetchNews(q, 2))
  const hrResults = await Promise.all(hrFetches)
  const seenHR = new Set<string>()
  for (const articles of hrResults) {
    for (const a of articles) {
      if (!seenHR.has(a.title)) { seenHR.add(a.title); lines.push(`  - ${fmt(a)}`) }
    }
  }
  if (seenHR.size === 0) lines.push('  No major workforce or talent developments detected this week.')

  // ── M&A and deal flow signals ────────────────────────────────────────────
  lines.push('\n[M&A WATCH — acquisitions, mergers, funding rounds, IPOs this week]')
  const maQueries = [
    `${company.industry} acquisition merger deal announced`,
    `${company.industry} funding round Series venture capital raised`,
    `${company.industry} IPO listed stock market`,
    ...profile.competitors.slice(0, 2).map(c => `"${c.name}" acquisition merger deal partnership`),
    ...profile.revenue_countries.slice(0, 2).map(r => `${r.country} ${r.sector} acquisition merger deal`),
  ]
  const maFetches = maQueries.slice(0, 5).map(q => fetchNews(q, 2))
  const maResults = await Promise.all(maFetches)
  const seenMA = new Set<string>()
  for (const articles of maResults) {
    for (const a of articles) {
      if (!seenMA.has(a.title)) { seenMA.add(a.title); lines.push(`  - ${fmt(a)}`) }
    }
  }
  if (seenMA.size === 0) lines.push('  No major M&A or deal flow activity detected this week.')

  // ── Company-specific press coverage ─────────────────────────────────────
  lines.push(`\n[COMPANY PRESS COVERAGE — articles directly about "${company.name}" this week]`)
  const [companyDirectArticles, companyNewsDataArticles] = await Promise.all([
    fetchNews(`"${company.name}"`, 5),
    fetchNewsData(`"${company.name}"`, 'business', 3),
  ])
  const seenCompanyNews = new Set<string>()
  for (const a of [...companyDirectArticles, ...companyNewsDataArticles]) {
    if (!seenCompanyNews.has(a.title)) {
      seenCompanyNews.add(a.title)
      lines.push(`  - ${fmt(a)}`)
    }
  }
  if (seenCompanyNews.size === 0) lines.push(`  No press coverage found for "${company.name}" this week.`)

  // ── Operational country signals ──────────────────────────────────────────
  if (locations.length > 0) {
    const countrySignals = await buildCountrySignals(locations).catch(() => '')
    if (countrySignals) lines.push('\n' + countrySignals)
  }

  const result = lines.join('\n')
  console.log(`[signals] Fetched live signals: ${result.length} chars`)
  return result
}
