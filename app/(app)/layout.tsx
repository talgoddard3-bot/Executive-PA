import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import MobileNav from '@/components/layout/MobileNav'
import AIChatbot from '@/components/AIChatbot'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Check session
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Check profile status
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await service
    .from('user_profiles')
    .select('status, is_admin')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/onboarding')
  if (!profile.is_admin && profile.status === 'pending') redirect('/pending')
  if (!profile.is_admin && profile.status === 'rejected') redirect('/login')

  return (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-gray-950">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>
      <MobileNav />
      <AIChatbot />
    </div>
  )
}
