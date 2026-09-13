import { createClient } from '@supabase/supabase-js'
import { checkAndUpdateIRReport } from '@/lib/investor-relations'
import { NextResponse } from 'next/server'

// Runs daily, well ahead of the Monday weekly brief cron. Decoupled from
// brief generation so a slow/large annual report never risks pushing a
// week's synthesis past Vercel's function time limit — synthesize.ts just
// reads whatever ir_last_report_summary this already left on company_profiles.
export const maxDuration = 280

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: companies } = await supabase
    .from('companies')
    .select('id, name, company_profiles(ir_page_url, ir_last_report_url, ir_last_report_summary)')
    .not('company_profiles.ir_page_url', 'is', null)

  const targets = (companies ?? []).filter(
    (c): c is typeof c & { company_profiles: { ir_page_url: string | null; ir_last_report_url: string | null; ir_last_report_summary: string | null }[] } =>
      Array.isArray(c.company_profiles) && c.company_profiles.length > 0 && !!c.company_profiles[0]?.ir_page_url
  )

  const results: { companyId: string; checked: boolean }[] = []
  for (const company of targets) {
    try {
      await checkAndUpdateIRReport(company.id, company.name, company.company_profiles[0])
      results.push({ companyId: company.id, checked: true })
    } catch (err) {
      console.error('[ir-check] failed for', company.id, err)
      results.push({ companyId: company.id, checked: false })
    }
  }

  return NextResponse.json({ checked: results.length, results })
}
