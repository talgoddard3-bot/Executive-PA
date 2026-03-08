import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { getSessionCompanyId } from '@/lib/get-company'
import Link from 'next/link'
import MarketMiniChart from '@/components/brief/MarketMiniChart'
import type { BriefContent, StoredSparkline } from '@/lib/types'

// ── Section metadata ──────────────────────────────────────────────────────────

const SECTION_META: Record<string, { label: string; audience: string; color: string; backSegment: string }> = {
  company_news:             { label: 'Company News',            audience: 'All',  color: 'bg-gray-100 text-gray-600',     backSegment: 'company-news' },
  competitor_intelligence:  { label: 'Competitor Intelligence', audience: 'CMO',  color: 'bg-orange-50 text-orange-700',  backSegment: 'competitors' },
  marketing_opportunities:  { label: 'Marketing Opportunities', audience: 'CMO',  color: 'bg-emerald-50 text-emerald-700',backSegment: 'competitors' },
  geopolitical_news:        { label: 'Geopolitical Signals',    audience: 'CEO',  color: 'bg-violet-50 text-violet-700',  backSegment: 'geopolitical' },
  financial_news:           { label: 'Financial News',          audience: 'CFO',  color: 'bg-blue-50 text-blue-700',      backSegment: 'markets' },
  financial_signals:        { label: 'Financial Signals',       audience: 'CFO',  color: 'bg-blue-50 text-blue-700',      backSegment: 'markets' },
  tech_intelligence:        { label: 'Tech Intelligence',       audience: 'CTO',  color: 'bg-cyan-50 text-cyan-700',      backSegment: 'technology' },
  hr_intelligence:          { label: 'HR Intelligence',         audience: 'HR',   color: 'bg-pink-50 text-pink-700',      backSegment: 'hr' },
  ma_watch:                 { label: 'M&A Watch',               audience: 'BD',   color: 'bg-indigo-50 text-indigo-700',  backSegment: 'ma' },
  operational_intelligence: { label: 'Operational Intelligence',audience: 'CBPO', color: 'bg-amber-50 text-amber-700',   backSegment: 'supply-chain' },
  customer_intelligence:    { label: 'Customer Intelligence',   audience: 'CEO',  color: 'bg-teal-50 text-teal-700',     backSegment: 'customers' },
  risk_summary:             { label: 'Risk Summary',            audience: 'CEO',  color: 'bg-red-50 text-red-700',        backSegment: 'full' },
}

// Which market_snapshots keys are relevant per section
const SECTION_CHARTS: Record<string, string[]> = {
  company_news:             ['company_stock'],
  customer_intelligence:    ['company_stock'],
  competitor_intelligence:  [],   // handled dynamically via competitor name
  financial_news:           ['sp500', 'dxy', 'oil'],
  financial_signals:        ['sp500', 'dxy', 'oil'],
  geopolitical_news:        ['dxy', 'oil'],
  operational_intelligence: ['oil'],
  ma_watch:                 ['company_stock', 'sp500'],
  marketing_opportunities:  [],
  tech_intelligence:        [],
  hr_intelligence:          [],
  risk_summary:             [],
}

// ── Field extraction per section ──────────────────────────────────────────────

