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
  S: { label: 'Strength',    dot: 'bg-green-500',  text: 'text-green-700' },
  W: { label: 'Weakness',    dot: 'bg-red-500',    text: 'text-red-700'   },
  O: { label: 'Opportunity', dot: 'bg-blue-500',   text: 'text-blue-700'  },
  T: { label: 'Threat',      dot: 'bg-amber-500',  text: 'text-amber-700' },
}

function splitHeadline(headline: string): { title: string; tagline: string | null } {
  const sep = headline.indexOf(' — ')
  if (sep === -1) return { title: headline, tagline: null }
  return {
    title: headline.slice(0, sep),
    tagline: headline.slice(sep + 3),
  }
}

export default function BriefCard({ brief, isAdmin }: { brief: Brief; isAdmin?: boolean }) {
  const weekOf = new Date(brief.week_of).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
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

  const { title, tagline } = brief.content?.headline
    ? splitHeadline(brief.content.headline)
    : { title: '', tagline: null }

  const riskHigh = brief.content?.risk_summary?.filter(r => r.severity === 'high').length ?? 0
  const riskMed  = brief.content?.risk_summary?.filter(r => r.severity === 'medium').length ?? 0

  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 p-4 md:p-5 hover:shadow-md transition-shadow">

      {/* Top row: week + status + timestamp + delete */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            Week of {weekOf}
          </p>
          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${statusStyles[brief.status]}`}>
            {statusLabel[brief.status]}
          </span>
          {generatedAt && (
            <span className="hidden sm:flex items-center gap-1 text-[10px] text-gray-300">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {generatedAt}
            </span>
          )}
        </div>
        {isAdmin && <DeleteBriefButton briefId={brief.id} />}
      </div>

      {/* Headline */}
      {title ? (
        <div className="mb-3">
          <h3 className="text-sm md:text-base font-bold text-gray-900 dark:text-white leading-snug">
            {title}
          </h3>
          {tagline && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-snug">
              {tagline}
            </p>
          )}
        </div>
      ) : brief.status === 'generating' ? (
        <p className="text-sm text-gray-400 italic mb-3">Generating brief…</p>
      ) : null}

      {/* SWOT + donut row */}
      {swotBullets.length > 0 && (
        <div className="flex gap-3 items-start mb-3">
          <ul className="flex-1 space-y-1.5">
            {swotBullets.map(({ key, text }) => (
              <li key={key} className="flex items-start gap-2">
                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${SWOT_STYLE[key].dot}`} />
                <span className="text-[11px] text-gray-600 dark:text-gray-400 leading-snug">
                  <span className={`font-semibold ${SWOT_STYLE[key].text}`}>{SWOT_STYLE[key].label}:</span>
                  {' '}{text!.replace(/\*\*/g, '')}
                </span>
              </li>
            ))}
          </ul>
          {swot && (
            <div className="shrink-0">
              <SWOTMiniDonut swot={swot} />
            </div>
          )}
        </div>
      )}

      {/* Risk counts + CTA */}
      {brief.status === 'complete' && (
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-2">
            {riskHigh > 0 && (
              <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded">
                {riskHigh} high risk{riskHigh !== 1 ? 's' : ''}
              </span>
            )}
            {riskMed > 0 && (
              <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded">
                {riskMed} medium
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/briefs/${brief.id}`}
              className="text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href={`/briefs/${brief.id}/full`}
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              Read Brief
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
