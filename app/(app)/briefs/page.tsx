import { createClient } from '@supabase/supabase-js'
import { getSessionCompanyId, getIsAdmin } from '@/lib/get-company'
import GenerateButton from '@/components/brief/GenerateButton'
import DeleteBriefButton from '@/components/brief/DeleteBriefButton'
import BriefsListClient from '@/components/brief/BriefsListClient'
import Link from 'next/link'
import type { Brief } from '@/lib/types'

async function getData() {
  const companyId = await getSessionCompanyId()
  if (!companyId) return { company: null, briefs: [] }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: company } = await supabase
    .from('companies')
    .select('id, name')
    .eq('id', companyId)
    .single()

  if (!company) return { company: null, briefs: [] }

  const { data: briefs } = await supabase
    .from('briefs')
    .select('*')
    .eq('company_id', company.id)
    .order('week_of', { ascending: false })

  return { company, briefs: briefs ?? [] }
}

function riskBadge(brief: Brief) {
  const high = brief.content?.risk_summary?.filter(r => r.severity === 'high').length ?? 0
  const med  = brief.content?.risk_summary?.filter(r => r.severity === 'medium').length ?? 0
  return { high, med }
}

const URGENCY_CONFIG = {
  'act-now':   { badge: 'bg-red-50 text-red-700 border-red-200',     dot: 'bg-red-500',   label: 'Act Now' },
  'monitor':   { badge: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', label: 'Monitor' },
  'awareness': { badge: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500', label: 'Awareness' },
}

export default async function BriefsPage() {
  const [{ company, briefs }, isAdmin] = await Promise.all([getData(), getIsAdmin()])

  const complete = (briefs as Brief[]).filter(b => b.status === 'complete')
  const latest = complete[0] ?? null
  const archive = complete.slice(1)
  const inProgress = (briefs as Brief[]).filter(b => b.status === 'generating' || b.status === 'pending')

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Intelligence Briefs</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{company?.name ?? 'Your company'}</p>
        </div>
        {company && <GenerateButton />}
      </div>

      {/* No company */}
      {!company && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-white/10 p-10 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Set up your company profile first.</p>
        </div>
      )}

      {/* In-progress briefs */}
      {inProgress.length > 0 && (
        <div className="space-y-2">
          {inProgress.map(b => (
            <div key={b.id} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                  {b.status === 'generating' ? 'Generating brief…' : 'Brief queued'}
                </p>
                <p className="text-xs text-blue-500 dark:text-blue-400">
                  Week of {new Date(b.week_of).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No briefs at all */}
      {company && briefs.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-white/10 p-12 text-center">
          <svg className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">No briefs generated yet.</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Use the Generate Brief button to create your first intelligence brief.</p>
        </div>
      )}

      {/* Latest brief — hero card */}
      {latest && (() => {
        const weekOf = new Date(latest.week_of).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
        const { high, med } = riskBadge(latest)
        const headline = latest.content?.headline ?? ''
        const tldr = latest.content?.tldr
        const soWhat = latest.content?.so_what
        const urgency = latest.content?.urgency
        const readTime = latest.content?.read_time
        const sectorTags = latest.content?.sector_tags ?? []
        const sep = headline.indexOf(' — ')
        const title = sep !== -1 ? headline.slice(0, sep) : headline
        const tagline = sep !== -1 ? headline.slice(sep + 3) : null
        const urgencyCfg = urgency ? URGENCY_CONFIG[urgency as keyof typeof URGENCY_CONFIG] : null
        return (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
            {/* Hero top bar */}
            <div className="px-5 pt-4 pb-3 border-b border-gray-100 dark:border-white/5 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded">Latest Brief</span>
                <span className="text-[11px] text-gray-400 dark:text-gray-500">Week of {weekOf}</span>
                {urgencyCfg && (
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${urgencyCfg.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${urgencyCfg.dot}`} />
                    {urgencyCfg.label}
                  </span>
                )}
                {readTime && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {readTime} min read
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {high > 0 && <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded">{high} high risk{high !== 1 ? 's' : ''}</span>}
                {med > 0  && <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded">{med} medium</span>}
                {isAdmin && <DeleteBriefButton briefId={latest.id} />}
              </div>
            </div>

            <div className="p-5">
              {/* Headline */}
              {title && (
                <div className="mb-3">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-snug">{title}</h2>
                  {tagline && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-snug">{tagline}</p>}
                </div>
              )}

              {/* Sector tags */}
              {sectorTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {sectorTags.map(tag => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 font-medium capitalize">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* TL;DR */}
              {tldr && (
                <div className="mb-4 px-3 py-2 bg-gray-900 dark:bg-black/40 rounded-lg">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mr-2">TL;DR</span>
                  <span className="text-sm font-semibold text-white">{tldr}</span>
                </div>
              )}

              {/* So What callout */}
              {soWhat && (
                <div className="mb-4 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 rounded-lg">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-1">What this means for you</p>
                  <p className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed">{soWhat}</p>
                </div>
              )}

              {/* SWOT bullets */}
              {!soWhat && latest.content?.swot && (() => {
                const s = latest.content.swot
                const items = [
                  { key: 'S', color: 'bg-green-500', text: s.strengths?.[0]?.point },
                  { key: 'W', color: 'bg-red-500',   text: s.weaknesses?.[0]?.point },
                  { key: 'O', color: 'bg-blue-500',  text: s.opportunities?.[0]?.point },
                  { key: 'T', color: 'bg-amber-500', text: s.threats?.[0]?.point },
                ].filter(i => i.text)
                return (
                  <ul className="space-y-1.5 mb-4">
                    {items.map(i => (
                      <li key={i.key} className="flex items-start gap-2">
                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${i.color}`} />
                        <span className="text-xs text-gray-600 dark:text-gray-400 leading-snug">{i.text!.replace(/\*\*/g, '')}</span>
                      </li>
                    ))}
                  </ul>
                )
              })()}

              <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-white/5">
                <Link href={`/briefs/${latest.id}`} className="text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 px-3 py-1.5 rounded-lg transition-colors">
                  Overview
                </Link>
                <Link href={`/briefs/${latest.id}/full`} className="flex items-center gap-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors">
                  Read Full Brief
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Archive — searchable + filterable */}
      {archive.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Archive</p>
          <BriefsListClient briefs={archive} isAdmin={isAdmin} />
        </div>
      )}
    </div>
  )
}