interface ArticleData {
  headline: string
  subtitle?: string
  detail?: string
  actionLabel?: string
  actionText?: string
  badge?: string
  badgeColor?: string
  source?: string
  source_url?: string
  date?: string
  extra?: Array<{ label: string; value: string }>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractArticle(section: string, item: Record<string, any>): ArticleData {
  switch (section) {
    case 'company_news':
      return {
        headline: item.headline,
        subtitle: item.category,
        detail: item.summary,
        actionLabel: 'Exec Note',
        actionText: item.exec_note,
        badge: item.sentiment,
        badgeColor: item.sentiment === 'positive' ? 'bg-emerald-50 text-emerald-700' : item.sentiment === 'negative' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600',
        source: item.source,
        source_url: item.source_url,
        date: item.date,
      }
    case 'competitor_intelligence':
      return {
        headline: item.headline,
        subtitle: `${item.competitor} · ${item.type?.replace('_', ' ')}`,
        detail: item.detail,
        badge: item.threat_level,
        badgeColor: item.threat_level === 'high' ? 'bg-red-50 text-red-700' : item.threat_level === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700',
      }
    case 'marketing_opportunities':
      return {
        headline: item.channel,
        subtitle: `Urgency: ${item.urgency}`,
        detail: item.opportunity,
        actionLabel: 'Rationale',
        actionText: item.rationale,
        badge: item.urgency,
        badgeColor: item.urgency === 'high' ? 'bg-red-50 text-red-700' : item.urgency === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600',
      }
    case 'geopolitical_news':
      return {
        headline: item.headline,
        subtitle: item.region,
        detail: item.detail,
        actionLabel: 'Relevance',
        actionText: item.relevance,
        source: item.source,
      }
    case 'financial_news':
      return {
        headline: item.headline,
        subtitle: item.market,
        detail: item.detail,
        actionLabel: 'Business Impact',
        actionText: item.impact,
        source: item.source,
      }
    case 'financial_signals':
      return {
        headline: item.headline,
        subtitle: item.category,
        detail: item.detail,
        actionLabel: 'CFO Action',
        actionText: item.cfo_action,
      }
    case 'tech_intelligence':
      return {
        headline: item.headline,
        subtitle: item.category,
        detail: item.detail,
        actionLabel: 'CTO Action',
        actionText: item.cto_action,
        badge: item.relevance,
        badgeColor: item.relevance === 'direct' ? 'bg-red-50 text-red-700' : item.relevance === 'watch' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600',
        source: item.source,
      }
    case 'hr_intelligence':
      return {
        headline: item.headline,
        subtitle: item.category,
        detail: item.detail,
        actionLabel: 'HR Action',
        actionText: item.action,
        extra: [{ label: 'Company Impact', value: item.company_impact }],
        source: item.source,
      }
    case 'ma_watch':
      return {
        headline: item.headline,
        subtitle: `${item.type?.toUpperCase()}${item.deal_size ? ' · ' + item.deal_size : ''}`,
        detail: item.detail,
        actionLabel: 'BD Action',
        actionText: item.bd_action,
        badge: item.relevance,
        badgeColor: item.relevance === 'direct' ? 'bg-red-50 text-red-700' : item.relevance === 'adjacent' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600',
        extra: [{ label: 'Strategic Read', value: item.strategic_read }],
        source: item.source,
      }
    case 'operational_intelligence':
      return {
        headline: item.headline,
        subtitle: item.area,
        detail: item.detail,
        actionLabel: 'Mitigation',
        actionText: item.mitigation,
      }
    case 'customer_intelligence':
      return {
        headline: item.headline,
        subtitle: `${item.customer} · ${item.signal_type?.replace('_', ' ')}`,
        detail: item.detail,
        actionLabel: 'Revenue Impact',
        actionText: item.revenue_impact,
        badge: item.sentiment,
        badgeColor: item.sentiment === 'positive' ? 'bg-emerald-50 text-emerald-700' : item.sentiment === 'negative' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600',
        source: item.source,
      }
    case 'risk_summary':
      return {
        headline: item.title,
        subtitle: item.timeframe,
        detail: item.detail,
        badge: item.severity,
        badgeColor: item.severity === 'high' ? 'bg-red-50 text-red-700' : item.severity === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700',
      }
    default:
      return { headline: String(item.headline ?? 'Article') }
  }
}

function boldify(text: string): React.ReactNode {
  if (!text.includes('**')) return text
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} className="font-semibold text-gray-900">{part}</strong>
      : part
  )
}

