import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { getSessionCompanyId } from '@/lib/get-company'
import BriefDashboard from '@/components/brief/BriefDashboard'
import type { Brief } from '@/lib/types'

export default async function BriefPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const companyId = await getSessionCompanyId()
  if (!companyId) notFound()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: company } = await supabase
    .from('companies')
    .select('id, name, logo_url, brand_color')
    .eq('id', companyId)
    .single()

  if (!company) notFound()

  const { data: brief } = await supabase
    .from('briefs')
    .select('*')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (!brief) notFound()

  const typedBrief = brief as Brief

  const weekOf = new Date(typedBrief.week_of).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="p-6">
      <div className="max-w-[1200px] mx-auto">
        {typedBrief.status !== 'complete' || !typedBrief.content ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <p className="text-sm text-gray-500">
              {typedBrief.status === 'generating'
                ? 'This brief is being generated…'
                : typedBrief.status === 'failed'
                  ? 'Brief generation failed.'
                  : 'Brief is pending.'}
            </p>
          </div>
        ) : (
          <BriefDashboard
            briefId={id}
            content={typedBrief.content}
            weekOf={weekOf}
            generatedAt={typedBrief.generated_at}
            companyName={company?.name}
          />
        )}
      </div>
    </div>
  )
}
