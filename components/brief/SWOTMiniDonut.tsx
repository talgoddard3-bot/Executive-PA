'use client'

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import type { SWOTAnalysis } from '@/lib/types'

export default function SWOTMiniDonut({ swot }: { swot: SWOTAnalysis }) {
  const data = [
    { name: 'S', value: swot.strengths?.length     ?? 0, color: '#16a34a' },
    { name: 'W', value: swot.weaknesses?.length    ?? 0, color: '#dc2626' },
    { name: 'O', value: swot.opportunities?.length ?? 0, color: '#2563eb' },
    { name: 'T', value: swot.threats?.length       ?? 0, color: '#d97706' },
  ].filter(d => d.value > 0)

  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="relative w-20 h-20 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={22}
            outerRadius={36}
            paddingAngle={2}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
          >
            {data.map(d => <Cell key={d.name} fill={d.color} opacity={0.85} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[10px] font-bold text-gray-700 leading-none">{total}</span>
        <span className="text-[8px] text-gray-400 leading-none">signals</span>
      </div>
    </div>
  )
}
