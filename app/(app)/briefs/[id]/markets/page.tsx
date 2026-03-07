import { getBriefById } from '@/lib/get-latest-brief'
import { notFound } from 'next/navigation'
import DashboardMarketSignals from '@/components/dashboard/DashboardMarketSignals'
import Link from 'next/link'
import type { StoredSparkline } from '@/lib/types'

export default async function BriefMarketsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { company, brief, weekOf } = await getBriefById(id)
  if (!brief) notFound()

  const content = brief.content
  const signals = content?.financial_signals ?? []

  return (
    <div className="p-6 max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <Link href="/briefs" className="hover:text-gray-700 transition-colors">Intelligence Briefs</Link>
            <span>/</span>
            <Link href={`/briefs/${id}`} className="hover:text-gray-700 transition-colors">Week of {weekOf}</Link>
            <span>/</span>
            <span className="text-gray-600">Market Signals</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Market Signals</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            Week of {weekOf}{company && ` · ${company.name}`}
          </p>
        </div>
      </div>

      {!content ? (
        <EmptySection />
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Macro Market Overview</h2>
            <DashboardMarketSignals
              snapshots={content.market_snapshots as Record<string, StoredSparkline> | undefined}
            />
          </div>

          {signals.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">CFO Financial Signals</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700">CFO</span>
              </div>
              <div className="space-y-0">
                {signals.map((item, i) => (
                  <div key={i} className="py-4 border-b border-gray-100 dark:border-white/5 last:border-0">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">{item.category}</div>
                    <Link href={`/briefs/${id}/article/financial_signals/${i}`} className="group">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-700 transition-colors leading-snug mb-1">{item.headline}</p>
                    </Link>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-1 line-clamp-2">{item.detail}</p>
                    {item.detail.length > 140 && (
                      <Link href={`/briefs/${id}/article/financial_signals/${i}`} className="text-[10px] text-blue-600 hover:underline mb-2 inline-block">Read more →</Link>
                    )}
                    <div className="flex gap-1.5 items-start mt-1">
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-gray-400 mt-0.5">CFO Action</span>
                      <p className="text-xs text-blue-700 font-medium">{item.cfo_action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {content.capital_impact && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Capital Impact</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700">CFO</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Revenue Exposure', value: content.capital_impact.revenue_exposure },
                  { label: 'Margin Pressure',  value: content.capital_impact.margin_pressure },
                  { label: 'Capex',            value: content.capital_impact.capex_considerations },
                ].map(({ label, value }) => (
                  <div key={label} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-white/10">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5">{label}</div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{value}</p>
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
      <p className="text-sm text-gray-500 mb-1">No market data in this brief.</p>
    </div>
  )
}
