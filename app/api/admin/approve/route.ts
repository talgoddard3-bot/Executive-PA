import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'

function sign(userId: string): string {
  const secret = process.env.ADMIN_APPROVE_SECRET ?? 'fallback-dev-secret'
  return createHmac('sha256', secret).update(userId).digest('hex')
}

function verify(userId: string, token: string): boolean {
  try {
    const expected = Buffer.from(sign(userId))
    const received = Buffer.from(token)
    if (expected.length !== received.length) return false
    return timingSafeEqual(expected, received)
  } catch { return false }
}

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url)
  const userId = searchParams.get('userId')
  const token  = searchParams.get('token')
  const action = searchParams.get('action') ?? 'approve'

  if (!userId || !token) {
    return new Response('Missing parameters', { status: 400 })
  }
  if (!verify(userId, token)) {
    return new Response('Invalid token', { status: 403 })
  }

  const status = action === 'reject' ? 'rejected' : 'active'

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await service
    .from('user_profiles')
    .update({ status })
    .eq('user_id', userId)

  if (error) {
    return new Response(`DB error: ${error.message}`, { status: 500 })
  }

  // If approving, send a notification email to the user (best-effort)
  if (status === 'active') {
    const { data: profile } = await service
      .from('user_profiles')
      .select('email, full_name')
      .eq('user_id', userId)
      .single()

    if (profile?.email) {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? origin
        await resend.emails.send({
          from: process.env.EMAIL_FROM ?? 'Intelligent Brief <brief@executive-intelligence.ai>',
          to: [profile.email],
          subject: 'Your Intelligent Brief access has been approved',
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#111">
              <div style="font-size:22px;font-weight:700;margin-bottom:8px">You're in.</div>
              <p style="color:#555;margin:0 0 24px">Hi ${profile.full_name ?? 'there'}, your access to Intelligent Brief has been approved. You can now sign in and set up your company profile.</p>
              <a href="${appUrl}/login" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Sign in now →</a>
              <p style="margin-top:32px;font-size:12px;color:#999">Intelligent Brief · Weekly intelligence for executives</p>
            </div>
          `,
        })
      } catch (e) {
        console.warn('[approve] user notification email failed:', e)
      }
    }
  }

  const message = status === 'active' ? 'User approved ✓' : 'User rejected ✓'
  return new Response(`
    <html><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb">
      <div style="text-align:center;max-width:320px">
        <div style="font-size:40px;margin-bottom:16px">${status === 'active' ? '✅' : '❌'}</div>
        <h1 style="font-size:20px;font-weight:700;color:#111;margin:0 0 8px">${message}</h1>
        <p style="color:#666;font-size:14px;margin:0">The user has been notified by email.</p>
        <a href="/admin" style="display:inline-block;margin-top:20px;padding:10px 20px;background:#111;color:#fff;border-radius:8px;text-decoration:none;font-size:14px">Back to admin →</a>
      </div>
    </body></html>
  `, { headers: { 'Content-Type': 'text/html' } })
}

export { sign as generateApproveToken }
