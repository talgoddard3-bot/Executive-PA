import { createClient } from '@supabase/supabase-js'
import { getSessionUser } from '@/lib/get-company'
import { notFound } from 'next/navigation'
import InternalPageClient from '@/components/internal/InternalPageClient'

export default async function InternalPage() {
  const user = await getSessionUser()
  if (!user?.companyId) notFound()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date().toISOString()

  const [notesResult, docsResult] = await Promise.all([
    supabase
      .from('internal_notes')
      .select('id, category, content, expires_at, created_at')
      .eq('company_id', user.companyId)
      .eq('archived', false)
      .gte('expires_at', now)
      .order('created_at', { ascending: false }),
    supabase
      .from('uploaded_documents')
      .select('id, title, description, file_type, file_size, expires_at, created_at')
      .eq('company_id', user.companyId)
      .eq('archived', false)
      .gte('expires_at', now)
      .order('created_at', { ascending: false }),
  ])

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Internal Intelligence</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Notes and documents you add here are fed into your next brief synthesis. Only descriptions are shared with AI — files stay private.
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Do not include passwords, personal data, or NDA-restricted information
          </div>
        </div>

        <InternalPageClient
          initialNotes={notesResult.data ?? []}
          initialDocs={docsResult.data ?? []}
        />
      </div>
    </div>
  )
}
