import { createClient } from '@supabase/supabase-js'
import { anthropic } from './claude/client'
import { truncatePdfPages } from './pdf-utils'

function service() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface ReportLink {
  url: string
  label: string
}

/**
 * Extracts PDF report links from a company's own public investor-relations
 * page HTML and picks the most recent one. Handles the common WordPress
 * upload convention (/wp-content/uploads/YYYY/MM/...) by preferring the
 * link with the latest year/month; falls back to the first PDF link found
 * (most IR pages list newest first) when that pattern isn't present.
 */
function pickLatestReportLink(html: string, pageUrl: string): ReportLink | null {
  const links: ReportLink[] = []
  const anchorRegex = /<a\b[^>]*href=["']([^"']+\.pdf)["'][^>]*>([\s\S]*?)<\/a>/gi
  let match: RegExpExecArray | null
  while ((match = anchorRegex.exec(html)) !== null) {
    const href = match[1]
    const label = match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    try {
      const abs = new URL(href, pageUrl).toString()
      links.push({ url: abs, label: label || abs.split('/').pop() || 'Report' })
    } catch {
      // skip malformed hrefs
    }
  }
  if (links.length === 0) return null

  const dated = links
    .map(l => {
      const m = l.url.match(/\/uploads\/(\d{4})\/(\d{2})\//)
      return m ? { link: l, year: Number(m[1]), month: Number(m[2]) } : null
    })
    .filter(Boolean) as { link: ReportLink; year: number; month: number }[]

  if (dated.length > 0) {
    dated.sort((a, b) => (b.year - a.year) || (b.month - a.month))
    return dated[0].link
  }

  return links[0]
}

async function fetchLatestReportLink(irPageUrl: string): Promise<ReportLink | null> {
  try {
    const res = await fetch(irPageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; IntelligentBriefBot/1.0)' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return null
    const html = await res.text()
    return pickLatestReportLink(html, irPageUrl)
  } catch {
    return null
  }
}

async function analyzeReportPDF(title: string, companyName: string, bytes: Buffer): Promise<string> {
  // Merged filings (statements + appendices + historical comparatives) can tokenize
  // past Claude's 200K context even under the API's 32MB/100-page hard limits.
  // Truncate to where the primary statements live, retrying smaller if still too dense.
  const first = await truncatePdfPages(bytes, 40)
  const note = first.truncated ? ` [Note: analysis covers the first 40 of ${first.originalPages} pages.]` : ''

  try {
    return await callClaudePDF(first.bytes, title, companyName, note)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (!message.includes('too long') && !message.includes('maximum')) throw err

    const retry = await truncatePdfPages(bytes, 12)
    const retryNote = ` [Note: this report is unusually dense — analysis covers only the first 12 of ${retry.originalPages || first.originalPages} pages.]`
    return await callClaudePDF(retry.bytes, title, companyName, retryNote)
  }
}

async function callClaudePDF(bytes: Buffer, title: string, companyName: string, note: string): Promise<string> {
  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
    messages: [{
      role: 'user',
      content: [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: bytes.toString('base64') } },
        { type: 'text', text: `This is an official financial report titled "${title}", filed by ${companyName}. Extract the key figures and disclosures: revenue, profit/loss, key balance sheet items, guidance or outlook statements, and any material events mentioned. Concise bullet points only — this is real filed data, be precise and only state what's actually in the document.` },
      ],
    }],
  })
  const text = msg.content.filter(b => b.type === 'text').map(b => (b as { text: string }).text).join('')
  return text + note
}

/**
 * Checks a company's own IR page for a newer report than the one already on
 * file. If unchanged, returns the previously-analyzed summary at no extra
 * cost. If a new report is found, downloads and analyzes it, persists the
 * result to company_profiles, and returns the fresh summary. Returns '' if
 * no ir_page_url is configured or nothing could be fetched.
 */
export async function checkAndUpdateIRReport(
  companyId: string,
  companyName: string,
  profile: { ir_page_url?: string | null; ir_last_report_url?: string | null; ir_last_report_summary?: string | null }
): Promise<string> {
  const irPageUrl = profile.ir_page_url?.trim()
  if (!irPageUrl) return ''

  try {
    const latest = await fetchLatestReportLink(irPageUrl)
    if (!latest) return ''

    if (latest.url === profile.ir_last_report_url && profile.ir_last_report_summary) {
      return formatBlock(companyName, latest.label, profile.ir_last_report_summary)
    }

    const fileRes = await fetch(latest.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; IntelligentBriefBot/1.0)' },
      signal: AbortSignal.timeout(30000),
    })
    if (!fileRes.ok) return ''
    const bytes = Buffer.from(await fileRes.arrayBuffer())

    const summary = await analyzeReportPDF(latest.label, companyName, bytes)

    const db = service()
    await db
      .from('company_profiles')
      .update({
        ir_last_report_url: latest.url,
        ir_last_report_title: latest.label,
        ir_last_report_summary: summary,
        ir_last_checked_at: new Date().toISOString(),
      })
      .eq('company_id', companyId)

    return formatBlock(companyName, latest.label, summary)
  } catch (err) {
    console.warn('[investor-relations] check failed:', err)
    return ''
  }
}

function formatBlock(companyName: string, reportLabel: string | null | undefined, summary: string): string {
  return `\n\n[OFFICIAL FINANCIAL REPORT — from ${companyName}'s own investor relations page${reportLabel ? `, "${reportLabel}"` : ''}]\n${summary}\n`
}
