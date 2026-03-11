import { createClient } from '@supabase/supabase-js'

function service() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Builds the [INTERNAL SIGNALS] block that gets prepended to the Claude prompt.
 * Pulls active notes, active document descriptions, and recent helpful article feedback.
 * File contents are NEVER accessed — only title + description.
 */
export async function buildInternalSignals(companyId: string): Promise<string> {
  const db = service()
  const now = new Date().toISOString()

  const [notesResult, docsResult, feedbackResult] = await Promise.all([
    // Active, non-expired notes
    db
      .from('internal_notes')
      .select('category, content, created_at')
      .eq('company_id', companyId)
      .eq('archived', false)
      .gte('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(20),

    // Active, non-expired document descriptions
    db
      .from('uploaded_documents')
      .select('title, description, file_type, created_at')
      .eq('company_id', companyId)
      .eq('archived', false)
      .gte('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(10),

    // Most helpful (👍) article feedback with tags in the last 90 days
    db
      .from('article_feedback')
      .select('section, item_index, rating, tag, created_at')
      .eq('company_id', companyId)
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  const sections: string[] = []

  // ── Internal notes ─────────────────────────────────────────────────────────
  const notes = notesResult.data ?? []
  if (notes.length > 0) {
    const lines = notes.map(n => `[${n.category}] ${n.content}`)
    sections.push(`INTERNAL NOTES (added by company users, highest priority):\n${lines.join('\n')}`)
  }

  // ── Uploaded document descriptions ────────────────────────────────────────
  const docs = docsResult.data ?? []
  if (docs.length > 0) {
    const lines = docs.map(d =>
      `- "${d.title}" (${d.file_type}): ${d.description || '(no description provided)'}`
    )
    sections.push(`INTERNAL DOCUMENTS (summaries only — files not shared with AI):\n${lines.join('\n')}`)
  }

  // ── Article feedback signals ───────────────────────────────────────────────
  const feedback = feedbackResult.data ?? []
  if (feedback.length > 0) {
    const helpful = feedback.filter(f => f.rating === 1)
    const unhelpful = feedback.filter(f => f.rating === -1)

    const lines: string[] = []

    if (helpful.length > 0) {
      // Group by section to surface topic preferences
      const bySection: Record<string, number> = {}
      helpful.forEach(f => { bySection[f.section] = (bySection[f.section] ?? 0) + 1 })
      const topSections = Object.entries(bySection)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([s, n]) => `${s.replace(/_/g, ' ')} (${n} helpful votes)`)
      lines.push(`Topics users found most valuable: ${topSections.join(', ')}`)

      // Tagged items carry explicit user intent
      const tagged = helpful.filter(f => f.tag).map(f => `"${f.tag}"`)
      if (tagged.length > 0) {
        lines.push(`User tags on helpful articles: ${tagged.slice(0, 10).join(' | ')}`)
      }
    }

    if (unhelpful.length > 0) {
      const bySection: Record<string, number> = {}
      unhelpful.forEach(f => { bySection[f.section] = (bySection[f.section] ?? 0) + 1 })
      const lowSections = Object.entries(bySection)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([s, n]) => `${s.replace(/_/g, ' ')} (${n} not-helpful votes)`)
      lines.push(`Topics users found less relevant (de-prioritise if possible): ${lowSections.join(', ')}`)
    }

    if (lines.length > 0) {
      sections.push(`USER FEEDBACK FROM PREVIOUS BRIEFS (use to calibrate relevance):\n${lines.join('\n')}`)
    }
  }

  if (sections.length === 0) return ''

  return `\n\n[INTERNAL SIGNALS — treat as highest-priority context]\n${'─'.repeat(60)}\n${sections.join('\n\n')}\n${'─'.repeat(60)}\n`
}
