import Link from 'next/link'
import type { Brief } from '@/lib/types'
import DeleteBriefButton from './DeleteBriefButton'
import SWOTMiniDonut from './SWOTMiniDonut'

const statusStyles = {
  pending:    'bg-yellow-50 text-yellow-700 border-yellow-200',
  generating: 'bg-blue-50   text-blue-700   border-blue-200',
  complete:   'bg-green-50  text-green-700  border-green-200',
  failed:     'bg-red-50    text-red-700    border-red-200',
}
const statusLabel = {
  pending:    'Pending',
  generating: 'Generating…',
  complete:   'Ready',
  failed:     'Failed',
}

const SWOT_STYLE = {
  S: { label: 'Strength',    dot: 'bg-green-500' },
  W: { label: 'Weakness',    dot: 'bg-red-500'   },
  O: { label: 'Opportunity', dot: 'bg-blue-500'  },
  T: { label: 'Threat',      dot: 'bg-amber-500' },
}

export default function BriefCard({ brief }: { brief: Brief }) {
  const weekOf = new Date(brief.week_of).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const generatedAt = brief.generated_at
    ? new Date(brief.generated_at).toLocaleString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
      }) + ' UTC'
    : null

  const swot = brief.content?.swot
  const swotBullets = swot ? [
    { key: 'S' as const, text: swot.strengths?.[0]?.point },
    { key: 'W' as const, text: swot.weaknesses?.[0]?.point },
    { key: 'O' as const, text: swot.opportunities?.[0]?.point },
    { key: 'T' as const, text: swot.threats?.[0]?.point },
  ].filter(b => b.text) : []

  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 p-5 hover:shadow-md transition-shadow">
      {/* Top row: week + status + timestamp */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Week of {weekOf}</p>
          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${statusStyles[brief.status]}`}>
            {statusLabel[brief.status]}
          </span>
          {generatedAt && (
            <span className="flex items-center gap-1 text-[10px] text-gray-300">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {generatedAt}
            </span>
          )}
        </div>
        <DeleteBriefButton briefId={brief.id} />
      </div>

      {/* Main content: text + SWOT donut */}
      <div className="flex gap-4 items-start">
        <div className="flex-1 min-w-0">
          {brief.content?.headline ? (
            <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug mb-2">
              {brief.content.headline}
            </h3>
          ) : (
            <p className="text-sm text-gray-400 italic mb-2">
              {brief.status === 'generating' ? 'Generating brief…' : 'No headline yet'}
            </p>
          )}

          {swotBullets.length > 0 ? (
            <ul className="space-y-1 mb-3">
              {swotBullets.map(({ key, text }) => (
                <li key={key} className="flex items-start gap-2">
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${SWOT_STYLE[key].dot}`} />
                  <span className="text-[11px] text-gray-600 dark:text-gray-400 leading-snug line-clamp-1">
                    <span className="font-semibold text-gray-500 dark:text-gray-400">{SWOT_STYLE[key].label}: </span>
                    {text!.replace(/\*\*/g, '')}
                  </span>
                </li>
              ))}
            </ul>
          ) : brief.content?.executive_summary ? (
            <p className="text-xs text-gray-500 line-clamp-2 mb-3">
              {brief.content.executive_summary}
            </p>
          ) : null}
        </div>

        {swot && <SWOTMiniDonut swot={swot} />}
      </div>

      {/* CTA */}
      {brief.status === 'complete' && (
        <div className="mt-1 flex items-center gap-2">
          <Link
            href={`/briefs/${brief.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href={`/briefs/${brief.id}/full`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            Read Intelligence Brief
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  )
}
