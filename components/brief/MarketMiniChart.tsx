'use client'

import { AreaChart, Area, ResponsiveContainer, Tooltip, YAxis } from 'recharts'
import type { Sparkline } from '@/lib/market-data'

interface Props {
  sparkline: Sparkline
  compact?: boolean
}

export default function MarketMiniChart({ sparkline, compact = false }: Props) {
  const { label, ticker, unit, data, current, pct, up } = sparkline
  const color = up ? '#16a34a' : '#dc2626'
  const fill = up ? '#dcfce7' : '#fee2e2'

  const displayValue = current >= 1000
    ? current.toLocaleString('en-US', { maximumFractionDigits: 0 })
    : current.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })

  if (compact) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 p-3 flex flex-col gap-1" title={label}>
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{ticker}</div>
            <div className="text-[11px] font-semibold text-gray-700 leading-tight">{label}</div>
          </div>
          <span className={`text-[10px] font-bold ${up ? 'text-green-600' : 'text-red-600'}`}>
            {up ? '▲' : '▼'} {Math.abs(pct)}%
          </span>
        </div>
        <div className="text-sm font-mono font-semibold text-gray-900">
          {unit && <span className="text-gray-400 text-xs mr-0.5">{unit.split('/')[0] || ''}</span>}
          {displayValue}
        </div>
        <div className="h-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
              <YAxis domain={['dataMin', 'dataMax']} hide />
              <Tooltip
                contentStyle={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, border: '1px solid #e5e7eb' }}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ''}
                formatter={(v: number | undefined) => [v != null ? v.toLocaleString('en-US', { maximumFractionDigits: 4 }) : '—', label]}
              />
              <Area type="monotone" dataKey="value" stroke={color} fill={fill}
                strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-100 p-4">
      <div className="flex items-start justify-between mb-1">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{ticker}</div>
          <div className="text-sm font-semibold text-gray-900">{label}</div>
        </div>
        <div className="text-right">
          <div className="text-base font-mono font-bold text-gray-900">{displayValue}</div>
          <div className={`text-xs font-bold ${up ? 'text-green-600' : 'text-red-600'}`}>
            {up ? '▲' : '▼'} {Math.abs(pct)}% · 30d
          </div>
        </div>
      </div>
      <div className="h-16 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <YAxis domain={['dataMin', 'dataMax']} hide />
            <Tooltip
              contentStyle={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, border: '1px solid #e5e7eb' }}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ''}
              formatter={(v: number | undefined) => [v != null ? v.toLocaleString('en-US', { maximumFractionDigits: 4 }) : '—', label]}
            />
            <Area type="monotone" dataKey="value" stroke={color} fill={fill}
              strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
