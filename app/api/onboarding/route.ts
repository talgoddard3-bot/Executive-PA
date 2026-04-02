import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createHmac } from 'crypto'

function signToken(userId: string): string {
  const secret = process.env.ADMIN_APPROVE_SECRET ?? 'fallback-dev-secret'
  return createHmac('sha256', secret).update(userId).digest('hex')
}

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { full_name, email, company_name, position, plan } = await request.json()

  if (!full_name?.trim() || !company_name?.trim() || !position) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await service
    .from('user_profiles')
    .upsert({
      user_id: user.id,
      full_name: full_name.trim(),
      email: email?.trim() ?? user.email ?? '',
      company_name: company_name.trim(),
      position,
      plan: plan ?? 'solo',
      status: 'pending',
      requested_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // ── Notify Tal with one-click approve/reject links ────────────────────────
  try {
    const adminEmail = process.env.ADMIN_EMAIL ?? 'tal@intelligentbrief.com'
    const appUrl     = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const token      = signToken(user.id)
    const approveUrl = `${appUrl}/api/admin/approve?userId=${user.id}&token=${token}&action=approve`
    const rejectUrl  = `${appUrl}/api/admin/approve?userId=${user.id}&token=${token}&action=reject`

    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'Intelligent Brief <brief@executive-intelligence.ai>',
      to: [adminEmail],
      subject: `New access request — ${full_name.trim()} (${company_name.trim()})`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#111">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#6b7280;margin-bottom:16px">New Access Request</div>

          <table style="width:100%;border-collapse:collapse;margin-bottom:28px">
            <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#6b7280;font-size:13px;width:120px">Name</td><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px;font-weight:600">${full_name.trim()}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#6b7280;font-size:13px">Email</td><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px">${email ?? user.email}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#6b7280;font-size:13px">Company</td><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px;font-weight:600">${company_name.trim()}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#6b7280;font-size:13px">Position</td><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px">${position}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Plan</td><td style="padding:8px 0;font-size:13px">${plan === 'team' ? 'Team ($50/mo)' : 'Solo ($15/mo)'}</td></tr>
          </table>

          <div style="display:flex;gap:12px">
            <a href="${approveUrl}" style="display:inline-block;padding:12px 24px;background:#16a34a;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
              ✓ Approve access
            </a>
            <a href="${rejectUrl}" style="display:inline-block;padding:12px 24px;background:#fff;color:#dc2626;border:1px solid #fca5a5;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
              ✕ Reject
            </a>
          </div>

          <p style="margin-top:28px;font-size:11px;color:#9ca3af">
            Or manage all users at <a href="${appUrl}/admin" style="color:#2563eb">${appUrl}/admin</a>
          </p>
        </div>
      `,
    })
  } catch (e) {
    // Email is best-effort — don't fail the onboarding if it breaks
    console.warn('[onboarding] admin notification email failed:', e)
  }

  return NextResponse.json({ ok: true })
}
