import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { getSessionCompanyId } from '@/lib/get-company'
import Link from 'next/link'
import MarketMiniChart from '@/components/brief/MarketMiniChart'
import ShareButtons from '@/components/brief/ShareButtons'
import FeedbackButtons from '@/components/internal/FeedbackButtons'
import FavouriteButton from '@/components/article/FavouriteButton'
import ArticleComments from '@/components/article/ArticleComments'
import type { BriefContent, StoredSparkline } from '@/lib/types'

// ── Section metadata ──────────────────────────────────────────────────────────

const SECTION_META: Record<string, { label: string; audience: string; color: string; backAnchor: string }> = {
  company_news:             { label: 'Company News',            audience: 'All',  color: 'bg-gray-100 text-gray-600',     backAnchor: 'brief-company-news' },
  competitor_intelligence:  { label: 'Competitor Intelligence', audience: 'CMO',  color: 'bg-orange-50 text-orange-700',  backAnchor: 'brief-comp' },
  marketing_opportunities:  { label: 'Marketing Opportunities', audience: 'CMO',  color: 'bg-emerald-50 text-emerald-700',backAnchor: 'brief-mktg' },
  geopolitical_news:        { label: 'Geopolitical Signals',    audience: 'CEO',  color: 'bg-violet-50 text-violet-700',  backAnchor: 'brief-geo' },
  financial_news:           { label: 'Financial News',          audience: 'CFO',  color: 'bg-blue-50 text-blue-700',      backAnchor: 'brief-fin-news' },
  financial_signals:        { label: 'Financial Signals',       audience: 'CFO',  color: 'bg-blue-50 text-blue-700',      backAnchor: 'brief-fin-signals' },
  tech_intelligence:        { label: 'Tech Intelligence',       audience: 'CTO',  color: 'bg-cyan-50 text-cyan-700',      backAnchor: 'brief-tech' },
  hr_intelligence:          { label: 'HR Intelligence',         audience: 'HR',   color: 'bg-pink-50 text-pink-700',      backAnchor: 'brief-hr' },
  ma_watch:                 { label: 'M&A Watch',               audience: 'BD',   color: 'bg-indigo-50 text-indigo-700',  backAnchor: 'brief-ma' },
  operational_intelligence: { label: 'Operational Intelligence',audience: 'CBPO', color: 'bg-amber-50 text-amber-700',   backAnchor: 'brief-ops' },
  customer_intelligence:    { label: 'Customer Intelligence',   audience: 'CEO',  color: 'bg-teal-50 text-teal-700',     backAnchor: 'brief-customers' },
  risk_summary:             { label: 'Risk Summary',            audience: 'CEO',  color: 'bg-red-50 text-red-700',        backAnchor: 'brief-risk' },
}

// Only show market charts where they are directly relevant to the article
const SECTION_CHARTS: Record<string, string[]> = {
  financial_news:    ['sp500', 'dxy', 'oil'],
  financial_signals: ['sp500', 'dxy', 'oil'],
  company_news:      ['company_stock'],
  ma_watch:          ['company_stock', 'sp500'],
}

// ── Semantic article data ─────────────────────────────────────────────────────

interface ArticleData {
  headline: string
  sectionSubtitle?: string       // region, competitor name, category label
  impactLevel?: string           // HIGH / MEDIUM / LOW
  impactColor?: string
  source?: string
  source_url?: string
  date?: string
  signal?: string                // Core fact
  whyItMatters?: string          // Relevance / business impact
  whyItMattersLabel?: string     // Custom label for this field
  companyExposure?: string       // Company-specific exposure
  companyExposureLabel?: string
  recommendedAction?: string     // Exec action
  recommendedActionLabel?: string
}

const HIGH_COLOR   = 'bg-red-100 text-red-700 border border-red-200'
const MED_COLOR    = 'bg-amber-100 text-amber-700 border border-amber-200'
const LOW_COLOR    = 'bg-green-100 text-green-700 border border-green-200'
const NEUT_COLOR   = 'bg-gray-100 text-gray-600 border border-gray-200'

