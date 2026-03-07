import { getBriefById } from '@/lib/get-latest-brief'
import { notFound } from 'next/navigation'
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

export default async function BriefSupplyChainPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { company, brief, weekOf } = await getBriefById(id)
  if (!brief) notFound()

  const content = brief.content
  const ops = content?.operational_intelligence ?? []
  const risks = content?.risk_summary ?? []

  return (
    <div className="p-6 max-w-4xl space-y-5">
      <div>
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
          <Link href="/briefs" className="hover:text-gray-700 transition-colors">Intelligence Briefs</Link>
          <span>/</span>
          <Link href={`/briefs/${id}`} className="hover:text-gray-700 transition-colors">Week of {weekOf}</Link>
          <span>/</span>
          <span className="text-gray-600">Supply Chain</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Supply Chain</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
          Week of {weekOf}{company && ` · ${company.name}`}
        </p>
      </div>

      {!content ? (
        <EmptySection />
      ) : (
        <>
          {ops.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Operational Intelligence</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-700">CBPO</span>
              </div>
              <div className="space-y-0">
                {ops.map((item, i) => (
                  <div key={i} className="py-4 border-b border-gray-100 dark:border-white/5 last:border-0">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{item.area}</div>
                    <Link href={`/briefs/${id}/article/operational_intelligence/${i}`} className="group">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-700 transition-colors leading-snug mb-1">{item.headline}</p>
                    </Link>
                    <p className="text-xs text-gray-500 leading-relaxed mb-1 line-clamp-2">{item.detail}</p>
                    {item.detail.length > 140 && (
                      <Link href={`/briefs/${id}/article/operational_intelligence/${i}`} className="text-[10px] text-blue-600 hover:underline mb-2 inline-block">Read more →</Link>
                    )}
                    <div className="flex gap-1.5 items-start mt-1">
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-gray-400 mt-0.5">Action</span>
                      <p className="text-xs text-orange-700 font-medium">{item.mitigation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {risks.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Supply Risk Summary</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-700">CEO</span>
              </div>
              <div className="space-y-0">
                {risks.map((risk, i) => (
                  <div key={i} className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-white/5 last:border-0">
                    <span className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${severityDot[risk.severity] ?? 'bg-gray-400'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{risk.title}</span>
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
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-white/10 p-12 text-center">
      <p className="text-sm text-gray-500 mb-1">No supply chain data in this brief.</p>
    </div>
  )
}
