/**
 * USPTO PatentsView — free REST API, no key required.
 * https://patentsview.org/apis/api-query-language
 *
 * Fetches recent patent filings for the company and its competitors.
 * Useful for R&D intelligence — what are competitors building?
 * Sends only title + 200-char abstract to Claude.
 */

const BASE = 'https://api.patentsview.org/patents/query'

interface PatentResult {
  patent_title: string
  patent_date: string
  patent_abstract?: string
  assignees?: { assignee_organization?: string }[]
}

interface PatentResponse {
  patents?: PatentResult[]
  count?: number
}

async function fetchPatents(assigneeName: string, limit = 5): Promise<PatentResult[]> {
  const cutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0] // last 12 months

  const body = {
    q: {
      _and: [
        { _contains: { assignee_organization: assigneeName } },
        { _gte: { patent_date: cutoff } },
      ],
    },
    f: ['patent_title', 'patent_date', 'patent_abstract', 'assignees.assignee_organization'],
    o: { per_page: limit, sort_by: 'patent_date', sort_order: 'desc' },
  }

  try {
    const res = await fetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'ExecutiveIntelligenceBrief/1.0' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data: PatentResponse = await res.json()
    return data.patents ?? []
  } catch {
    return []
  }
}

function formatPatent(p: PatentResult, assignee: string): string {
  const date = p.patent_date ? ` (${p.patent_date.slice(0, 7)})` : ''
  const abstract = p.patent_abstract
    ? ' ' + p.patent_abstract.replace(/\s+/g, ' ').slice(0, 200) + (p.patent_abstract.length > 200 ? '…' : '')
    : ''
  return `  [${assignee}]${date} "${p.patent_title}".${abstract}`
}

/**
 * Returns a [PATENT INTELLIGENCE] block string, or empty string on failure.
 * Covers the company itself + up to 5 competitors.
 */
export async function buildPatentSignals(
  companyName: string,
  competitors: string[],
): Promise<string> {
  const targets = [companyName, ...competitors.slice(0, 5)]

  try {
    const results = await Promise.all(
      targets.map(name => fetchPatents(name, 5).then(patents => ({ name, patents })))
    )

    const lines: string[] = [
      '[PATENT INTELLIGENCE — USPTO PatentsView, recent filings last 12 months]',
    ]

    let totalFound = 0
    for (const { name, patents } of results) {
      const withAbstract = patents.filter(p => p.patent_title && p.patent_title.length > 10)
      if (withAbstract.length > 0) {
        lines.push(`\n${name} (${withAbstract.length} recent patent${withAbstract.length !== 1 ? 's' : ''}):`)
        for (const p of withAbstract.slice(0, 3)) {
          lines.push(formatPatent(p, name))
        }
        totalFound += withAbstract.length
      }
    }

    if (totalFound === 0) return ''
    return lines.join('\n')
  } catch {
    return ''
  }
}