function levelColor(val?: string): string {
  const v = (val ?? '').toLowerCase()
  if (v === 'high' || v === 'critical' || v === 'direct' || v === 'negative') return HIGH_COLOR
  if (v === 'medium' || v === 'adjacent' || v === 'watch') return MED_COLOR
  if (v === 'low' || v === 'positive') return LOW_COLOR
  return NEUT_COLOR
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractArticle(section: string, item: Record<string, any>): ArticleData {
  switch (section) {
    case 'company_news':
      return {
        headline: item.headline,
        sectionSubtitle: item.category,
        impactLevel: item.sentiment,
        impactColor: levelColor(item.sentiment),
        source: item.source,
        source_url: item.source_url,
        date: item.date,
        signal: item.summary,
        recommendedAction: item.exec_note,
        recommendedActionLabel: 'Exec Note',
      }
    case 'competitor_intelligence':
      return {
        headline: item.headline,
        sectionSubtitle: `${item.competitor}${item.type ? ' · ' + item.type.replace('_', ' ') : ''}`,
        impactLevel: item.threat_level,
        impactColor: levelColor(item.threat_level),
        signal: item.detail,
      }
    case 'marketing_opportunities':
      return {
        headline: item.channel,
        sectionSubtitle: `Urgency: ${item.urgency}`,
        impactLevel: item.urgency,
        impactColor: levelColor(item.urgency),
        signal: item.opportunity,
        whyItMatters: item.rationale,
        whyItMattersLabel: 'Rationale',
      }
    case 'geopolitical_news':
      return {
        headline: item.headline,
        sectionSubtitle: item.region,
        source: item.source,
        signal: item.detail,
        companyExposure: item.relevance,
        companyExposureLabel: 'Business Relevance',
      }
    case 'financial_news':
      return {
        headline: item.headline,
        sectionSubtitle: item.market,
        source: item.source,
        signal: item.detail,
        whyItMatters: item.impact,
        whyItMattersLabel: 'Business Impact',
      }
    case 'financial_signals':
      return {
        headline: item.headline,
        sectionSubtitle: item.category,
        signal: item.detail,
        recommendedAction: item.cfo_action,
        recommendedActionLabel: 'CFO Action',
      }
    case 'tech_intelligence':
      return {
        headline: item.headline,
        sectionSubtitle: item.category,
        impactLevel: item.relevance,
        impactColor: levelColor(item.relevance),
        source: item.source,
        signal: item.detail,
        recommendedAction: item.cto_action,
        recommendedActionLabel: 'CTO Action',
      }
    case 'hr_intelligence':
      return {
        headline: item.headline,
        sectionSubtitle: item.category,
        source: item.source,
        signal: item.detail,
        companyExposure: item.company_impact,
        companyExposureLabel: 'Company Impact',
        recommendedAction: item.action,
        recommendedActionLabel: 'HR Action',
      }
    case 'ma_watch':
      return {
        headline: item.headline,
        sectionSubtitle: `${item.type?.toUpperCase() ?? ''}${item.deal_size ? ' · ' + item.deal_size : ''}`,
        impactLevel: item.relevance,
        impactColor: levelColor(item.relevance),
        source: item.source,
        signal: item.detail,
        whyItMatters: item.strategic_read,
        whyItMattersLabel: 'Strategic Read',
        recommendedAction: item.bd_action,
        recommendedActionLabel: 'BD Action',
      }
    case 'operational_intelligence':
      return {
        headline: item.headline,
        sectionSubtitle: item.area,
        signal: item.detail,
        recommendedAction: item.mitigation,
        recommendedActionLabel: 'Mitigation',
      }
    case 'customer_intelligence':
      return {
        headline: item.headline,
        sectionSubtitle: `${item.customer}${item.signal_type ? ' · ' + item.signal_type.replace('_', ' ') : ''}`,
        impactLevel: item.sentiment,
        impactColor: levelColor(item.sentiment),
        source: item.source,
        signal: item.detail,
        whyItMatters: item.revenue_impact,
        whyItMattersLabel: 'Revenue Impact',
      }
    case 'risk_summary':
      return {
        headline: item.title,
        sectionSubtitle: item.timeframe,
        impactLevel: item.severity,
        impactColor: levelColor(item.severity),
        signal: item.detail,
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function itemHeadline(item: Record<string, any>): string {
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

  if (section === 'competitor_intelligence' && item.competitor) {
    const compKey = `competitor_${String(item.competitor).toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20)}`
    if (snaps[compKey]) chartKeys.push(compKey)
  }
  if (section === 'operational_intelligence') {
    Object.keys(snaps).filter(k => k.startsWith('commodity_')).forEach(k => chartKeys.push(k))
  }

  const charts = chartKeys.map(k => snaps[k]).filter(Boolean) as StoredSparkline[]

  // ── Related items ─────────────────────────────────────────────────────────
  const related = sectionArray
    .map((it, i) => ({ item: it, i }))
    .filter(({ i }) => i !== idx)
    .slice(0, 3)

  const briefBase = `/briefs/${id}`
  const backHref = `${briefBase}/full#${meta.backAnchor}`

  const prev = idx > 0 ? `/briefs/${id}/article/${section}/${idx - 1}` : null
  const next = idx < sectionArray.length - 1 ? `/briefs/${id}/article/${section}/${idx + 1}` : null

  // ── Feedback ──────────────────────────────────────────────────────────────
  const { data: feedbackRows } = await supabase
    .from('article_feedback')
    .select('rating, tag, user_id')
    .eq('company_id', companyId)
    .eq('brief_id', id)
    .eq('section', section)
    .eq('item_index', idx)

  const feedback = feedbackRows ?? []
  const likes    = feedback.filter(f => f.rating === 1).length
  const dislikes = feedback.filter(f => f.rating === -1).length
  const notes    = feedback.filter(f => f.tag)

  let userNames: Record<string, string> = {}
  if (notes.length > 0) {
    const userIds = [...new Set(notes.map(n => n.user_id))]
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('user_id, full_name')
      .in('user_id', userIds)
    if (profiles) {
      userNames = Object.fromEntries(profiles.map(p => [p.user_id, p.full_name ?? 'Team member']))
    }
  }

  // ── Saved state ───────────────────────────────────────────────────────────
  const currentUserId = process.env.NEXT_PUBLIC_DEV_MODE === 'true'
    ? '00000000-0000-0000-0000-000000000001'
    : (await supabase.auth.getUser()).data.user?.id ?? '00000000-0000-0000-0000-000000000001'

  const { data: favRow } = await supabase
    .from('article_favourites')
    .select('id')
    .eq('user_id', currentUserId)
    .eq('brief_id', id)
    .eq('section', section)
    .eq('item_index', idx)
    .single()

  const isSaved = !!favRow

  // ── Team members for @mention ─────────────────────────────────────────────
  const { data: teamProfiles } = await supabase
    .from('user_profiles')
    .select('user_id, full_name')
    .eq('company_id', companyId)
  const teamMembers = (teamProfiles ?? []).filter(p => p.full_name) as { user_id: string; full_name: string }[]

  return (
    <div className="p-6 max-w-3xl space-y-0">

      {/* Breadcrumb */}
      <div className="flex items-start justify-between gap-3 flex-wrap mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-400 flex-wrap">
          <Link href="/briefs" className="hover:text-gray-700 transition-colors">Intelligence Briefs</Link>
          <span>/</span>
          <Link href={`/briefs/${id}`} className="hover:text-gray-700 transition-colors">Week of {weekOf}</Link>
          <span>/</span>
          <Link href={backHref} className="hover:text-gray-700 transition-colors">{meta.label}</Link>
        </div>
        <div className="flex items-center gap-2">
          <FavouriteButton
            companyId={companyId}
            briefId={id}
            section={section}
            itemIndex={idx}
            headline={article.headline}
            sectionLabel={meta.label}
            briefWeekOf={brief.week_of}
            initialSaved={isSaved}
          />
          <ShareButtons title={article.headline} />
        </div>
      </div>

      {/* ── Main article card ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Header */}
        <div className="p-6 pb-5 border-b border-gray-100">
          {/* Section label + subtitle */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${meta.color}`}>
              {meta.label}
            </span>
            {article.sectionSubtitle && (
              <span className="text-xs text-gray-500">{article.sectionSubtitle}</span>
            )}
            {article.date && (
              <span className="ml-auto text-xs text-gray-400">{article.date}</span>
            )}
          </div>

          {/* Headline */}
          <h1 className="text-xl font-bold text-gray-900 leading-snug">
            {article.headline}
          </h1>

          {/* Meta row: Impact · Source */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {article.impactLevel && (
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${article.impactColor ?? NEUT_COLOR}`}>
                {article.impactLevel}
              </span>
            )}
            {article.source_url ? (
              <a
                href={article.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                {article.source ?? 'Source'}
              </a>
            ) : article.source ? (
              <span className="text-xs text-gray-400">{article.source}</span>
            ) : null}
          </div>
        </div>

        {/* Signal */}
        {article.signal && (
          <div className="px-6 py-5 border-b border-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Signal</p>
            <p className="text-sm text-gray-700 leading-relaxed">{boldify(article.signal)}</p>
          </div>
        )}

        {/* Why it matters */}
        {article.whyItMatters && (
          <div className="px-6 py-5 border-b border-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
              {article.whyItMattersLabel ?? 'Why It Matters'}
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">{boldify(article.whyItMatters)}</p>
          </div>
        )}

        {/* Company exposure */}
        {article.companyExposure && (
          <div className="px-6 py-5 border-b border-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
              {article.companyExposureLabel ?? 'Company Exposure'}
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">{boldify(article.companyExposure)}</p>
          </div>
        )}

        {/* Recommended action */}
        {article.recommendedAction && (
          <div className="px-6 py-5 bg-blue-50 border-b border-blue-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-2">
              {article.recommendedActionLabel ?? 'Recommended Action'}
            </p>
            <p className="text-sm font-medium text-blue-900 leading-relaxed">{boldify(article.recommendedAction)}</p>
          </div>
        )}

        {/* Feedback row */}
        <div className="px-6 py-4 flex items-center gap-3">
          <p className="text-xs text-gray-500 shrink-0">Was this article useful?</p>
          <FeedbackButtons briefId={id} section={section} itemIndex={idx} />
        </div>
      </div>

      {/* Team feedback summary */}
      {(likes > 0 || dislikes > 0 || notes.length > 0) && (
        <div className="mt-4 bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Team Feedback</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-sm text-gray-600">
              <span className="text-base">👍</span>
              <span className="font-medium">{likes}</span>
            </span>
            <span className="flex items-center gap-1.5 text-sm text-gray-600">
              <span className="text-base">👎</span>
              <span className="font-medium">{dislikes}</span>
            </span>
          </div>
          {notes.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-gray-100">
              {notes.map((note, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {(userNames[note.user_id] ?? 'T')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-700">{userNames[note.user_id] ?? 'Team member'}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{note.tag}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Team Comments */}
      <div className="mt-4">
        <ArticleComments
          companyId={companyId}
          briefId={id}
          section={section}
          itemIndex={idx}
          headline={article.headline}
          teamMembers={teamMembers}
        />
      </div>

      {/* Market Context — compact, only if relevant */}
      {charts.length > 0 && (
        <div className="mt-4 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Market Context</p>
          <div className="flex flex-wrap gap-4">
            {charts.map(s => (
              <MarketMiniChart key={s.ticker} sparkline={s} compact />
            ))}
          </div>
        </div>
      )}

      {/* More from this brief */}
      {related.length > 0 && (
        <div className="mt-4">
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
                  {itemHeadline(rel)}
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
      <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-200">
        {prev ? (
          <Link href={prev} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </Link>
        ) : <span />}

        <Link href={backHref} className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
          Back to {meta.label}
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
