'use client'

import type { StoredSparkline } from '@/lib/types'
import MarketMiniChart from '@/components/brief/MarketMiniChart'
import { SPARKLINES } from '@/lib/market-data'

interface Props {
  snapshots?: Record<string, StoredSparkline>
}

const DASHBOARD_KEYS = ['sp500', 'msci', 'dxy', 'oil']

export default function DashboardMarketSignals({ snapshots }: Props) {
  const charts = DASHBOARD_KEYS.map(key => {
    const live = snapshots?.[key]
    return (live ?? SPARKLINES[key]) as StoredSparkline | undefined
  }).filter(Boolean) as StoredSparkline[]

  if (charts.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {charts.map((s) => (
          <MarketMiniChart
            key={s.ticker}
            sparkline={s as Parameters<typeof MarketMiniChart>[0]['sparkline']}
            compact
          />
        ))}
      </div>
      <p className="text-[10px] text-gray-400">
        {snapshots && Object.keys(snapshots).length > 0
          ? '✓ Live · fetched at brief generation'
          : '⚠ Simulated data'}
      </p>
    </div>
  )
}
