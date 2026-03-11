import { createClient } from '@supabase/supabase-js'
import { getSessionCompanyId } from '@/lib/get-company'
import Link from 'next/link'
import type { CompanyNewsItem } from '@/lib/types'

const SENTIMENT_BADGE: Record<string, string> = {
  positive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  neutral:  'bg-gray-50 text-gray-500 border-gray-200',
  negative: 'bg-red-50 text-red-700 border-red-200',
}

const CATEGORY_COLOR: Record<string, string> = {
  'Product Launch':       'bg-blue-50 text-blue-700',
  'Partnership':          'bg-indigo-50 text-indigo-700',
  'Financial Results':    'bg-violet-50 text-violet-700',
  'Leadership':           'bg-purple-50 text-purple-700',
  'Legal / Regulatory':   'bg-red-50 text-red-700',
  'Brand / PR':           'bg-amber-50 text-amber-700',
  'General Coverage':     'bg-gray-100 text-gray-600',
}

interface EnrichedNewsItem extends CompanyNewsItem {
  briefId: string
  briefWeek: string
  globalIdx: number
}

function formatWeek(weekOf: string) {
  return new Date(weekOf).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default async function CompanyNewsPage() {
  const companyId = await getSessionCompanyId()

  if (!companyId) {
    return (
      <div className="p-6 max-w-4xl">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Company News</h1>
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-sm text-gray-500">Not signed in.</p>
        </div>
      </div>
    )
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ data: company }, { data: briefs }] = await Promise.all([
    db.from('companies').select('name').eq('id', companyId).single(),
    db.from('briefs')
      .select('id, week_of, content')
      .eq('company_id', companyId)
      .eq('status', 'complete')
      .order('week_of', { ascending: false }),
  ])

  // Aggregate all company_news items across all briefs, newest brief first
  const allItems: EnrichedNewsItem[] = []
  for (const brief of briefs ?? []) {
    const items: CompanyNewsItem[] = (brief.content?.company_news ?? []) as CompanyNewsItem[]
    items.forEach((item, idx) => {
      allItems.push({
        ...item,
        briefId: brief.id,
        briefWeek: formatWeek(brief.week_of),
        globalIdx: idx,
      })
    })
  }

  const positive = allItems.filter(i => i.sentiment === 'positive')
  const neutral   = allItems.filter(i => i.sentiment === 'neutral')
  const negative  = allItems.filter(i => i.sentiment === 'negative')

  return (
    <div className="p-6 max-w-4xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Company News</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          All press coverage of {company?.name ?? 'your company'} across every brief
        </p>
      </div>

      {allItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-sm text-gray-500 mb-1">No press coverage found.</p>
          <p className="text-xs text-gray-400">Generate your first intelligence brief to see media mentions.</p>
        </div>
      ) : (
        <>
          {/* Sentiment summary */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Sentiment</p>
            <div className="flex items-center gap-4">
              {[
                { label: 'Positive', count: positive.length, dot: 'bg-emerald-500' },
                { label: 'Neutral',  count: neutral.length,  dot: 'bg-gray-400' },
                { label: 'Negative', count: negative.length, dot: 'bg-red-500' },
              ].map(({ label, count, dot }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${dot}`} />
                  <span className="text-sm text-gray-700 font-medium">{count}</span>
                  <span className="text-xs text-gray-400">{label}</span>
                </div>
              ))}
            </div>
            <span className="ml-auto text-xs text-gray-400">{briefs?.length ?? 0} briefs · {allItems.length} articles</span>
          </div>

          {negative.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Negative Coverage</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-700">Requires Attention</span>
              </div>
              <ArticleList items={negative} />
            </div>
          )}

          {positive.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Positive Coverage</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Amplify</span>
              </div>
              <ArticleList items={positive} />
            </div>
          )}

          {neutral.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-gray-900">General Coverage</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">Monitor</span>
              </div>
              <ArticleList items={neutral} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ArticleList({ items }: { items: EnrichedNewsItem[] }) {
  return (
    <div className="space-y-0">
      {items.map((item, i) => (
        <div key={i} className="py-4 border-b border-gray-100 last:border-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${SENTIMENT_BADGE[item.sentiment] ?? 'bg-gray-50 text-gray-500 border-gray-200'}`}>
              {item.sentiment}
            </span>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${CATEGORY_COLOR[item.category] ?? 'bg-gray-50 text-gray-500'}`}>
              {item.category}
            </span>
            <span className="ml-auto text-[10px] text-gray-400">
              {item.date ? `${item.date} · ` : ''}{item.briefWeek}
            </span>
          </div>
          <Link href={`/briefs/${item.briefId}/article/company_news/${item.globalIdx}`} className="group">
            <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors leading-snug mb-1">{item.headline}</p>
          </Link>
          <p className="text-xs text-gray-500 leading-relaxed mb-2">{item.summary.replace(/\*\*/g, '')}</p>
          <div className="flex gap-1.5 items-start">
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-gray-400 mt-0.5">Exec Note</span>
            <p className={`text-xs font-medium ${item.sentiment === 'negative' ? 'text-red-700' : item.sentiment === 'positive' ? 'text-emerald-700' : 'text-gray-700'}`}>
              {item.exec_note}
            </p>
          </div>
          {item.source && (
            <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 mt-1.5">
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              {item.source}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
