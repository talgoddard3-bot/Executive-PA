import { getBriefById } from '@/lib/get-latest-brief'
import { notFound } from 'next/navigation'
import Link from 'next/link'

const typeLabel: Record<string, string> = {
  product_launch: 'NEW PRODUCT',
  pricing:        'PRICING',
  partnership:    'PARTNERSHIP',
  expansion:      'EXPANSION',
  other:          'MOVE',
}
const threatBadge: Record<string, string> = {
  high:   'text-red-600 bg-red-50 border-red-200',
  medium: 'text-amber-600 bg-amber-50 border-amber-200',
  low:    'text-gray-500 bg-gray-50 border-gray-200',
}

export default async function BriefCompetitorsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { company, brief, weekOf } = await getBriefById(id)
  if (!brief) notFound()

  const content = brief.content
  const competitors = content?.competitor_intelligence ?? []
  const marketing = content?.marketing_opportunities ?? []

  return (
    <div className="p-6 max-w-4xl space-y-5">
      <div>
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
          <Link href="/briefs" className="hover:text-gray-700 transition-colors">Intelligence Briefs</Link>
          <span>/</span>
          <Link href={`/briefs/${id}`} className="hover:text-gray-700 transition-colors">Week of {weekOf}</Link>
          <span>/</span>
          <span className="text-gray-600">Competitors</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Competitor Intelligence</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
          Week of {weekOf}{company && ` · ${company.name}`}
        </p>
      </div>

      {!content ? (
        <EmptySection />
      ) : (
        <>
          {competitors.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Competitor Moves This Week</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">CMO</span>
              </div>
              <div className="space-y-0">
                {competitors.map((item, i) => (
                  <div key={i} className="py-4 border-b border-gray-100 dark:border-white/5 last:border-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{item.competitor}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-900 text-white tracking-wide">
                        {typeLabel[item.type] ?? item.type.toUpperCase()}
                      </span>
                      <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded border ${threatBadge[item.threat_level]}`}>
                        {item.threat_level} threat
                      </span>
                    </div>
                    <Link href={`/briefs/${id}/article/competitor_intelligence/${i}`} className="group">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-700 transition-colors leading-snug mb-1">{item.headline}</p>
                    </Link>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">{item.detail}</p>
                    {item.detail.length > 140 && (
                      <Link href={`/briefs/${id}/article/competitor_intelligence/${i}`} className="text-[10px] text-blue-600 hover:underline mt-0.5 inline-block">Read more →</Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {marketing.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Marketing Opportunities</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">CMO</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {marketing.map((item, i) => (
                  <Link key={i} href={`/briefs/${id}/article/marketing_opportunities/${i}`} className="group p-4 rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50/60 dark:bg-gray-700/40 hover:border-gray-300 hover:shadow-sm transition-all block">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{item.channel}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        item.urgency === 'high' ? 'bg-red-50 text-red-700 border-red-200' :
                        item.urgency === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-gray-50 text-gray-500 border-gray-200'
                      }`}>{item.urgency}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-700 transition-colors leading-snug mb-1">{item.opportunity}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{item.rationale}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function EmptySection() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-white/10 p-12 text-center">
      <p className="text-sm text-gray-500 mb-1">No competitor data in this brief.</p>
    </div>
  )
}
