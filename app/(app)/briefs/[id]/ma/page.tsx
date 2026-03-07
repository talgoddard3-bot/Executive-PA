import { getBriefById } from '@/lib/get-latest-brief'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { MAItem } from '@/lib/types'

const TYPE_BADGE: Record<string, string> = {
  acquisition: 'bg-indigo-900 text-white',
  merger:      'bg-indigo-700 text-white',
  funding:     'bg-violet-100 text-violet-700',
  ipo:         'bg-blue-100 text-blue-700',
  divestiture: 'bg-amber-100 text-amber-700',
  rumour:      'bg-gray-100 text-gray-600',
}

const RELEVANCE_BADGE: Record<string, string> = {
  direct:   'bg-indigo-50 text-indigo-700 border-indigo-200',
  adjacent: 'bg-amber-50 text-amber-700 border-amber-200',
  watch:    'bg-gray-50 text-gray-500 border-gray-200',
}

export default async function BriefMAPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { company, brief, weekOf } = await getBriefById(id)
  if (!brief) notFound()

  const content = brief.content
  const items = (content?.ma_watch ?? []) as MAItem[]

  const byRelevance = {
    direct:   items.filter(i => i.relevance === 'direct'),
    adjacent: items.filter(i => i.relevance === 'adjacent'),
    watch:    items.filter(i => i.relevance === 'watch'),
  }

  return (
    <div className="p-6 max-w-4xl space-y-5">
      <div>
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
          <Link href="/briefs" className="hover:text-gray-700 transition-colors">Intelligence Briefs</Link>
          <span>/</span>
          <Link href={`/briefs/${id}`} className="hover:text-gray-700 transition-colors">Week of {weekOf}</Link>
          <span>/</span>
          <span className="text-gray-600">M&amp;A Watch</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">M&amp;A Watch</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
          Week of {weekOf}{company && ` · ${company.name}`}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-white/10 p-12 text-center">
          <p className="text-sm text-gray-500 mb-1">No M&amp;A activity tracked in this brief.</p>
          <p className="text-xs text-gray-400">Generate a new brief to populate M&amp;A and deal signals.</p>
        </div>
      ) : (
        <>
          {/* Deal type summary */}
          <div className="flex gap-2 flex-wrap">
            {[...new Set(items.map(i => i.type))].map(type => (
              <span key={type}
                className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${TYPE_BADGE[type] ?? 'bg-gray-100 text-gray-600'}`}>
                {type}
              </span>
            ))}
          </div>

          {/* Direct impact deals */}
          {byRelevance.direct.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Direct Impact</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">BD · High Priority</span>
              </div>
              <MAList items={byRelevance.direct} allItems={items} briefId={id} />
            </div>
          )}

          {/* Adjacent / sector deals */}
          {byRelevance.adjacent.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Adjacent Sector Activity</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700">BD · Monitor</span>
              </div>
              <MAList items={byRelevance.adjacent} allItems={items} briefId={id} />
            </div>
          )}

          {/* Watch list */}
          {byRelevance.watch.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Watch List</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">BD · Peripheral</span>
              </div>
              <MAList items={byRelevance.watch} allItems={items} briefId={id} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

function MAList({ items, allItems, briefId }: { items: MAItem[]; allItems: MAItem[]; briefId: string }) {
  return (
    <div className="space-y-0">
      {items.map((item, i) => {
        const globalIdx = allItems.indexOf(item)
        return (
        <div key={i} className="py-4 border-b border-gray-100 dark:border-white/5 last:border-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded capitalize ${TYPE_BADGE[item.type] ?? 'bg-gray-100 text-gray-600'}`}>
              {item.type}
            </span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border capitalize ${RELEVANCE_BADGE[item.relevance] ?? 'bg-gray-50 text-gray-500 border-gray-200'}`}>
              {item.relevance}
            </span>
            {item.deal_size && (
              <span className="ml-auto text-xs font-semibold text-gray-700">{item.deal_size}</span>
            )}
          </div>

          <Link href={`/briefs/${briefId}/article/ma_watch/${globalIdx}`} className="group">
            <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-700 transition-colors leading-snug mb-1">{item.headline}</p>
          </Link>

          {(item.acquirer || item.target) && (
            <p className="text-xs text-gray-500 mb-2">
              {item.acquirer && <><span className="font-medium text-gray-700">{item.acquirer}</span> acquiring </>}
              <span className="font-medium text-gray-700">{item.target}</span>
            </p>
          )}

          <p className="text-xs text-gray-500 leading-relaxed mb-1 line-clamp-2">{item.detail.replace(/\*\*/g, '')}</p>
          {item.detail.length > 140 && (
            <Link href={`/briefs/${briefId}/article/ma_watch/${globalIdx}`} className="text-[10px] text-blue-600 hover:underline mb-2 inline-block">Read more →</Link>
          )}

          <div className="flex gap-1.5 items-start mb-1 mt-1">
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 mt-0.5">Strategic Read</span>
            <p className="text-xs text-gray-700 font-medium">{item.strategic_read}</p>
          </div>

          <div className="flex gap-1.5 items-start">
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 mt-0.5">BD Action</span>
            <p className="text-xs text-indigo-700 font-medium">{item.bd_action}</p>
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
