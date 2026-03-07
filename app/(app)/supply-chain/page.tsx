import { getLatestBrief } from '@/lib/get-latest-brief'
import Link from 'next/link'

const severityDot: Record<string, string> = {
  high:   'bg-red-500',
  medium: 'bg-amber-400',
  low:    'bg-gray-400',
}
const severityBadge: Record<string, string> = {
  high:   'bg-red-50 text-red-700 border-red-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low:    'bg-gray-100 text-gray-500 border-gray-200',
}

export default async function SupplyChainPage() {
  const { company, brief, weekOf } = await getLatestBrief()
  const content = brief?.content
  const ops = content?.operational_intelligence ?? []
  const risks = content?.risk_summary ?? []

  return (
    <div className="p-6 max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Supply Chain</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {weekOf ? `From brief: Week of ${weekOf}` : 'Operational intelligence and supply risks'}
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
        <EmptySection />
      ) : (
        <>
          {ops.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Operational Intelligence</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-700">CBPO</span>
              </div>
              <div className="space-y-0">
                {ops.map((item, i) => (
                  <div key={i} className="py-4 border-b border-gray-100 last:border-0">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{item.area}</div>
                    <p className="text-sm font-semibold text-gray-900 leading-snug mb-1">{item.headline}</p>
                    <p className="text-xs text-gray-500 leading-relaxed mb-2">{item.detail}</p>
                    <div className="flex gap-1.5 items-start">
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-gray-400 mt-0.5">Action</span>
                      <p className="text-xs text-orange-700 font-medium">{item.mitigation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {risks.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Supply Risk Summary</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-700">CEO</span>
              </div>
              <div className="space-y-0">
                {risks.map((risk, i) => (
                  <div key={i} className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
                    <span className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${severityDot[risk.severity] ?? 'bg-gray-400'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900">{risk.title}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${severityBadge[risk.severity]}`}>
                          {risk.severity}
                        </span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wide ml-auto">{risk.timeframe}</span>
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

function EmptySection() {
  return (
    <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
      <p className="text-sm text-gray-500 mb-1">No supply chain data available yet.</p>
      <p className="text-xs text-gray-400">Generate a brief from the Dashboard to populate operational intelligence.</p>
    </div>
  )
}
