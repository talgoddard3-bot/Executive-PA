/**
 * SEC EDGAR integration — fetches recent 8-K filings.
 * Uses the free EDGAR API (no API key required).
 *
 * Flow:
 *  1. If a company has a stock ticker → resolve to CIK via company_tickers.json
 *     → fetch their filings directly (most precise)
 *  2. If no ticker → fall back to EDGAR full-text search by name
 *
 * 8-K filings cover: earnings, M&A, leadership changes, guidance, material agreements.
 */

const USER_AGENT    = 'IntelligentBrief/1.0 contact@companybrief.net'
const EDGAR_SEARCH  = 'https://efts.sec.gov/LATEST/search-index'
const TICKERS_URL   = 'https://www.sec.gov/files/company_tickers.json'

// Cached in-memory for the lifetime of the request
let tickerCache: Record<string, { cik: string; title: string }> | null = null

async function resolveTickerToCIK(ticker: string): Promise<string | null> {
  try {
    if (!tickerCache) {
      const res = await fetch(TICKERS_URL, {
        headers: { 'User-Agent': USER_AGENT },
        next: { revalidate: 3600 }, // cache 1 hour
      })
      if (!res.ok) return null
      const raw = await res.json()
      tickerCache = {}
      for (const entry of Object.values(raw) as { cik_str: number; ticker: string; title: string }[]) {
        tickerCache[entry.ticker.toUpperCase()] = {
          cik: String(entry.cik_str).padStart(10, '0'),
          title: entry.title,
        }
      }
    }
    return tickerCache[ticker.toUpperCase()]?.cik ?? null
  } catch {
    return null
  }
}

interface Filing8K {
  name: string
  date: string
  items: string
  formType: string
}

/** Fetch recent 8-Ks by CIK from the EDGAR submissions API */
async function filingsByCIK(cik: string, entityName: string, daysBack = 7): Promise<Filing8K[]> {
  try {
    const res = await fetch(`https://data.sec.gov/submissions/CIK${cik}.json`, {
      headers: { 'User-Agent': USER_AGENT },
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data = await res.json()

    const forms: string[]  = data.filings?.recent?.form ?? []
    const dates: string[]  = data.filings?.recent?.filingDate ?? []
    const items: string[]  = data.filings?.recent?.items ?? []

    const cutoff = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const results: Filing8K[] = []
    for (let i = 0; i < forms.length; i++) {
      if (forms[i] !== '8-K') continue
      if (dates[i] < cutoff) break  // filings are newest-first
      results.push({ name: entityName, date: dates[i], items: items[i] ?? '', formType: forms[i] })
      if (results.length >= 3) break
    }
    return results
  } catch {
    return []
  }
}

/** Fall back: EDGAR full-text search by company name */
async function filingsByName(companyName: string, daysBack = 7): Promise<Filing8K[]> {
  const endDate   = new Date()
  const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
  const fmt = (d: Date) => d.toISOString().split('T')[0]

  const url = new URL(EDGAR_SEARCH)
  url.searchParams.set('q', `"${companyName}"`)
  url.searchParams.set('forms', '8-K')
  url.searchParams.set('dateRange', 'custom')
  url.searchParams.set('startdt', fmt(startDate))
  url.searchParams.set('enddt', fmt(endDate))

  try {
    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': USER_AGENT },
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data = await res.json()

    return (data.hits?.hits ?? []).slice(0, 2).map((hit: {
      _source: { display_names?: { name: string }[]; file_date: string; items?: string; form_type: string }
    }) => ({
      name:     hit._source.display_names?.[0]?.name ?? companyName,
      date:     hit._source.file_date,
      items:    hit._source.items ?? '',
      formType: hit._source.form_type,
    }))
  } catch {
    return []
  }
}

function classify8KItem(items: string): string {
  if (items.includes('1.01')) return 'Material Agreement'
  if (items.includes('1.02')) return 'Agreement Termination'
  if (items.includes('1.03')) return 'Bankruptcy/Receivership'
  if (items.includes('2.01')) return 'Asset Acquisition / Disposal'
  if (items.includes('2.02')) return 'Earnings Release'
  if (items.includes('2.05') || items.includes('2.06')) return 'Impairment / Exit Costs'
  if (items.includes('5.01')) return 'Change in Control'
  if (items.includes('5.02')) return 'Leadership Change'
  if (items.includes('7.01') || items.includes('8.01')) return 'Press Release'
  return 'Regulatory Filing'
}

interface CompetitorInput {
  name: string
  ticker?: string
}

/**
 * Main export — fetches 8-K filings for a list of competitors.
 * Uses ticker → CIK lookup when available, falls back to name search.
 * Also accepts optional own company ticker to include own filings.
 */
export async function buildEdgarSignals(
  competitors: CompetitorInput[],
  ownTicker?: string | null,
): Promise<string> {
  if (!competitors.length && !ownTicker) return ''

  const tasks: Promise<Filing8K[]>[] = []

  // Own company filings (informational — did we file anything this week?)
  if (ownTicker) {
    tasks.push(
      resolveTickerToCIK(ownTicker).then(cik =>
        cik ? filingsByCIK(cik, `[Own Company]`, 7) : []
      )
    )
  }

  // Competitor filings
  for (const comp of competitors.slice(0, 6)) {
    if (comp.ticker) {
      tasks.push(
        resolveTickerToCIK(comp.ticker).then(cik =>
          cik ? filingsByCIK(cik, comp.name, 7) : filingsByName(comp.name, 7)
        )
      )
    } else {
      tasks.push(filingsByName(comp.name, 7))
    }
  }

  const results = await Promise.all(tasks)
  const filings = results.flat()

  if (!filings.length) return ''

  const lines: string[] = ['\n[SEC EDGAR 8-K FILINGS — regulatory disclosures filed this week]']
  for (const f of filings) {
    const eventType = classify8KItem(f.items)
    const date = new Date(f.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    lines.push(`• ${f.name} (${date}): ${eventType}${f.items ? ` — Items: ${f.items}` : ''}`)
  }
  lines.push('(Source: SEC EDGAR public filings — primary authoritative source)')

  return lines.join('\n')
}
