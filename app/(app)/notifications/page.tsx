import { createClient } from '@supabase/supabase-js'
import { getSessionCompanyId } from '@/lib/get-company'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import MarkAllReadButton from '@/components/notifications/MarkAllReadButton'

export default async function NotificationsPage() {
  const companyId = await getSessionCompanyId()
  if (!companyId) notFound()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const DEV_USER_ID = '00000000-0000-0000-0000-000000000001'
  const userId = DEV_USER_ID

  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  // Fetch sender names
  const notifications = data ?? []
  const senderIds = [...new Set(notifications.filter(n => n.from_user_id).map(n => n.from_user_id))]
  let names: Record<string, string> = {}
  if (senderIds.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('user_id, full_name')
      .in('user_id', senderIds)
    if (profiles) names = Object.fromEntries(profiles.map(p => [p.user_id, p.full_name ?? 'Team member']))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="p-6 max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</p>
        </div>
        {unreadCount > 0 && <MarkAllReadButton />}
      </div>

      {notifications.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center">
          <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <p className="text-sm text-gray-400">No notifications yet</p>
          <p className="text-xs text-gray-300 mt-1">You&rsquo;ll be notified when someone @mentions you in a comment</p>
        </div>
      )}

      <div className="space-y-2">
        {notifications.map(n => {
          const fromName = names[n.from_user_id] ?? 'A team member'
          const time = new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
          const href = n.brief_id && n.section !== null && n.item_index !== null
            ? `/briefs/${n.brief_id}/article/${n.section}/${n.item_index}`
            : '/briefs'
          return (
            <Link
              key={n.id}
              href={href}
              className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border shadow-sm transition-all hover:shadow-md ${
                n.read ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-100'
              }`}
            >
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.read ? 'bg-gray-200' : 'bg-blue-500'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">
                  <span className="font-semibold">{fromName}</span> mentioned you in a comment
                  {n.headline && <span className="text-gray-500"> on &ldquo;{n.headline.slice(0, 60)}{n.headline.length > 60 ? '\u2026' : ''}&rdquo;</span>}
                </p>
                {n.comment_body && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 italic">&ldquo;{n.comment_body}&rdquo;</p>
                )}
                <p className="text-[10px] text-gray-400 mt-1">{time}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
