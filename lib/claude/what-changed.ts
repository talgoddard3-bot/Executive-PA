import type { BriefContent, WhatChangedItem } from '@/lib/types'

// Pure-code diff between this week's brief and last week's — no LLM call.
// The model already gets a prose summary of the previous brief for tone
// (see previousBriefContext in synthesize.ts); this is the structural,
// verifiable counterpart: it can only ever report what's actually different
// between the two stored JSON objects.

function stripBold(s: string): string {
  return s.replace(/\*\*/g, '')
}

function normalize(s: string): string {
  return stripBold(s).toLowerCase().trim().replace(/[^a-z0-9 ]/g, '').slice(0, 60)
}

function levelRank(level: 'low' | 'medium' | 'high'): number {
  return level === 'high' ? 2 : level === 'medium' ? 1 : 0
}

const FORCE_LABELS: Record<string, string> = {
  rivalry: 'Industry rivalry',
  new_entrants: 'Threat of new entrants',
  supplier_power: 'Supplier power',
  buyer_power: 'Buyer power',
  substitutes: 'Threat of substitutes',
}

export function computeWhatChanged(current: BriefContent, previous: BriefContent | null): WhatChangedItem[] {
  if (!previous) return []
  const items: WhatChangedItem[] = []

  // ── Risks added / resolved ────────────────────────────────────────────
  const prevRiskTitles = new Set((previous.risk_summary ?? []).map(r => normalize(r.title)))
  const currRiskTitles = new Set((current.risk_summary ?? []).map(r => normalize(r.title)))

  for (const r of current.risk_summary ?? []) {
    if (!prevRiskTitles.has(normalize(r.title))) {
      items.push({ type: 'risk_new', title: r.title, direction: 'new', detail: r.detail })
    }
  }
  for (const r of previous.risk_summary ?? []) {
    if (!currRiskTitles.has(normalize(r.title))) {
      items.push({ type: 'risk_resolved', title: r.title, direction: 'resolved', detail: 'No longer flagged as an active risk this week.' })
    }
  }

  // ── New SWOT threats / opportunities ──────────────────────────────────
  const prevSwotPoints = new Set([
    ...(previous.swot?.threats ?? []),
    ...(previous.swot?.opportunities ?? []),
  ].map(i => normalize(i.point)))

  for (const t of current.swot?.threats ?? []) {
    if (!prevSwotPoints.has(normalize(t.point))) {
      items.push({ type: 'swot_new', title: stripBold(t.point).slice(0, 90), direction: 'new', detail: t.point })
    }
  }
  for (const o of current.swot?.opportunities ?? []) {
    if (!prevSwotPoints.has(normalize(o.point))) {
      items.push({ type: 'swot_new', title: stripBold(o.point).slice(0, 90), direction: 'new', detail: o.point })
    }
  }

  // ── New competitor moves ──────────────────────────────────────────────
  const prevCompetitorHeadlines = new Set((previous.competitor_intelligence ?? []).map(c => normalize(c.headline)))
  for (const c of current.competitor_intelligence ?? []) {
    if (!prevCompetitorHeadlines.has(normalize(c.headline))) {
      items.push({ type: 'competitor_move', title: `${c.competitor}: ${c.headline}`, direction: 'new', detail: c.detail })
    }
  }

  // ── Overall urgency shift ─────────────────────────────────────────────
  if (current.urgency && previous.urgency && current.urgency !== previous.urgency) {
    const rank = { awareness: 0, monitor: 1, 'act-now': 2 }
    const dir = rank[current.urgency] > rank[previous.urgency] ? 'up' : 'down'
    items.push({
      type: 'urgency_shift',
      title: `Overall urgency: ${previous.urgency} → ${current.urgency}`,
      direction: dir,
      detail: current.tldr ?? '',
    })
  }

  // ── Five Forces level shifts (only once both weeks have run the framework) ──
  if (current.five_forces && previous.five_forces) {
    const prevForces = new Map((previous.five_forces.forces ?? []).map(f => [f.force, f]))
    for (const f of current.five_forces.forces ?? []) {
      const prev = prevForces.get(f.force)
      if (prev && prev.level !== f.level) {
        const dir = levelRank(f.level) > levelRank(prev.level) ? 'up' : 'down'
        items.push({
          type: 'five_forces_shift',
          title: `${FORCE_LABELS[f.force] ?? f.force}: ${prev.level} → ${f.level}`,
          direction: dir,
          detail: f.rationale,
        })
      }
    }
  }

  return items.slice(0, 8)
}
