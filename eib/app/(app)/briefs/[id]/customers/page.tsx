import { getBriefById } from '@/lib/get-latest-brief'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { CustomerIntelItem } from '@/lib/types'

const SIGNAL_LABEL: Record<string, string> = {
  spending_cut:     'SPENDING CUT',
  growth:           'GROWTH',
  financial_distress: 'DISTRESS',
  strategic_shift:  'STRATEGIC SHIFT',
  leadership_change: 'LEADERSHIP',
  general:          'UPDATE',
}

const SENTIMENT_STYLE: Record<string, { card: string; badge: string }> = {
  positive: { card: 'border-l-4 border-l-emerald-400',   badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  neutral:  { card: 'border-l-4 border-l-gray-200',      badge: 'bg-gray-50 text-gray-500 border-gray-200' },
  negative: { card: 'border-l-4 border-l-red-400',       badge: 'bg-red-50 text-red-700 border-red-200' },
}

export default async function CustomersPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { company, brief, weekOf } = await getBriefById(id)
  if (!brief) notFound()

  const items = (brief.content?.customer_intelligence ?? []) as CustomerIntelItem[]

  const positive = items.filter(i => i.sentiment === 'positive')
  const neutral  = items.filter(i => i.sentiment === 'neutral')
  const negative = items.filter(i => i.sentiment === 'negative')

  return (
    <div className="p-6 max-w-4xl space-y-5">
      <div>
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
          <Link href="/briefs" className="hover:text-gray-700 transition-colors">Intelligence Briefs</Link>
          <span>/</span>
          <Link href={`/briefs/${id}`} className="hover:text-gray-700 transition-colors">Week of {weekOf}</Link>
          <span>/</span>
          <span className="text-gray-600">Customers</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Customer Intelligence</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
          News about your key customers and what it means for your revenue — {company?.name}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-white/10 p-12 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">No customer intelligence in this brief.</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Add key customers to your company profile to see customer signals here.</p>
        </div>
      ) : (
        <>
          {/* Summary bar */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-4 flex items-center gap-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Signal Sentiment</p>
            <div className="flex items-center gap-4">
              {[
                { label: 'Positive',  count: positive.length, dot: 'bg-emerald-500' },
                { label: 'Neutral',   count: neutral.length,  dot: 'bg-gray-400' },
                { label: 'Negative',  count: negative.length, dot: 'bg-red-500' },
              ].map(({ label, count, dot }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${dot}`} />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{count}</span>
                  <span className="text-xs text-gray-400">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Negative first — needs attention */}
          {negative.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Requires Attention</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-700">Account Risk</span>
              </div>
              <CustomerList items={negative} allItems={items} briefId={id} />
            </div>
          )}

          {/* Positive */}
          {positive.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Positive Signals</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Opportunity</span>
              </div>
              <CustomerList items={positive} allItems={items} briefId={id} />
            </div>
          )}

          {/* Neutral */}
          {neutral.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">General Updates</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">Monitor</span>
              </div>
              <CustomerList items={neutral} allItems={items} briefId={id} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

function CustomerList({ items, allItems, briefId }: { items: CustomerIntelItem[]; allItems: CustomerIntelItem[]; briefId: string }) {
  return (
    <div className="space-y-0">
      {items.map((item, i) => {
        const style = SENTIMENT_STYLE[item.sentiment] ?? SENTIMENT_STYLE.neutral
        const globalIdx = allItems.indexOf(item)
        return (
          <div key={i} className={`py-4 border-b border-gray-100 dark:border-white/5 last:border-0 pl-3 ${style.card}`}>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {item.customer}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-900 dark:bg-gray-700 text-white tracking-wide">
                {SIGNAL_LABEL[item.signal_type] ?? item.signal_type.toUpperCase()}
              </span>
              <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded border ${style.badge}`}>
                {item.sentiment}
              </span>
            </div>

            <Link href={`/briefs/${briefId}/article/customer_intelligence/${globalIdx}`} className="group">
              <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-700 transition-colors leading-snug mb-1">{item.headline}</p>
            </Link>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-1 line-clamp-2">
              {item.detail.replace(/\*\*/g, '')}
            </p>
            {item.detail.length > 140 && (
              <Link href={`/briefs/${briefId}/article/customer_intelligence/${globalIdx}`} className="text-[10px] text-blue-600 hover:underline mb-2 inline-block">Read more →</Link>
            )}

            <div className="flex gap-1.5 items-start">
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 mt-0.5">
                Revenue Impact
              </span>
              <p className={`text-xs font-medium ${
                item.sentiment === 'negative' ? 'text-red-700' :
                item.sentiment === 'positive' ? 'text-emerald-700' : 'text-gray-700 dark:text-gray-300'
              }`}>
                {item.revenue_impact}
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
        )
      })}
    </div>
  )
}
