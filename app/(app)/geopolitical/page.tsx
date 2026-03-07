import { getLatestBrief } from '@/lib/get-latest-brief'
import Link from 'next/link'

export default async function GeopoliticalPage() {
  const { company, brief, weekOf } = await getLatestBrief()
  const content = brief?.content
  const geo = content?.geopolitical_news ?? []
  const scenarios = content?.scenario_modeling ?? []
  const risks = content?.risk_summary ?? []

  const probabilityDot: Record<string, string> = {
    high:   'bg-red-500',
    medium: 'bg-amber-400',
    low:    'bg-gray-400',
  }

  return (
    <div className="p-6 max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Geopolitical Signals</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {weekOf ? `From brief: Week of ${weekOf}` : 'Global risk intelligence and scenario analysis'}
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

      {!content ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-sm text-gray-500 mb-1">No geopolitical data available yet.</p>
          <p className="text-xs text-gray-400">Generate a brief to populate geopolitical intelligence.</p>
        </div>
      ) : (
        <>
          {geo.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Geopolitical Developments</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-700">CEO</span>
              </div>
              <div className="space-y-0">
                {geo.map((item, i) => (
                  <div key={i} className="py-4 border-b border-gray-100 last:border-0">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{item.region}</div>
                    <p className="text-sm font-semibold text-gray-900 leading-snug mb-1">{item.headline}</p>
                    <p className="text-xs text-gray-500 leading-relaxed mb-2">{item.detail.replace(/\*\*/g, '')}</p>
                    <div className="flex gap-1.5 items-start">
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
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Scenario Modeling</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-700">CEO</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {scenarios.map((s, i) => (
                  <div key={i} className="p-4 rounded-xl border border-gray-100 bg-gray-50/60 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-gray-900">{s.title}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`w-2 h-2 rounded-full ${probabilityDot[s.probability] ?? 'bg-gray-400'}`} />
                        <span className="text-[10px] text-gray-400 uppercase">{s.probability}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500"><span className="font-semibold text-gray-700">Trigger: </span>{s.trigger}</p>
                    <p className="text-xs text-gray-500"><span className="font-semibold text-gray-700">Impact: </span>{s.impact}</p>
                    <p className="text-xs text-gray-500"><span className="font-semibold text-gray-700">Response: </span>{s.response}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {risks.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Risk Register</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-700">CEO</span>
              </div>
              <div className="space-y-0">
                {risks.map((risk, i) => (
                  <div key={i} className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
                    <span className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${probabilityDot[risk.severity] ?? 'bg-gray-400'}`} />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900">{risk.title}</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wide">{risk.severity} · {risk.timeframe}</span>
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
