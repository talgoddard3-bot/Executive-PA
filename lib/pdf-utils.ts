import { PDFDocument } from 'pdf-lib'

/**
 * Large merged filings (quarterly/annual reports bundled with appendices,
 * historical comparatives, auditor letters, multi-language duplicates) can
 * tokenize to well over Claude's 200K context window even when well under
 * the API's 32MB/100-page hard limits — a dense scanned page can run several
 * thousand tokens on its own. Truncate to the first N pages, where the
 * primary financial statements and disclosures actually live, before
 * sending to Claude for analysis.
 */
export async function truncatePdfPages(bytes: Buffer, maxPages = 40): Promise<{ bytes: Buffer; truncated: boolean; originalPages: number }> {
  try {
    const src = await PDFDocument.load(bytes, { ignoreEncryption: true })
    const totalPages = src.getPageCount()
    if (totalPages <= maxPages) {
      return { bytes, truncated: false, originalPages: totalPages }
    }

    const out = await PDFDocument.create()
    const indices = Array.from({ length: maxPages }, (_, i) => i)
    const copied = await out.copyPages(src, indices)
    copied.forEach(p => out.addPage(p))

    const outBytes = Buffer.from(await out.save())
    return { bytes: outBytes, truncated: true, originalPages: totalPages }
  } catch {
    // If pdf-lib can't parse it (unusual encoding, etc.) fall back to the original —
    // the downstream Claude call will surface its own error if it's still too large.
    return { bytes, truncated: false, originalPages: 0 }
  }
}
