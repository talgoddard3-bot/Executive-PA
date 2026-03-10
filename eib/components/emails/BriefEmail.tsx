import {
  Html, Head, Body, Container, Section, Text, Heading, Hr, Link, Row, Column, Preview,
} from '@react-email/components'
import type { BriefContent } from '@/lib/types'

const RTL_LANGUAGES = new Set(['Hebrew', 'Arabic'])
const LANG_CODES: Record<string, string> = { 'Hebrew': 'he', 'Arabic': 'ar' }

interface BriefEmailProps {
  companyName: string
  weekOf: string
  content: BriefContent
  briefUrl: string
  appUrl?: string
  language?: string
}

// Top 5 items across sections by priority, one sentence each
function pickTopSignals(content: BriefContent, briefUrl: string) {
  const items: { label: string; color: string; text: string; href: string }[] = []
  const base = briefUrl.replace('/full', '')

  const highRisks = content.risk_summary?.filter(r => r.severity === 'high') ?? []
  highRisks.slice(0, 2).forEach(r =>
    items.push({ label: 'Risk', color: '#dc2626', text: r.title + ' — ' + r.detail.replace(/\*\*/g, '').split('.')[0] + '.', href: `${base}/markets` })
  )

  content.competitor_intelligence?.slice(0, 1).forEach(c =>
    items.push({ label: 'Competitor', color: '#7c3aed', text: `${c.competitor}: ${c.headline}`, href: `${base}/competitors` })
  )

  content.geopolitical_news?.slice(0, 1).forEach(g =>
    items.push({ label: 'Geopolitical', color: '#0369a1', text: `${g.region}: ${g.headline}`, href: `${base}/geopolitical` })
  )

  content.financial_news?.slice(0, 1).forEach(f =>
    items.push({ label: 'Markets', color: '#0f766e', text: `${f.market}: ${f.headline}`, href: `${base}/markets` })
  )

  return items.slice(0, 5)
}

// Helper: bold the first occurrence of key phrases (wraps **text** markdown in <strong>)
function boldify(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  if (parts.length === 1) return text
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**')
      ? <strong key={i}>{p.slice(2, -2)}</strong>
      : p
  )
}

