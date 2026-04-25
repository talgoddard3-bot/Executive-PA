import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { Resend } from 'resend'

export const maxDuration = 120

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic()
const resend    = new Resend(process.env.RESEND_API_KEY)

interface RawSignal {
  id: string
  company_id: string
  title: string
  summary?: string
  source?: string
  url?: string
  fetched_at: string
}

interface CompanyWithProfile {
  id: string
  name: string
  brand_color?: string
  brief_schedules: { recipient_emails: string[] }[]
  company_profiles: {
    competitors: { name: string }[]
    keywords: string[]
  }[]
}

// ── Score a batch of signals for one company with Claude Haiku ──
async function scoreSignals(
  signals: RawSignal[],
  company: CompanyWithProfile
): Promise<{ signal: RawSignal; score: number; reason: string }[]> {
  const profile  = company.company_profiles[0]
  const keywords = profile?.keywords?.join(', ') ?? ''
  const competitors = profile?.competitors?.map(c => c.name).join(', ') ?? ''

  const signalText = signals
    .map((s, i) => `[${i}] ${s.title}${s.summary ? ': ' + s.summary.slice(0, 150) : ''}`)
    .join('\n')

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    tools: [
      {
        name: 'score_signals',
        description: 'Score each signal for urgency and relevance to this company.',
        input_schema: {
          type: 'object' as const,
          properties: {
            scores: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  index:  { type: 'number', description: 'Signal index from the list' },
                  score:  { type: 'number', description: 'Relevance score 1–10. 9+ means breaking/urgent.' },
                  reason: { type: 'string', description: 'One sentence why this is urgent (if score >= 8)' },
                },
                required: ['index', 'score', 'reason'],
              },
            },
          },
          required: ['scores'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'score_signals' },
    messages: [
      {
        role: 'user',
        content: `Company: ${company.name}
Keywords: ${keywords}
Competitors: ${competitors}

Score each signal below for urgency and strategic relevance to this company.
A 9 or 10 means this is breaking news the CEO needs to know TODAY — not in the weekly brief.

Signals:
${signalText}`,
      },
    ],
  })

  const toolBlock = message.content.find(b => b.type === 'tool_use')
  if (!toolBlock || toolBlock.type !== 'tool_use') return []

  const { scores } = toolBlock.input as { scores: { index: number; score: number; reason: string }[] }

  return scores.map(s => ({
    signal: signals[s.index],
    score:  s.score,
    reason: s.reason,
  }))
}

// ── Send a breaking alert email via Resend ────────────────────────
async function sendBreakingAlert(
  recipients: string[],
  companyName: string,
  alerts: { signal: RawSignal; score: number; reason: string }[],
  brandColor = '#1a1a2e'
) {
  const alertItems = alerts
    .map(
      a => `
      <tr>
        <td style="padding: 16px 0; border-bottom: 1px solid #f0f0f0;">
          <div style="font-size: 13px; font-weight: 600; color: #111; margin-bottom: 4px;">
            ${a.signal.url
              ? `<a href="${a.signal.url}" style="color: #111; text-decoration: none;">${a.signal.title}</a>`
              : a.signal.title
            }
          </div>
          <div style="font-size: 12px; color: #666; margin-bottom: 6px;">${a.reason}</div>
          <div style="display: inline-block; font-size: 11px; background: #fff3cd; color: #856404; padding: 2px 8px; border-radius: 99px; font-weight: 500;">
            Urgency: ${a.score}/10
          </div>
          ${a.signal.source ? `<span style="font-size: 11px; color: #999; margin-left: 8px;">via ${a.signal.source}</span>` : ''}
        </td>
      </tr>
    `
    )
    .join('')

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">

        <!-- Header -->
        <tr>
          <td style="background:${brandColor};padding:20px 28px;">
            <div style="font-size:11px;color:rgba(255,255,255,0.6);letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px;">Breaking Alert</div>
            <div style="font-size:20px;font-weight:700;color:#fff;">${companyName}</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:24px 28px;">
            <div style="font-size:13px;color:#444;margin-bottom:20px;line-height:1.6;">
              ${alerts.length} high-urgency signal${alerts.length !== 1 ? 's' : ''} detected that may require your attention today.
            </div>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${alertItems}
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 28px;border-top:1px solid #f0f0f0;background:#fafafa;">
            <div style="font-size:11px;color:#999;">
              Sent by <strong>Company Brief</strong> &middot;
              <a href="https://companybrief.net" style="color:#999;">companybrief.net</a>
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? 'Company Brief <alerts@companybrief.net>',
    to: recipients,
    subject: `⚡ Breaking: ${alerts.length} urgent signal${alerts.length !== 1 ? 's' : ''} for ${companyName}`,
    html,
  })
}

// ── Main handler ──────────────────────────────────────────────────
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  // Fetch all active companies with their profiles and schedules
  const { data: companies, error } = await supabase
    .from('companies')
    .select(`
      id, name, brand_color,
      brief_schedules!inner(recipient_emails),
      company_profiles(competitors, keywords)
    `)
    .eq('brief_schedules.enabled', true)

  if (error || !companies?.length) {
    return NextResponse.json({ message: 'No active companies', checked: 0 })
  }

  // Look back window — signals from the last 25 hours not yet alerted
  const since = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()

  const results: { companyId: string; alerts: number; status: string }[] = []

  for (const company of companies as CompanyWithProfile[]) {
    try {
      const { data: signals } = await supabase
        .from('raw_signals')
        .select('id, company_id, title, summary, source, url, fetched_at')
        .eq('company_id', company.id)
        .gte('fetched_at', since)
        .is('alerted_at', null)
        .order('fetched_at', { ascending: false })
        .limit(20)

      if (!signals?.length) {
        results.push({ companyId: company.id, alerts: 0, status: 'no new signals' })
        continue
      }

      const scored = await scoreSignals(signals, company)
      const breaking = scored.filter(s => s.score >= 9)

      if (breaking.length === 0) {
        results.push({ companyId: company.id, alerts: 0, status: 'no breaking signals' })
        continue
      }

      const recipients = company.brief_schedules[0]?.recipient_emails ?? []
      if (recipients.length > 0) {
        await sendBreakingAlert(
          recipients,
          company.name,
          breaking,
          company.brand_color
        )
      }

      const alertedIds = breaking.map(b => b.signal.id)
      await supabase
        .from('raw_signals')
        .update({ alerted_at: new Date().toISOString() })
        .in('id', alertedIds)

      console.log(`[alerts] Sent ${breaking.length} breaking alerts for ${company.name}`)
      results.push({ companyId: company.id, alerts: breaking.length, status: 'sent' })

    } catch (err) {
      console.error(`[alerts] Failed for company ${company.id}:`, err)
      results.push({ companyId: company.id, alerts: 0, status: 'error' })
    }
  }

  return NextResponse.json({
    checked: companies.length,
    alerted: results.filter(r => r.alerts > 0).length,
    results,
  })
}
