import { getBriefById } from '@/lib/get-latest-brief'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { HRIntelItem } from '@/lib/types'

const signalBadge: Record<string, string> = {
  competitor: 'bg-pink-50 text-pink-700 border-pink-200',
  market:     'bg-purple-50 text-purple-700 border-purple-200',
  regulatory: 'bg-amber-50 text-amber-700 border-amber-200',
  economic:   'bg-gray-100 text-gray-600 border-gray-200',
}

const categoryColor: Record<string, string> = {
  'Talent Market':             'bg-purple-50 text-purple-700',
  'Competitor Hiring':         'bg-pink-50 text-pink-700',
  'Executive Move':            'bg-indigo-50 text-indigo-700',
  'Workforce Restructuring':   'bg-red-50 text-red-700',
  'Compensation Trends':       'bg-amber-50 text-amber-700',
  'Skills Gap':                'bg-orange-50 text-orange-700',
  'Labour Relations':          'bg-gray-100 text-gray-600',
}

export default async function BriefHRPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { company, brief, weekOf } = await getBriefById(id)
  if (!brief) notFound()

  const content = brief.content
  const items = (content?.hr_intelligence ?? []) as HRIntelItem[]

  const byType = {
    competitor: items.filter(i => i.signal_type === 'competitor'),
    market:     items.filter(i => i.signal_type === 'market'),
    regulatory: items.filter(i => i.signal_type === 'regulatory'),
    economic:   items.filter(i => i.signal_type === 'economic'),
  }

  return (
    <div className="p-6 max-w-4xl space-y-5">
      <div>
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
          <Link href="/briefs" className="hover:text-gray-700 transition-colors">Intelligence Briefs</Link>
          <span>/</span>
          <Link href={`/briefs/${id}`} className="hover:text-gray-700 transition-colors">Week of {weekOf}</Link>
          <span>/</span>
          <span className="text-gray-600">HR Intelligence</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">HR Intelligence</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
          Week of {weekOf}{company && ` · ${company.name}`}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-white/10 p-12 text-center">
          <p className="text-sm text-gray-500 mb-1">No HR intelligence in this brief.</p>
          <p className="text-xs text-gray-400">Generate a new brief to populate HR & talent signals.</p>
        </div>
      ) : (
        <>
          {/* Category summary */}
          <div className="flex gap-2 flex-wrap">
            {[...new Set(items.map(i => i.category))].map(cat => (
              <span key={cat}
                className={`text-xs font-medium px-2.5 py-1 rounded-full border border-transparent ${categoryColor[cat] ?? 'bg-gray-50 text-gray-500'}`}>
                {cat}
              </span>
            ))}
          </div>

          {/* Competitor hiring signals */}
          {byType.competitor.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Competitor Talent Moves</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-pink-50 text-pink-700">VP HR · Competitive</span>
              </div>
              <HRList items={byType.competitor} allItems={items} briefId={id} signalBadge={signalBadge} />
            </div>
          )}

          {/* Market-wide talent signals */}
          {byType.market.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Talent Market Signals</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700">VP HR · Market</span>
              </div>
              <HRList items={byType.market} allItems={items} briefId={id} signalBadge={signalBadge} />
            </div>
          )}

          {/* Regulatory / economic */}
          {(byType.regulatory.length > 0 || byType.economic.length > 0) && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Regulatory &amp; Economic Signals</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700">VP HR · External</span>
              </div>
              <HRList items={[...byType.regulatory, ...byType.economic]} allItems={items} briefId={id} signalBadge={signalBadge} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

function HRList({ items, allItems, briefId, signalBadge }: { items: HRIntelItem[]; allItems: HRIntelItem[]; briefId: string; signalBadge: Record<string, string> }) {
  return (
    <div className="space-y-0">
      {items.map((item, i) => {
        const globalIdx = allItems.indexOf(item)
        return (
        <div key={i} className="py-4 border-b border-gray-100 dark:border-white/5 last:border-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">{item.category}</span>
            <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded border ${signalBadge[item.signal_type] ?? 'bg-gray-50 text-gray-500 border-gray-200'}`}>
              {item.signal_type}
            </span>
          </div>
          <Link href={`/briefs/${briefId}/article/hr_intelligence/${globalIdx}`} className="group">
            <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-700 transition-colors leading-snug mb-1">{item.headline}</p>
          </Link>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-1 line-clamp-2">{item.detail.replace(/\*\*/g, '')}</p>
          {item.detail.length > 140 && (
            <Link href={`/briefs/${briefId}/article/hr_intelligence/${globalIdx}`} className="text-[10px] text-blue-600 hover:underline mb-2 inline-block">Read more →</Link>
          )}
          <div className="flex gap-1.5 items-start mb-1 mt-1">
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 mt-0.5">Impact</span>
            <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">{item.company_impact}</p>
          </div>
          <div className="flex gap-1.5 items-start">
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 mt-0.5">Action</span>
            <p className="text-xs text-pink-700 font-medium">{item.action}</p>
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
