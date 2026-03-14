import { createClient } from '@supabase/supabase-js'
import { getSessionCompanyId } from '@/lib/get-company'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const SECTION_COLORS: Record<string, string> = {
  company_news: 'bg-gray-100 text-gray-600',
  competitor_intelligence: 'bg-orange-50 text-orange-700',
  marketing_opportunities: 'bg-emerald-50 text-emerald-700',
  geopolitical_news: 'bg-violet-50 text-violet-700',
  financial_news: 'bg-blue-50 text-blue-700',
  financial_signals: 'bg-blue-50 text-blue-700',
  tech_intelligence: 'bg-cyan-50 text-cyan-700',
  hr_intelligence: 'bg-pink-50 text-pink-700',
  ma_watch: 'bg-indigo-50 text-indigo-700',
  operational_intelligence: 'bg-amber-50 text-amber-700',
  customer_intelligence: 'bg-teal-50 text-teal-700',
  risk_summary: 'bg-red-50 text-red-700',
}

export default async function SavedPage() {
  const companyId = await getSessionCompanyId()
  if (!companyId) notFound()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const DEV_USER_ID = '00000000-0000-0000-0000-000000000001'
  const userId = DEV_USER_ID // server-side; in production use session

  const { data: favourites } = await supabase
    .from('article_favourites')
    .select('*')
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  const items = favourites ?? []

  return (
    <div className="p-6 max-w-3xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Saved Articles</h1>
        <p className="text-sm text-gray-500 mt-1">{items.length} saved article{items.length !== 1 ? 's' : ''}</p>
      </div>

      {items.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center">
          <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <p className="text-sm text-gray-400">No saved articles yet</p>
          <p className="text-xs text-gray-300 mt-1">Tap the heart icon on any article to save it here</p>
        </div>
      )}

      <div className="space-y-2">
        {items.map(fav => {
          const weekOf = fav.brief_week_of
            ? new Date(fav.brief_week_of).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : null
          const color = SECTION_COLORS[fav.section] ?? 'bg-gray-100 text-gray-600'
          return (
            <Link
              key={fav.id}
              href={`/briefs/${fav.brief_id}/article/${fav.section}/${fav.item_index}`}
              className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-4 flex items-start gap-3 hover:border-gray-300 hover:shadow-md transition-all group block"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded shrink-0 ${color}`}>
                    {fav.section_label}
                  </span>
                  {weekOf && <span className="text-[10px] text-gray-400">Week of {weekOf}</span>}
                </div>
                <p className="text-sm font-medium text-gray-800 group-hover:text-blue-700 transition-colors line-clamp-2">
                  {fav.headline}
                </p>
              </div>
              <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-400 shrink-0 mt-1 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
