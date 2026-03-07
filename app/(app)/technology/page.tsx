import { getLatestBrief } from '@/lib/get-latest-brief'
import Link from 'next/link'

export default async function TechnologyPage() {
  const { company, brief, weekOf } = await getLatestBrief()
  const content = brief?.content
  const techItems = content?.tech_intelligence ?? []

  return (
    <div className="p-6 max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Technology Intelligence</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {weekOf ? `From brief: Week of ${weekOf}` : 'AI, hardware, software and emerging tech'}
            {company && ` · ${company.name}`}
          </p>
        </div>
        {brief && (
          <Link href={`/briefs/${brief.id}`}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
            View full brief →
          </Link>
        )}
      </div>

      {!content || techItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-sm text-gray-500 mb-1">No technology data available yet.</p>
          <p className="text-xs text-gray-400">Generate a brief to populate technology intelligence.</p>
        </div>
      ) : (
        <>
          {/* Category summary pills */}
          <div className="flex gap-2 flex-wrap">
            {[...new Set(techItems.map(t => t.category))].map(cat => (
              <span key={cat}
                className="text-xs font-medium px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-100">
                {cat}
              </span>
            ))}
          </div>

          {/* Direct relevance items first */}
          {techItems.filter(t => t.relevance === 'direct').length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Act Now</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700">CTO · Direct Impact</span>
              </div>
              <TechList items={techItems.filter(t => t.relevance === 'direct')} />
            </div>
          )}

          {/* Watch list */}
          {techItems.filter(t => t.relevance === 'watch').length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Worth Evaluating</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700">CTO · Watch</span>
              </div>
              <TechList items={techItems.filter(t => t.relevance === 'watch')} />
            </div>
          )}

          {/* Awareness items */}
          {techItems.filter(t => t.relevance === 'awareness').length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Awareness</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">CTO · FYI</span>
              </div>
              <TechList items={techItems.filter(t => t.relevance === 'awareness')} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

type TechItem = { category: string; headline: string; detail: string; cto_action: string; relevance: string; source?: string }

function TechList({ items }: { items: TechItem[] }) {
  return (
    <div className="space-y-0">
      {items.map((item, i) => (
        <div key={i} className="py-4 border-b border-gray-100 last:border-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{item.category}</span>
            {item.source && <span className="text-[10px] text-gray-400 ml-auto">Source: {item.source}</span>}
          </div>
          <p className="text-sm font-semibold text-gray-900 leading-snug mb-1">{item.headline}</p>
          <p className="text-xs text-gray-500 leading-relaxed mb-2">{item.detail.replace(/\*\*/g, '')}</p>
          <div className="flex gap-1.5 items-start">
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-gray-400 mt-0.5">CTO Action</span>
            <p className="text-xs text-cyan-700 font-medium">{item.cto_action}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