export default function BriefEmail({ companyName, weekOf, content, briefUrl, appUrl = 'http://localhost:3000', language = 'English' }: BriefEmailProps) {
  const isRtl = RTL_LANGUAGES.has(language)
  const langCode = LANG_CODES[language] ?? 'en'
  const highRisks  = content.risk_summary?.filter(r => r.severity === 'high').length ?? 0
  const medRisks   = content.risk_summary?.filter(r => r.severity === 'medium').length ?? 0
  const lowRisks   = content.risk_summary?.filter(r => r.severity === 'low').length ?? 0
  const topSignals = pickTopSignals(content, briefUrl)

  const capital = content.capital_impact
  const topDecision = content.decision_framing?.[0]
  const base = briefUrl.replace('/full', '')

  const sectionLinks = [
    { label: 'Markets',      count: content.financial_news?.length ?? 0,          href: `${base}/markets`,     color: '#0f766e' },
    { label: 'Competitors',  count: content.competitor_intelligence?.length ?? 0,  href: `${base}/competitors`, color: '#7c3aed' },
    { label: 'Customers',    count: content.customer_intelligence?.length ?? 0,   href: `${base}/customers`,   color: '#0891b2' },
    { label: 'Geopolitical', count: content.geopolitical_news?.length ?? 0,        href: `${base}/geopolitical`,color: '#0369a1' },
    { label: 'Operations',   count: content.operational_intelligence?.length ?? 0, href: `${base}/supply-chain`,color: '#92400e' },
    { label: 'Technology',   count: content.tech_intelligence?.length ?? 0,        href: `${base}/technology`,  color: '#1d4ed8' },
    { label: 'M&A Watch',    count: content.ma_watch?.length ?? 0,                href: `${base}/ma`,          color: '#be185d' },
  ].filter(s => s.count > 0)

  // Initials fallback for company logo
  const initials = companyName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <Html lang={langCode} dir={isRtl ? 'rtl' : 'ltr'}>
      <Head>
        <style>{`
          @media only screen and (max-width: 600px) {
            .email-container { padding: 0 !important; }
            .header-section { padding: 28px 20px 24px !important; }
            .content-section { padding: 24px 20px !important; }
            .signal-label { display: none !important; }
            .section-link-col { width: 50% !important; }
          }
        `}</style>
      </Head>
      <Preview>{content.headline ?? `Your intelligence brief — Week of ${weekOf}`}</Preview>
      <Body style={{ backgroundColor: '#f0f4f8', fontFamily: isRtl ? '"Segoe UI", "Arial Hebrew", Arial, sans-serif' : '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif', margin: 0, padding: '20px 0', direction: isRtl ? 'rtl' : 'ltr' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto' }} className="email-container">

          {/* ── Top action buttons ── */}
          <Section style={{ textAlign: 'center', paddingBottom: '16px' }}>
            <Row>
              <Column style={{ textAlign: 'center' }}>
                <Link
                  href={appUrl}
                  style={{ display: 'inline-block', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', color: '#475569', fontSize: '12px', fontWeight: 600, textDecoration: 'none', padding: '8px 18px', borderRadius: '20px', marginRight: '8px' }}
                >
                  EIB Intelligence
                </Link>
                <Link
                  href={briefUrl}
                  style={{ display: 'inline-block', backgroundColor: '#6366f1', color: '#ffffff', fontSize: '12px', fontWeight: 600, textDecoration: 'none', padding: '8px 18px', borderRadius: '20px' }}
                >
                  Open in browser →
                </Link>
              </Column>
            </Row>
          </Section>

          {/* ── Header card — centered, lighter ── */}
          <Section style={{ backgroundColor: '#1e40af', borderRadius: '16px 16px 0 0', padding: '36px 32px 28px', textAlign: 'center' }} className="header-section">
            {/* Company initials badge */}
            <Text style={{ margin: '0 auto 16px', width: '56px', height: '56px', lineHeight: '56px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '14px', fontSize: '20px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.05em', textAlign: 'center' }}>
              {initials}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 6px' }}>
              Intelligence Brief
            </Text>
            <Heading style={{ color: '#ffffff', fontSize: '26px', fontWeight: 800, margin: '0 0 6px', lineHeight: 1.2 }}>
              {companyName}
            </Heading>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', margin: '0 0 16px' }}>
              Week of {weekOf}
            </Text>
            {highRisks > 0 && (
              <Text style={{ display: 'inline-block', backgroundColor: '#dc2626', color: '#ffffff', fontSize: '11px', fontWeight: 800, padding: '5px 14px', borderRadius: '20px', margin: 0, letterSpacing: '0.05em' }}>
                ⚠ {highRisks} HIGH RISK
              </Text>
            )}
          </Section>

          {/* ── Headline banner ── */}
          <Section style={{ backgroundColor: '#1d3461', padding: '18px 32px', textAlign: 'center' }}>
            <Text style={{ color: '#bfdbfe', fontSize: '14px', fontWeight: 500, lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
              &ldquo;{content.headline}&rdquo;
            </Text>
          </Section>

          {/* ── White content area ── */}
          <Section style={{ backgroundColor: '#ffffff', padding: '28px 32px', borderRadius: '0 0 16px 16px' }} className="content-section">

            {/* Executive summary */}
            <Text style={{ fontSize: '14px', color: '#374151', lineHeight: 1.8, margin: '0 0 24px' }}>
              {boldify(content.executive_summary ?? '')}
            </Text>

            <Hr style={{ borderColor: '#f1f5f9', margin: '0 0 24px' }} />

            {/* This week's top signals */}
            {topSignals.length > 0 && (
              <>
                <Text style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9ca3af', margin: '0 0 14px' }}>
                  This week's key signals
                </Text>
                {topSignals.map((s, i) => (
                  <Row key={i} style={{ marginBottom: '12px' }}>
                    <Column style={{ width: '80px', verticalAlign: 'top', paddingTop: '2px' }} className="signal-label">
                      <Text style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ffffff', backgroundColor: s.color, padding: '3px 7px', borderRadius: '4px', margin: 0, display: 'inline-block' }}>
                        {s.label}
                      </Text>
                    </Column>
                    <Column style={{ paddingLeft: '8px' }}>
                      <Text style={{ fontSize: '13px', color: '#1f2937', margin: 0, lineHeight: 1.55 }}>
                        <strong>{s.text.split('—')[0].trim()}</strong>
                        {s.text.includes('—') ? ' — ' + s.text.split('—').slice(1).join('—').trim() : ''}
                        {' '}
                        <Link href={s.href} style={{ color: '#6366f1', fontSize: '11px', textDecoration: 'none', fontWeight: 700 }}>
                          Read more →
                        </Link>
                      </Text>
                    </Column>
                  </Row>
                ))}
                <Hr style={{ borderColor: '#f1f5f9', margin: '20px 0' }} />
              </>
            )}

            {/* Risk radar */}
            {content.risk_summary && content.risk_summary.length > 0 && (
              <>
                <Text style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9ca3af', margin: '0 0 10px' }}>
                  Risk Radar
                </Text>
                <Text style={{ fontSize: '13px', color: '#374151', margin: '0 0 6px' }}>
                  <strong style={{ color: '#dc2626' }}>{highRisks} High</strong>
                  {'  ·  '}
                  <strong style={{ color: '#d97706' }}>{medRisks} Medium</strong>
                  {'  ·  '}
                  <span style={{ color: '#16a34a', fontWeight: 600 }}>{lowRisks} Low</span>
                </Text>
                {content.risk_summary[0] && (
                  <Text style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 16px', lineHeight: 1.5 }}>
                    Top risk: <strong style={{ color: '#111827' }}>{content.risk_summary[0].title}</strong>
                    {'  '}
                    <Link href={`${base}/markets`} style={{ color: '#6366f1', fontSize: '11px', textDecoration: 'none', fontWeight: 700 }}>
                      See all →
                    </Link>
                  </Text>
                )}
                <Hr style={{ borderColor: '#f1f5f9', margin: '0 0 20px' }} />
              </>
            )}

            {/* Capital impact */}
            {capital && (capital.revenue_exposure || capital.margin_pressure) && (
              <>
                <Text style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9ca3af', margin: '0 0 10px' }}>
                  Capital Impact
                </Text>
                {capital.revenue_exposure && (
                  <Text style={{ fontSize: '13px', color: '#374151', margin: '0 0 6px', lineHeight: 1.6 }}>
                    <strong style={{ color: '#111827' }}>Revenue:</strong>{' '}
                    {boldify(capital.revenue_exposure.replace(/\*\*/g, ''))}
                  </Text>
                )}
                {capital.margin_pressure && (
                  <Text style={{ fontSize: '13px', color: '#374151', margin: '0 0 6px', lineHeight: 1.6 }}>
                    <strong style={{ color: '#111827' }}>Margins:</strong>{' '}
                    {boldify(capital.margin_pressure.replace(/\*\*/g, ''))}
                  </Text>
                )}
                <Hr style={{ borderColor: '#f1f5f9', margin: '16px 0 20px' }} />
              </>
            )}

            {/* Decision to make */}
            {topDecision && (
              <>
                <Text style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9ca3af', margin: '0 0 8px' }}>
                  Decision This Week
                </Text>
                <Text style={{ fontSize: '15px', fontWeight: 800, color: '#111827', margin: '0 0 6px', lineHeight: 1.4 }}>
                  {topDecision.question}
                </Text>
                <Text style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px', lineHeight: 1.6 }}>
                  {topDecision.context}
                  {'  '}
                  <Link href={briefUrl} style={{ color: '#6366f1', fontSize: '11px', textDecoration: 'none', fontWeight: 700 }}>
                    See options →
                  </Link>
                </Text>
                <Hr style={{ borderColor: '#f1f5f9', margin: '16px 0 20px' }} />
              </>
            )}

            {/* Section quick links */}
            {sectionLinks.length > 0 && (
              <>
                <Text style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9ca3af', margin: '0 0 12px' }}>
                  Full brief by section
                </Text>
                <Row style={{ marginBottom: '24px' }}>
                  {sectionLinks.map((s, i) => (
                    <Column key={i} style={{ width: '33%', paddingBottom: '10px' }} className="section-link-col">
                      <Link href={s.href} style={{ textDecoration: 'none' }}>
                        <Text style={{ fontSize: '12px', color: s.color, fontWeight: 700, margin: '0 0 1px' }}>
                          {s.label}
                        </Text>
                        <Text style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>
                          {s.count} item{s.count !== 1 ? 's' : ''} →
                        </Text>
                      </Link>
                    </Column>
                  ))}
                </Row>
              </>
            )}

            {/* Main CTA */}
            <Section style={{ textAlign: 'center', paddingTop: '4px' }}>
              <Link
                href={briefUrl}
                style={{ display: 'inline-block', backgroundColor: '#1e40af', color: '#ffffff', fontSize: '15px', fontWeight: 700, textDecoration: 'none', padding: '14px 36px', borderRadius: '10px', letterSpacing: '0.02em' }}
              >
                Open Full Brief →
              </Link>
            </Section>
          </Section>

          {/* ── Footer ── */}
          <Section style={{ textAlign: 'center', padding: '20px 32px' }}>
            <Text style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 8px' }}>
              <Link href={appUrl} style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 700 }}>
                Executive Intelligence Brief
              </Link>
              {'  ·  Generated '}
              {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
            <Link
              href={appUrl}
              style={{ display: 'inline-block', backgroundColor: '#f3f4f6', color: '#6b7280', fontSize: '12px', fontWeight: 600, textDecoration: 'none', padding: '7px 20px', borderRadius: '20px' }}
            >
              Go to dashboard →
            </Link>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}
