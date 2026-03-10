import { getLatestBrief } from '@/lib/get-latest-brief'
import DashboardMarketSignals from '@/components/dashboard/DashboardMarketSignals'
import Link from 'next/link'
import type { StoredSparkline } from '@/lib/types'

export default async function MarketsPage() {
  const { company, brief, weekOf } = await getLatestBrief()

  const content = brief?.content
  const signals = content?.financial_signals ?? []

  return (
    <div className="p-6 max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Market Signals</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {weekOf ? `From brief: Week of ${weekOf}` : 'Financial market intelligence'}
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
          {/* Macro charts */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Macro Market Overview</h2>
            <DashboardMarketSignals
              snapshots={content.market_snapshots as Record<string, StoredSparkline> | undefined}
            />
          </div>

          {/* Financial signals */}
          {signals.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-gray-900">CFO Financial Signals</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700">CFO</span>
              </div>
              <div className="space-y-0">
                {signals.map((item, i) => (
                  <div key={i} className="py-4 border-b border-gray-100 last:border-0">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{item.category}</div>
                    <p className="text-sm font-semibold text-gray-900 leading-snug mb-1">{item.headline}</p>
                    <p className="text-xs text-gray-500 leading-relaxed mb-2">{item.detail}</p>
                    <div className="flex gap-1.5 items-start">
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-gray-400 mt-0.5">CFO Action</span>
                      <p className="text-xs text-blue-700 font-medium">{item.cfo_action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Capital impact */}
          {content.capital_impact && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Capital Impact</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700">CFO</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Revenue Exposure', value: content.capital_impact.revenue_exposure },
                  { label: 'Margin Pressure',  value: content.capital_impact.margin_pressure },
                  { label: 'Capex',            value: content.capital_impact.capex_considerations },
                ].map(({ label, value }) => (
                  <div key={label} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">{label}</div>
                    <p className="text-xs text-gray-700 leading-relaxed">{value}</p>
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
      <p className="text-sm text-gray-500 mb-1">No market data available yet.</p>
      <p className="text-xs text-gray-400">Generate a brief from the Dashboard to populate market signals.</p>
    </div>
  )
}
