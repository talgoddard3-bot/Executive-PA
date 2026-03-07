import type { CompanyProfile } from '@/lib/types'

/**
 * MVP: Generates realistic simulated signals based on company profile.
 * Phase 2 will replace this with live data from news/economic APIs.
 */
export function generateSimulatedSignals(profile: CompanyProfile): string {
  const lines: string[] = []

  lines.push('[DEMAND SIGNALS]')
  for (const rc of profile.revenue_countries) {
    lines.push(
      `${rc.country} (${rc.sector}): PMI reading for ${rc.sector} sector came in at 51.2, marginal expansion. ` +
        `Energy costs rose 4% month-on-month. No significant regulatory changes announced.`
    )
  }

  lines.push('')
  lines.push('[SUPPLY CHAIN SIGNALS]')
  for (const sc of profile.supplier_countries) {
    lines.push(
      `${sc.country} (${sc.materials}): Port throughput normal. ` +
        `No active strikes or export restrictions. ` +
        `Lead times stable at typical levels. Currency movement: +1.2% vs EUR.`
    )
  }

  lines.push('')
  lines.push('[COMPETITIVE SIGNALS]')
  for (const comp of profile.competitors) {
    lines.push(
      `${comp.name}: No major public announcements this week. ` +
        `LinkedIn activity suggests active hiring in engineering and sales. ` +
        `No new product launches detected via press monitoring.`
    )
  }

  if (profile.keywords.length > 0) {
    lines.push('')
    lines.push('[SECTOR SIGNALS]')
    lines.push(
      `Keywords monitored: ${profile.keywords.join(', ')}. ` +
        `No major regulatory changes this week. Trade publication coverage is neutral.`
    )
  }

  return lines.join('\n')
}
