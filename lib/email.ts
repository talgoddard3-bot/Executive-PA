import { Resend } from 'resend'
import type { BriefContent } from './types'
import { BriefDigestEmail } from '@/components/email/BriefDigestEmail'

let _resend: Resend | null = null
function resend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

export interface SendBriefEmailOptions {
  to: string[]
  companyName: string
  weekOf: string
  briefId: string
  generatedAt: string
  content: BriefContent
  appUrl?: string
  logoUrl?: string | null
  brandColor?: string | null
}

export async function sendBriefEmail(opts: SendBriefEmailOptions): Promise<void> {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.log('[email] RESEND_API_KEY not set — skipping email')
    return
  }
  if (!opts.to.length) {
    console.log('[email] No recipients configured — skipping')
    return
  }

  const appUrl   = opts.appUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const briefUrl = `${appUrl}/briefs/${opts.briefId}`

  const subject = `[EIB] Week of ${opts.weekOf} · ${opts.content.headline}`

  const { error } = await resend().emails.send({
    from:    process.env.EMAIL_FROM ?? 'EIB <brief@executive-intelligence.ai>',
    to:      opts.to,
    subject,
    react:   BriefDigestEmail({
      companyName:  opts.companyName,
      weekOf:       opts.weekOf,
      generatedAt:  opts.generatedAt,
      briefUrl,
      content:      opts.content,
      brandColor:   opts.brandColor ?? '#1d4ed8',
      logoUrl:      opts.logoUrl,
    }),
  })

  if (error) {
    console.error('[email] Resend error:', error)
    throw new Error(`Email send failed: ${JSON.stringify(error)}`)
  }

  console.log(`[email] Sent to ${opts.to.length} recipient(s) for brief ${opts.briefId}`)
}
