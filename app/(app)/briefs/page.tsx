import { createClient } from '@supabase/supabase-js'
import { getSessionCompanyId } from '@/lib/get-company'
import BriefCard from '@/components/brief/BriefCard'
import GenerateButton from '@/components/brief/GenerateButton'
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

export default async function BriefsPage() {
  const { company, briefs } = await getData()

  return (
    <div className="p-6 max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Intelligence Briefs</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">All generated weekly briefs for {company?.name ?? 'your company'}</p>
        </div>
        {company && <GenerateButton />}
      </div>

      {!company && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-white/10 p-10 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Set up your company profile first.</p>
        </div>
      )}

      {company && briefs.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-white/10 p-10 text-center">
          <p className="text-sm text-gray-500 mb-1">No briefs generated yet.</p>
          <p className="text-xs text-gray-400">Use the button above to generate your first intelligence brief.</p>
        </div>
      )}

      {briefs.length > 0 && (
        <div className="space-y-2.5">
          {(briefs as Brief[]).map((brief) => (
            <BriefCard key={brief.id} brief={brief} />
          ))}
        </div>
      )}
    </div>
  )
}