// ── Headline helper for related cards ─────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function itemHeadline(section: string, item: Record<string, any>): string {
  return String(item.headline ?? item.title ?? item.channel ?? item.question ?? '')
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string; section: string; index: string }>
}) {
  const { id, section, index: indexStr } = await params
  const idx = parseInt(indexStr, 10)
  if (isNaN(idx) || idx < 0) notFound()

  const meta = SECTION_META[section]
  if (!meta) notFound()

  const companyId = await getSessionCompanyId()
  if (!companyId) notFound()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: brief } = await supabase
    .from('briefs')
    .select('id, week_of, content')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (!brief?.content) notFound()

  const content = brief.content as BriefContent
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sectionArray = (content as any)[section] as Array<Record<string, any>> | undefined
  if (!Array.isArray(sectionArray) || idx >= sectionArray.length) notFound()

  const item = sectionArray[idx]
  const article = extractArticle(section, item)

  const weekOf = new Date(brief.week_of).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  // ── Related charts ────────────────────────────────────────────────────────
  const snaps = content.market_snapshots ?? {}
  const chartKeys = [...(SECTION_CHARTS[section] ?? [])]

  // For competitors: try to find matching competitor snapshot
  if (section === 'competitor_intelligence' && item.competitor) {
    const compKey = `competitor_${String(item.competitor).toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20)}`
    if (snaps[compKey]) chartKeys.push(compKey)
  }
  // For operational: also include commodity_* keys
  if (section === 'operational_intelligence') {
    Object.keys(snaps).filter(k => k.startsWith('commodity_')).forEach(k => chartKeys.push(k))
  }

  const charts = chartKeys.map(k => snaps[k]).filter(Boolean) as StoredSparkline[]

  // ── Related items (3 others from same section) ────────────────────────────
  const related = sectionArray
    .map((it, i) => ({ item: it, i }))
    .filter(({ i }) => i !== idx)
    .slice(0, 3)

  const briefBase = `/briefs/${id}`
  const backHref = meta.backSegment === 'full'
    ? `${briefBase}/full`
    : `${briefBase}/${meta.backSegment}`

  const prev = idx > 0 ? `/briefs/${id}/article/${section}/${idx - 1}` : null
  const next = idx < sectionArray.length - 1 ? `/briefs/${id}/article/${section}/${idx + 1}` : null

  return (
    <div className="p-6 max-w-3xl space-y-5">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 flex-wrap">
        <Link href="/briefs" className="hover:text-gray-700 transition-colors">Intelligence Briefs</Link>
        <span>/</span>
        <Link href={`/briefs/${id}`} className="hover:text-gray-700 transition-colors">Week of {weekOf}</Link>
        <span>/</span>
        <Link href={backHref} className="hover:text-gray-700 transition-colors">{meta.label}</Link>
        <span>/</span>
        <span className="text-gray-600 truncate max-w-[260px]">{article.headline}</span>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6">
          {/* Badges row */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${meta.color}`}>
              {meta.label}
            </span>
            {article.badge && (
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${article.badgeColor ?? 'bg-gray-100 text-gray-600'}`}>
                {article.badge}
              </span>
            )}
            {article.subtitle && (
              <span className="text-xs text-gray-500">{article.subtitle}</span>
            )}
            {article.date && (
              <span className="ml-auto text-xs text-gray-400">{article.date}</span>
            )}
          </div>

          {/* Headline */}
          <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-4">
            {article.headline}
          </h1>

          {/* Source link */}
          {(article.source_url || article.source) && (
            <div className="flex items-center gap-2">
              {article.source_url ? (
                <a
                  href={article.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Read original source
                  {article.source && <span className="text-blue-400">· {article.source}</span>}
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  {article.source}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Detail body */}
      {article.detail && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Summary</p>
          <p className="text-sm text-gray-700 leading-relaxed">
            {boldify(article.detail)}
          </p>
        </div>
      )}

      {/* Extra fields (strategic read, company impact, etc.) */}
      {article.extra && article.extra.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          {article.extra.map(({ label, value }) => (
            <div key={label}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{label}</p>
              <p className="text-sm text-gray-700 leading-relaxed">{boldify(value)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Exec action / insight */}
      {article.actionText && article.actionLabel && (
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1.5">{article.actionLabel}</p>
          <p className="text-sm font-medium text-blue-900 leading-relaxed">{boldify(article.actionText)}</p>
        </div>
      )}

      {/* Related market charts */}
      {charts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Market Context</p>
          <div className="flex flex-wrap gap-4">
            {charts.map(s => (
              <MarketMiniChart key={s.ticker} sparkline={s} compact />
            ))}
          </div>
        </div>
      )}

      {/* Related items */}
      {related.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">More from this brief</p>
          <div className="space-y-2">
            {related.map(({ item: rel, i }) => (
              <Link
                key={i}
                href={`/briefs/${id}/article/${section}/${i}`}
                className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 flex items-center gap-3 hover:border-gray-300 hover:shadow-md transition-all group"
              >
                <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded shrink-0 ${meta.color}`}>
                  {meta.label}
                </span>
                <p className="text-sm text-gray-700 group-hover:text-blue-700 transition-colors line-clamp-1 flex-1">
                  {itemHeadline(section, rel)}
                </p>
                <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-400 shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Prev / Next nav */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
        {prev ? (
          <Link href={prev} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </Link>
        ) : <span />}

        <Link href={backHref} className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
          ← Back to {meta.label}
        </Link>

        {next ? (
          <Link href={next} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            Next
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ) : <span />}
      </div>

    </div>
  )
}
