import { Resend } from 'resend'
import { render } from '@react-email/components'
import { createClient } from '@supabase/supabase-js'
import { getSessionUser } from '@/lib/get-company'
import { NextResponse } from 'next/server'
import { createElement } from 'react'
import BriefEmail from '@/components/emails/BriefEmail'
import type { BriefContent } from '@/lib/types'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const session = await getSessionUser()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { userId, companyId } = session

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ data: company }, { data: userProfile }] = await Promise.all([
    supabase.from('companies').select('id, name').eq('id', companyId).single(),
    supabase.from('user_profiles').select('email, language').eq('user_id', userId).single(),
  ])

  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

  const { data: brief } = await supabase
    .from('briefs')
    .select('content, week_of, status')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (!brief || brief.status !== 'complete' || !brief.content) {
    return NextResponse.json({ error: 'Brief not ready' }, { status: 400 })
  }

  const toEmail = userProfile?.email || process.env.EMAIL_TO || 'talgoddard3@gmail.com'
  if (!toEmail) return NextResponse.json({ error: 'No recipient email configured — set one in My Profile' }, { status: 400 })

  const content = brief.content as BriefContent
  const weekOf = new Date(brief.week_of).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const briefUrl = `${appUrl}/briefs/${id}/full`

  const language = userProfile?.language ?? 'English'

  const html = await render(
    createElement(BriefEmail, { companyName: company.name, weekOf, content, briefUrl, appUrl, language })
  )

  const resend = new Resend(process.env.RESEND_API_KEY)

  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? 'onboarding@resend.dev',
    to: toEmail,
    subject: `Intelligence Brief — ${company.name} · Week of ${weekOf}`,
    html,
  })

  if (error) {
    console.error('[briefs/send] Resend error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
