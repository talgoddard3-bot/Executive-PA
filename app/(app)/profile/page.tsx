import { createClient } from '@supabase/supabase-js'
import { getSessionCompanyId } from '@/lib/get-company'
import ProfileForm from '@/components/profile/ProfileForm'
import ProfileDisplay from '@/components/profile/ProfileDisplay'
import LocationsManager from '@/components/profile/LocationsManager'
import type { Company, CompanyProfile } from '@/lib/types'

async function getCompanyData() {
  const companyId = await getSessionCompanyId()
  if (!companyId) return null

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data } = await supabase
    .from('companies')
    .select('*, company_profiles(*)')
    .eq('id', companyId)
    .single()

  return data
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>
}) {
  const params = await searchParams
  const company = await getCompanyData()
  const profile = company?.company_profiles?.[0] as CompanyProfile | undefined
  const justSaved = params.saved === '1'

  return (
    <div className="p-6">
      <div className="max-w-2xl space-y-5">

        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Company Profile</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Manage your company details and intelligence preferences</p>
        </div>

        {justSaved && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
            Profile saved successfully.
          </div>
        )}

        {company && profile ? (
          <>
            <ProfileDisplay
              company={company as Company}
              profile={profile}
            />
            <LocationsManager />
          </>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Set up your company profile</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                This information is used to personalise your intelligence brief.
              </p>
            </div>
            <ProfileForm />
          </div>
        )}

      </div>
    </div>
  )
}
