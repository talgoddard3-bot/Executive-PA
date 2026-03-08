import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

const service = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

/**
 * Returns the authenticated user's company_id.
 * Use this in every server route/page instead of DEV_USER_ID.
 * Returns null if the user is not authenticated or has no linked company.
 */
export async function getSessionCompanyId(): Promise<string | null> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await service()
    .from('user_profiles')
    .select('company_id')
    .eq('user_id', user.id)
    .single()

  return data?.company_id ?? null
}

/**
 * Returns both the user id and company_id.
 */
export async function getSessionUser(): Promise<{ userId: string; companyId: string } | null> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await service()
    .from('user_profiles')
    .select('company_id')
    .eq('user_id', user.id)
    .single()

  if (!data?.company_id) return null

  return { userId: user.id, companyId: data.company_id }
}
