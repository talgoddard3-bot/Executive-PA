import { getBriefById } from '@/lib/get-latest-brief'
import { notFound } from 'next/navigation'
import Link from 'next/link'

const probabilityDot: Record<string, string> = {
  high:   'bg-red-500',
  medium: 'bg-amber-400',
  low:    'bg-gray-400',
}

export default async function BriefGeopoliticalPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { company, brief, weekOf } = await getBriefById(id)
  if (!brief) notFound()

  const content = brief.content
  const geo = content?.geopolitical_news ?? []
  const scenarios = content?.scenario_modeling ?? []
  const risks = content?.risk_summary ?? []

  return (
    <div className="p-6 max-w-4xl space-y-5">
      <div>
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
          <Link href="/briefs" className="hover:text-gray-700 transition-colors">Intelligence Briefs</Link>
          <span>/</span>
          <Link href={`/briefs/${id}`} className="hover:text-gray-700 transition-colors">Week of {weekOf}</Link>
          <span>/</span>
          <span className="text-gray-600">Geopolitical</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Geopolitical Signals</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
          Week of {weekOf}{company && ` · ${company.name}`}
        </p>
      </div>

      {!content ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-white/10 p-12 text-center">
          <p className="text-sm text-gray-500 mb-1">No geopolitical data in this brief.</p>
        </div>
      ) : (
        <>
          {geo.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Geopolitical Developments</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-700">CEO</span>
              </div>
              <div className="space-y-0">
                {geo.map((item, i) => (
                  <div key={i} className="py-4 border-b border-gray-100 dark:border-white/5 last:border-0">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">{item.region}</div>
                    <Link href={`/briefs/${id}/article/geopolitical_news/${i}`} className="group">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-700 transition-colors leading-snug mb-1">{item.headline}</p>
                    </Link>
                    <p className="text-xs text-gray-500 leading-relaxed mb-1 line-clamp-2">{item.detail.replace(/\*\*/g, '')}</p>
                    {item.detail.length > 140 && (
                      <Link href={`/briefs/${id}/article/geopolitical_news/${i}`} className="text-[10px] text-blue-600 hover:underline mb-2 inline-block">Read more →</Link>
                    )}
                    <div className="flex gap-1.5 items-start mt-1">
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-gray-400 mt-0.5">Relevance</span>
                      <p className="text-xs text-violet-700 font-medium">{item.relevance}</p>
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
            </div>
          )}

          {scenarios.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Scenario Modeling</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-700">CEO</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {scenarios.map((s, i) => (
                  <div key={i} className="p-4 rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50/60 dark:bg-gray-700/40 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{s.title}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`w-2 h-2 rounded-full ${probabilityDot[s.probability] ?? 'bg-gray-400'}`} />
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase">{s.probability}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400"><span className="font-semibold text-gray-700 dark:text-gray-300">Trigger: </span>{s.trigger}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400"><span className="font-semibold text-gray-700 dark:text-gray-300">Impact: </span>{s.impact}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400"><span className="font-semibold text-gray-700 dark:text-gray-300">Response: </span>{s.response}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {risks.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Risk Register</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-700">CEO</span>
              </div>
              <div className="space-y-0">
                {risks.map((risk, i) => (
                  <div key={i} className="flex gap-3 py-3 border-b border-gray-100 dark:border-white/5 last:border-0">
                    <span className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${probabilityDot[risk.severity] ?? 'bg-gray-400'}`} />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{risk.title}</span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">{risk.severity} · {risk.timeframe}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{risk.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
