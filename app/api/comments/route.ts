import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSessionUser } from '@/lib/get-company'

const DEV_USER_ID = '00000000-0000-0000-0000-000000000001'

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function getUserId(): Promise<string> {
  try {
    const session = await getSessionUser()
    return session?.userId ?? DEV_USER_ID
  } catch {
    return DEV_USER_ID
  }
}

// GET /api/comments?brief_id=xxx&section=xxx&item_index=0&company_id=xxx
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  const brief_id = p.get('brief_id')
  const section = p.get('section')
  const item_index = p.get('item_index')
  const company_id = p.get('company_id')
  if (!brief_id || !section || item_index === null || !company_id) {
    return NextResponse.json({ error: 'missing params' }, { status: 400 })
  }

  const { data: comments, error } = await sb()
    .from('article_comments')
    .select('id, user_id, body, created_at, mentions')
    .eq('brief_id', brief_id)
    .eq('section', section)
    .eq('item_index', parseInt(item_index))
    .eq('company_id', company_id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch user names
  const userIds = [...new Set((comments ?? []).map(c => c.user_id))]
  let names: Record<string, string> = {}
  if (userIds.length > 0) {
    const { data: profiles } = await sb()
      .from('user_profiles')
      .select('user_id, full_name, avatar_url')
      .in('user_id', userIds)
    if (profiles) {
      names = Object.fromEntries(profiles.map(p => [p.user_id, p.full_name ?? 'Team member']))
    }
  }

  return NextResponse.json((comments ?? []).map(c => ({ ...c, author_name: names[c.user_id] ?? 'Team member' })))
}

// POST /api/comments
export async function POST(req: NextRequest) {
  const userId = await getUserId()
  const body = await req.json()
  const { company_id, brief_id, section, item_index, text, headline } = body

  if (!text?.trim()) return NextResponse.json({ error: 'empty comment' }, { status: 400 })

  // Parse @mentions — format: @[Name](user_id)
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g
  const mentions: string[] = []
  let match
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[2]) // user_id
  }

  const { data: comment, error } = await sb()
    .from('article_comments')
    .insert({ user_id: userId, company_id, brief_id, section, item_index, body: text, mentions })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Create notifications for mentioned users
  if (mentions.length > 0) {
    const { data: fromProfile } = await sb()
      .from('user_profiles')
      .select('full_name')
      .eq('user_id', userId)
      .single()
    const fromName = fromProfile?.full_name ?? 'A team member'
    void fromName // used implicitly via notification creation context

    const notifications = mentions
      .map(uid => ({
        user_id: uid,
        from_user_id: userId,
        company_id,
        type: 'mention',
        brief_id,
        section,
        item_index,
        headline,
        comment_body: text.replace(/@\[[^\]]+\]\([^)]+\)/g, (m: string) => {
          const nameMatch = m.match(/@\[([^\]]+)\]/)
          return nameMatch ? `@${nameMatch[1]}` : m
        }).slice(0, 120),
      }))

    if (notifications.length > 0) {
      await sb().from('notifications').insert(notifications)
    }
  }

  return NextResponse.json({ comment })
}
