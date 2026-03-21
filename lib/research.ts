/**
 * Semantic Scholar — free academic paper search, no API key required.
 * Pulls top recent papers relevant to the company's industry and keywords.
 * Sends only title + 200-char abstract to Claude — no data overload.
 */

const BASE = 'https://api.semanticscholar.org/graph/v1/paper/search'
const FIELDS = 'title,abstract,year,citationCount,journal,publicationTypes'

interface S2Paper {
  paperId: string
  title: string
  abstract?: string
  year?: number
  citationCount?: number
  journal?: { name: string }
  publicationTypes?: string[]
}

interface S2Response {
  data?: S2Paper[]
}

async function searchPapers(query: string, limit = 8): Promise<S2Paper[]> {
  const url = new URL(BASE)
  url.searchParams.set('query', query)
  url.searchParams.set('fields', FIELDS)
  url.searchParams.set('limit', String(limit))
  // Only last 3 years
  const currentYear = new Date().getFullYear()
  url.searchParams.set('year', `${currentYear - 2}-${currentYear}`)

  try {
    const res = await fetch(url.toString(), {
      cache: 'no-store',
      headers: { 'User-Agent': 'ExecutiveIntelligenceBrief/1.0' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    const data: S2Response = await res.json()
    return data.data ?? []
  } catch {
    return []
  }
}

function buildQuery(industry: string, keywords: string[]): string {
  // Combine industry with top 2 keywords for a focused but not too narrow query
  const parts = [industry, ...keywords.slice(0, 2)].filter(Boolean)
  return parts.join(' ')
}

function formatPaper(p: S2Paper): string {
  const year     = p.year ? ` (${p.year})` : ''
  const journal  = p.journal?.name ? ` — ${p.journal.name}` : ''
  const abstract = p.abstract
    ? ' ' + p.abstract.replace(/\s+/g, ' ').slice(0, 200) + (p.abstract.length > 200 ? '…' : '')
    : ''
  const cited    = p.citationCount != null ? ` [${p.citationCount} citations]` : ''
  return `  "${p.title}"${year}${journal}${cited}.${abstract}`
}

/**
 * Returns a [RESEARCH SIGNALS] block string, or empty string on failure.
 * Max 5 papers, prioritised by citation count then recency.
 */
export async function buildResearchSignals(
  industry: string,
  keywords: string[],
): Promise<string> {
  if (!industry) return ''

  const query = buildQuery(industry, keywords)

  try {
    const papers = await searchPapers(query, 10)
    if (papers.length === 0) return ''

    // Sort: cited first, then by year
    const ranked = papers
      .filter(p => p.abstract && p.abstract.length > 50)
      .sort((a, b) => {
        const aCite = a.citationCount ?? 0
        const bCite = b.citationCount ?? 0
        if (aCite !== bCite) return bCite - aCite
        return (b.year ?? 0) - (a.year ?? 0)
      })
      .slice(0, 5)

    if (ranked.length === 0) return ''

    const lines = [
      `[RESEARCH SIGNALS — Semantic Scholar, recent academic papers on "${industry}" (last 3 years)]`,
      ...ranked.map(formatPaper),
    ]

    return lines.join('\n')
  } catch {
    return ''
  }
}
