import {
  Html, Head, Body, Container, Preview,
  Section, Row, Column, Text, Heading, Link, Button, Hr, Img,
} from '@react-email/components'
import type { BriefContent, SWOTItem } from '@/lib/types'

interface Props {
  companyName: string
  weekOf: string
  generatedAt: string
  briefUrl: string
  content: BriefContent
  brandColor: string
  logoUrl?: string | null
}

// Strip markdown bold (**text**) for plain email text
function strip(text: string): string {
  return text.replace(/\*\*/g, '')
}

const SWOT_STYLE = {
  strengths:     { label: 'Strengths',     bg: '#f0fdf4', border: '#86efac', text: '#15803d', dot: '#22c55e' },
  weaknesses:    { label: 'Weaknesses',    bg: '#fff7ed', border: '#fdba74', text: '#c2410c', dot: '#f97316' },
  opportunities: { label: 'Opportunities', bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8', dot: '#3b82f6' },
  threats:       { label: 'Threats',       bg: '#fef2f2', border: '#fca5a5', text: '#b91c1c', dot: '#ef4444' },
}

const SEVERITY_COLOR: Record<string, string> = {
  high: '#dc2626', medium: '#d97706', low: '#6b7280',
}

export function BriefDigestEmail({
  companyName, weekOf, generatedAt, briefUrl, content, brandColor, logoUrl,
}: Props) {
  const preview = `${content.headline} — ${strip(content.executive_summary).slice(0, 120)}…`

  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px' }}>

          {/* ── Header ─────────────────────────────────────────────────── */}
          <Section style={{ backgroundColor: brandColor, borderRadius: '12px 12px 0 0', padding: '20px 28px' }}>
            <Row>
              <Column>
                {logoUrl && (
                  <Img src={logoUrl} width={24} height={24} alt={companyName}
                    style={{ borderRadius: 4, display: 'inline-block', verticalAlign: 'middle', marginRight: 8 }} />
                )}
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0, display: 'inline' }}>
                  Executive Intelligence Brief
                </Text>
              </Column>
              <Column align="right">
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, margin: 0 }}>
                  {companyName} · Week of {weekOf}
                </Text>
              </Column>
            </Row>
          </Section>

          {/* ── Headline block ─────────────────────────────────────────── */}
          <Section style={{ backgroundColor: '#ffffff', padding: '24px 28px 0' }}>
            <Heading as="h1" style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1.3, margin: '0 0 12px' }}>
              {content.headline}
            </Heading>
            <Text style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, margin: '0 0 8px', borderLeft: `3px solid ${brandColor}`, paddingLeft: 12 }}>
              {strip(content.executive_summary)}
            </Text>
            <Text style={{ fontSize: 10, color: '#9ca3af', margin: '8px 0 0' }}>
              🕐 Generated {new Date(generatedAt).toLocaleString('en-GB', {
                day: 'numeric', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
              })} UTC
            </Text>
          </Section>

          <Hr style={{ borderColor: '#e5e7eb', margin: '0 28px' }} />

          {/* ── SWOT snapshot ──────────────────────────────────────────── */}
          {content.swot && (
            <Section style={{ backgroundColor: '#ffffff', padding: '20px 28px' }}>
              <Text style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 12px' }}>
                SWOT Snapshot
              </Text>
              <Row style={{ gap: 8 }}>
                {(Object.entries(SWOT_STYLE) as [keyof typeof SWOT_STYLE, typeof SWOT_STYLE.strengths][]).map(([key, style]) => {
                  const items: SWOTItem[] = content.swot[key] ?? []
                  return (
                    <Column key={key} style={{ width: '50%', paddingRight: 6, paddingBottom: 8, verticalAlign: 'top' }}>
                      <Section style={{ backgroundColor: style.bg, border: `1px solid ${style.border}`, borderRadius: 8, padding: '10px 12px' }}>
                        <Text style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: style.text, margin: '0 0 6px' }}>
                          {style.label}
                        </Text>
                        {items.slice(0, 2).map((item, i) => (
                          <Text key={i} style={{ fontSize: 11, color: '#374151', margin: '0 0 4px', lineHeight: 1.5 }}>
                            <span style={{ color: style.dot }}>●</span> {strip(item.point)}
                          </Text>
                        ))}
                      </Section>
                    </Column>
                  )
                })}
              </Row>
            </Section>
          )}

          <Hr style={{ borderColor: '#e5e7eb', margin: '0 28px' }} />

          {/* ── Top Risks ──────────────────────────────────────────────── */}
          {content.risk_summary?.length > 0 && (
            <Section style={{ backgroundColor: '#ffffff', padding: '20px 28px' }}>
              <Text style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 12px' }}>
                Risk Register
              </Text>
              {content.risk_summary.slice(0, 4).map((risk, i) => (
                <Row key={i} style={{ marginBottom: 8 }}>
                  <Column style={{ width: 10, verticalAlign: 'top', paddingTop: 4, paddingRight: 8 }}>
                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: SEVERITY_COLOR[risk.severity] ?? '#6b7280' }} />
                  </Column>
                  <Column>
                    <Text style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', margin: 0 }}>{risk.title}</Text>
                    <Text style={{ fontSize: 11, color: '#6b7280', margin: '2px 0 0' }}>{risk.detail}</Text>
                  </Column>
                </Row>
              ))}
            </Section>
          )}

          <Hr style={{ borderColor: '#e5e7eb', margin: '0 28px' }} />

          {/* ── Competitor moves ───────────────────────────────────────── */}
          {content.competitor_intelligence?.length > 0 && (
            <Section style={{ backgroundColor: '#ffffff', padding: '20px 28px' }}>
              <Text style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 12px' }}>
                Competitor Moves
              </Text>
              {content.competitor_intelligence.slice(0, 3).map((item, i) => (
                <Section key={i} style={{ borderLeft: `3px solid ${item.threat_level === 'high' ? '#dc2626' : item.threat_level === 'medium' ? '#d97706' : '#d1d5db'}`, paddingLeft: 10, marginBottom: 10 }}>
                  <Text style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', margin: '0 0 2px' }}>
                    {item.competitor} · {item.threat_level} threat
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', margin: '0 0 2px' }}>{item.headline}</Text>
                  <Text style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>{item.detail}</Text>
                </Section>
              ))}
            </Section>
          )}

          <Hr style={{ borderColor: '#e5e7eb', margin: '0 28px' }} />

          {/* ── Decision framing ───────────────────────────────────────── */}
          {content.decision_framing?.length > 0 && (
            <Section style={{ backgroundColor: '#ffffff', padding: '20px 28px' }}>
              <Text style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 12px' }}>
                Decisions This Week
              </Text>
              {content.decision_framing.slice(0, 3).map((d, i) => (
                <Row key={i} style={{ marginBottom: 10 }}>
                  <Column style={{ width: 20, verticalAlign: 'top' }}>
                    <Text style={{ fontSize: 12, fontWeight: 700, color: brandColor, margin: 0 }}>{i + 1}.</Text>
                  </Column>
                  <Column>
                    <Text style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', margin: '0 0 2px' }}>{d.question}</Text>
                    <Text style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>{d.context}</Text>
                  </Column>
                </Row>
              ))}
            </Section>
          )}

          {/* ── CTA ────────────────────────────────────────────────────── */}
          <Section style={{ backgroundColor: '#ffffff', borderRadius: '0 0 12px 12px', padding: '8px 28px 28px', textAlign: 'center' }}>
            <Button
              href={briefUrl}
              style={{
                backgroundColor: brandColor,
                color: '#ffffff',
                fontSize: 14,
                fontWeight: 700,
                padding: '12px 32px',
                borderRadius: 8,
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Read Full Brief →
            </Button>
          </Section>

          {/* ── Footer ─────────────────────────────────────────────────── */}
          <Section style={{ padding: '16px 28px', textAlign: 'center' }}>
            <Text style={{ fontSize: 10, color: '#9ca3af', margin: 0 }}>
              {companyName} · Executive Intelligence Brief · Week of {weekOf}
            </Text>
            <Text style={{ fontSize: 10, color: '#9ca3af', margin: '4px 0 0' }}>
              <Link href={`${briefUrl.replace(/\/briefs.*/, '/settings/schedule')}`} style={{ color: '#9ca3af' }}>
                Manage notification settings
              </Link>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}
