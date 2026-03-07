import { getBriefById } from '@/lib/get-latest-brief'
import { notFound } from 'next/navigation'
import Link from 'next/link'

type TechItem = { category: string; headline: string; detail: string; cto_action: string; relevance: string; source?: string }

export default async function BriefTechnologyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { company, brief, weekOf } = await getBriefById(id)
  if (!brief) notFound()

  const content = brief.content
  const techItems = (content?.tech_intelligence ?? []) as TechItem[]

  return (
    <div className="p-6 max-w-4xl space-y-5">
      <div>
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
          <Link href="/briefs" className="hover:text-gray-700 transition-colors">Intelligence Briefs</Link>
          <span>/</span>
          <Link href={`/briefs/${id}`} className="hover:text-gray-700 transition-colors">Week of {weekOf}</Link>
          <span>/</span>
          <span className="text-gray-600">Technology</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Technology Intelligence</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
          Week of {weekOf}{company && ` · ${company.name}`}
        </p>
      </div>

      {techItems.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-white/10 p-12 text-center">
          <p className="text-sm text-gray-500 mb-1">No technology data in this brief.</p>
        </div>
      ) : (
        <>
          <div className="flex gap-2 flex-wrap">
            {[...new Set(techItems.map(t => t.category))].map(cat => (
              <span key={cat} className="text-xs font-medium px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-100">
                {cat}
              </span>
            ))}
          </div>

          {techItems.filter(t => t.relevance === 'direct').length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Act Now</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700">CTO · Direct Impact</span>
              </div>
              <TechList items={techItems.filter(t => t.relevance === 'direct')} allItems={techItems} briefId={id} />
            </div>
          )}

          {techItems.filter(t => t.relevance === 'watch').length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Worth Evaluating</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700">CTO · Watch</span>
              </div>
              <TechList items={techItems.filter(t => t.relevance === 'watch')} allItems={techItems} briefId={id} />
            </div>
          )}

          {techItems.filter(t => t.relevance === 'awareness').length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Awareness</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">CTO · FYI</span>
              </div>
              <TechList items={techItems.filter(t => t.relevance === 'awareness')} allItems={techItems} briefId={id} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

function TechList({ items, allItems, briefId }: { items: TechItem[]; allItems: TechItem[]; briefId: string }) {
  return (
    <div className="space-y-0">
      {items.map((item, i) => {
        const globalIdx = allItems.indexOf(item)
        return (
        <div key={i} className="py-4 border-b border-gray-100 dark:border-white/5 last:border-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">{item.category}</span>
            {item.source && <span className="text-[10px] text-gray-400 ml-auto">Source: {item.source}</span>}
          </div>
          <Link href={`/briefs/${briefId}/article/tech_intelligence/${globalIdx}`} className="group">
            <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-700 transition-colors leading-snug mb-1">{item.headline}</p>
          </Link>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-1 line-clamp-2">{item.detail.replace(/\*\*/g, '')}</p>
          {item.detail.length > 140 && (
            <Link href={`/briefs/${briefId}/article/tech_intelligence/${globalIdx}`} className="text-[10px] text-blue-600 hover:underline mb-2 inline-block">Read more →</Link>
          )}
          <div className="flex gap-1.5 items-start mt-1">
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 mt-0.5">CTO Action</span>
            <p className="text-xs text-cyan-700 font-medium">{item.cto_action}</p>
          </div>
        </div>
        )
      })}
    </div>
  )
}
