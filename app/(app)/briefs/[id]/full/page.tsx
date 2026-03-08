import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { getSessionCompanyId } from '@/lib/get-company'
import BriefViewer from '@/components/brief/BriefViewer'
import Link from 'next/link'
import type { Brief } from '@/lib/types'

export default async function FullBriefPage({
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
      <div className="max-w-[1400px] space-y-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Link href="/briefs" className="hover:text-gray-700 transition-colors">Intelligence Briefs</Link>
          <span>/</span>
          <Link href={`/briefs/${id}`} className="hover:text-gray-700 transition-colors">Week of {weekOf}</Link>
          <span>/</span>
          <span className="text-gray-600">Full Brief</span>
        </div>

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
          <BriefViewer
            content={typedBrief.content}
            weekOf={weekOf}
            generatedAt={typedBrief.generated_at}
            companyName={company?.name}
            logoUrl={(company as { logo_url?: string | null })?.logo_url}
            brandColor={(company as { brand_color?: string | null })?.brand_color}
            briefId={id}
          />
        )}
      </div>
    </div>
  )
}
